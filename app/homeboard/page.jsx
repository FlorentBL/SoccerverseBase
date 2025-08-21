// app/roi/page.jsx
"use client";

/**
 * HomeBoard — ROI (définitif, "depuis toujours")
 *
 * Données consommées :
 * - /api/user_balance_sheet  → historique SVC (trades, mints, dividends, etc.)
 * - /api/transactions        → mêmes événements avec l’ID de part (club/joueur)
 * - JSON-RPC gsppub          → positions actuelles (quantités détenues)
 * - /club_mapping.json & /player_mapping.json → libellés
 *
 * Règles :
 * - Payouts (revenus) = somme des "dividend (...)" par club/joueur.
 * - Base Joueurs = somme absolue des "mint" négatifs (freebench) par joueur.
 * - Base Clubs   = somme absolue des "share trade" négatifs JOIN
 *                  (unix_time, other_name) ↔ /api/transactions → id de club.
 * - ROI = Payouts / Base (si Base > 0). Sinon “n/a (base trade/mint)”.
 * - “Depuis toujours” : aucune borne de date, on agrège l’historique complet.
 */

import React, { useEffect, useMemo, useState } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Utils

const fmtSVC = (n) =>
  typeof n === "number"
    ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} SVC`
    : "-";

const fmtInt = (n) =>
  typeof n === "number" ? n.toLocaleString("fr-FR") : "-";

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

const shareLink = (type, id) =>
  type === "club"
    ? `https://play.soccerverse.com/club/${id}`
    : `https://play.soccerverse.com/player/${id}`;

const tradeKey = (otherName, unix) => `${otherName || ""}|${Number(unix) || 0}`;

// Les montants du balance_sheet sont en dix-millièmes de SVC
const UNIT = 10000;
const toSVC = (n) => (Number(n) || 0) / UNIT;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

// ───────────────────────────────────────────────────────────────────────────────
// Agrégation

function indexTradesByTimeAndCounterparty(txs) {
  const idx = new Map();
  for (const t of txs || []) {
    if (t?.type !== "share trade") continue;
    const share = t?.share;
    if (!share?.type || !share?.id) continue;
    const k = tradeKey(t?.other_name, t?.date);
    if (!idx.has(k)) idx.set(k, { type: share.type, id: share.id });
  }
  return idx;
}

function aggregateForever({ balanceSheet, transactions, balances, clubMap, playerMap }) {
  const tradeIdx = indexTradesByTimeAndCounterparty(transactions);

  const payoutsClub = new Map();
  const payoutsPlayer = new Map();
  const baseMintPlayer = new Map();
  const baseTradeClub = new Map();

  for (const it of balanceSheet || []) {
    const amtSVC = toSVC(it?.amount); // <-- conversion en SVC

    // Payouts (dividendes) en SVC
    if (it?.type?.startsWith("dividend")) {
      if (it?.other_type === "club" && it?.other_id != null) {
        payoutsClub.set(it.other_id, (payoutsClub.get(it.other_id) || 0) + amtSVC);
      } else if (it?.other_type === "player" && it?.other_id != null) {
        payoutsPlayer.set(it.other_id, (payoutsPlayer.get(it.other_id) || 0) + amtSVC);
      }
      continue;
    }

    // Base mint (joueurs) en SVC
    if (it?.type === "mint" && it?.other_type === "player" && it?.other_id != null && amtSVC < 0) {
      baseMintPlayer.set(it.other_id, (baseMintPlayer.get(it.other_id) || 0) + Math.abs(amtSVC));
      continue;
    }

    // Base trade (clubs) en SVC — join via (other_name, unix_time) -> id club
    if (it?.type === "share trade" && amtSVC < 0) {
      const k = `${it?.other_name || ""}|${Number(it?.unix_time) || 0}`;
      const share = tradeIdx.get(k);
      if (share?.type === "club") {
        baseTradeClub.set(share.id, (baseTradeClub.get(share.id) || 0) + Math.abs(amtSVC));
      }
    }
  }

  const clubs = [];
  const players = [];

  for (const b of balances?.clubs || []) {
    const id = b.id;
    const qty = Number(b.total ?? b.balance?.total ?? 0);
    const name = clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`;
    const payouts = round4(payoutsClub.get(id) || 0);
    const base = round2(baseTradeClub.get(id) || 0);
    const roi = base > 0 ? payouts / base : null;
    clubs.push({ id, name, qty, payouts, base, roi, link: `https://play.soccerverse.com/club/${id}` });
  }

  for (const b of balances?.players || []) {
    const id = b.id;
    const qty = Number(b.total ?? b.balance?.total ?? 0);
    const p = playerMap?.[id];
    const name = p?.name || [p?.f, p?.s].filter(Boolean).join(" ") || `Joueur #${id}`;
    const payouts = round4(payoutsPlayer.get(id) || 0);
    const base = round2(baseMintPlayer.get(id) || 0);
    const roi = base > 0 ? payouts / base : null;
    players.push({ id, name, qty, payouts, base, roi, link: `https://play.soccerverse.com/player/${id}` });
  }

  clubs.sort((a, b) => (b.payouts - a.payouts) || (b.qty - a.qty));
  players.sort((a, b) => (b.payouts - a.payouts) || (b.qty - a.qty));

  return { clubs, players };
}


