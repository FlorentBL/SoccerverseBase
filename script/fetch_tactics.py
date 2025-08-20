#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, sys, json, math, time, argparse, asyncio, random
from datetime import datetime, timedelta, timezone

import httpx
from supabase import create_client
from dotenv import load_dotenv

# ──────────────────────────────────────────────────────────────────────────────
# Config par défaut
DEFAULT_LEAGUES = [
    637, 638, 639, 683, 684, 864, 961, 962, 963, 795, 796, 567, 568, 664, 665, 905, 906, 736, 737, 548, 549, 942, 522, 523, 595, 952, 852, 853
]
DEFAULT_SEASON = int(os.getenv("SEASON_ID", "2"))
DEFAULT_PAR = int(os.getenv("PAR", "4"))
DEFAULT_REFRESH_DAYS = int(os.getenv("REFRESH_DAYS", "14"))

# Cadence HTTP (anti-429)
RPC_QPS = float(os.getenv("RPC_QPS", "1.0"))         # ex: 0.8, 1.0, 1.5...
LEAGUE_PAUSE_S = float(os.getenv("LEAGUE_PAUSE_S", "1.0"))  # pause entre ligues

RPC_URL = "https://gsppub.soccerverse.io/"
SERVICES = "https://services.soccerverse.com"
TACTICS_BASE = f"{SERVICES}/api/fixture_history/tactics/"

# ──────────────────────────────────────────────────────────────────────────────
# Limiteur de débit simple (QPS global)
class AsyncRateLimiter:
    def __init__(self, qps: float = 1.0, jitter: float = 0.25):
        self.min_interval = 1.0 / max(qps, 0.01)
        self.jitter = float(jitter)
        self._lock = asyncio.Lock()
        self._last = 0.0

    async def wait(self):
        async with self._lock:
            now = time.monotonic()
            delay = max(0.0, self.min_interval - (now - self._last))
            # petit jitter pour désynchroniser vis-à-vis d'autres runners
            if delay > 0:
                delay += self.jitter * (random.random() - 0.5)
                if delay > 0:
                    await asyncio.sleep(delay)
            self._last = time.monotonic()

rate_limiter = AsyncRateLimiter(RPC_QPS)

# ──────────────────────────────────────────────────────────────────────────────
# Supabase
def get_supabase():
    load_dotenv()
    url_names = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]
    key_names = ["SUPABASE_SERVICE_ROLE", "SUPABASE_KEY", "NEXT_PUBLIC_SUPABASE_KEY"]

    name_url = next((n for n in url_names if os.getenv(n)), None)
    name_key = next((n for n in key_names if os.getenv(n)), None)

    if not name_url or not name_key:
        raise RuntimeError(
            "Missing Supabase env. Checked URL vars: "
            + ", ".join(url_names)
            + " — KEY vars: "
            + ", ".join(key_names)
        )

    url = os.getenv(name_url)
    key = os.getenv(name_key)
    return create_client(url, key)

# ──────────────────────────────────────────────────────────────────────────────
# HTTP utils
async def _post_json(url, payload, client, tries=6, tag=""):
    for i in range(tries):
        try:
            await rate_limiter.wait()  # ← limiteur global
            r = await client.post(url, json=payload, timeout=30)
            if r.status_code == 429:
                wait = 2.0 * (i + 1)
                print(f"[WARN] {tag} HTTP 429 — retry in {wait:.1f}s", flush=True)
                await asyncio.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as e:
            wait = 1.5 * (i + 1)
            print(f"[WARN] {tag} HTTP error {e} — retry in {wait:.1f}s", flush=True)
            await asyncio.sleep(wait)
    raise RuntimeError(f"{tag} failed after retries")

async def _get_json(url, client, tries=6, tag=""):
    for i in range(tries):
        try:
            await rate_limiter.wait()  # ← limiteur global
            r = await client.get(url, timeout=30)
            if r.status_code == 429:
                wait = 2.0 * (i + 1)
                print(f"[WARN] {tag} HTTP 429 — retry in {wait:.1f}s", flush=True)
                await asyncio.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as e:
            wait = 1.5 * (i + 1)
            print(f"[WARN] {tag} HTTP error {e} — retry in {wait:.1f}s", flush=True)
            await asyncio.sleep(wait)
    raise RuntimeError(f"{tag} failed after retries")

