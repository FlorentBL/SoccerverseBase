// app/roi/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

const UNIT = 10000;
const toSVC = (n) => (Number(n) || 0) / UNIT;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
const SAFE_DIV = (num, den) => (den > 0 ? num / den : null);

const fmtSVC = (n) =>
  typeof n === "number" ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} SVC` : "-";
const fmtUSD = (n) =>
  typeof n === "number" ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "-";
const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "-");

function RoiBar({ pct }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className="flex items-center gap-3 min-w-[120px]">
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

// ─────────────────────────────────────────────
// Agrégation ROI
function aggregateForever({
  balanceSheet,
  transactions,
  positions,
  clubMap,
  playerMap,
  packDataByClub, // Map<clubId, {priceUSD, influences:{clubId, qty}}>
  svcRateUSD,
}) {
  const payoutsClub = new Map();
  const payoutsPlayer = new Map();
  const baseMintPlayer = new Map();
  const achatsSvcClub = new Map();

  for (const it of balanceSheet || []) {
    const amtSVC = toSVC(it?.amount);
    if (it?.type?.startsWith("dividend") && it?.other_type === "club") {
      payoutsClub.set(it.other_id, (payoutsClub.get(it.other_id) || 0) + amtSVC);
    }
    if (it?.type?.startsWith("dividend") && it?.other_type === "player") {
      payoutsPlayer.set(it.other_id, (payoutsPlayer.get(it.other_id) || 0) + amtSVC);
    }
    if (it?.type === "mint" && it?.other_type === "player" && amtSVC < 0) {
      baseMintPlayer.set(it.other_id, (baseMintPlayer.get(it.other_id) || 0) + Math.abs(amtSVC));
    }
    if (it?.type === "share trade" && amtSVC < 0 && it?.other_type === "club") {
      achatsSvcClub.set(it.other_id, (achatsSvcClub.get(it.other_id) || 0) + Math.abs(amtSVC));
    }
  }

  const clubs = [];
  for (const b of positions?.clubs || []) {
    const id = b.id;
    const qty = Number(b.total || 0);
    const name = clubMap?.[id]?.name || `Club #${id}`;
    const gainsSvc = round4(payoutsClub.get(id) || 0);
    const achatsSvc = round2(achatsSvcClub.get(id) || 0);

    const pack = packDataByClub.get(id);
    let depensePackUSD = 0;
    let depensePackAffineeUSD = 0;

    if (pack && pack.priceUSD && pack.influences) {
      // coût par influence (affiné)
      const totalInf = pack.influences.reduce((s, x) => s + x.qty, 0);
      const costPerInf = totalInf > 0 ? pack.priceUSD / totalInf : 0;
      const clubInf = pack.influences.find((x) => x.clubId === id)?.qty || 0;

      // Version simple (tout pack attribué au club principal)
      depensePackUSD = (clubInf > 0 ? qty : 0) * (pack.priceUSD / clubInf);

      // Version affinée
      depensePackAffineeUSD = qty * clubInf * costPerInf / clubInf;
      // simplifie à qty * costPerInf (si clubInf>0)
      depensePackAffineeUSD = qty * costPerInf;
    }

    const depenseSvcUSD = svcRateUSD != null ? achatsSvc * svcRateUSD : 0;
    const gainsUSD = svcRateUSD != null ? gainsSvc * svcRateUSD : 0;

    const roiUSD = SAFE_DIV(gainsUSD, depenseSvcUSD + depensePackUSD);
    const roiAffUSD = SAFE_DIV(gainsUSD, depenseSvcUSD + depensePackAffineeUSD);

    clubs.push({
      id,
      name,
      qty,
      achatsSvc,
      gainsSvc,
      roiUSD,
      roiAffUSD,
      packPriceUSD: pack?.priceUSD,
      link: `https://play.soccerverse.com/club/${id}`,
    });
  }

  const players = [];
  for (const b of positions?.players || []) {
    const id = b.id;
    const qty = Number(b.total || 0);
    const p = playerMap?.[id];
    const name = p?.name || `Joueur #${id}`;
    const payouts = round4(payoutsPlayer.get(id) || 0);
    const baseSvc = round2(baseMintPlayer.get(id) || 0);
    const roi = SAFE_DIV(payouts, baseSvc);
    players.push({ id, name, qty, payouts, baseSvc, roi });
  }

  return { clubs, players };
}

