"use client";
/**
 * HomeBoard — ROI (réalisé) + Positions actuelles
 * Sources:
 *  - /api/user_balance_sheet  → flux (achats/ventes, payouts)
 *  - /api/gsp_share_balances  → positions (quantités club/joueur)
 *
 * ROI (réalisé) sur la période = (Gains - Investi) / Investi
 *   Investi: sorties SVC pour "share trade" (<0) et "mint" (<0)
 *   Gains:   entrées SVC (dividends, manager/agent wage, "share trade" >0)
 *
 * Dédup + tri date desc pour aligner avec la page Transactions.
 */

import React, { useEffect, useMemo, useState } from "react";

// ───────────── Utils dates (Europe/Paris)
function startOfNDaysAgoUTC(days) {
  const now = new Date();
  const tzNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  tzNow.setHours(0, 0, 0, 0);
  return Math.floor((tzNow.getTime() - days * 86400000) / 1000);
}
function endOfTodayUTC() {
  const now = new Date();
  const tzNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  tzNow.setHours(23, 59, 59, 999);
  return Math.floor(tzNow.getTime() / 1000);
}
function toEpoch(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

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
function isInvestmentOutflow(item) {
  const cat = mapCategory(item.type);
  return (cat === "trade" || cat === "mint") && item.amount < 0;
}
function isRealizedInflow(item) {
  const cat = mapCategory(item.type);
  if (cat === "vault" || cat === "user_tx") return false;
  if (cat === "trade" && item.amount > 0) return true;
  return [
    "club_matchday",
    "club_league_prize",
    "club_cup_prize",
    "player_wage",
    "player_bonus",
    "manager_fee",
    "agent_fee",
    "dividend_other",
  ].includes(cat);
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
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [rows, setRows] = useState([]);       // flux
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

  // défaut: 7 derniers jours
  useEffect(() => {
    if (!fromStr && !toStr) {
      const from = startOfNDaysAgoUTC(6);
      const to = endOfTodayUTC();
      setFromStr(toISODate(new Date(from * 1000)));
      setToStr(toISODate(new Date(to * 1000)));
    }
  }, [fromStr, toStr]);

  async function handleSubmit(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    const from_time = toEpoch(fromStr);
    const to_time = toEpoch(toStr) ? toEpoch(toStr) + 86399 : null;

    setLoading(true);
    setError("");
    setSearched(true);
    setRows([]);
    setPositions([]);

    try {
      // flux + positions en parallèle
      const [bsRes, posRes] = await Promise.all([
        fetch("/api/user_balance_sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, from_time, to_time }),
        }),
        fetch("/api/gsp_share_balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }),
      ]);

      // ---- balance sheet
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

      // ---- positions
      if (!posRes.ok) {
        const j = await posRes.json().catch(() => ({}));
        throw new Error(j?.error || `Erreur share_balances (${posRes.status})`);
      }
      const j2 = await posRes.json();
      const pos = Array.isArray(j2?.result) ? j2.result : [];
      // garde: on n’affiche que les positions non nulles
      setPositions(pos.filter((p) => (p?.balance?.total ?? 0) > 0));
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }

  // KPI
  const { totalInvestedSVC, totalGainsSVC, roi, buyRows, sellRows, payoutsAgg } = useMemo(
    () => aggregate(rows),
    [rows]
  );

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">HomeBoard — ROI & Positions</h1>

        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end"
        >
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
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Du</label>
            <input
              type="date"
              value={fromStr}
              onChange={(e) => setFromStr(e.target.value)}
              className="rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Au</label>
            <input
              type="date"
              value={toStr}
              onChange={(e) => setToStr(e.target.value)}
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
            <KpiCard title="Investi (achats influence)" value={fmtSVC(totalInvestedSVC)} />
            <KpiCard title="Gains réalisés" value={fmtSVC(totalGainsSVC)} />
            <KpiCard
              title="ROI réalisé"
              value={isFinite(roi) ? `${(roi * 100).toFixed(2)} %` : "-"}
              accent={roi >= 0 ? "pos" : "neg"}
            />
          </div>
        )}

        {/* Positions actuelles */}
        {searched && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Positions actuelles (influence détenue)</h2>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {positions.map((p, i) => (
                        <tr key={`${p.type}-${p.id}-${i}`} className="hover:bg-white/5">
                          <td className="py-2 px-3">{renderShareLabel(p, clubMap, playerMap)}</td>
                          <td className="py-2 px-3 text-right">{p.balance.total.toLocaleString("fr-FR")}</td>
                          <td className="py-2 px-3 text-right">{p.balance.available.toLocaleString("fr-FR")}</td>
                          <td className="py-2 px-3 text-right">{p.balance.reserved.toLocaleString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Breakdown gains */}
        {searched && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Répartition des gains (payouts)</h2>
            {Object.keys(payoutsAgg).length === 0 ? (
              <div className="text-gray-400">Aucun payout sur la période.</div>
            ) : (
              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3">Catégorie</th>
                      <th className="text-right py-2 px-3">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {Object.entries(payoutsAgg).map(([cat, amt]) => (
                      <tr key={cat} className="hover:bg-white/5">
                        <td className="py-2 px-3">{labelCategory(cat)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(amt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Achats */}
        {searched && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Achats (share trade / mint)</h2>
            {buyRows.length === 0 ? (
              <div className="text-gray-400">Aucun achat sur la période.</div>
            ) : (
              <TableFlux rows={buyRows} footerLabel="Total investi" footerValue={fmtSVC(totalInvestedSVC)} clubMap={clubMap} playerMap={playerMap} />
            )}
          </section>
        )}

        {/* Ventes */}
        {searched && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-3">Ventes (share trade)</h2>
            {sellRows.length === 0 ? (
              <div className="text-gray-400">Aucune vente sur la période.</div>
            ) : (
              <TableFlux rows={sellRows} clubMap={clubMap} playerMap={playerMap} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ───────────── UI helpers

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

function TableFlux({ rows, footerLabel, footerValue, clubMap, playerMap }) {
  return (
    <div className="overflow-x-auto">
      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">Montant</th>
              <th className="text-left py-2 px-3">Référence</th>
              <th className="text-left py-2 px-3">Autre</th>
              <th className="text-left py-2 px-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="py-2 px-3">{r.type}</td>
                <td className="py-2 px-3 text-right">{fmtSVC(r.amount)}</td>
                <td className="py-2 px-3">{renderRef(r, clubMap, playerMap)}</td>
                <td className="py-2 px-3">{r.other_name || "-"}</td>
                <td className="py-2 px-3">{fmtDate(r.unix_time)}</td>
              </tr>
            ))}
            {footerLabel && (
              <tr className="bg-gray-900/40 font-semibold">
                <td className="py-2 px-3">{footerLabel}</td>
                <td className="py-2 px-3 text-right">{footerValue}</td>
                <td className="py-2 px-3">—</td>
                <td className="py-2 px-3">—</td>
                <td className="py-2 px-3">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────── Normalisation & agrégation

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
    category: mapCategory(r?.type),
  };
}
function aggregate(rows) {
  let invested = 0;
  let gains = 0;
  const buyRows = [];
  const sellRows = [];
  const payoutsAgg = {};

  for (const r of rows) {
    if (isInvestmentOutflow(r)) {
      invested += Math.abs(r.amount);
      buyRows.push(r);
      continue;
    }
    if (isRealizedInflow(r)) {
      gains += r.amount;
      payoutsAgg[r.category] = (payoutsAgg[r.category] ?? 0) + r.amount;
      if (r.category === "trade") sellRows.push(r);
      continue;
    }
  }

  const denom = Math.max(invested, 1);
  const roi = (gains - invested) / denom;

  return {
    totalInvestedSVC: round2(invested),
    totalGainsSVC: round2(gains),
    roi,
    buyRows,
    sellRows,
    payoutsAgg: mapVals(payoutsAgg, round2),
  };
}
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function mapVals(obj, fn) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = fn(v);
  return out;
}

// ───────────── Rendu références + positions

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
