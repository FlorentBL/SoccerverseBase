"use client";
/**
 * HomeBoard — Positions & Paiements cumulés (lifetime)
 *
 * Sources:
 *  - /api/gsp_share_balances   → positions actuelles (club|player, balances)
 *  - /api/user_balance_sheet   → flux historiques (toutes pages, sans dates)
 *
 * Objectif:
 *  - Afficher combien on a gagné "depuis toujours" SUR LES POSITIONS ACTUELLES :
 *      on somme uniquement les payouts rattachés aux ids (club|player) que l'on détient
 *      (dividends matchday/league/cup, players wage, players bonus).
 *  - On exclut: share trade, mint, vault, user tx, manager wage, agent wage.
 *
 * Qualité:
 *  - Dédup stricte & tri date desc côté client
 *  - Mapping noms (club/player) identique à /transactions
 */

import React, { useEffect, useMemo, useState } from "react";

// ───────────── Mapping catégories
const CATEGORY_GROUPS = {
  "dividend (match day income)": "club_matchday",
  "dividend (league prize)": "club_league_prize",
  "dividend (cup prize)": "club_cup_prize",
  "dividend (players wage)": "player_wage",
  "dividend (playing bonus)": "player_bonus",
  "dividend (goal bonus)": "player_bonus",
  "dividend (assist bonus)": "player_bonus",
  "dividend (clean sheet bonus)": "player_bonus",
  // on gardera "dividend_other" en fallback
  "manager wage": "manager_fee",
  "agent wage": "agent_fee",
  "share trade": "trade",
  mint: "mint",
  vault: "vault",
  "user tx": "user_tx",
};
function mapCategory(type) {
  if (!type) return "unknown";
  if (CATEGORY_GROUPS[type]) return CATEGORY_GROUPS[type];
  if (type.startsWith("dividend (")) return "dividend_other";
  return "unknown";
}
function isPayoutForPositions(item) {
  // Payouts qui comptent pour les positions club/joueur
  const cat = mapCategory(item.type);
  return (
    ["club_matchday", "club_league_prize", "club_cup_prize", "player_wage", "player_bonus", "dividend_other"].includes(cat) &&
    (item.other_type === "club" || item.other_type === "player")
  );
}
function fmtSVC(n) {
  if (typeof n !== "number") return "-";
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} SVC`;
}
function fmtDate(ts) {
  if (!ts && ts !== 0) return "-";
  const d = new Date(Number(ts) * 1000);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR");
}

export default function HomeBoard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [rows, setRows] = useState([]);         // flux historiques (entier)
  const [positions, setPositions] = useState([]); // positions actuelles

  // mapping noms (comme Transactions)
  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const [clubRes, playerRes] = await Promise.all([
          fetch("/club_mapping.json"),
          fetch("/player_mapping.json"),
        ]);
        const [clubData, playerData] = await Promise.all([clubRes.json(), playerRes.json()]);
        setClubMap(clubData);
        setPlayerMap(playerData);
      } catch {
        /* ignore mapping errors */
      }
    };
    loadMaps();
  }, []);

  async function handleSubmit(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setRows([]);
    setPositions([]);

    try {
      // Appels en parallèle (sans from/to → lifetime)
      const [bsRes, posRes] = await Promise.all([
        fetch("/api/user_balance_sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }),
        fetch("/api/gsp_share_balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }),
      ]);

      // ---- balance sheet (flux)
      if (!bsRes.ok) {
        const j = await bsRes.json().catch(() => ({}));
        throw new Error(j?.error || `Erreur balance_sheet (${bsRes.status})`);
      }
      const j1 = await bsRes.json();
      const items = Array.isArray(j1?.result) ? j1.result : [];

      const normalized = items.map(normalizeRow);
      // dédup stricte
      const seen = new Set();
      const uniq = [];
      for (const r of normalized) {
        const k = [
          r.name,
          r.type,
          r.amount,
          r.other_name ?? "",
          r.other_type ?? "",
          r.other_id ?? "",
          r.unix_time ?? r.time ?? "",
        ].join("|");
        if (seen.has(k)) continue;
        seen.add(k);
        uniq.push(r);
      }
      // tri desc par date
      uniq.sort((a, b) => (b.unix_time ?? 0) - (a.unix_time ?? 0));
      setRows(uniq);

      // ---- positions actuelles
      if (!posRes.ok) {
        const j = await posRes.json().catch(() => ({}));
        throw new Error(j?.error || `Erreur share_balances (${posRes.status})`);
      }
      const j2 = await posRes.json();
      const pos = Array.isArray(j2?.result) ? j2.result : [];
      setPositions(pos.filter((p) => (p?.balance?.total ?? 0) > 0));
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }

  // Calculs "gains cumulés" par position
  const { earningsByKey, totalEarnings } = useMemo(
    () => computeLifetimeEarningsOnCurrentPositions(rows, positions),
    [rows, positions]
  );

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">HomeBoard — Positions & Paiements cumulés</h1>

        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nom d'utilisateur Soccerverse"
              className="rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
            />
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <KpiCard title="Paiements cumulés (sur positions actuelles)" value={fmtSVC(totalEarnings)} accent={totalEarnings >= 0 ? "pos" : "neg"} />
          </div>
        )}

        {/* Positions actuelles + gains cumulés par position */}
        {searched && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-3">Positions actuelles</h2>
            {positions.length === 0 ? (
              <div className="text-gray-400">Aucune position.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Actif</th>
                        <th className="text-right py-2 px-3">Total</th>
                        <th className="text-right py-2 px-3">Disponible</th>
                        <th className="text-right py-2 px-3">Réservé</th>
                        <th className="text-right py-2 px-3">Gains cumulés</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {positions.map((p, i) => {
                        const key = `${p.type}:${p.id}`;
                        const earned = earningsByKey[key] ?? 0;
                        return (
                          <tr key={`${p.type}-${p.id}-${i}`} className="hover:bg-white/5">
                            <td className="py-2 px-3">{renderShareLabel(p, clubMap, playerMap)}</td>
                            <td className="py-2 px-3 text-right">{p.balance.total.toLocaleString("fr-FR")}</td>
                            <td className="py-2 px-3 text-right">{p.balance.available.toLocaleString("fr-FR")}</td>
                            <td className="py-2 px-3 text-right">{p.balance.reserved.toLocaleString("fr-FR")}</td>
                            <td className="py-2 px-3 text-right">{fmtSVC(earned)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-900/40 font-semibold">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(totalEarnings)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Journal brut (optionnel, utile debug) */}
        {searched && rows.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Journal des payouts (filtré positions actuelles)</h2>
            <div className="overflow-x-auto">
              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-right py-2 px-3">Montant</th>
                      <th className="text-left py-2 px-3">Référence</th>
                      <th className="text-left py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {rows
                      .filter(isPayoutForPositions)
                      .filter((r) => r.other_id && r.other_type)
                      .filter((r) => positionsSet(positions).has(`${r.other_type}:${r.other_id}`))
                      .map((r, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="py-2 px-3">{r.type}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(r.amount)}</td>
                          <td className="py-2 px-3">{renderRef(r, clubMap, playerMap)}</td>
                          <td className="py-2 px-3">{fmtDate(r.unix_time)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ───────────── Helpers calculs

function normalizeRow(r) {
  return {
    name: r?.name ?? "",
    amount: typeof r?.amount === "number" ? r.amount : 0,
    type: r?.type ?? "",
    other_name: r?.other_name ?? null,
    other_type: r?.other_type ?? null,
    other_id: r?.other_id ?? null,
    time: r?.time ?? null,
    unix_time: typeof r?.unix_time === "number" ? r.unix_time : null,
  };
}
function positionsSet(positions) {
  const s = new Set();
  for (const p of positions) s.add(`${p.type}:${p.id}`);
  return s;
}
function computeLifetimeEarningsOnCurrentPositions(rows, positions) {
  const posSet = positionsSet(positions);
  const earningsByKey = {};
  let total = 0;

  for (const r of rows) {
    if (!isPayoutForPositions(r)) continue;
    if (!r.other_type || !r.other_id) continue;
    const key = `${r.other_type}:${r.other_id}`;
    if (!posSet.has(key)) continue; // on ne compte que ce qu'on détient aujourd'hui
    earningsByKey[key] = (earningsByKey[key] ?? 0) + r.amount;
    total += r.amount;
  }
  // arrondis légers
  for (const k of Object.keys(earningsByKey)) earningsByKey[k] = round2(earningsByKey[k]);
  return { earningsByKey, totalEarnings: round2(total) };
}
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ───────────── Rendu références & cartes

function renderRef(r, clubMap, playerMap) {
  if (!r.other_type || !r.other_id) return "-";
  const id = r.other_id;
  if (r.other_type === "club") {
    const label = clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`;
    const href = `https://play.soccerverse.com/club/${id}`;
    return (
      <a href={href} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }
  if (r.other_type === "player") {
    const p = playerMap?.[id];
    const label = p?.name || [p?.f, p?.s].filter(Boolean).join(" ") || `Joueur #${id}`;
    const href = `https://play.soccerverse.com/player/${id}`;
    return (
      <a href={href} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }
  return `${r.other_type} #${id}`;
}
function renderShareLabel(p, clubMap, playerMap) {
  const id = p.id;
  if (p.type === "club") {
    const label = clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`;
    const href = `https://play.soccerverse.com/club/${id}`;
    return (
      <a href={href} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }
  if (p.type === "player") {
    const pl = playerMap?.[id];
    const label = pl?.name || [pl?.f, pl?.s].filter(Boolean).join(" ") || `Joueur #${id}`;
    const href = `https://play.soccerverse.com/player/${id}`;
    return (
      <a href={href} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }
  return `${p.type} #${id}`;
}
function KpiCard({ title, value, accent }) {
  const ring =
    accent === "pos" ? "ring-emerald-500/30" : accent === "neg" ? "ring-red-500/30" : "ring-gray-500/20";
  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-900/40 p-4 ring-1 ${ring}`}>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