// ─────────────────────────────────────────────
// Page
export default function RoiForever() {
  const [username, setUsername] = useState("");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});
  const [balanceSheet, setBalanceSheet] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [positions, setPositions] = useState({ clubs: [], players: [] });
  const [packDataByClub, setPackDataByClub] = useState(new Map());
  const [svcRateUSD, setSvcRateUSD] = useState(null);

  // tri
  const [sortKey, setSortKey] = useState("roiUSD");
  const [sortDir, setSortDir] = useState("desc");

  // fetch mappings
  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([
          fetch("/club_mapping.json").then((r) => r.json()),
          fetch("/player_mapping.json").then((r) => r.json()),
        ]);
        setClubMap(c);
        setPlayerMap(p);
      } catch {}
    })();
  }, []);

  // fetch rate
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("https://services.soccerverse.com/api/market");
        const j = await r.json();
        if (j?.SVC2USDC) setSvcRateUSD(j.SVC2USDC);
      } catch {}
    })();
  }, []);

  async function fetchPackPreview(clubId) {
    const r = await fetch(`/api/pack_preview?clubId=${clubId}&numPacks=1`);
    if (!r.ok) return null;
    const j = await r.json();
    const priceUSD = Array.isArray(j?.resultNums) ? j.resultNums[1] / 1e6 : null;

    // influences : [clubId, qty] à partir du tableau
    const influences = [];
    if (Array.isArray(j?.resultNums)) {
      for (let i = 3; i < j.resultNums.length - 1; i += 2) {
        influences.push({ clubId: j.resultNums[i], qty: j.resultNums[i + 1] });
      }
    }
    return { priceUSD, influences };
  }

  async function handleSearch(e) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const [bs, tx, pos] = await Promise.all([
        fetch("/api/user_balance_sheet", { method: "POST", body: JSON.stringify({ name: username }) }).then((r) =>
          r.json()
        ),
        fetch("/api/transactions", { method: "POST", body: JSON.stringify({ name: username }) }).then((r) => r.json()),
        fetch("/api/user_positions", { method: "POST", body: JSON.stringify({ name: username }) }).then((r) => r.json()),
      ]);
      setBalanceSheet(bs.result || []);
      setTransactions(tx.result || []);
      setPositions(pos);

      const clubIds = pos?.clubs?.map((c) => c.id) || [];
      const previews = await Promise.all(clubIds.map((id) => fetchPackPreview(id).then((p) => [id, p])));
      const map = new Map();
      for (const [id, p] of previews) if (p) map.set(id, p);
      setPackDataByClub(map);
      setSearched(true);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const { clubs, players } = useMemo(
    () => aggregateForever({ balanceSheet, transactions, positions, clubMap, playerMap, packDataByClub, svcRateUSD }),
    [balanceSheet, transactions, positions, clubMap, playerMap, packDataByClub, svcRateUSD]
  );

  const sortedClubs = [...clubs].sort((a, b) => {
    const va = a[sortKey] || 0;
    const vb = b[sortKey] || 0;
    return sortDir === "asc" ? va - vb : vb - va;
  });

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="text-white p-4">
      <h1 className="text-2xl font-bold mb-4">ROI depuis toujours</h1>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur"
          className="flex-1 bg-gray-800 p-2 rounded"
        />
        <button className="bg-indigo-600 px-4 py-2 rounded" disabled={loading}>
          {loading ? "..." : "Analyser"}
        </button>
      </form>

      {searched && (
        <table className="w-full text-sm border border-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-2 py-1 text-left">Club</th>
              <th className="px-2 py-1 text-right">Quantité</th>
              <th className="px-2 py-1 text-right">Achats via SVC</th>
              <th className="px-2 py-1 text-right">Gains SVC</th>
              <th className="px-2 py-1 text-right">Prix pack ($)</th>
              <th className="px-2 py-1 text-right">ROI ($)</th>
              <th
                className="px-2 py-1 text-right cursor-pointer hover:underline"
                onClick={() => toggleSort("roiAffUSD")}
              >
                ROI affiné ($) {sortKey === "roiAffUSD" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedClubs.map((row) => (
              <tr key={row.id} className="hover:bg-gray-900">
                <td className="px-2 py-1">{row.name}</td>
                <td className="px-2 py-1 text-right">{fmtInt(row.qty)}</td>
                <td className="px-2 py-1 text-right">{fmtSVC(row.achatsSvc)}</td>
                <td className="px-2 py-1 text-right">{fmtSVC(row.gainsSvc)}</td>
                <td className="px-2 py-1 text-right">{fmtUSD(row.packPriceUSD)}</td>
                <td className="px-2 py-1">{row.roiUSD != null ? <RoiBar pct={row.roiUSD * 100} /> : "—"}</td>
                <td className="px-2 py-1">{row.roiAffUSD != null ? <RoiBar pct={row.roiAffUSD * 100} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
