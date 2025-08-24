// app/roi/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * ROI — “depuis toujours”
 * - Achats via SVC (clubs) = somme absolue des share trade négatifs en SVC (balance_sheet)
 * - Gains SVC (clubs)      = somme des dividends_club
 * - Coût packs ($)         = /api/packs/by-wallet (répartition réelle par club selon l’influence des packs)
 * - ROI ($)                = gains$ / (dépense$SVC + dépense$Packs)
 */

//
// ───────────────────────────────────────────────────────────────────────────────
// Utils / format
//

const UNIT = 10000; // montants du balance_sheet en 1e-4 SVC
const toSVC = (n) => (Number(n) || 0) / UNIT;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
const SAFE_DIV = (num, den) => (den > 0 ? num / den : null);

const fmtSVC = (n) =>
  typeof n === "number"
    ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} SVC`
    : "—";

const fmtUSD = (n) =>
  typeof n === "number"
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : "—";

const fmtInt = (n) =>
  typeof n === "number" ? n.toLocaleString("fr-FR") : "—";

const fmtDate = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(Number(ts) * 1000);
    return d.toLocaleString("fr-FR");
  } catch {
    return "—";
  }
};

const shortHash = (h) => (h ? `${h.slice(0, 6)}…${h.slice(-4)}` : "");

// clé pour matcher un trade balance_sheet ↔ transactions
const tradeKey = (otherName, unix) => `${otherName || ""}|${Number(unix) || 0}`;

//
// ───────────────────────────────────────────────────────────────────────────────
// Joins / helpers
//

function indexTradesByTimeAndCounterparty(txs) {
  const idx = new Map();
  for (const t of txs || []) {
    if (t?.type !== "share trade") continue;
    const share = t?.share;
    if (!share?.type || share?.id == null) continue;
    const k = tradeKey(t?.other_name, t?.date);
    if (!idx.has(k)) idx.set(k, { type: share.type, id: share.id });
  }
  return idx;
}

// Estime les quantités achetées en SVC depuis /api/transactions (si dispo)
function estimateQtyBoughtViaSVC(transactions) {
  const qtyByClub = new Map();
  for (const t of transactions || []) {
    if (t?.type !== "share trade") continue;
    const s = t?.share;
    if (s?.type !== "club" || s?.id == null) continue;

    const q =
      Number(t?.qty) ||
      Number(t?.quantity) ||
      Number(t?.delta) ||
      Number(t?.totalDelta) ||
      0;

    if (q > 0) {
      qtyByClub.set(s.id, (qtyByClub.get(s.id) || 0) + q);
    }
  }
  return qtyByClub;
}

//
// ───────────────────────────────────────────────────────────────────────────────
// Agrégation principale
//

function aggregateForever({
  balanceSheet,
  transactions,
  positions,
  clubMap,
  playerMap,
  // (facultatif) preview pack unitaire
  packPriceUSDByClub,
  infPerPackByClub,
  allInfByClub,
  // coût packs réel réparti par club ($)
  packSpendUSDByClub,
  // 1 SVC = $svcRateUSD
  svcRateUSD,
}) {
  const tradeIdx = indexTradesByTimeAndCounterparty(transactions);

  const payoutsClub = new Map();
  const payoutsPlayer = new Map();
  const baseMintPlayer = new Map();

  // SVC dépensés en achats directs (par club)
  const achatsSvcClub = new Map();

  // À défaut d’info côté balance_sheet, estimation des quantités achetées via SVC
  const qtyAcheteeSvcClub = estimateQtyBoughtViaSVC(transactions);

  for (const it of balanceSheet || []) {
    const amtSVC = toSVC(it?.amount);

    // Gains (dividendes)
    if (it?.type?.startsWith("dividend")) {
      if (it?.other_type === "club" && it?.other_id != null) {
        payoutsClub.set(it.other_id, (payoutsClub.get(it.other_id) || 0) + amtSVC);
      } else if (it?.other_type === "player" && it?.other_id != null) {
        payoutsPlayer.set(it.other_id, (payoutsPlayer.get(it.other_id) || 0) + amtSVC);
      }
      continue;
    }

    // Base joueurs (mint négatifs)
    if (it?.type === "mint" && it?.other_type === "player" && it?.other_id != null && amtSVC < 0) {
      baseMintPlayer.set(it.other_id, (baseMintPlayer.get(it.other_id) || 0) + Math.abs(amtSVC));
      continue;
    }

    // Achats via SVC (club)
    if (it?.type === "share trade" && amtSVC < 0) {
      const k = `${it?.other_name || ""}|${Number(it?.unix_time) || 0}`;
      const share = tradeIdx.get(k);
      if (share?.type === "club" && share?.id != null) {
        achatsSvcClub.set(share.id, (achatsSvcClub.get(share.id) || 0) + Math.abs(amtSVC));
      }
    }
  }

  // Sorties
  const clubs = [];
  const players = [];

  for (const b of positions?.clubs || []) {
    const id = b.id;
    const qty = Number(b.total || 0);
    const name = clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`;

    const gainsSvc = round4(payoutsClub.get(id) || 0);            // dividendes
    const achatsSvc = round2(achatsSvcClub.get(id) || 0);         // SVC dépensés

    // (préviews éventuels, juste informatifs)
    const packPriceUSD = Number(packPriceUSDByClub?.get(id) || 0);
    const infPerPack = Number(infPerPackByClub?.get(id) || 0);

    // Quantité achetée via SVC si dispo
    const qtyAcheteeSvc = Number(qtyAcheteeSvcClub.get(id) || 0);
    // Le reste supposé venir des packs (indicatif)
    const qtyIssuePacks = Math.max(0, qty - qtyAcheteeSvc);

    // Coûts packs par club ($) issus de l’historique on-chain
    const depensePacksAffineeUSD = round2(Number(packSpendUSDByClub?.get(id) || 0));

    // Conversion SVC -> USD
    const depenseSvcUSD = svcRateUSD != null ? round2(achatsSvc * svcRateUSD) : null;
    const gainsUSD = svcRateUSD != null ? round2(gainsSvc * svcRateUSD) : null;

    const coutTotalUSD = (depenseSvcUSD ?? 0) + (depensePacksAffineeUSD || 0);

    const roiUSD = SAFE_DIV(gainsUSD ?? 0, coutTotalUSD);
    const roiAffUSD = roiUSD; // même coût (réparti finement)

    clubs.push({
      id,
      name,
      qty,
      achatsSvc,               // SVC
      gainsSvc,                // SVC
      packPriceUSD,            // $ (indicatif)
      infPerPack,              // influence/pack (indicatif)
      depenseSvcUSD,           // $ SVC
      depensePacksAffineeUSD,  // $ Packs (réel réparti)
      gainsUSD,                // $
      roiUSD,                  // ROI ($)
      roiAffUSD,               // ROI ($)
      coutTotalUSD,            // pour tri/affichage
      qtyIssuePacks,           // info
      link: `https://play.soccerverse.com/club/${id}`,
    });
  }

  for (const b of positions?.players || []) {
    const id = b.id;
    const qty = Number(b.total || 0);
    const p = playerMap?.[id];
    const name = p?.name || [p?.f, p?.s].filter(Boolean).join(" ") || `Joueur #${id}`;
    const payouts = round4(payoutsPlayer.get(id) || 0);
    const baseSvc = round2(baseMintPlayer.get(id) || 0);
    const roi = baseSvc > 0 ? payouts / baseSvc : null;

    players.push({
      id,
      name,
      qty,
      payouts,
      baseSvc,
      roi,
      link: `https://play.soccerverse.com/player/${id}`,
    });
  }

  // tri par défaut (gains SVC)
  clubs.sort((a, b) => (b.gainsSvc - a.gainsSvc) || (b.qty - a.qty));
  players.sort((a, b) => (b.payouts - a.payouts) || (b.qty - a.qty));

  return { clubs, players };
}