async def rpc(method, params, client):
    payload = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
    return await _post_json(RPC_URL, payload, client, tag=method)

# ──────────────────────────────────────────────────────────────────────────────
# Source SV

async def get_league_club_ids(league_id: int, client: httpx.AsyncClient) -> list[int]:
    """
    Stratégie robuste:
      1) services.soccerverse.com/api/league_tables?league_id=... (publique)
      2) fallback JSON-RPC get_league_clubs / get_league
    """
    # 1) services API
    try:
        rows = await _get_json(f"{SERVICES}/api/league_tables?league_id={league_id}", client, tag=f"league_tables {league_id}")
        if isinstance(rows, list) and rows:
            ids = [int(r["club_id"]) for r in rows if isinstance(r, dict) and r.get("club_id") is not None]
            ids = sorted(set(int(x) for x in ids))
            if ids:
                return ids
    except Exception as e:
        print(f"[WARN] league_tables {league_id}: {e}", flush=True)

    # 2a) RPC get_league_clubs
    try:
        data = await rpc("get_league_clubs", {"league_id": league_id}, client)
        arr = data.get("result", {}).get("clubs") or data.get("result", [])
        ids = [c["club_id"] if isinstance(c, dict) and "club_id" in c else int(c) for c in arr]
        ids = sorted(set(int(x) for x in ids if isinstance(x, (int, str))))
        if ids:
            return ids
    except Exception as e:
        print(f"[WARN] get_league_clubs {league_id}: {e}", flush=True)

    # 2b) RPC get_league
    try:
        data = await rpc("get_league", {"league_id": league_id}, client)
        arr = data.get("result", {}).get("clubs") or data.get("result", {}).get("data", {}).get("clubs", [])
        ids = [c["club_id"] if isinstance(c, dict) and "club_id" in c else int(c) for c in arr]
        ids = sorted(set(int(x) for x in ids if isinstance(x, (int, str))))
        return ids
    except Exception as e:
        print(f"[WARN] get_league {league_id}: {e}", flush=True)
        return []

async def get_club_schedule(club_id: int, season_id: int, client: httpx.AsyncClient) -> list[dict]:
    data = await rpc("get_club_schedule", {"club_id": club_id, "season_id": season_id}, client)
    return data.get("result", {}).get("data", []) or data.get("result", []) or []

async def get_fixture_core_rpc(fixture_id: int, client: httpx.AsyncClient) -> dict:
    data = await rpc("get_fixture", {"fixture_id": fixture_id}, client)
    return data.get("result", {}) or {}

async def get_tactics(fixture_id: int, client: httpx.AsyncClient) -> list[dict]:
    return await _get_json(f"{TACTICS_BASE}{fixture_id}", client, tag=f"tactics {fixture_id}")

# ──────────────────────────────────────────────────────────────────────────────
# DB helpers

def select_existing_fixtures(sb, league_id: int, season_id: int) -> set[int]:
    res = sb.table("sv_matches").select("fixture_id").eq("league_id", league_id).eq("season_id", season_id).execute()
    return set(int(r["fixture_id"]) for r in (res.data or []))

def select_recent_core_from_db(sb, league_id: int, season_id: int, days: int) -> list[dict]:
    if days <= 0: return []
    cutoff = int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp())
    res = sb.table("sv_matches").select(
        "fixture_id,date,home_club,away_club,home_goals,away_goals,played"
    ).eq("league_id", league_id).eq("season_id", season_id).gte("date", cutoff).execute()
    return res.data or []

def get_fix_core_from_db(sb, fixture_id: int) -> dict:
    res = sb.table("sv_matches").select(
        "fixture_id,date,home_club,away_club,home_goals,away_goals,played"
    ).eq("fixture_id", fixture_id).limit(1).execute()
    rows = res.data or []
    return rows[0] if rows else {}

def upsert_matches(sb, rows: list[dict]):
    if not rows: return
    sb.table("sv_matches").upsert(rows, on_conflict="fixture_id").execute()

