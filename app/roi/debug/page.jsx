// app/roi/debug/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** Page de debug pour suivre chaque étape:
 * 1) fetch Soccerverse (positions, balance_sheet, transactions)
 * 2) résolution du wallet
 * 3) scan on-chain packs (/api/packs/by-wallet)
 * 4) jointure + deltas (qui manque / qui en trop)
 */

// ───────────────────────────────────────────────────────────────────────────────
// Constantes
const PACKS_PAGES = 1000;
const PACKS_PAGE_SIZE = 100;
// IMPORTANT: on veut TOUT voir, donc pas de filtre montant
const MIN_AMOUNT_USDC = 0;

const UNIT = 10000;
const toSVC = (n) => (Number(n) || 0) / UNIT;

const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "—");
const fmtUSD = (n) =>
  typeof n === "number" ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—";
const fmtSVC = (n) =>
  typeof n === "number" ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} SVC` : "—";
const fmtDate = (ts) => (ts ? new Date(Number(ts) * 1000).toLocaleString("fr-FR") : "—");
const shortHash = (h) => (h ? `${h.slice(0, 6)}…${h.slice(-4)}` : "");

// ───────────────────────────────────────────────────────────────────────────────
// API helpers

async function fetchJSON(url, body) {
  const r = await fetch(url, body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } : { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

async function fetchUserBalanceSheet(name) {
  const j = await fetchJSON("/api/user_balance_sheet", { name });
  return Array.isArray(j?.result) ? j.result : [];
}
async function fetchTransactions(name) {
  const j = await fetchJSON("/api/transactions", { name });
  return Array.isArray(j?.result) ? j.result : [];
}
async function fetchPositions(name) {
  return await fetchJSON("/api/user_positions", { name });
}
async function resolveWallet(name) {
  const j = await fetchJSON("/api/resolve_wallet", { name }).catch(() => ({}));
  return j?.wallet || null;
}

// Packs on-chain
async function fetchPackCostsForWallet(w) {
  const url =
    `/api/packs/by-wallet?wallet=${w}` +
    `&pages=${PACKS_PAGES}&pageSize=${PACKS_PAGE_SIZE}` +
    `&minAmountUSDC=${MIN_AMOUNT_USDC}`;

  const j = await fetchJSON(url);
  const buysMap = new Map(); // clubId -> [rows]

  for (const it of j.items || []) {
    const price = Number(it.priceUSDC || 0);
    const unit = Number(it.unitPriceUSDC || 0);
    const packs = Number(it.packs || 0);
    const txHash = it.txHash;
    const blockNumber = it.blockNumber;
    const blockTs = Number(it.timeStamp || it.blockTimestamp || 0);

    const det = it.details || {};
    const parts = [];
    const mainId  = Number(det?.shares?.mainClub?.clubId || 0);
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

  // tri par date desc
  for (const [cid, arr] of buysMap.entries()) {
    arr.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0) || (b.blockNumber || 0) - (a.blockNumber || 0));
  }

  return { api: j, buysMap };
}

// ───────────────────────────────────────────────────────────────────────────────
// Composant

export default function DebugROI() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [positions, setPositionsState] = useState({ clubs: [], players: [] });
  const [balanceSheet, setBalanceSheet] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [wallet, setWallet] = useState(null);

  const [packsRaw, setPacksRaw] = useState(null);
  const [packBuysByClub, setPackBuysByClub] = useState(new Map());

  // mappings
  useEffect(() => {
    (async () => {
      try {
        const [clubRes, playerRes] = await Promise.all([
          fetch("/club_mapping.json"),
          fetch("/player_mapping.json"),
        ]);
        const [clubData, playerData] = await Promise.all([clubRes.json(), playerRes.json()]);
        setClubMap(clubData || {});
        setPlayerMap(playerData || {});
      } catch {}
    })();
  }, []);

  async function handleGo(e) {
    e?.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const name = username.trim();
      const [bs, txs, pos] = await Promise.all([
        fetchUserBalanceSheet(name),
        fetchTransactions(name),
        fetchPositions(name),
      ]);
      setBalanceSheet(bs);
      setTransactions(txs);
      setPositionsState(pos);

      const w = await resolveWallet(name);
      setWallet(w);

      if (w) {
        const p = await fetchPackCostsForWallet(w);
        setPacksRaw(p.api);
        setPackBuysByClub(p.buysMap);
      } else {
        setPacksRaw(null);
        setPackBuysByClub(new Map());
      }
    } catch (e) {
      setErr(e.message || "Erreur");
      setPacksRaw(null);
      setPackBuysByClub(new Map());
    } finally {
      setLoading(false);
    }
  }

  // sets utiles pour comparer
  const setPositionsIds = useMemo(
    () => new Set((positions?.clubs || []).map((c) => c.id)),
    [positions]
  );
  const setPacksAny = useMemo(
    () => new Set(Array.from(packBuysByClub.keys())),
    [packBuysByClub]
  );

  const onlyPositions = useMemo(
    () => Array.from(setPositionsIds).filter((id) => !setPacksAny.has(id)),
    [setPositionsIds, setPacksAny]
  );
  const onlyPacks = useMemo(
    () => Array.from(setPacksAny).filter((id) => !setPositionsIds.has(id)),
    [setPositionsIds, setPacksAny]
  );
  const both = useMemo(
    () => Array.from(setPositionsIds).filter((id) => setPacksAny.has(id)),
    [setPositionsIds, setPacksAny]
  );

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ROI — Debug</h1>

        <form onSubmit={handleGo} className="flex gap-2 mb-4">
          <input
            className="flex-1 rounded-lg p-2 bg-gray-900 border border-gray-700"
            placeholder="Nom d'utilisateur Soccerverse"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 disabled:opacity-50"
            disabled={loading || !username.trim()}
          >
            {loading ? "Chargement…" : "Analyser"}
          </button>
        </form>

        {wallet && (
          <div className="mb-4 text-sm text-gray-300">
            Wallet détecté :{" "}
            <a
              className="text-indigo-400 hover:underline"
              href={`https://polygonscan.com/address/${wallet}`}
              target="_blank"
              rel="noreferrer"
            >
              {wallet}
            </a>
          </div>
        )}

        {!!err && (
          <div className="mb-4 rounded border border-red-800 bg-red-950/40 p-3 text-red-300">
            {err}
          </div>
        )}

        {/* Récap Soccerverse */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1) Données Soccerverse</h2>
          <div className="text-sm text-gray-300 mb-2">
            Positions (clubs): {fmtInt((positions?.clubs || []).length)} — Positions (joueurs):{" "}
            {fmtInt((positions?.players || []).length)} — Balance sheet rows:{" "}
            {fmtInt(balanceSheet.length)} — Transactions: {fmtInt(transactions.length)}
          </div>

          <div className="overflow-x-auto rounded border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Club</th>
                  <th className="text-right p-2">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(positions?.clubs || []).map((c) => (
                  <tr key={c.id}>
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">{clubMap?.[c.id]?.name || clubMap?.[c.id]?.n || `Club #${c.id}`}</td>
                    <td className="p-2 text-right">{fmtInt(Number(c.total || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Scan packs */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">2) Scan on-chain (packs)</h2>
          <div className="text-sm text-gray-300 mb-2">
            Paramètres: pages={PACKS_PAGES}, pageSize={PACKS_PAGE_SIZE},{" "}
            <strong>minAmountUSDC={MIN_AMOUNT_USDC}</strong>
          </div>

          {packsRaw ? (
            <div className="text-sm text-gray-300 mb-4">
              Candidates: {fmtInt(packsRaw?.scans?.candidates || 0)} — Analyzed:{" "}
              {fmtInt(packsRaw?.scans?.analyzed || 0)} — Packs détectés:{" "}
              {fmtInt(packsRaw?.scans?.packsDetected || 0)}
            </div>
          ) : (
            <div className="text-sm text-gray-400 mb-4">Aucun résultat de scan (wallet manquant ?).</div>
          )}

          {/* clubs avec achats détectés */}
          <div className="overflow-x-auto rounded border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-2">Club</th>
                  <th className="text-left p-2">Rôle (packs)</th>
                  <th className="text-right p-2">Packs achetés</th>
                  <th className="text-right p-2">Dernier achat</th>
                  <th className="text-right p-2">Achats via SVC</th>
                  <th className="text-right p-2">Gains SVC</th>
                  <th className="text-right p-2">Coût total ($)</th>
                  <th className="text-right p-2">Coût packs (club) ($)</th>
                  <th className="text-right p-2">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {Array.from(packBuysByClub.entries()).map(([cid, rows]) => {
                  const name = clubMap?.[cid]?.name || clubMap?.[cid]?.n || `Club #${cid}`;
                  const lastTs = rows[0]?.dateTs || null;
                  const packs = rows.reduce((s, r) => s + (r.packs || 0), 0);
                  const price = rows.reduce((s, r) => s + (r.priceUSDC || 0), 0);
                  const unit = packs > 0 ? price / packs : 0;
                  return (
                    <tr key={cid}>
                      <td className="p-2">{name}</td>
                      <td className="p-2 capitalize">
                        {rows.some((r) => r.role === "main")
                          ? "Principal"
                          : rows.some((r) => r.role === "secondary")
                          ? "Secondaire"
                          : "—"}
                      </td>
                      <td className="p-2 text-right">{fmtInt(packs)}</td>
                      <td className="p-2 text-right">{fmtDate(lastTs)}</td>
                      <td className="p-2 text-right">—</td>
                      <td className="p-2 text-right">—</td>
                      <td className="p-2 text-right">{fmtUSD(price)}</td>
                      <td className="p-2 text-right">{fmtUSD(unit)}</td>
                      <td className="p-2 text-right">
                        {rows.length ? (
                          <details>
                            <summary className="cursor-pointer text-indigo-400">voir</summary>
                            <div className="mt-2">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr>
                                    <th className="text-left p-1">Date</th>
                                    <th className="text-left p-1">Tx</th>
                                    <th className="text-left p-1">Rôle</th>
                                    <th className="text-right p-1">Packs</th>
                                    <th className="text-right p-1">Prix total</th>
                                    <th className="text-right p-1">Prix/pack</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r, i) => (
                                    <tr key={`${r.txHash}-${i}`}>
                                      <td className="p-1">{fmtDate(r.dateTs)}</td>
                                      <td className="p-1">
                                        <a
                                          className="text-indigo-400 hover:underline"
                                          href={`https://polygonscan.com/tx/${r.txHash}`}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          {shortHash(r.txHash)}
                                        </a>
                                      </td>
                                      <td className="p-1 capitalize">{r.role}</td>
                                      <td className="p-1 text-right">{fmtInt(r.packs)}</td>
                                      <td className="p-1 text-right">{fmtUSD(r.priceUSDC)}</td>
                                      <td className="p-1 text-right">{fmtUSD(r.unitPriceUSDC)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Deltas */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-2">3) Différences</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded border border-gray-800 p-3">
              <h3 className="font-semibold mb-2">Dans positions SEULEMENT</h3>
              <ul className="text-sm list-disc pl-5">
                {onlyPositions.map((id) => (
                  <li key={`pos-${id}`}>
                    {clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`} (id {id})
                  </li>
                ))}
                {!onlyPositions.length && <li className="text-gray-500">—</li>}
              </ul>
            </div>
            <div className="rounded border border-gray-800 p-3">
              <h3 className="font-semibold mb-2">Dans packs SEULEMENT</h3>
              <ul className="text-sm list-disc pl-5">
                {onlyPacks.map((id) => (
                  <li key={`pack-${id}`}>
                    {clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`} (id {id})
                  </li>
                ))}
                {!onlyPacks.length && <li className="text-gray-500">—</li>}
              </ul>
            </div>
            <div className="rounded border border-gray-800 p-3">
              <h3 className="font-semibold mb-2">Présents dans les deux</h3>
              <div className="text-sm">{fmtInt(both.length)}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
