#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, sys, json, math, time, argparse, asyncio
from datetime import datetime, timedelta, timezone

import httpx
from supabase import create_client
from dotenv import load_dotenv

# ──────────────────────────────────────────────────────────────────────────────
# Config par défaut
DEFAULT_LEAGUES = [
    637, 638, 639, 683, 684, 864, 961, 567, 664, 665, 905, 906, 736, 737, 548, 549, 942
]
DEFAULT_SEASON = int(os.getenv("SEASON_ID", "2"))
DEFAULT_PAR = int(os.getenv("PAR", "4"))
DEFAULT_REFRESH_DAYS = int(os.getenv("REFRESH_DAYS", "14"))

RPC_URL = "https://gsppub.soccerverse.io/"
TACTICS_BASE = "https://services.soccerverse.com/api/fixture_history/tactics/"

# ──────────────────────────────────────────────────────────────────────────────
# Supabase
def get_supabase():
    load_dotenv()  # charge .env si présent (local)
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE/KEY in env.")
    return create_client(url, key)

# ──────────────────────────────────────────────────────────────────────────────
# HTTP utils
async def _post_json(url, payload, client, tries=6, tag=""):
    # Exponential backoff + 429
    for i in range(tries):
        try:
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
# Source SV JSON-RPC
async def get_league_club_ids(league_id: int, client: httpx.AsyncClient) -> list[int]:
    """
    Essaie plusieurs méthodes connues pour récupérer la liste des clubs d'une ligue.
    """
    # 1) get_league_clubs
    try:
        data = await rpc("get_league_clubs", {"league_id": league_id}, client)
        arr = data.get("result", {}).get("clubs") or data.get("result", [])
        ids = [c["club_id"] if isinstance(c, dict) and "club_id" in c else int(c) for c in arr]
        return sorted(set(int(x) for x in ids if isinstance(x, (int, str))))
    except Exception:
        pass

    # 2) get_league (certains endpoints renvoient clubs dans result.clubs)
    data = await rpc("get_league", {"league_id": league_id}, client)
    arr = data.get("result", {}).get("clubs") or data.get("result", {}).get("data", {}).get("clubs", [])
    ids = [c["club_id"] if isinstance(c, dict) and "club_id" in c else int(c) for c in arr]
    return sorted(set(int(x) for x in ids if isinstance(x, (int, str))))

async def get_club_schedule(club_id: int, season_id: int, client: httpx.AsyncClient) -> list[dict]:
    data = await rpc("get_club_schedule", {"club_id": club_id, "season_id": season_id}, client)
    return data.get("result", {}).get("data", []) or data.get("result", []) or []

async def get_fixture_core(fixture_id: int, client: httpx.AsyncClient) -> dict:
    data = await rpc("get_fixture", {"fixture_id": fixture_id}, client)
    return data.get("result", {}) or {}

async def get_tactics(fixture_id: int, client: httpx.AsyncClient) -> list[dict]:
    return await _get_json(f"{TACTICS_BASE}{fixture_id}", client, tag=f"tactics {fixture_id}")

# ──────────────────────────────────────────────────────────────────────────────
# DB helpers
async def select_existing_fixtures(sb, league_id: int, season_id: int) -> set[int]:
    res = sb.table("sv_matches").select("fixture_id").eq("league_id", league_id).eq("season_id", season_id).execute()
    return set(int(r["fixture_id"]) for r in (res.data or []))

async def select_existing_sides(sb, fixture_ids: list[int]) -> set[tuple[int, str]]:
    out = set()
    CHUNK = 900
    for i in range(0, len(fixture_ids), CHUNK):
        part = fixture_ids[i : i + CHUNK]
        res = sb.table("sv_match_sides").select("fixture_id, side").in_("fixture_id", part).execute()
        for r in (res.data or []):
            out.add((int(r["fixture_id"]), r["side"]))
    return out

def upsert_matches(sb, rows: list[dict]):
    if not rows: return
    sb.table("sv_matches").upsert(rows, on_conflict=["fixture_id"]).execute()

def upsert_sides(sb, rows: list[dict]):
    if not rows: return
    sb.table("sv_match_sides").upsert(rows, on_conflict=["fixture_id", "side"]).execute()

# ──────────────────────────────────────────────────────────────────────────────
# Business
def take_core_from_schedule(m: dict, league_id: int, season_id: int) -> dict:
    # Les schedules ont souvent déjà l'info de base : clubs, date, score, played.
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
    """
    Convertit la structure tactics en 2 lignes sv_match_sides, si possible.
    """
    # Index par club_id
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
            "tactics_history": actions,  # on stocke l'historique brut si utile
        })
    return out

