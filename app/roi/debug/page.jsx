// app/roi/debug/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** Page de DEBUG ROI / Packs
 * - Montre tout le pipeline étape par étape
 * - Compare les clubs "positions" vs "achats packs détectés"
 * - Affiche aussi le détail des achats rattachés à un club + coût via SVC
 */

// ╭───────────────────────────────────────────────────────────────────────────╮
// │ Config / utils                                                            │
// ╰───────────────────────────────────────────────────────────────────────────╯
const PACKS_PAGES = 1000;
const PACKS_PAGE_SIZE = 100;
const MIN_AMOUNT_USDC = 0; // on laisse 0 ici pour ne rien rater en debug

const UNIT = 10000; // montants du balance_sheet en 1e-4 SVC
const toSVC = (n) => (Number(n) || 0) / UNIT;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

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

const shortHash = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : "");

// mapping “share trade” → club id (via /api/transactions)
const tradeKey = (otherName, unix) => `${otherName || ""}|${Number(unix) || 0}`;
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

// somme des achats via SVC par club (balance_sheet négatifs “share trade”)
function computeClubCostsViaSVC(balanceSheet, transactions) {
  const tradeIdx = indexTradesByTimeAndCounterparty(transactions);
  const achatsSvcClub = new Map();
  for (const it of balanceSheet || []) {
    const amtSVC = toSVC(it?.amount);
    if (it?.type === "share trade" && amtSVC < 0) {
      const k = `${it?.other_name || ""}|${Number(it?.unix_time) || 0}`;
      const share = tradeIdx.get(k);
      if (share?.type === "club" && share?.id != null) {
        achatsSvcClub.set(share.id, (achatsSvcClub.get(share.id) || 0) + Math.abs(amtSVC));
      }
    }
  }
  return achatsSvcClub;
}