//
// ───────────────────────────────────────────────────────────────────────────────
// UI helpers
//

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

//
// ───────────────────────────────────────────────────────────────────────────────
// Page
//

export default function RoiForever() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [balanceSheet, setBalanceSheet] = useState([]); // /api/user_balance_sheet
  const [transactions, setTransactions] = useState([]); // /api/transactions
  const [positions, setPositions] = useState({ clubs: [], players: [] }); // /api/user_positions

  // (facultatif) preview unitaire par club
  const [packPriceUSDByClub, setPackPriceUSDByClub] = useState(new Map());
  const [infPerPackByClub, setInfPerPackByClub] = useState(new Map());
  const [allInfByClub, setAllInfByClub] = useState(new Map());

  // coût packs réel par club ($) + détails d’achats (pour drawer)
  const [packSpendUSDByClub, setPackSpendUSDByClub] = useState(new Map());
  const [packBuysByClub, setPackBuysByClub] = useState(new Map());

  // 1 SVC = $svcRateUSD
  const [svcRateUSD, setSvcRateUSD] = useState(null);

  // Tri
  const [sortKey, setSortKey] = useState(null); // "roiUSD" | "roiAffUSD" | "coutTotalUSD" | null
  const [sortDir, setSortDir] = useState("desc");

  // wallet résolu (via /api/resolve_wallet)
  const [wallet, setWallet] = useState(null);

  // Drawer ouvert
  const [openClub, setOpenClub] = useState(null);

  // mappings noms (club / player)
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

  // Taux SVC → USDC
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://services.soccerverse.com/api/market", { cache: "no-store" });
        const data = await res.json();
        if (data && typeof data.SVC2USDC === "number") {
          setSvcRateUSD(data.SVC2USDC);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function fetchUserBalanceSheet(name) {
    const res = await fetch("/api/user_balance_sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }), // pas de dates → depuis toujours
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

  async function fetchPositions(name) {
    const res = await fetch("/api/user_positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `Erreur positions (${res.status})`);
    }
    return res.json();
  }

  // (facultatif) preview unitaire par club
  async function fetchPackPreviewFor(clubId) {
    const r = await fetch(`/api/pack_preview?clubId=${clubId}&numPacks=1`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();

    const packPriceUSD =
      typeof j?.unitUSDC === "number"
        ? j.unitUSDC
        : Array.isArray(j?.resultNums) && typeof j.resultNums[1] === "number"
        ? j.resultNums[1] / 1e6
        : null;

    const infPerPack =
      j?.parsed?.mainClub?.influence ??
      (Array.isArray(j?.resultNums) ? j.resultNums[7] : null);

    const influences = [];
    if (Array.isArray(j?.resultNums)) {
      for (let i = 6; i < j.resultNums.length; i += 2) {
        const cid = Number(j.resultNums[i]);
        const inf = Number(j.resultNums[i + 1] || 0);
        if (!cid) break; // 0 terminal
        influences.push({ clubId: cid, inf });
      }
    }

    if (typeof packPriceUSD === "number" && typeof infPerPack === "number") {
      return { packPriceUSD, infPerPack, influences };
    }
    return null;
  }

  // Résolution du wallet
  async function resolveWallet(name) {
    try {
      const rw = await fetch("/api/resolve_wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const rwJson = await rw.json();
      const w = rw.ok ? (rwJson.wallet || null) : null;
      setWallet(w);
      return w;
    } catch {
      setWallet(null);
      return null;
    }
  }

  // Récupère les achats de packs on-chain et répartit le coût par club
  async function fetchPackCostsForWallet(w) {
    // gros filetage (on enlève les limites pour couvrir des wallets très actifs)
    const url = `/api/packs/by-wallet?wallet=${w}&pages=1000&pageSize=100&limit=100000`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "packs fetch failed");

    const spend = new Map();
    const buysMap = new Map();

    for (const it of j.items || []) {
      const price = Number(it.priceUSDC || 0);
      const unit  = Number(it.unitPriceUSDC || 0);
      const packs = Number(it.packs || 0);
      const txHash = it.txHash;
      const blockNumber = it.blockNumber;
      const blockTs = Number(it.blockTimestamp || 0); // le backend peut le fournir

      const det = it.details || {};
      const parts = [];
      const mainId  = det?.shares?.mainClub?.clubId;
      const mainInf = Number(det?.influence?.main || 0);
      if (mainId && mainInf > 0) parts.push({ clubId: mainId, inf: mainInf });
      for (const s of det?.shares?.secondaryClubs || []) {
        const cid = Number(s.clubId);
        const inf = Number(s.influence || 0);
        if (cid && inf > 0) parts.push({ clubId: cid, inf });
      }
      const totalInf = parts.reduce((a, b) => a + b.inf, 0);
      if (price <= 0 || totalInf <= 0) continue;

      const usdPerInf = price / totalInf;

      for (const p of parts) {
        const partUSD = usdPerInf * p.inf;
        spend.set(p.clubId, (spend.get(p.clubId) || 0) + partUSD);

        const arr = buysMap.get(p.clubId) || [];
        arr.push({
          txHash,
          dateTs: blockTs || null,          // date pour le drawer
          blockNumber,
          packs,
          priceUSDC: price,
          unitPriceUSDC: unit || (packs > 0 ? price / packs : null),
          allocatedUSD: partUSD,
          allocatedInf: p.inf,
        });
        buysMap.set(p.clubId, arr);
      }
    }

    // trie les achats par date/bloc
    for (const [cid, arr] of buysMap.entries()) {
      arr.sort(
        (a, b) =>
          (b.dateTs || 0) - (a.dateTs || 0) ||
          (b.blockNumber || 0) - (a.blockNumber || 0)
      );
    }

    setPackSpendUSDByClub(spend);
    setPackBuysByClub(buysMap);
  }

  async function handleSearch(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setOpenClub(null);

    try {
      const [bs, txs, pos] = await Promise.all([
        fetchUserBalanceSheet(name),
        fetchTransactions(name),
        fetchPositions(name),
      ]);

      setBalanceSheet(bs);
      setTransactions(txs);
      setPositions(pos);

      // wallet détecté + coûts packs par club
      const w = await resolveWallet(name);
      if (w) await fetchPackCostsForWallet(w);

      // (facultatif) previews unitaire pour info
      const clubIds = Array.from(new Set((pos?.clubs || []).map((c) => c.id)));
      const previews = await Promise.all(
        clubIds.map(async (id) => [id, await fetchPackPreviewFor(id)])
      );

      const priceMap = new Map();
      const infMap = new Map();
      const allInfMap = new Map();
      for (const [id, p] of previews) {
        if (!p) continue;
        if (typeof p.packPriceUSD === "number") priceMap.set(id, p.packPriceUSD);
        if (typeof p.infPerPack === "number") infMap.set(id, p.infPerPack);
        if (Array.isArray(p.influences)) allInfMap.set(id, p.influences);
      }
      setPackPriceUSDByClub(priceMap);
      setInfPerPackByClub(infMap);
      setAllInfByClub(allInfMap);
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
      setBalanceSheet([]);
      setTransactions([]);
      setPositions({ clubs: [], players: [] });
      setPackPriceUSDByClub(new Map());
      setInfPerPackByClub(new Map());
      setAllInfByClub(new Map());
      setPackSpendUSDByClub(new Map());
      setPackBuysByClub(new Map());
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }

  const aggregated = useMemo(
    () =>
      aggregateForever({
        balanceSheet,
        transactions,
        positions,
        clubMap,
        playerMap,
        packPriceUSDByClub,
        infPerPackByClub,
        allInfByClub,
        packSpendUSDByClub,
        svcRateUSD,
      }),
    [
      balanceSheet,
      transactions,
      positions,
      clubMap,
      playerMap,
      packPriceUSDByClub,
      infPerPackByClub,
      allInfByClub,
      packSpendUSDByClub,
      svcRateUSD,
    ]
  );

  // tri local si demandé
  const clubs = useMemo(() => {
    const arr = [...aggregated.clubs];
    if (!sortKey) return arr;
    arr.sort((a, b) => {
      const va = a[sortKey] ?? -Infinity;
      const vb = b[sortKey] ?? -Infinity;
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [aggregated.clubs, sortKey, sortDir]);

  const { players } = aggregated;

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const Arrow = ({ active, dir }) => (
    <span className={`ml-1 text-xs ${active ? "opacity-100" : "opacity-30"}`}>
      {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const renderDrawer = (clubId) => {
    const rows = packBuysByClub.get(clubId) || [];
    if (!rows.length) {
      return (
        <div className="text-sm text-gray-400">
          Aucun achat de pack détecté pour ce club.
        </div>
      );
    }
    return (
      <div className="text-sm">
        <div className="mb-2 text-gray-300">
          {rows.length} achat{rows.length > 1 ? "s" : ""} de pack impliquant ce club
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Tx</th>
                <th className="text-right py-2 px-3">Packs</th>
                <th className="text-right py-2 px-3">Prix total ($)</th>
                <th className="text-right py-2 px-3">Prix / pack ($)</th>
                <th className="text-right py-2 px-3">Part allouée au club ($)</th>
                <th className="text-right py-2 px-3">Influence allouée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {rows.map((r, i) => (
                <tr key={`${r.txHash}-${i}`} className="hover:bg-white/5">
                  <td className="py-2 px-3">{fmtDate(r.dateTs)}</td>
                  <td className="py-2 px-3">
                    <a
                      className="text-indigo-400 hover:underline"
                      href={`https://polygonscan.com/tx/${r.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortHash(r.txHash)}
                    </a>
                  </td>
                  <td className="py-2 px-3 text-right">{fmtInt(r.packs)}</td>
                  <td className="py-2 px-3 text-right">{fmtUSD(r.priceUSDC)}</td>
                  <td className="py-2 px-3 text-right">{fmtUSD(r.unitPriceUSDC)}</td>
                  <td className="py-2 px-3 text-right">{fmtUSD(r.allocatedUSD)}</td>
                  <td className="py-2 px-3 text-right">{fmtInt(r.allocatedInf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">ROI — depuis toujours</h1>

        <form onSubmit={handleSearch} className="mb-4 flex flex-col sm:flex-row gap-2">
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

        {searched && (
          <div className="mb-6 text-sm text-gray-300">
            Wallet détecté :{" "}
            {wallet ? (
              <a
                className="text-indigo-400 hover:underline"
                href={`https://polygonscan.com/address/${wallet}`}
                target="_blank"
                rel="noreferrer"
              >
                {wallet}
              </a>
            ) : (
              <span className="text-gray-500">introuvable</span>
            )}
          </div>
        )}

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
                      <th className="text-right py-2 px-3">Achats via SVC</th>
                      <th className="text-right py-2 px-3">Gains SVC</th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("coutTotalUSD")}
                        title="Trier par coût total ($)"
                      >
                        Coût total ($)
                        <Arrow active={sortKey === "coutTotalUSD"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">Coût packs ($)</th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("roiUSD")}
                        title="Trier par ROI ($)"
                      >
                        ROI ($)
                        <Arrow active={sortKey === "roiUSD"} dir={sortDir} />
                      </th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("roiAffUSD")}
                        title="Trier par ROI affiné ($)"
                      >
                        ROI affiné ($)
                        <Arrow active={sortKey === "roiAffUSD"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {clubs.map((row) => {
                      const isOpen = openClub === row.id;
                      return (
                        <React.Fragment key={`c-${row.id}`}>
                          <tr className="hover:bg-white/5">
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
                            <td className="py-2 px-3 text-right">{fmtSVC(row.achatsSvc)}</td>
                            <td className="py-2 px-3 text-right">{fmtSVC(row.gainsSvc)}</td>
                            <td className="py-2 px-3 text-right">
                              {row.coutTotalUSD || row.coutTotalUSD === 0
                                ? fmtUSD(row.coutTotalUSD)
                                : <span className="text-gray-500">—</span>}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {row.depensePacksAffineeUSD || row.depensePacksAffineeUSD === 0
                                ? fmtUSD(row.depensePacksAffineeUSD)
                                : <span className="text-gray-500">—</span>}
                            </td>
                            <td className="py-2 px-3">
                              {row.roiUSD != null ? (
                                <RoiBar pct={row.roiUSD * 100} />
                              ) : (
                                <span className="text-gray-500">n/a</span>
                              )}
                              {row.gainsUSD != null && (
                                <div className="text-xs text-gray-500 text-right mt-1">
                                  gains: {fmtUSD(row.gainsUSD)} / coût: {fmtUSD(row.coutTotalUSD || 0)}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {row.roiAffUSD != null ? (
                                <RoiBar pct={row.roiAffUSD * 100} />
                              ) : (
                                <span className="text-gray-500">n/a</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs"
                                onClick={() => setOpenClub(isOpen ? null : row.id)}
                              >
                                {isOpen ? "fermer" : "voir"}
                              </button>
                            </td>
                          </tr>

                          {/* Drawer */}
                          {isOpen && (
                            <tr className="bg-black/30">
                              <td className="py-3 px-3" colSpan={9}>
                                {renderDrawer(row.id)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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
                      <th className="text-right py-2 px-3">Base (mint, SVC)</th>
                      <th className="text-right py-2 px-3">Payouts cumulés (SVC)</th>
                      <th className="text-left py-2 px-3">ROI (SVC)</th>
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
                        <td className="py-2 px-3 text-right">{fmtSVC(row.baseSvc)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(row.payouts)}</td>
                        <td className="py-2 px-3">
                          {row.baseSvc > 0 ? (
                            <RoiBar pct={(row.payouts / row.baseSvc) * 100} />
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