def upsert_sides(sb, rows: list[dict]):
    if not rows: return
    # side en lower pour homogénéiser
    for r in rows:
        if "side" in r and isinstance(r["side"], str):
            r["side"] = r["side"].lower()
    sb.table("sv_match_sides").upsert(rows, on_conflict="fixture_id,side").execute()

# ──────────────────────────────────────────────────────────────────────────────
# Business

def take_core_from_schedule(m: dict, league_id: int, season_id: int) -> dict:
    return {
        "fixture_id": int(m["fixture_id"]),
        "league_id": league_id,
        "season_id": season_id,
        "date": int(m.get("date") or 0),
        "home_club": int(m.get("home_club") or 0),
        "away_club": int(m.get("away_club") or 0),
        "home_goals": int(m.get("home_goals") or 0),
        "away_goals": int(m.get("away_goals") or 0),
        "played": int(m.get("played") or 0) == 1,
    }

def build_side_rows_from_tactics(fix_core: dict, tactics: list[dict]) -> list[dict]:
    by_club = {t["club_id"]: t for t in tactics if "club_id" in t}
    home = fix_core["home_club"]
    away = fix_core["away_club"]
    out = []

    for club_id, side in [(home, "home"), (away, "away")]:
        t = by_club.get(club_id)
        if not t: continue
        actions = (t.get("tactic_actions") or [])
        if not actions: continue
        a0 = actions[0]
        lineup = a0.get("lineup") or []
        formation_id = a0.get("formation_id")
        play_style = a0.get("play_style")

        if side == "home":
            gf, ga, opp = fix_core["home_goals"], fix_core["away_goals"], away
        else:
            gf, ga, opp = fix_core["away_goals"], fix_core["home_goals"], home

        out.append({
            "fixture_id": fix_core["fixture_id"],
            "side": side,
            "club_id": club_id,
            "opponent_club_id": opp,
            "goals_for": gf,
            "goals_against": ga,
            "formation_id": formation_id,
            "play_style": play_style,
            "lineup": lineup,
            "tactics_history": actions,
        })
    return out

async def collect_league_fixtures(league_id: int, season_id: int, client: httpx.AsyncClient) -> list[dict]:
    club_ids = await get_league_club_ids(league_id, client)

    # Séquentiel + rate limiter -> évite 429
    all_sched = []
    for cid in club_ids:
        try:
            sched = await get_club_schedule(cid, season_id, client)
        except Exception as e:
            print(f"[WARN] schedule club {cid}: {e}", flush=True)
            sched = []
        all_sched.extend(sched)

    out_map = {}
    for m in all_sched:
        fid = int(m["fixture_id"])
        core = take_core_from_schedule(m, league_id, season_id)
        if fid not in out_map:
            out_map[fid] = core
        else:
            if core["played"] and not out_map[fid]["played"]:
                out_map[fid] = core
    return list(out_map.values())

