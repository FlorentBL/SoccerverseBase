"use client";
/**
 * HomeBoard — ROI via /api/user_balance_sheet
 * - Dédup + tri par date desc
 * - Libellés Club/Joueur comme la page Transactions
 */

import React, { useEffect, useMemo, useState } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Utils dates (Europe/Paris)

function startOfNDaysAgoUTC(days) {
  const now = new Date();
  const tzNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  tzNow.setHours(0, 0, 0, 0);
  const ms = tzNow.getTime() - days * 24 * 3600 * 1000;
  return Math.floor(ms / 1000);
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

// ───────────────────────────────────────────────────────────────────────────────
// Mapping & calculs

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
function labelCategory(key) {
  const MAP = {
    club_matchday: "Club · Matchday (1%)",
    club_league_prize: "Club · Prime championnat",
    club_cup_prize: "Club · Prime coupe",
    player_wage: "Joueur · Salaire (0,2%)",
    player_bonus: "Joueur · Bonus (titulaire/but/passe/CS)",
    manager_fee: "Manager (TV ~0,0004%)",
    agent_fee: "Agent (0,002%)",
    dividend_other: "Dividende (autre)",
    trade: "Trade (vente/achat)",
    mint: "Mint (freebench)",
    vault: "Vault (hors ROI)",
    user_tx: "Transfert utilisateur (hors ROI)",
    unknown: "Inconnu",
  };
  return MAP[key] || key;
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

// ───────────────────────────────────────────────────────────────────────────────

export default function HomeBoard() {
  const [username, setUsername] = useState("");
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  // mappings (pour affichage noms)
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

  // Par défaut: 7 derniers jours
  useEffect(() => {
    if (!fromStr && !toStr) {
      const from = startOfNDaysAgoUTC(6);
      const to = endOfTodayUTC();
      const toD = new Date(to * 1000);
      const fromD = new Date(from * 1000);
      setFromStr(toISODate(fromD));
      setToStr(toISODate(toD));
    }
  }, [fromStr, toStr]);

  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    const from_time = toEpoch(fromStr);
    const to_time = toEpoch(toStr) ? toEpoch(toStr) + 86399 : null; // inclure fin de journée

    setLoading(true);
    setError("");
    setSearched(true);
    setRows([]);

    try {
      const res = await fetch("/api/user_balance_sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, from_time, to_time }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Erreur serveur (${res.status})`);
      }
      const j = await res.json();
      const items = Array.isArray(j?.result) ? j.result : [];

      // normalisation
      const normalized = items.map(normalizeRow);

      // dédup
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

      // tri date desc (comme la page Transactions)
      uniq.sort((a, b) => (b.unix_time ?? 0) - (a.unix_time ?? 0));

      setRows(uniq);
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }

  // KPI & views
  const {
    totalInvestedSVC,
    totalGainsSVC,
    roi,
    buyRows,
    sellRows,
    payoutsAgg,
    investmentRows,
  } = useMemo(() => aggregate(rows), [rows]);

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">HomeBoard — ROI (Balance Sheet)</h1>

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

        {searched && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">ROI par investissement</h2>
            {investmentRows.length === 0 ? (
              <div className="text-gray-400">Aucun investissement sur la période.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Référence</th>
                        <th className="text-right py-2 px-3">Investi</th>
                        <th className="text-right py-2 px-3">Gains</th>
                        <th className="text-right py-2 px-3">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {investmentRows.map((r, i) => (
                        <tr key={`inv-${i}`} className="hover:bg-white/5">
                          <td className="py-2 px-3">{renderRef(r, clubMap, playerMap)}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(r.invested)}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(r.gains)}</td>
                          <td className="py-2 px-3 text-right">
                            {isFinite(r.roi) ? `${(r.roi * 100).toFixed(2)} %` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {searched && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Achats (share trade / mint)</h2>
            {buyRows.length === 0 ? (
              <div className="text-gray-400">Aucun achat sur la période.</div>
            ) : (
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
                      {buyRows.map((r, i) => (
                        <tr key={`b-${i}`} className="hover:bg-white/5">
                          <td className="py-2 px-3">{r.type}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(r.amount)}</td>
                          <td className="py-2 px-3">{renderRef(r, clubMap, playerMap)}</td>
                          <td className="py-2 px-3">{r.other_name || "-"}</td>
                          <td className="py-2 px-3">{fmtDate(r.unix_time)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-900/40 font-semibold">
                        <td className="py-2 px-3">Total investi</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(totalInvestedSVC)}</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {searched && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-3">Ventes (share trade)</h2>
            {sellRows.length === 0 ? (
              <div className="text-gray-400">Aucune vente sur la période.</div>
            ) : (
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
                      {sellRows.map((r, i) => (
                        <tr key={`s-${i}`} className="hover:bg-white/5">
                          <td className="py-2 px-3">{r.type}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(r.amount)}</td>
                          <td className="py-2 px-3">{renderRef(r, clubMap, playerMap)}</td>
                          <td className="py-2 px-3">{r.other_name || "-"}</td>
                          <td className="py-2 px-3">{fmtDate(r.unix_time)}</td>
                        </tr>
                      ))}
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

// ───────────────────────────────────────────────────────────────────────────────
// Petits composants

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

// ───────────────────────────────────────────────────────────────────────────────
// Normalisation & agrégation

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
  const perInvestment = {};

  for (const r of rows) {
    const key = r.other_type && r.other_id ? `${r.other_type}:${r.other_id}` : null;

    if (isInvestmentOutflow(r)) {
      invested += Math.abs(r.amount);
      buyRows.push(r);
      if (key) {
        if (!perInvestment[key]) perInvestment[key] = { other_type: r.other_type, other_id: r.other_id, invested: 0, gains: 0 };
        perInvestment[key].invested += Math.abs(r.amount);
      }
      continue;
    }
    if (isRealizedInflow(r)) {
      gains += r.amount;
      payoutsAgg[r.category] = (payoutsAgg[r.category] ?? 0) + r.amount;
      if (r.category === "trade") sellRows.push(r);
      if (key) {
        if (!perInvestment[key]) perInvestment[key] = { other_type: r.other_type, other_id: r.other_id, invested: 0, gains: 0 };
        perInvestment[key].gains += r.amount;
      }
      continue;
    }
    if (r.category === "trade" && r.amount > 0) {
      gains += r.amount;
      payoutsAgg[r.category] = (payoutsAgg[r.category] ?? 0) + r.amount;
      sellRows.push(r);
      if (key) {
        if (!perInvestment[key]) perInvestment[key] = { other_type: r.other_type, other_id: r.other_id, invested: 0, gains: 0 };
        perInvestment[key].gains += r.amount;
      }
    }
  }

  const denom = Math.max(invested, 1);
  const roi = (gains - invested) / denom;

  const investmentRows = Object.values(perInvestment).map((p) => ({
    other_type: p.other_type,
    other_id: p.other_id,
    invested: round2(p.invested),
    gains: round2(p.gains),
    roi: (p.gains - p.invested) / Math.max(p.invested, 1),
  }));

  investmentRows.sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));

  return {
    totalInvestedSVC: round2(invested),
    totalGainsSVC: round2(gains),
    roi,
    buyRows,
    sellRows,
    payoutsAgg: mapObject(payoutsAgg, round2),
    investmentRows,
  };
}
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function mapObject(obj, fn) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = fn(v);
  return out;
}

// Affichage d'une référence (club / player) si présente (avec libellés)
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