// ╭───────────────────────────────────────────────────────────────────────────╮
// │ Composant principal                                                       │
// ╰───────────────────────────────────────────────────────────────────────────╯
export default function RoiDebug() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [wallet, setWallet] = useState(null);
  const [svcRateUSD, setSvcRateUSD] = useState(null);

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [positionsData, setPositionsData] = useState({ clubs: [], players: [] });
  const [balanceSheet, setBalanceSheet] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // packs API retour brut + maps dérivées
  const [packsApi, setPacksApi] = useState(null);
  const [packBuysByClub, setPackBuysByClub] = useState(new Map()); // clubId -> [{txHash, role, packs, priceUSDC, unitPriceUSDC, dateTs, blockNumber}]

  // Inspecteur club
  const [inspectClubId, setInspectClubId] = useState("");

  // chargement mappings + taux
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

  // Fetch helpers
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

    // Construire clubId -> rows + rôle
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

    // tri interne par club : plus récent d’abord
    for (const [cid, arr] of buysMap.entries()) {
      arr.sort(
        (a, b) =>
          (b.dateTs || 0) - (a.dateTs || 0) ||
          (b.blockNumber || 0) - (a.blockNumber || 0)
      );
    }

    setPacksApi(j);
    setPackBuysByClub(buysMap);
  }

  async function handleSearch(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setSearched(true);
    setError("");
    setWallet(null);
    setPacksApi(null);
    setPackBuysByClub(new Map());

    try {
      const [pos, bs, txs] = await Promise.all([
        fetchPositions(name),
        fetchUserBalanceSheet(name),
        fetchTransactions(name),
      ]);
      setPositionsData(pos || { clubs: [], players: [] });
      setBalanceSheet(bs || []);
      setTransactions(txs || []);

      const w = await resolveWallet(name);
      setWallet(w);
      if (w) {
        await fetchPackCostsForWallet(w);
      }
    } catch (err) {
      setError(err?.message || "Erreur de chargement.");
      setPositionsData({ clubs: [], players: [] });
      setBalanceSheet([]);
      setTransactions([]);
      setWallet(null);
      setPacksApi(null);
      setPackBuysByClub(new Map());
    } finally {
      setLoading(false);
    }
  }

  // Ensembles d’IDs pour les diffs
  const positionsSet = useMemo(
    () => new Set((positionsData?.clubs || []).map((c) => c.id)),
    [positionsData]
  );
  const packsAnySet = useMemo(
    () => new Set(Array.from(packBuysByClub.keys())),
    [packBuysByClub]
  );

  const onlyPositions = useMemo(
    () => Array.from(positionsSet).filter((id) => !packsAnySet.has(id)),
    [positionsSet, packsAnySet]
  );
  const onlyPacks = useMemo(
    () => Array.from(packsAnySet).filter((id) => !positionsSet.has(id)),
    [positionsSet, packsAnySet]
  );
  const bothSets = useMemo(
    () => Array.from(positionsSet).filter((id) => packsAnySet.has(id)),
    [positionsSet, packsAnySet]
  );

  // Coûts via SVC par club
  const achatsSvcByClub = useMemo(
    () => computeClubCostsViaSVC(balanceSheet, transactions),
    [balanceSheet, transactions]
  );

  const clubName = (id) =>
    clubMap?.[id]?.name || clubMap?.[id]?.n || `Club #${id}`;

  const InspectPanel = ({ clubId }) => {
    const id = Number(clubId) || null;
    if (!id) return null;

    const rows = packBuysByClub.get(id) || [];
    const viaSvc = round4(achatsSvcByClub.get(id) || 0);
    const viaSvcUSD =
      svcRateUSD != null ? round2(viaSvc * svcRateUSD) : null;

    const totalPackUSD = rows.reduce((s, r) => s + (r.priceUSDC || 0), 0);
    const totalPackPacks = rows.reduce((s, r) => s + (r.packs || 0), 0);
    const avgUnitUSD = totalPackPacks > 0 ? totalPackUSD / totalPackPacks : null;

    const coutTotalUSD =
      (totalPackUSD || 0) + (viaSvcUSD != null ? viaSvcUSD : 0);

    return (
      <div className="rounded-lg border border-gray-700 p-3 mt-4">
        <div className="text-lg font-semibold mb-2">
          Inspecteur — {clubName(id)} (id {id})
        </div>
        <div className="text-sm text-gray-300 mb-2">
          Packs détectés pour ce club : {rows.length} — Total packs:{" "}
          <b>{fmtInt(totalPackPacks)}</b> — Total $ packs:{" "}
          <b>{fmtUSD(totalPackUSD)}</b> — Prix / pack moyen:{" "}
          <b>{avgUnitUSD != null ? fmtUSD(avgUnitUSD) : "—"}</b>
        </div>
        <div className="text-sm text-gray-300 mb-4">
          Coût via SVC (share trade): <b>{fmtSVC(viaSvc)}</b>{" "}
          {svcRateUSD != null && (
            <> (~ {fmtUSD(viaSvcUSD)})</>
          )}
        </div>
        <div className="text-sm text-gray-300 mb-4">
          <b>Coût total considéré (packs + SVC)</b> : {fmtUSD(coutTotalUSD)}
        </div>

        {rows.length === 0 ? (
          <div className="text-gray-400 text-sm">
            Aucun achat de pack rattaché à ce club.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-700">
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
                    <td className="py-2 px-3 text-right">
                      {r.unitPriceUSDC != null ? fmtUSD(r.unitPriceUSDC) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">ROI — DEBUG</h1>

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

        {searched && (
          <>
            {/* Bloc 1 — Données Soccerverse */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-3">1) Données Soccerverse</h2>
              <div className="text-sm text-gray-300 mb-2">
                Positions (clubs): <b>{positionsData?.clubs?.length || 0}</b> • Positions (joueurs):{" "}
                <b>{positionsData?.players?.length || 0}</b> • Balance sheet rows:{" "}
                <b>{balanceSheet.length}</b> • Transactions: <b>{transactions.length}</b>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3">ID</th>
                      <th className="text-left py-2 px-3">Club</th>
                      <th className="text-right py-2 px-3">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {(positionsData?.clubs || []).map((c) => (
                      <tr key={`pos-${c.id}`} className="hover:bg-white/5">
                        <td className="py-2 px-3">{c.id}</td>
                        <td className="py-2 px-3">{clubName(c.id)}</td>
                        <td className="py-2 px-3 text-right">{fmtInt(Number(c.total || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bloc 2 — Wallet + Scans on-chain */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-3">2) Wallet & Scan on-chain</h2>
              <div className="text-sm mb-3">
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

              {packsApi ? (
                <>
                  <div className="text-sm text-gray-300 mb-2">
                    Découverte de transactions : USDC (tokentx) ={" "}
                    <b>{packsApi?.scans?.debug?.discovered?.tokenTxs ?? 0}</b> • Normal txs (vers contrats packs) ={" "}
                    <b>{packsApi?.scans?.debug?.discovered?.normalTxs ?? 0}</b> • Fusion unique ={" "}
                    <b>{packsApi?.scans?.debug?.discovered?.mergedUnique ?? 0}</b>
                  </div>
                  <div className="text-sm text-gray-300 mb-4">
                    Candidats analysés : <b>{packsApi?.scans?.candidates ?? 0}</b> • Packs détectés :{" "}
                    <b>{packsApi?.scans?.packsDetected ?? packsApi?.items?.length ?? 0}</b>
                  </div>

                  <details className="mb-4">
                    <summary className="cursor-pointer select-none text-indigo-300">
                      Voir JSON brut de /api/packs/by-wallet
                    </summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap bg-black/40 p-3 rounded-lg border border-gray-800 overflow-x-auto max-h-[400px]">
                      {JSON.stringify(packsApi, null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                <div className="text-gray-400 text-sm">Aucun résultat /api/packs/by-wallet (wallet non résolu ?)</div>
              )}
            </section>

            {/* Bloc 3 — Diffs sets */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-3">3) Comparaison positions vs achats de packs</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {/* only positions */}
                <div className="rounded-lg border border-gray-700">
                  <div className="bg-gray-800 px-3 py-2 font-semibold">
                    Présents uniquement dans positions ({onlyPositions.length})
                  </div>
                  <div className="p-3 text-sm max-h-[300px] overflow-auto">
                    {onlyPositions.length === 0 ? (
                      <div className="text-gray-500">—</div>
                    ) : (
                      <ul className="space-y-1">
                        {onlyPositions.map((id) => (
                          <li key={`onlypos-${id}`}>
                            <span className="text-gray-400">#{id}</span> — {clubName(id)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* both */}
                <div className="rounded-lg border border-gray-700">
                  <div className="bg-gray-800 px-3 py-2 font-semibold">
                    Présents dans positions + packs ({bothSets.length})
                  </div>
                  <div className="p-3 text-sm max-h-[300px] overflow-auto">
                    {bothSets.length === 0 ? (
                      <div className="text-gray-500">—</div>
                    ) : (
                      <ul className="space-y-1">
                        {bothSets.map((id) => (
                          <li key={`both-${id}`}>
                            <span className="text-gray-400">#{id}</span> — {clubName(id)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* only packs */}
                <div className="rounded-lg border border-gray-700">
                  <div className="bg-gray-800 px-3 py-2 font-semibold">
                    Présents uniquement dans achats packs ({onlyPacks.length})
                  </div>
                  <div className="p-3 text-sm max-h-[300px] overflow-auto">
                    {onlyPacks.length === 0 ? (
                      <div className="text-gray-500">—</div>
                    ) : (
                      <ul className="space-y-1">
                        {onlyPacks.map((id) => (
                          <li key={`onlypacks-${id}`}>
                            <span className="text-gray-400">#{id}</span> — {clubName(id)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Bloc 4 — Inspecteur club */}
            <section className="mb-20">
              <h2 className="text-2xl font-semibold mb-3">4) Inspecteur par club</h2>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={inspectClubId}
                  onChange={(e) => setInspectClubId(e.target.value)}
                  placeholder="Entrer un clubId (ex: 8067)"
                  className="w-64 rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
                />
                <span className="text-sm text-gray-400">
                  (Exemples : 8067 Motema Pembe, 3463 East Bengal, 1687 Catanzaro…)
                </span>
              </div>
              {inspectClubId ? (
                <InspectPanel clubId={inspectClubId} />
              ) : (
                <div className="text-gray-500 text-sm">
                  Entrez un <em>clubId</em> pour voir les achats rattachés, le coût via SVC et le coût combiné (packs + SVC).
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