async def collect_league_fixtures(league_id: int, season_id: int, client: httpx.AsyncClient) -> list[dict]:
    club_ids = await get_league_club_ids(league_id, client)
    # Agrège le calendrier de chaque club
    all_sched = []
    for cid in club_ids:
        try:
            sched = await get_club_schedule(cid, season_id, client)
        except Exception as e:
            print(f"[WARN] schedule club {cid}: {e}", flush=True)
            sched = []
        all_sched.extend(sched)
    # Déduplique par fixture_id
    out_map = {}
    for m in all_sched:
        fid = int(m["fixture_id"])
        if fid not in out_map:
            out_map[fid] = take_core_from_schedule(m, league_id, season_id)
        else:
            # conservez 'played' et le score les plus "avancés"
            if (m.get("played") == 1) and not out_map[fid]["played"]:
                out_map[fid] = take_core_from_schedule(m, league_id, season_id)
    return list(out_map.values())

async def process_league(sb, league_id: int, season_id: int, refresh_days: int, client: httpx.AsyncClient):
    # 1) Calendrier (core rows)
    core_rows = await collect_league_fixtures(league_id, season_id, client)
    print(f"[{league_id}] schedule size={len(core_rows)}", flush=True)

    # 2) Upsert core matches (nouveaux ou updates)
    upsert_matches(sb, core_rows)
    print(f"[{league_id}] upserted sv_matches core: {len(core_rows)}", flush=True)

    # 3) Cible des fixtures à détailler : nouveaux + récents (refresh_days)
    existing_set = await select_existing_fixtures(sb, league_id, season_id)
    all_ids = [r["fixture_id"] for r in core_rows]
    new_ids = [fid for fid in all_ids if fid not in existing_set]  # (utile la 1ère fois)
    cutoff_ts = int((datetime.now(timezone.utc) - timedelta(days=refresh_days)).timestamp())
    recent_ids = [r["fixture_id"] for r in core_rows if r["date"] and r["date"] >= cutoff_ts]
    target_ids = sorted(set(new_ids) | set(recent_ids))

    # 4) Ne garde que les fixtures joués
    played_ids = [r["fixture_id"] for r in core_rows if r["played"]]
    target_ids = [fid for fid in target_ids if fid in played_ids]
    if not target_ids:
        print(f"[{league_id}] nothing to detail", flush=True)
        return

    # Déjà présents côté "sides" ?
    have_sides = await select_existing_sides(sb, target_ids)

    # 5) Détail tactique / upsert sides
    rows_sides = []
    for fid in target_ids:
        # si les 2 côtés existent déjà, passe (fixture_id, 'home') & (fixture_id, 'away')
        if (fid, "home") in have_sides and (fid, "away") in have_sides:
            continue
        try:
            fix_core = await get_fixture_core(fid, client)
        except Exception:
            # fallback : trouve dans core_rows
            fix_core = next((r for r in core_rows if r["fixture_id"] == fid), None) or {}
        if not fix_core:
            continue

        try:
            tactics = await get_tactics(fid, client)
        except Exception as e:
            print(f"[WARN] tactics {fid}: {e}", flush=True)
            continue

        # Construit 2 lignes si possible (formation/style présents)
        side_rows = build_side_rows_from_tactics(fix_core, tactics)
        # Ignore si aucun des 2 côtés n'a de tactique
        if not side_rows:
            continue
        rows_sides.extend(side_rows)

        if len(rows_sides) >= 200:
            upsert_sides(sb, rows_sides); rows_sides = []

    if rows_sides:
        upsert_sides(sb, rows_sides)

    print(f"[{league_id}] upserted sv_match_sides rows: {len(rows_sides)} (batched)", flush=True)

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

    # Fallback : env LEAGUES_CSV
    env_csv = os.getenv("LEAGUES_CSV", "").strip()
    if env_csv:
        ids.extend(int(x) for x in env_csv.split(",") if x.strip())

    if not ids:
        ids = DEFAULT_LEAGUES[:]  # <- valeur par défaut demandée
    # dedupe / tri
    return sorted(set(ids))

async def main():
    ns = parse_args()
    leagues = resolve_leagues(ns)
    sb = get_supabase()

    print(f"Season={ns.season}  refresh_days={ns.refresh_days}  leagues={leagues}", flush=True)

    limits = httpx.Limits(max_keepalive_connections=20, max_connections=20)
    async with httpx.AsyncClient(limits=limits, headers={"Content-Type": "application/json"}) as client:
        # parallélise par ligue (mais pas trop pour éviter les 429)
        sem = asyncio.Semaphore(ns.par)

        async def _one(lid: int):
            async with sem:
                try:
                    await process_league(sb, lid, ns.season, ns.refresh_days, client)
                except Exception as e:
                    print(f"[{lid}] ERROR: {e}", flush=True)

        await asyncio.gather(*[_one(l) for l in leagues])

if __name__ == "__main__":
    asyncio.run(main())