// ───────────────────────────────────────────────────────────────────────────────
// Page

export default function RoiForever() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [balanceSheet, setBalanceSheet] = useState([]); // /api/user_balance_sheet
  const [transactions, setTransactions] = useState([]); // /api/transactions
  const [positions, setPositions] = useState({ clubs: [], players: [] }); // JSON-RPC

  // Charger les mappings (noms)
  useEffect(() => {
    (async () => {
      try {
        const [clubRes, playerRes] = await Promise.all([
          fetch("/club_mapping.json"),
          fetch("/player_mapping.json"),
        ]);
        const [clubData, playerData] = await Promise.all([
          clubRes.json(),
          playerRes.json(),
        ]);
        setClubMap(clubData || {});
        setPlayerMap(playerData || {});
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function fetchUserBalanceSheet(name) {
    const res = await fetch("/api/user_balance_sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }), // pas de dates → “depuis toujours”
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `Erreur balance_sheet (${res.status})`);
    }
    const j = await res.json();
    return Array.isArray(j?.result) ? j.result : [];
  }

  async function fetchTransactions(name) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `Erreur transactions (${res.status})`);
    }
    const j = await res.json();
    return Array.isArray(j?.result) ? j.result : [];
  }

  // Appel direct JSON-RPC (si CORS bloque chez toi, proxifie via un /api/*)
  async function fetchShareBalances(name) {
    const res = await fetch("https://gsppub.soccerverse.io/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "get_user_share_balances",
        params: { name },
        id: 1,
      }),
    });
    if (!res.ok) throw new Error(`Erreur gsppub (${res.status})`);
    const j = await res.json();
    const data = j?.result?.data || [];
    // normalise → { clubs:[{id,total}], players:[{id,total}] }
    const clubs = [];
    const players = [];
    for (const row of data) {
      const total = Number(row?.balance?.total || 0);
      const share = row?.share || {};
      if (share.club != null) clubs.push({ id: Number(share.club), total });
      else if (share.player != null) players.push({ id: Number(share.player), total });
    }
    return { clubs, players };
  }

  async function handleSearch(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const [bs, txs, pos] = await Promise.all([
        fetchUserBalanceSheet(name),
        fetchTransactions(name),
        fetchShareBalances(name),
      ]);

      setBalanceSheet(bs);
      setTransactions(txs);
      setPositions(pos);
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
      setBalanceSheet([]);
      setTransactions([]);
      setPositions({ clubs: [], players: [] });
    } finally {
      setLoading(false);
    }
  }

  const { clubs, players } = useMemo(
    () =>
      aggregateForever({
        balanceSheet,
        transactions,
        balances: positions,
        clubMap,
        playerMap,
      }),
    [balanceSheet, transactions, positions, clubMap, playerMap]
  );

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          HomeBoard — ROI (depuis toujours)
        </h1>

        <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-2">
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

        {/* Clubs */}
        {searched && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">Clubs</h2>
            {clubs.length === 0 ? (
              <div className="text-gray-400">Aucune position club.</div>
            ) : (
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3">Club</th>
                      <th className="text-right py-2 px-3">Quantité</th>
                      <th className="text-right py-2 px-3">Base (trade)</th>
                      <th className="text-right py-2 px-3">Payouts cumulés</th>
                      <th className="text-left py-2 px-3">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {clubs.map((row) => (
                      <tr key={`c-${row.id}`} className="hover:bg-white/5">
                        <td className="py-2 px-3">
                          <a
                            href={row.link}
                            className="text-indigo-400 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.name}
                          </a>
                        </td>
                        <td className="py-2 px-3 text-right">{fmtInt(row.qty)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(row.base)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(row.payouts)}</td>
                        <td className="py-2 px-3">
                          {row.base > 0 ? (
                            <RoiBar pct={row.roi * 100} />
                          ) : (
                            <span className="text-gray-500">n/a (base trade)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Joueurs */}
        {searched && (
          <section className="mb-20">
            <h2 className="text-2xl font-semibold mb-3">Joueurs</h2>
            {players.length === 0 ? (
              <div className="text-gray-400">Aucune position joueur.</div>
            ) : (
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3">Joueur</th>
                      <th className="text-right py-2 px-3">Quantité</th>
                      <th className="text-right py-2 px-3">Base (mint)</th>
                      <th className="text-right py-2 px-3">Payouts cumulés</th>
                      <th className="text-left py-2 px-3">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {players.map((row) => (
                      <tr key={`p-${row.id}`} className="hover:bg-white/5">
                        <td className="py-2 px-3">
                          <a
                            href={row.link}
                            className="text-indigo-400 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.name}
                          </a>
                        </td>
                        <td className="py-2 px-3 text-right">{fmtInt(row.qty)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(row.base)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(row.payouts)}</td>
                        <td className="py-2 px-3">
                          {row.base > 0 ? (
                            <RoiBar pct={row.roi * 100} />
                          ) : (
                            <span className="text-gray-500">n/a (base mint)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// UI: barre de ROI

function RoiBar({ pct }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <div className="flex-1 h-2 rounded bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="tabular-nums">{clamped.toFixed(1)}%</span>
    </div>
  );
}
