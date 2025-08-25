// app/roi/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ROI “depuis toujours”
 * - Achats via SVC (clubs) = somme absolue des share trade négatifs en SVC (balance_sheet)
 * - Gains SVC (clubs)      = somme des dividends_club
 * - Coût packs ($)         = somme des “Prix total ($)” des achats packs
 * - Coût SVC ($)           = achatsSVC * SVC2USDC
 * - Coût ROI ($)           = coût packs + (inclure SVC ? coût SVC : 0)
 * - ROI ($)                = gains$ / coût ROI$
 */

// ───────────────────────────────────────────────────────────────────────────────
// Config & utils
const PACKS_PAGES = 1000;
const PACKS_PAGE_SIZE = 100;
const MIN_AMOUNT_USDC = 2;

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

const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "—");

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
const tradeKey = (otherName, unix) => `${otherName || ""}|${Number(unix) || 0}`;

function tooltipDatesForClub(buys = []) {
  return buys
    .filter((r) => r?.dateTs)
    .map((r) => fmtDate(r.dateTs))
    .join("\n");
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers: joindre les share-trades → id club

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

// ───────────────────────────────────────────────────────────────────────────────
// Agrégation

function aggregateForever({
  balanceSheet,
  transactions,
  positions,
  clubMap,
  playerMap,

  // métriques packs (calculées côté front via /api/packs/by-wallet)
  packRawTotalUSDByClub, // somme des “Prix total ($)”
  packUnitAvgUSDByClub, // “Prix / pack” pondéré
  packLastDateByClub, // ts dernier achat de pack
  packTotalPacksByClub, // #packs cumulés

  // conversion SVC -> $
  svcRateUSD,

  // options
  includeSvcInCost = true, // additionner coût SVC au coût packs pour le ROI
}) {
  const tradeIdx = indexTradesByTimeAndCounterparty(transactions);

  const payoutsClub = new Map();
  const payoutsPlayer = new Map();
  const baseMintPlayer = new Map();

  const achatsSvcClub = new Map(); // coût SVC (absolu) via share trade-
  const qtyAcheteeSvcClub = estimateQtyBoughtViaSVC(transactions);

  for (const it of balanceSheet || []) {
    const amtSVC = toSVC(it?.amount);

    // Gains SVC (dividendes)
    if (it?.type?.startsWith("dividend")) {
      if (it?.other_type === "club" && it?.other_id != null) {
        payoutsClub.set(it.other_id, (payoutsClub.get(it.other_id) || 0) + amtSVC);
      } else if (it?.other_type === "player" && it?.other_id != null) {
        payoutsPlayer.set(it.other_id, (payoutsPlayer.get(it.other_id) || 0) + amtSVC);
      }
      continue;
    }

    // Base joueurs (mint)
    if (it?.type === "mint" && it?.other_type === "player" && it?.other_id != null && amtSVC < 0) {
      baseMintPlayer.set(it.other_id, (baseMintPlayer.get(it.other_id) || 0) + Math.abs(amtSVC));
      continue;
    }

    // Achats via SVC (share trade négatifs)
    if (it?.type === "share trade" && amtSVC < 0) {
      const k = `${it?.other_name || ""}|${Number(it?.unix_time) || 0}`;
      const share = tradeIdx.get(k);
      if (share?.type === "club" && share?.id != null) {
        achatsSvcClub.set(share.id, (achatsSvcClub.get(share.id) || 0) + Math.abs(amtSVC));
      }
    }
  }

  const clubs = [];
  const players = [];

  for (const b of positions?.clubs || []) {
    const id = b.id;
    const qty = Number(b.total || 0);
    const name = clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`;

    const gainsSvc = round4(payoutsClub.get(id) || 0);
    const achatsSvc = round2(achatsSvcClub.get(id) || 0);

    const qtyAcheteeSvc = Number(qtyAcheteeSvcClub.get(id) || 0);
    const qtyIssuePacks = Math.max(0, qty - qtyAcheteeSvc);

    // coûts packs + infos
    const costPacksUSD = round2(Number(packRawTotalUSDByClub?.get(id) || 0));
    const unitAvgUSD = round2(Number(packUnitAvgUSDByClub?.get(id) || 0));
    const lastDateTs = Number(packLastDateByClub?.get(id) || 0);
    const totalPacks = Number(packTotalPacksByClub?.get(id) || 0);

    // conversion gains & achats SVC → $
    const gainsUSD = svcRateUSD != null ? round2(gainsSvc * svcRateUSD) : null;
    const achatsSvcUSD = svcRateUSD != null ? round2(achatsSvc * svcRateUSD) : 0;

    // coût utilisé pour le ROI : packs + (optionnel) SVC
    const coutUtiliseUSD =
      (costPacksUSD || 0) + (includeSvcInCost ? (achatsSvcUSD || 0) : 0);

    let roiBase = null;
    if (includeSvcInCost && costPacksUSD > 0 && achatsSvcUSD > 0) roiBase = "packs+svc";
    else if (costPacksUSD > 0) roiBase = "packs";
    else if (includeSvcInCost && achatsSvcUSD > 0) roiBase = "svc";

    const roiUSD = SAFE_DIV(gainsUSD ?? 0, coutUtiliseUSD);

    clubs.push({
      id,
      name,
      qty,

      // SVC bruts (affichage)
      achatsSvc,
      gainsSvc,

      // conversions/affichages $
      gainsUSD,
      coutPacksUSD: costPacksUSD,
      coutSvcUSD: achatsSvcUSD,
      coutUtiliseUSD, // packs + svc si option active
      roiBase, // "packs" | "svc" | "packs+svc" | null

      // colonnes
      depensePacksAffineeUSD: unitAvgUSD,
      packsAchetes: totalPacks,
      dernierAchatTs: lastDateTs,

      qtyIssuePacks,
      link: `https://play.soccerverse.com/club/${id}`,
      roiUSD,
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

  clubs.sort((a, b) => (b.gainsSvc - a.gainsSvc) || (b.qty - a.qty));
  players.sort((a, b) => (b.payouts - a.payouts) || (b.qty - a.qty));

  return { clubs, players };
}

// ───────────────────────────────────────────────────────────────────────────────
// UI helpers

function RoiBar({ pct }) {
  const val = Number(pct) || 0;
  const width = Math.max(0, Math.min(100, val));
  const color =
    val < 0 ? "bg-red-500" : val >= 100 ? "bg-emerald-500" : "bg-indigo-500";

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <div
        className="flex-1 h-2 rounded bg-gray-800 overflow-hidden"
        title={`${val.toFixed(2)}%`}
        role="progressbar"
        aria-valuenow={val}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full ${color} transition-[width] duration-300`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="tabular-nums">{val.toFixed(1)}%</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Page

export default function RoiForever() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [hideNoROI, setHideNoROI] = useState(false);
  const [includeSvcInCost, setIncludeSvcInCost] = useState(true); // ← addition SVC dans coût ROI

  // Filtre par rôle déduit via les packs: "all" | "main" | "secondary" | "both" | "none"
  const [roleFilter, setRoleFilter] = useState("all");

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [balanceSheet, setBalanceSheet] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [positions, setPositions] = useState({ clubs: [], players: [] });

  // Packs: métriques & détails pour drawer
  const [packRawTotalUSDByClub, setPackRawTotalUSDByClub] = useState(new Map());
  const [packUnitAvgUSDByClub, setPackUnitAvgUSDByClub] = useState(new Map());
  const [packLastDateByClub, setPackLastDateByClub] = useState(new Map());
  const [packTotalPacksByClub, setPackTotalPacksByClub] = useState(new Map());
  const [packBuysByClub, setPackBuysByClub] = useState(new Map());

  // Drawer
  const [openClub, setOpenClub] = useState(null);

  // 1 SVC = $svcRateUSD
  const [svcRateUSD, setSvcRateUSD] = useState(null);

  // Tri
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  // Wallet
  const [wallet, setWallet] = useState(null);

  // mappings
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
        const res = await fetch(
          "https://services.soccerverse.com/api/market",
          { cache: "no-store" }
        );
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
      body: JSON.stringify({ name }),
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

  // Résolution du wallet
  async function resolveWallet(name) {
    try {
      const rw = await fetch("/api/resolve_wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const rwJson = await rw.json();
      const w = rw.ok ? rwJson.wallet || null : null;
      setWallet(w);
      return w;
    } catch {
      setWallet(null);
      return null;
    }
  }

  // Packs by wallet → détails & agrégats
  async function fetchPackCostsForWallet(w) {
    const url = `/api/packs/by-wallet?wallet=${w}&pages=${PACKS_PAGES}&pageSize=${PACKS_PAGE_SIZE}&minAmountUSDC=${MIN_AMOUNT_USDC}`;

    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "packs fetch failed");

    const buysMap = new Map(); // clubId -> rows
    for (const it of j.items || []) {
      const price = Number(it.priceUSDC || 0);
      const unit = Number(it.unitPriceUSDC || 0);
      const packs = Number(it.packs || 0);
      const txHash = it.txHash;
      const blockNumber = it.blockNumber;
      const blockTs = Number(it.timeStamp || it.blockTimestamp || 0);

const det = it.details || {};
const parts = [];

// ✅ toujours number pour le principal
const mainId = Number(det?.shares?.mainClub?.clubId);
const mainInf = Number(det?.influence?.main || 0);
if (Number.isFinite(mainId) && mainId > 0 && mainInf > 0) {
  parts.push({ clubId: mainId, role: "main" });
}

// ✅ déjà number pour les secondaires (on garde)
for (const s of det?.shares?.secondaryClubs || []) {
  const cid = Number(s.clubId);
  const inf = Number(s.influence || 0);
  if (Number.isFinite(cid) && cid > 0 && inf > 0) {
    parts.push({ clubId: cid, role: "secondary" });
  }
}

// ✅ clés de la map toujours number
for (const p of parts) {
  const key = Number(p.clubId);
  const arr = buysMap.get(key) || [];
  arr.push({
    txHash,
    role: p.role,
    dateTs: blockTs || null,
    blockNumber,
    packs,
    priceUSDC: price,
    unitPriceUSDC: unit || (packs > 0 ? price / packs : null),
  });
  buysMap.set(key, arr);
}

    }

    // agrégats
    const totalUSD = new Map();
    const unitAvg = new Map();
    const lastDate = new Map();
    const totalPks = new Map();

    for (const [cid, arr] of buysMap.entries()) {
      let sumPrice = 0,
        sumPacks = 0,
        last = 0;
      for (const r of arr) {
        sumPrice += Number(r.priceUSDC || 0);
        sumPacks += Number(r.packs || 0);
        if ((r.dateTs || 0) > last) last = r.dateTs || 0;
      }
      totalUSD.set(cid, sumPrice);
      unitAvg.set(cid, sumPacks > 0 ? sumPrice / sumPacks : 0);
      lastDate.set(cid, last);
      totalPks.set(cid, sumPacks);
    }

    // ordre décroissant
    for (const [cid, arr] of buysMap.entries()) {
      arr.sort(
        (a, b) =>
          (b.dateTs || 0) - (a.dateTs || 0) ||
          (b.blockNumber || 0) - (a.blockNumber || 0)
      );
    }
// normalise au cas où des clés string se seraient glissées
const buysMapNum = new Map();
for (const [k, v] of buysMap.entries()) buysMapNum.set(Number(k), v);

    setPackBuysByClub(buysMap);
    setPackRawTotalUSDByClub(totalUSD);
    setPackUnitAvgUSDByClub(unitAvg);
    setPackLastDateByClub(lastDate);
    setPackTotalPacksByClub(totalPks);
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

      const w = await resolveWallet(name);
      if (w) await fetchPackCostsForWallet(w);
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
      setBalanceSheet([]);
      setTransactions([]);
      setPositions({ clubs: [], players: [] });
      setPackRawTotalUSDByClub(new Map());
      setPackUnitAvgUSDByClub(new Map());
      setPackLastDateByClub(new Map());
      setPackTotalPacksByClub(new Map());
      setPackBuysByClub(new Map());
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }

  // Rôles dérivés des achats de packs
  const roleByClub = useMemo(() => {
    const m = new Map();
    for (const [cid, rows] of packBuysByClub.entries()) {
      const hasMain = rows.some((r) => r.role === "main");
      const hasSec = rows.some((r) => r.role === "secondary");
      const role =
        hasMain && hasSec ? "both" : hasMain ? "main" : hasSec ? "secondary" : null;
      m.set(cid, role || null);
    }
    return m; // clubs sans entrée => null (aucun achat pack)
  }, [packBuysByClub]);

  const aggregated = useMemo(
    () =>
      aggregateForever({
        balanceSheet,
        transactions,
        positions,
        clubMap,
        playerMap,
        packRawTotalUSDByClub,
        packUnitAvgUSDByClub,
        packLastDateByClub,
        packTotalPacksByClub,
        svcRateUSD,
        includeSvcInCost, // ← addition SVC au coût ROI
      }),
    [
      balanceSheet,
      transactions,
      positions,
      clubMap,
      playerMap,
      packRawTotalUSDByClub,
      packUnitAvgUSDByClub,
      packLastDateByClub,
      packTotalPacksByClub,
      svcRateUSD,
      includeSvcInCost,
    ]
  );

  // Sort helper nulls-last
  const sortNullsLast = (va, vb, dir) => {
    const a = va ?? null;
    const b = vb ?? null;
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return dir === "asc" ? a - b : b - a;
  };

  // Prépare les lignes : filtre “Masquer sans ROI” + filtre rôle + tri
  const clubs = useMemo(() => {
    let arr = [...aggregated.clubs];

    if (hideNoROI) arr = arr.filter((r) => r.roiUSD != null);

    if (roleFilter !== "all") {
      arr = arr.filter((r) => {
        const role = roleByClub.get(r.id) || "none";
        if (roleFilter === "none") return role === "none";
        if (roleFilter === "both") return role === "both";
        if (roleFilter === "main") return role === "main";
        if (roleFilter === "secondary") return role === "secondary";
        return true;
      });
    }

    if (sortKey) {
      const numericKeys = new Set([
        "qty",
        "packsAchetes",
        "dernierAchatTs",
        "gainsSvc",
        "coutPacksUSD",
        "depensePacksAffineeUSD",
        "roiUSD",
      ]);
      arr.sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (numericKeys.has(sortKey)) return sortNullsLast(va, vb, sortDir);
        return sortDir === "asc"
          ? String(va ?? "").localeCompare(String(vb ?? ""))
          : String(vb ?? "").localeCompare(String(va ?? ""));
      });
    }

    return arr;
  }, [aggregated.clubs, hideNoROI, roleFilter, roleByClub, sortKey, sortDir]);

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

  // Drawer
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
                <th className="text-left py-2 px-3">Rôle</th>
                <th className="text-right py-2 px-3">Packs</th>
                <th className="text-right py-2 px-3">Prix total ($)</th>
                <th className="text-right py-2 px-3">Prix / pack ($)</th>
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
                  <td className="py-2 px-3 capitalize">{r.role}</td>
                  <td className="py-2 px-3 text-right">{fmtInt(r.packs)}</td>
                  <td className="py-2 px-3 text-right">{fmtUSD(r.priceUSDC)}</td>
                  <td className="py-2 px-3 text-right">{fmtUSD(r.unitPriceUSDC)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Petite aide pour le badge de rôle dans la table
  const roleLabel = (clubId) => {
    const r = roleByClub.get(clubId);
    if (r === "main") return "Principal";
    if (r === "secondary") return "Secondaire";
    if (r === "both") return "Les deux";
    return "—";
  };

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">ROI</h1>

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
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={hideNoROI}
                  onChange={(e) => setHideNoROI(e.target.checked)}
                />
                <span>Masquer les clubs sans ROI</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={includeSvcInCost}
                  onChange={(e) => setIncludeSvcInCost(e.target.checked)}
                />
                <span>Inclure les achats SVC dans le coût (packs + SVC)</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-400">Rôle (packs) :</span>
                {[
                  ["all", "Tous"],
                  ["main", "Principal"],
                  ["secondary", "Secondaire"],
                  ["both", "Les deux"],
                  ["none", "Aucun achat"],
                ].map(([val, lab]) => (
                  <button
                    key={val}
                    onClick={() => setRoleFilter(val)}
                    className={`px-2 py-1 rounded border ${
                      roleFilter === val
                        ? "bg-indigo-600 border-indigo-500"
                        : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {lab}
                  </button>
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-2">Clubs</h2>
            <p className="text-sm text-gray-400 mb-4">
              Tous vos clubs sont affichés. La colonne “Rôle (packs)” indique le rôle
              du club dans vos achats de packs (principal = 40 d&apos;influence,
              secondaire = 10). “—” signifie qu&apos;aucun achat de pack n&apos;implique ce club.
            </p>

            {clubs.length === 0 ? (
              <div className="text-gray-400">Aucune position club.</div>
            ) : (
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th
                        className="text-left py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("name")}
                        title="Trier par club"
                      >
                        Club <Arrow active={sortKey === "name"} dir={sortDir} />
                      </th>
                      <th className="text-left py-2 px-3">Rôle (packs)</th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("qty")}
                        title="Trier par quantité"
                      >
                        Quantité <Arrow active={sortKey === "qty"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">Packs achetés</th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("dernierAchatTs")}
                        title="Trier par dernier achat"
                      >
                        Dernier achat <Arrow active={sortKey === "dernierAchatTs"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">Achats via SVC</th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("gainsSvc")}
                        title="Trier par gains SVC"
                      >
                        Gains SVC <Arrow active={sortKey === "gainsSvc"} dir={sortDir} />
                      </th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("coutPacksUSD")}
                        title="Trier par coût packs ($)"
                      >
                        Coût total (packs) ($) <Arrow active={sortKey === "coutPacksUSD"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">Coût packs (club) ($)</th>
                      <th
                        className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                        onClick={() => toggleSort("roiUSD")}
                        title="Trier par ROI ($)"
                      >
                        ROI ($) <Arrow active={sortKey === "roiUSD"} dir={sortDir} />
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
                            <td className="py-2 px-3">{roleLabel(row.id)}</td>
                            <td className="py-2 px-3 text-right">{fmtInt(row.qty)}</td>
                            <td className="py-2 px-3 text-right">{fmtInt(row.packsAchetes)}</td>
                            <td className="py-2 px-3 text-right">
                              {(() => {
                                const buys = packBuysByClub.get(row.id) || [];
                                const lastTs = buys[0]?.dateTs || null;
                                const tip = tooltipDatesForClub(buys);
                                if (!lastTs) return <span className="text-gray-500">—</span>;
                                return (
                                  <span
                                    className="relative group cursor-help"
                                    title={tip}
                                    aria-label={tip.replace(/\n/g, ", ")}
                                  >
                                    {fmtDate(lastTs)}
                                    {buys.length > 1 && (
                                      <span className="ml-1 inline-flex items-center rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                                        +{buys.length - 1}
                                      </span>
                                    )}
                                    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 hidden -translate-x-1/2 whitespace-pre rounded border border-white/10 bg-black/90 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                                      {tip}
                                    </span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2 px-3 text-right">{fmtSVC(row.achatsSvc)}</td>
                            <td className="py-2 px-3 text-right">{fmtSVC(row.gainsSvc)}</td>
                            <td className="py-2 px-3 text-right">
                              {row.coutPacksUSD || row.coutPacksUSD === 0 ? (
                                fmtUSD(row.coutPacksUSD)
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {row.depensePacksAffineeUSD || row.depensePacksAffineeUSD === 0 ? (
                                fmtUSD(row.depensePacksAffineeUSD)
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {row.roiUSD != null ? (
                                <RoiBar pct={row.roiUSD * 100} />
                              ) : (
                                <span className="text-gray-500">n/a</span>
                              )}
                              {row.gainsUSD != null && (
                                <div className="text-xs text-gray-500 text-right mt-1">
                                  {row.roiBase === "packs+svc" ? (
                                    <>
                                      gains: {fmtUSD(row.gainsUSD)} / coût: {fmtUSD(row.coutUtiliseUSD || 0)}{" "}
                                      (packs+SVC)
                                    </>
                                  ) : row.roiBase === "svc" ? (
                                    <>
                                      base SVC — gains: {fmtUSD(row.gainsUSD)} / coût:{" "}
                                      {fmtUSD(row.coutUtiliseUSD || 0)}
                                    </>
                                  ) : row.roiBase === "packs" ? (
                                    <>
                                      gains: {fmtUSD(row.gainsUSD)} / coût: {fmtUSD(row.coutUtiliseUSD || 0)}
                                    </>
                                  ) : (
                                    <>gains: {fmtUSD(row.gainsUSD)} / coût: —</>
                                  )}
                                </div>
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
                          {isOpen && (
                            <tr className="bg-black/30">
                              <td className="py-3 px-3" colSpan={11}>
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
