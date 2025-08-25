// app/roi/debug/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * Page de DEBUG — étape par étape
 * 1) /api/user_positions, /api/user_balance_sheet, /api/transactions
 * 2) /api/resolve_wallet
 * 3) /api/packs/by-wallet (agrégats + mapping par club)
 * 4) Comparaisons et "qui manque où"
 */

const PACKS_PAGES = 1000;
const PACKS_PAGE_SIZE = 100;
const MIN_AMOUNT_USDC = 2;

const UNIT = 10000; // balance_sheet amounts in 1e-4 SVC
const toSVC = (n) => (Number(n) || 0) / UNIT;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

const fmtUSD = (n) =>
  typeof n === "number" ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—";
const fmtSVC = (n) =>
  typeof n === "number" ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} SVC` : "—";
const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "—");
const fmtDate = (ts) => (ts ? new Date(Number(ts) * 1000).toLocaleString("fr-FR") : "—");

// Helpers d’affichage JSON
function replacerForJSON(_, value) {
  if (value instanceof Map) {
    return { __type: "Map", entries: Array.from(value.entries()) };
  }
  return value;
}
const JsonBlock = ({ data, collapsed = true }) => (
  <details className="rounded border border-gray-700 p-3 bg-black/30" {...(collapsed ? {} : { open: true })}>
    <summary className="cursor-pointer text-indigo-300">Voir JSON</summary>
    <pre className="mt-2 overflow-auto text-xs whitespace-pre-wrap">
      {JSON.stringify(data, replacerForJSON, 2)}
    </pre>
  </details>
);

// ───────────────────────────────────────────────────────────────────────────────
// Agrégation "comme la page ROI" (copie simplifiée)

function indexTradesByTimeAndCounterparty(txs) {
  const idx = new Map();
  for (const t of txs || []) {
    if (t?.type !== "share trade") continue;
    const share = t?.share;
    if (!share?.type || !share?.id) continue;
    const k = `${t?.other_name || ""}|${Number(t?.date) || 0}`;
    if (!idx.has(k)) idx.set(k, { type: share.type, id: share.id });
  }
  return idx;
}
function estimateQtyBoughtViaSVC(transactions) {
  const qtyByClub = new Map();
  for (const t of transactions || []) {
    if (t?.type !== "share trade") continue;
    const s = t?.share;
    if (s?.type !== "club" || s?.id == null) continue;
    const q = Number(t?.qty || t?.quantity || t?.delta || t?.totalDelta || 0);
    if (q > 0) qtyByClub.set(s.id, (qtyByClub.get(s.id) || 0) + q);
  }
  return qtyByClub;
}

function aggregateForever({
  balanceSheet,
  transactions,
  positions,
  clubMap,
  playerMap,
  // issus des packs
  packRawTotalUSDByClub,
  packUnitAvgUSDByClub,
  packLastDateByClub,
  packTotalPacksByClub,
  svcRateUSD,
}) {
  const tradeIdx = indexTradesByTimeAndCounterparty(transactions);

  const payoutsClub = new Map();
  const payoutsPlayer = new Map();
  const baseMintPlayer = new Map();
  const achatsSvcClub = new Map();

  const qtyAcheteeSvcClub = estimateQtyBoughtViaSVC(transactions);

  for (const it of balanceSheet || []) {
    const amtSVC = toSVC(it?.amount);
    if (it?.type?.startsWith("dividend")) {
      if (it?.other_type === "club" && it?.other_id != null) {
        payoutsClub.set(it.other_id, (payoutsClub.get(it.other_id) || 0) + amtSVC);
      } else if (it?.other_type === "player" && it?.other_id != null) {
        payoutsPlayer.set(it.other_id, (payoutsPlayer.get(it.other_id) || 0) + amtSVC);
      }
      continue;
    }
    if (it?.type === "mint" && it?.other_type === "player" && it?.other_id != null && amtSVC < 0) {
      baseMintPlayer.set(it.other_id, (baseMintPlayer.get(it.other_id) || 0) + Math.abs(amtSVC));
      continue;
    }
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

    const totalPriceUSD = round2(Number(packRawTotalUSDByClub?.get(id) || 0));
    const unitAvgUSD = round2(Number(packUnitAvgUSDByClub?.get(id) || 0));
    const lastDateTs = Number(packLastDateByClub?.get(id) || 0);
    const totalPacks = Number(packTotalPacksByClub?.get(id) || 0);

    const gainsUSD = svcRateUSD != null ? round2(gainsSvc * svcRateUSD) : null;
    const coutTotalUSD = totalPriceUSD;
    const roiUSD = coutTotalUSD > 0 ? (gainsUSD ?? 0) / coutTotalUSD : null;

    clubs.push({
      id,
      name,
      qty,
      gainsSvc,
      achatsSvc,
      gainsUSD,
      coutTotalUSD,
      depensePacksAffineeUSD: unitAvgUSD,
      packsAchetes: totalPacks,
      dernierAchatTs: lastDateTs,
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

    players.push({ id, name, qty, payouts, baseSvc, roi });
  }

  return { clubs, players };
}

// ───────────────────────────────────────────────────────────────────────────────
// Page

export default function DebugRoiPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [positions, setPositions] = useState({ clubs: [], players: [] });
  const [balanceSheet, setBalanceSheet] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [wallet, setWallet] = useState(null);
  const [svcRateUSD, setSvcRateUSD] = useState(null);

  // Packs
  const [packBuysByClub, setPackBuysByClub] = useState(new Map());
  const [packRawTotalUSDByClub, setPackRawTotalUSDByClub] = useState(new Map());
  const [packUnitAvgUSDByClub, setPackUnitAvgUSDByClub] = useState(new Map());
  const [packLastDateByClub, setPackLastDateByClub] = useState(new Map());
  const [packTotalPacksByClub, setPackTotalPacksByClub] = useState(new Map());

  // chargement mappings + taux
  useEffect(() => {
    (async () => {
      try {
        const [clubRes, playerRes] = await Promise.all([fetch("/club_mapping.json"), fetch("/player_mapping.json")]);
        const [clubData, playerData] = await Promise.all([clubRes.json(), playerRes.json()]);
        setClubMap(clubData || {});
        setPlayerMap(playerData || {});
      } catch {}
    })();
    (async () => {
      try {
        const res = await fetch("https://services.soccerverse.com/api/market", { cache: "no-store" });
        const data = await res.json();
        if (data && typeof data.SVC2USDC === "number") setSvcRateUSD(data.SVC2USDC);
      } catch {}
    })();
  }, []);

  async function fetchUserBalanceSheet(name) {
    const res = await fetch("/api/user_balance_sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || `Erreur balance_sheet (${res.status})`);
    return Array.isArray(j?.result) ? j.result : [];
  }
  async function fetchTransactions(name) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || `Erreur transactions (${res.status})`);
    return Array.isArray(j?.result) ? j.result : [];
  }
  async function fetchPositions(name) {
    const res = await fetch("/api/user_positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || `Erreur positions (${res.status})`);
    return j;
  }
  async function resolveWallet(name) {
    try {
      const rw = await fetch("/api/resolve_wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await rw.json().catch(() => ({}));
      if (!rw.ok) return null;
      return j?.wallet || null;
    } catch {
      return null;
    }
  }

  async function fetchPackCostsForWallet(w) {
    const url = `/api/packs/by-wallet?wallet=${w}&pages=${PACKS_PAGES}&pageSize=${PACKS_PAGE_SIZE}&minAmountUSDC=${MIN_AMOUNT_USDC}`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) throw new Error(j?.error || "packs fetch failed");

    const buysMap = new Map();
    for (const it of j.items || []) {
      const price = Number(it.priceUSDC || 0);
      const unit = Number(it.unitPriceUSDC || 0);
      const packs = Number(it.packs || 0);
      const txHash = it.txHash;
      const blockNumber = it.blockNumber;
      const blockTs = Number(it.timeStamp || it.blockTimestamp || 0);

      const det = it.details || {};
      const parts = [];
      const mainId = det?.shares?.mainClub?.clubId;
      const mainInf = Number(det?.influence?.main || 0);
      if (mainId && mainInf > 0) parts.push({ clubId: mainId, role: "main" });
      for (const s of det?.shares?.secondaryClubs || []) {
        const cid = Number(s.clubId);
        const inf = Number(s.influence || 0);
        if (cid && inf > 0) parts.push({ clubId: cid, role: "secondary" });
      }

      for (const p of parts) {
        const arr = buysMap.get(p.clubId) || [];
        arr.push({
          txHash,
          role: p.role,
          dateTs: blockTs || null,
          blockNumber,
          packs,
          priceUSDC: price,
          unitPriceUSDC: unit || (packs > 0 ? price / packs : null),
        });
        buysMap.set(p.clubId, arr);
      }
    }

    // Agrégats
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

    for (const [cid, arr] of buysMap.entries()) {
      arr.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0) || (b.blockNumber || 0) - (a.blockNumber || 0));
    }

    setPackBuysByClub(buysMap);
    setPackRawTotalUSDByClub(totalUSD);
    setPackUnitAvgUSDByClub(unitAvg);
    setPackLastDateByClub(lastDate);
    setPackTotalPacksByClub(totalPks);

    return { api: j, buysMap };
  }

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
    ]
  );

  // Rôles dérivés des achats de packs
  const roleByClub = useMemo(() => {
    const m = new Map();
    for (const [cid, rows] of packBuysByClub.entries()) {
      const hasMain = rows.some((r) => r.role === "main");
      m.set(cid, hasMain ? "main" : "secondary");
    }
    return m;
  }, [packBuysByClub]);

// Diff sets pour trouver "qui manque"
const positionsSet = useMemo(() => new Set((positions?.clubs || []).map((c) => c.id)), [positions]);
const packsAnySet  = useMemo(() => new Set(Array.from(packBuysByClub.keys())), [packBuysByClub]);
const onlyPositions = useMemo(
  () => Array.from(positionsSet).filter((id) => !packsAnySet.has(id)),
  [positionsSet, packsAnySet]
);


  async function handleRun(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;
    setError("");
    setLoading(true);

    try {
      // Étape 1
      const [pos, bs, txs] = await Promise.all([fetchPositions(name), fetchUserBalanceSheet(name), fetchTransactions(name)]);
      setPositions(pos);
      setBalanceSheet(bs);
      setTransactions(txs);

      // Étape 2
      const w = await resolveWallet(name);
      setWallet(w);

      // Étape 3
      if (w) await fetchPackCostsForWallet(w);
    } catch (e) {
      setError(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-white py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">DEBUG ROI — step-by-step</h1>

        <form onSubmit={handleRun} className="flex gap-2 items-center">
          <input
            className="flex-1 rounded-lg p-2 bg-gray-900 border border-gray-700"
            placeholder="Nom d'utilisateur Soccerverse (ex: SoccerversePortugal)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Tester"}
          </button>
        </form>

        {!!error && (
          <div className="rounded border border-red-800 bg-red-950/40 text-red-300 p-3">{error}</div>
        )}

        {/* Étape 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1) Données Soccerverse</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Positions (clubs)</div>
              <div className="text-lg">{positions?.clubs?.length || 0}</div>
            </div>
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Positions (joueurs)</div>
              <div className="text-lg">{positions?.players?.length || 0}</div>
            </div>
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Balance sheet rows</div>
              <div className="text-lg">{balanceSheet.length}</div>
            </div>
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Transactions</div>
              <div className="text-lg">{transactions.length}</div>
            </div>
          </div>

          <div className="rounded border border-gray-700 p-3 bg-black/30">
            <div className="text-sm text-gray-300 mb-2">Clubs de <em>user_positions</em> (id, nom, qty)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-1 px-2">ID</th>
                    <th className="text-left py-1 px-2">Club</th>
                    <th className="text-right py-1 px-2">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(positions?.clubs || []).map((c) => (
                    <tr key={c.id}>
                      <td className="py-1 px-2">{c.id}</td>
                      <td className="py-1 px-2">{clubMap?.[c.id]?.name || `Club #${c.id}`}</td>
                      <td className="py-1 px-2 text-right">{fmtInt(Number(c.total || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <JsonBlock data={{ positionsSample: positions?.clubs?.slice(0, 3) || [], balanceSheetSample: balanceSheet.slice(0, 5), transactionsSample: transactions.slice(0, 5) }} />
        </section>

        {/* Étape 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2) Wallet & Taux</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Wallet détecté</div>
              <div className="truncate">
                {wallet ? (
                  <a className="text-indigo-300 hover:underline" target="_blank" rel="noreferrer" href={`https://polygonscan.com/address/${wallet}`}>
                    {wallet}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Taux SVC → USD</div>
              <div className="text-lg">{svcRateUSD != null ? svcRateUSD.toFixed(6) : "—"}</div>
            </div>
          </div>
        </section>

        {/* Étape 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3) Packs (scan blockchain)</h2>

          <div className="rounded border border-gray-700 p-3 bg-black/30">
            <div className="text-sm text-gray-300 mb-2">Clubs impliqués dans AU MOINS un achat de pack</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-1 px-2">Club</th>
                    <th className="text-left py-1 px-2">Rôle (déduit)</th>
                    <th className="text-right py-1 px-2">#achats</th>
                    <th className="text-right py-1 px-2">Prix total ($)</th>
                    <th className="text-right py-1 px-2">Prix / pack</th>
                    <th className="text-left py-1 px-2">Dernier achat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Array.from(packBuysByClub.keys()).map((cid) => {
                    const rows = packBuysByClub.get(cid) || [];
                    const role = roleByClub.get(cid) || "—";
                    return (
                      <tr key={cid}>
                        <td className="py-1 px-2">{clubMap?.[cid]?.name || `Club #${cid}`} <span className="text-gray-500">({cid})</span></td>
                        <td className="py-1 px-2 capitalize">{role}</td>
                        <td className="py-1 px-2 text-right">{rows.length}</td>
                        <td className="py-1 px-2 text-right">{fmtUSD(packRawTotalUSDByClub.get(cid))}</td>
                        <td className="py-1 px-2 text-right">{fmtUSD(packUnitAvgUSDByClub.get(cid))}</td>
                        <td className="py-1 px-2">{fmtDate(packLastDateByClub.get(cid))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-indigo-300">Détail: tx par club</summary>
              <div className="mt-2 space-y-3">
                {Array.from(packBuysByClub.entries()).map(([cid, rows]) => (
                  <div key={cid} className="rounded border border-gray-800 p-3">
                    <div className="text-sm mb-2">
                      <span className="font-medium">{clubMap?.[cid]?.name || `Club #${cid}`}</span>{" "}
                      <span className="text-gray-500">({cid})</span> — {rows.length} tx
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-900">
                          <tr>
                            <th className="text-left py-1 px-2">Date</th>
                            <th className="text-left py-1 px-2">Tx</th>
                            <th className="text-left py-1 px-2">Rôle</th>
                            <th className="text-right py-1 px-2">Packs</th>
                            <th className="text-right py-1 px-2">Prix total</th>
                            <th className="text-right py-1 px-2">Prix / pack</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {rows.map((r, i) => (
                            <tr key={`${r.txHash}-${i}`}>
                              <td className="py-1 px-2">{fmtDate(r.dateTs)}</td>
                              <td className="py-1 px-2">
                                <a className="text-indigo-300 hover:underline" href={`https://polygonscan.com/tx/${r.txHash}`} target="_blank" rel="noreferrer">
                                  {r.txHash.slice(0, 6)}…{r.txHash.slice(-4)}
                                </a>
                              </td>
                              <td className="py-1 px-2 capitalize">{r.role}</td>
                              <td className="py-1 px-2 text-right">{fmtInt(r.packs)}</td>
                              <td className="py-1 px-2 text-right">{fmtUSD(r.priceUSDC)}</td>
                              <td className="py-1 px-2 text-right">{fmtUSD(r.unitPriceUSDC)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>

        {/* Étape 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4) Agrégation & comparaison</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Clubs (positions)</div>
              <div className="text-lg">{positions?.clubs?.length || 0}</div>
            </div>
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Clubs avec achat de pack détecté</div>
              <div className="text-lg">{packBuysByClub.size}</div>
            </div>
            <div className="rounded border border-gray-700 p-3 bg-black/30">
              <div className="text-gray-400">Clubs en positions SANS pack détecté</div>
              <div className="text-lg">{onlyPositions.length}</div>
            </div>
          </div>

          {onlyPositions.length > 0 && (
            <div className="rounded border border-yellow-700 bg-yellow-950/20 p-3">
              <div className="font-medium mb-1">⚠️ Clubs présents dans user_positions mais sans trace d’achat de pack</div>
              <ul className="list-disc pl-5 text-sm">
                {onlyPositions.map((cid) => (
                  <li key={cid}>
                    {clubMap?.[cid]?.name || `Club #${cid}`} <span className="text-gray-500">({cid})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded border border-gray-700 p-3 bg-black/30">
            <div className="text-sm text-gray-300 mb-2">Aperçu lignes agrégées (ROI calculé sur prix total packs)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-1 px-2">Club</th>
                    <th className="text-right py-1 px-2">Qty</th>
                    <th className="text-right py-1 px-2">Gains (SVC)</th>
                    <th className="text-right py-1 px-2">Gains ($)</th>
                    <th className="text-right py-1 px-2">Coût total ($)</th>
                    <th className="text-right py-1 px-2">Prix/pack ($)</th>
                    <th className="text-right py-1 px-2">Packs</th>
                    <th className="text-right py-1 px-2">Dernier achat</th>
                    <th className="text-right py-1 px-2">ROI ($)</th>
                    <th className="text-left py-1 px-2">Rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {aggregated.clubs.map((row) => (
                    <tr key={row.id}>
                      <td className="py-1 px-2">
                        {clubMap?.[row.id]?.name || row.name}{" "}
                        <span className="text-gray-500">({row.id})</span>
                      </td>
                      <td className="py-1 px-2 text-right">{fmtInt(row.qty)}</td>
                      <td className="py-1 px-2 text-right">{fmtSVC(row.gainsSvc)}</td>
                      <td className="py-1 px-2 text-right">{row.gainsUSD != null ? fmtUSD(row.gainsUSD) : "—"}</td>
                      <td className="py-1 px-2 text-right">{row.coutTotalUSD != null ? fmtUSD(row.coutTotalUSD) : "—"}</td>
                      <td className="py-1 px-2 text-right">
                        {row.depensePacksAffineeUSD != null ? fmtUSD(row.depensePacksAffineeUSD) : "—"}
                      </td>
                      <td className="py-1 px-2 text-right">{fmtInt(row.packsAchetes)}</td>
                      <td className="py-1 px-2 text-right">{fmtDate(row.dernierAchatTs)}</td>
                      <td className="py-1 px-2 text-right">
                        {row.roiUSD != null ? `${(row.roiUSD * 100).toFixed(2)}%` : "n/a"}
                      </td>
                      <td className="py-1 px-2">
                        {roleByClub.has(row.id) ? (roleByClub.get(row.id) === "main" ? "principal" : "secondaire") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <JsonBlock
            data={{
              clubIds_positions: (positions?.clubs || []).map((c) => c.id),
              clubIds_packsAny: Array.from(packBuysByClub.keys()),
              onlyPositions,
              aggregatedSample: aggregated.clubs.slice(0, 5),
            }}
          />
        </section>
      </div>
    </div>
  );
}