async def process_league(sb, league_id: int, season_id: int, refresh_days: int, client: httpx.AsyncClient):
    total_upserted_sides = 0

    # 1) Tente d'agréger le calendrier
    core_rows = await collect_league_fixtures(league_id, season_id, client)
    print(f"[{league_id}] schedule size={len(core_rows)}", flush=True)

    # 2) Upsert core si on a des données
    if core_rows:
        upsert_matches(sb, core_rows)
        print(f"[{league_id}] upserted sv_matches core: {len(core_rows)}", flush=True)
    else:
        print(f"[{league_id}] no core rows from API; will try DB refresh only.", flush=True)

    # 3) Construire le mapping core
    core_by_fid = {r["fixture_id"]: r for r in core_rows}

    # 4) Déterminer les fixtures cible
    target_ids = []
    if core_rows:
        existing_set = select_existing_fixtures(sb, league_id, season_id)
        all_ids = [r["fixture_id"] for r in core_rows]
        new_ids = [fid for fid in all_ids if fid not in existing_set]
        cutoff_ts = int((datetime.now(timezone.utc) - timedelta(days=refresh_days)).timestamp())
        recent_ids = [r["fixture_id"] for r in core_rows if r["date"] and r["date"] >= cutoff_ts]
        played_ids = [r["fixture_id"] for r in core_rows if r["played"]]
        target_ids = sorted(set(new_ids) | set(recent_ids))
        target_ids = [fid for fid in target_ids if fid in played_ids]
    else:
        # Fallback: on rafraîchit uniquement les matchs récents déjà en DB
        recent_core_db = select_recent_core_from_db(sb, league_id, season_id, refresh_days)
        core_by_fid.update({r["fixture_id"]: r for r in recent_core_db if r.get("played")})
        target_ids = [r["fixture_id"] for r in recent_core_db if r.get("played")]

    if not target_ids:
        print(f"[{league_id}] nothing to detail", flush=True)
        return

    # 5) Détail tactique / upsert sides
    rows_sides_batch = []
    BATCH = 200

    for fid in target_ids:
        fix_core = core_by_fid.get(fid)
        if not fix_core:
            # Petit fallback : RPC puis DB
            try:
                fix_core = await get_fixture_core_rpc(fid, client)
            except Exception:
                fix_core = get_fix_core_from_db(sb, fid)
        if not fix_core:
            continue

        try:
            tactics = await get_tactics(fid, client)
        except Exception as e:
            print(f"[WARN] tactics {fid}: {e}", flush=True)
            continue

        side_rows = build_side_rows_from_tactics(fix_core, tactics)
        if not side_rows:
            continue
        rows_sides_batch.extend(side_rows)

        if len(rows_sides_batch) >= BATCH:
            upsert_sides(sb, rows_sides_batch)
            total_upserted_sides += len(rows_sides_batch)
            rows_sides_batch = []

    if rows_sides_batch:
        upsert_sides(sb, rows_sides_batch)
        total_upserted_sides += len(rows_sides_batch)

    print(f"[{league_id}] upserted sv_match_sides rows: {total_upserted_sides}", flush=True)

# ──────────────────────────────────────────────────────────────────────────────
# CLI
def parse_args():
    p = argparse.ArgumentParser(description="Fetch Soccerverse tactics to Supabase")
    p.add_argument("--season", type=int, default=DEFAULT_SEASON, help="Season ID (default from env SEASON_ID or 2)")
    p.add_argument("--league", type=int, action="append", help="Repeatable single league id")
    p.add_argument("--leagues", dest="leagues_csv", help="CSV league ids")
    p.add_argument("--leagues-file", dest="leagues_file", help="Path to a file with one league id per line")
    p.add_argument("--par", type=int, default=DEFAULT_PAR, help="Concurrency for leagues")
    p.add_argument("--refresh-days", type=int, default=DEFAULT_REFRESH_DAYS, help="Re-scan window for played fixtures")
    return p.parse_args()

def read_leagues_from_file(path: str) -> list[int]:
    ids = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#"): continue
            try:
                ids.append(int(s))
            except ValueError:
                pass
    return ids

def resolve_leagues(ns) -> list[int]:
    ids = []
    if ns.league:
        ids.extend(ns.league)
    if ns.leagues_csv:
        ids.extend(int(x) for x in ns.leagues_csv.split(",") if x.strip())
    if ns.leagues_file:
        ids.extend(read_leagues_from_file(ns.leagues_file))

    env_csv = os.getenv("LEAGUES_CSV", "").strip()
    if env_csv:
        ids.extend(int(x) for x in env_csv.split(",") if x.strip())

    if not ids:
        ids = DEFAULT_LEAGUES[:]  # liste par défaut
    return sorted(set(ids))

async def main():
    ns = parse_args()
    leagues = resolve_leagues(ns)
    sb = get_supabase()

    print(f"Season={ns.season}  refresh_days={ns.refresh_days}  leagues={leagues}", flush=True)

    limits = httpx.Limits(max_keepalive_connections=20, max_connections=20)
    async with httpx.AsyncClient(limits=limits, headers={"Content-Type": "application/json"}) as client:
        sem = asyncio.Semaphore(ns.par)

        async def _one(lid: int):
            async with sem:
                try:
                    await process_league(sb, lid, ns.season, ns.refresh_days, client)
                except Exception as e:
                    print(f"[{lid}] ERROR: {e}", flush=True)
                finally:
                    # petite respiration entre ligues pour ménager l'API
                    if LEAGUE_PAUSE_S > 0:
                        await asyncio.sleep(LEAGUE_PAUSE_S)

        await asyncio.gather(*[_one(l) for l in leagues])

if __name__ == "__main__":
    asyncio.run(main())
