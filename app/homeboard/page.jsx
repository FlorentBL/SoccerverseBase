"use client";

/**
 * HomeBoard — Positions & Revenus (lifetime)
 * - Positions actuelles via /api/user_share_balances
 * - Historique complet via /api/user_balance_sheet
 * - Payouts lifetime filtrés sur actifs détenus
 * - ROI par joueur = payouts / |mint| (si base connue)
 * - Mapping noms clubs/joueurs
 */

import React, { useEffect, useMemo, useState } from "react";

const BASE_UNIT = 10000;
const toSVC = (x) => (typeof x === "number" ? x / BASE_UNIT : 0);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers format & UI */

function fmtSVC(n, digits = 4) {
  if (typeof n !== "number" || !isFinite(n)) return "-";
  return `${n.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} SVC`;
}
function fmtInt(n) {
  if (typeof n !== "number" || !isFinite(n)) return "-";
  return n.toLocaleString("fr-FR");
}
function assetLink(type, id, label) {
  const href =
    type === "club"
      ? `https://play.soccerverse.com/club/${id}`
      : type === "player"
      ? `https://play.soccerverse.com/player/${id}`
      : "";
  if (!href) return label || `${type} #${id}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-indigo-400 hover:underline"
    >
      {label || `${type} #${id}`}
    </a>
  );
}
function KpiCard({ title, value, accent }) {
  const ring =
    accent === "pos"
      ? "ring-emerald-500/30"
      : accent === "neg"
      ? "ring-red-500/30"
      : "ring-gray-500/20";
  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-900/40 p-4 ring-1 ${ring}`}>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
function RoiBar({ roi }) {
  // roi en décimal (ex: 0.35 = 35%). Barre bornée à 200%.
  if (roi == null || !isFinite(roi)) {
    return <span className="text-gray-400">—</span>;
  }
  const pct = roi * 100;
  const width = clamp(pct, 0, 200); // borne visuelle
  const tone =
    pct >= 100 ? "from-emerald-500/70 to-emerald-400/70"
    : pct > 0 ? "from-indigo-500/70 to-indigo-400/70"
    : "from-red-500/70 to-red-400/70";
  return (
    <div className="min-w-[180px]">
      <div className="text-right text-xs text-gray-300 mb-1">{pct.toFixed(1)}%</div>
      <div className="h-2 rounded bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded bg-gradient-to-r ${tone}`}
          style={{ width: `${width}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Types de payouts */

function isPayout(type) {
  if (!type) return false;
  if (type.startsWith("dividend (")) return true;
  return type === "manager wage" || type === "agent wage";
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function HomeBoard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [positions, setPositions] = useState([]); // [{type,id,qty:{total,available,reserved}}]
  const [sheet, setSheet] = useState([]); // balance sheet items

  // mapping (noms)
  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([
          fetch("/club_mapping.json"),
          fetch("/player_mapping.json"),
        ]);
        const [cj, pj] = await Promise.all([c.json(), p.json()]);
        setClubMap(cj || {});
        setPlayerMap(pj || {});
      } catch {
        /* ok */
      }
    })();
  }, []);

  const getClubName = (id) => clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`;
  const getPlayerName = (id) => {
    const p = playerMap?.[id];
    if (!p) return `Joueur #${id}`;
    return p.name || [p.f, p.s].filter(Boolean).join(" ") || `Joueur #${id}`;
  };

  async function handleSubmit(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setPositions([]);
    setSheet([]);

    try {
      // positions
      const pRes = await fetch("/api/user_share_balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!pRes.ok) {
        const j = await pRes.json().catch(() => ({}));
        throw new Error(j?.error || j?.message || `Erreur positions (${pRes.status})`);
      }
      const pJson = await pRes.json();
      const posRaw = Array.isArray(pJson?.result?.data) ? pJson.result.data : [];
      const pos = [];
      for (const it of posRaw) {
        const share = it?.share || {};
        const bal = it?.balance || {};
        if (share.club) {
          pos.push({
            type: "club",
            id: Number(share.club),
            qty: {
              total: Number(bal.total ?? 0),
              available: Number(bal.available ?? 0),
              reserved: Number(bal.reserved ?? 0),
            },
          });
        } else if (share.player) {
          pos.push({
            type: "player",
            id: Number(share.player),
            qty: {
              total: Number(bal.total ?? 0),
              available: Number(bal.available ?? 0),
              reserved: Number(bal.reserved ?? 0),
            },
          });
        }
      }
      setPositions(pos);

      // historique complet
      const sRes = await fetch("/api/user_balance_sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!sRes.ok) {
        const j = await sRes.json().catch(() => ({}));
        throw new Error(j?.error || j?.message || `Erreur historique (${sRes.status})`);
      }
      const sJson = await sRes.json();
      setSheet(Array.isArray(sJson?.result) ? sJson.result : []);
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }

  /* ──────────────────────────────────────────────────────────────────────── */
  /* Agrégation payouts + base (mint) par actif détenu */

  const perAsset = useMemo(() => {
    if (!positions.length) return { clubs: [], players: [], totals: { clubs: 0, players: 0 } };

    // set des actifs détenus
    const have = new Set(positions.map((p) => `${p.type}:${p.id}`));

    // montants SVC
    const payouts = new Map();   // key -> SVC
    const mintBase = new Map();  // player:<id> -> SVC absolu (somme des mints négatifs)

    for (const r of sheet) {
      const t = r?.type;
      const otype = r?.other_type;
      const oid = r?.other_id;

      // payouts (clubs & joueurs)
      if (isPayout(t) && otype && oid) {
        const key = `${otype}:${oid}`;
        if (!have.has(key)) continue; // on ne garde que les actifs encore détenus
        const v = toSVC(r.amount);
        payouts.set(key, (payouts.get(key) || 0) + v);
      }

      // base (mint) pour joueurs
      if (t === "mint" && r?.other_type === "player" && r?.other_id) {
        const key = `player:${r.other_id}`;
        const invested = Math.abs(toSVC(r.amount)); // montant négatif en base-unit
        mintBase.set(key, (mintBase.get(key) || 0) + invested);
      }
    }

    // assemble par actif détenu
    const clubs = [];
    const players = [];

    for (const p of positions) {
      const key = `${p.type}:${p.id}`;
      const pay = payouts.get(key) || 0;

      if (p.type === "club") {
        clubs.push({
          key,
          type: p.type,
          id: p.id,
          name: getClubName(p.id),
          qty: p.qty,
          payouts: round4(pay),
          roi: null, // base club via trades manquante pour l’instant
          base: null,
        });
      } else {
        const base = mintBase.get(key) || 0; // SVC
        const roi = base > 0 ? pay / base : null;
        players.push({
          key,
          type: p.type,
          id: p.id,
          name: getPlayerName(p.id),
          qty: p.qty,
          payouts: round4(pay),
          base: round4(base),
          roi,
        });
      }
    }

    // tri: plus rémunérateurs d'abord
    clubs.sort((a, b) => b.payouts - a.payouts);
    players.sort((a, b) => b.payouts - a.payouts);

    const totals = {
      clubs: round4(clubs.reduce((s, x) => s + x.payouts, 0)),
      players: round4(players.reduce((s, x) => s + x.payouts, 0)),
      playersBase: round4(players.reduce((s, x) => s + (x.base || 0), 0)),
      playersRoi: (() => {
        const base = players.reduce((s, x) => s + (x.base || 0), 0);
        const gains = players.reduce((s, x) => s + (x.payouts || 0), 0);
        return base > 0 ? gains / base : null;
      })(),
    };

    return { clubs, players, totals };
  }, [positions, sheet, clubMap, playerMap]);

  /* ──────────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          HomeBoard — Revenus “lifetime” & ROI (positions actuelles)
        </h1>

        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur Soccerverse"
            className="flex-1 rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Analyser"}
          </button>
        </form>

        {!!error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-300">
            {error}
          </div>
        )}

        {searched && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <KpiCard title="Clubs détenus" value={positions.filter(p => p.type==="club").length} />
            <KpiCard title="Joueurs détenus" value={positions.filter(p => p.type==="player").length} />
            <KpiCard title="Payouts Clubs (lifetime)" value={fmtSVC(perAsset.totals.clubs)} />
            <KpiCard
              title="Payouts Joueurs / ROI global"
              value={
                perAsset.totals.playersBase > 0
                  ? `${fmtSVC(perAsset.totals.players)} · ${(perAsset.totals.playersRoi*100).toFixed(1)}%`
                  : `${fmtSVC(perAsset.totals.players)} · ROI n/a`
              }
              accent="pos"
            />
          </div>
        )}

        {/* ── Clubs ───────────────────────────────────────────────────────── */}
        {searched && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Clubs</h2>
            {perAsset.clubs.length === 0 ? (
              <div className="text-gray-400">Aucun club détenu.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-xl border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Club</th>
                        <th className="text-right py-2 px-3">Quantité</th>
                        <th className="text-right py-2 px-3">Payouts cumulés</th>
                        <th className="text-left py-2 px-3">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {perAsset.clubs.map((c) => (
                        <tr key={c.key} className="hover:bg-white/5">
                          <td className="py-2 px-3">{assetLink("club", c.id, c.name)}</td>
                          <td className="py-2 px-3 text-right">{fmtInt(c.qty.total)}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(c.payouts)}</td>
                          <td className="py-2 px-3"><span className="text-gray-400">n/a (base trade)</span></td>
                        </tr>
                      ))}
                      <tr className="bg-gray-900/40 font-semibold">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(perAsset.totals.clubs)}</td>
                        <td className="py-2 px-3">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Joueurs ─────────────────────────────────────────────────────── */}
        {searched && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">Joueurs</h2>
            {perAsset.players.length === 0 ? (
              <div className="text-gray-400">Aucun joueur détenu.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-xl border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Joueur</th>
                        <th className="text-right py-2 px-3">Quantité</th>
                        <th className="text-right py-2 px-3">Base (mint)</th>
                        <th className="text-right py-2 px-3">Payouts cumulés</th>
                        <th className="text-left py-2 px-3 w-[220px]">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {perAsset.players.map((p) => (
                        <tr key={p.key} className="hover:bg-white/5">
                          <td className="py-2 px-3">{assetLink("player", p.id, p.name)}</td>
                          <td className="py-2 px-3 text-right">{fmtInt(p.qty.total)}</td>
                          <td className="py-2 px-3 text-right">{p.base != null ? fmtSVC(p.base) : "—"}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(p.payouts)}</td>
                          <td className="py-2 px-3"><RoiBar roi={p.roi} /></td>
                        </tr>
                      ))}
                      <tr className="bg-gray-900/40 font-semibold">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(perAsset.totals.playersBase)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(perAsset.totals.players)}</td>
                        <td className="py-2 px-3">
                          <RoiBar roi={perAsset.totals.playersRoi} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function round4(n) {
  return Math.round((n + Number.EPSILON) * 1e4) / 1e4;
}
