"use client";

import React, { useMemo, useState } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// helpers

const fmtUSD = (n) =>
  typeof n === "number"
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : "—";
const fmtInt = (n) =>
  typeof n === "number" ? n.toLocaleString("fr-FR") : "—";
const fmtBlock = (bn) => (bn ? `#${bn}` : "—");
const short = (h) => (h ? `${h.slice(0, 10)}…` : "—");

async function fetchWithTimeout(resource, options = {}, ms = 120_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function callHistoryAPI({ name, fromBlock, maxSecs }) {
  const body = { name };
  if (fromBlock) body.fromBlock = Number(fromBlock);
  if (maxSecs) body.maxSecs = Number(maxSecs);

  const res = await fetchWithTimeout("/api/packs/history_onchain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, 120_000);

  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Réponse non JSON (HTTP ${res.status})`);
  }
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Erreur API (HTTP ${res.status})`);
  }
  return data;
}

// ───────────────────────────────────────────────────────────────────────────────
// page

export default function PacksHistoryOnchain() {
  const [username, setUsername] = useState("");
  const [fromBlock, setFromBlock] = useState(""); // ex: 77000000, optionnel
  const [maxSecs, setMaxSecs] = useState("180");  // fenêtre max de scan, optionnel

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [wallet, setWallet] = useState("");
  const [mints, setMints] = useState([]);            // achats
  const [spent, setSpent] = useState([]);            // agrégat { clubId, usd }

  // tri agrégat
  const [sortKey, setSortKey] = useState("usd");     // "usd" | "clubId"
  const [sortDir, setSortDir] = useState("desc");

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const spentSorted = useMemo(() => {
    const arr = [...spent];
    arr.sort((a, b) => {
      const va = sortKey === "clubId" ? Number(a.clubId) : Number(a.usd);
      const vb = sortKey === "clubId" ? Number(b.clubId) : Number(b.usd);
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [spent, sortKey, sortDir]);

  const totalUSD = useMemo(
    () => spent.reduce((s, r) => s + (Number(r.usd) || 0), 0),
    [spent]
  );

  async function run() {
    const name = username.trim();
    if (!name) {
      setError("Entre un nom d'utilisateur Soccerverse");
      return;
    }

    setLoading(true);
    setError("");
    setWallet("");
    setMints([]);
    setSpent([]);

    try {
      const data = await callHistoryAPI({
        name,
        fromBlock: fromBlock ? Number(fromBlock) : undefined,
        maxSecs: maxSecs ? Number(maxSecs) : undefined,
      });

      setWallet(data.wallet || "");
      setMints(Array.isArray(data.mints) ? data.mints : []);
      setSpent(Array.isArray(data.spentPackUSDByClub) ? data.spentPackUSDByClub : []);
    } catch (e) {
      setError(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          Test — Packs history (on‑chain)
        </h1>

        {/* contrôles */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            className="rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur Soccerverse (ex: klo)"
          />
          <input
            className="rounded-lg p-2 bg-gray-900 border border-gray-800 text-gray-200"
            value={fromBlock}
            onChange={(e) => setFromBlock(e.target.value)}
            placeholder="Depuis le bloc (optionnel, ex: 77000000)"
          />
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg p-2 bg-gray-900 border border-gray-800 text-gray-200"
              value={maxSecs}
              onChange={(e) => setMaxSecs(e.target.value)}
              placeholder="Temps max scan (s)"
            />
            <button
              type="button"
              onClick={run}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              disabled={loading || !username.trim()}
            >
              {loading ? "Chargement..." : "Lancer"}
            </button>
          </div>
        </div>

        {/* erreur */}
        {!!error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-300">
            {error}
          </div>
        )}

        {/* wallet */}
        {!!wallet && (
          <div className="mb-6 text-sm text-gray-300">
            Wallet :{" "}
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

        {/* journal des achats */}
        {mints.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">Achats (détaillés)</h2>
            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="text-left py-2 px-3">Tx</th>
                    <th className="text-left py-2 px-3">Bloc</th>
                    <th className="text-right py-2 px-3">Tier</th>
                    <th className="text-right py-2 px-3">unitUSDC</th>
                    <th className="text-right py-2 px-3">numPacks</th>
                    <th className="text-right py-2 px-3">totalUSDC</th>
                    <th className="text-left py-2 px-3">Contenu (club:inf)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {mints.map((m) => (
                    <tr key={m.tx} className="hover:bg-white/5 align-top">
                      <td className="py-2 px-3">
                        <a
                          className="text-indigo-400 hover:underline"
                          href={`https://polygonscan.com/tx/${m.tx}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {short(m.tx)}
                        </a>
                      </td>
                      <td className="py-2 px-3">{fmtBlock(m.blockNumber)}</td>
                      <td className="py-2 px-3 text-right">{m.tier ?? "—"}</td>
                      <td className="py-2 px-3 text-right">{fmtUSD(Number(m.unitUSDC) || 0)}</td>
                      <td className="py-2 px-3 text-right">{fmtInt(Number(m.numPacks) || 0)}</td>
                      <td className="py-2 px-3 text-right">
                        {fmtUSD(Number(m.totalUSDC) || 0)}
                      </td>
                      <td className="py-2 px-3">
                        {/* components = [{clubId, influence}] au bloc du tx */}
                        {Array.isArray(m.components) && m.components.length > 0
                          ? m.components
                              .map((c) => `${c.clubId}:${c.influence}`)
                              .join("  ·  ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              Le coût est réparti **au bloc exact de l’achat** en fonction des influences
              retournées par <code className="px-1 rounded bg-gray-800">preview</code>.
            </div>
          </section>
        )}

        {/* agrégat par club */}
        {spent.length > 0 && (
          <section className="mb-20">
            <h2 className="text-2xl font-semibold mb-3">
              Dépenses imputées par club — total {fmtUSD(totalUSD)}
            </h2>

            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th
                      className="text-left py-2 px-3 cursor-pointer select-none hover:underline"
                      onClick={() => toggleSort("clubId")}
                    >
                      ClubId {sortKey === "clubId" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                    <th
                      className="text-right py-2 px-3 cursor-pointer select-none hover:underline"
                      onClick={() => toggleSort("usd")}
                    >
                      USD {sortKey === "usd" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {spentSorted.map((row) => (
                    <tr key={row.clubId} className="hover:bg-white/5">
                      <td className="py-2 px-3">{row.clubId}</td>
                      <td className="py-2 px-3 text-right">{fmtUSD(Number(row.usd) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && !error && wallet && mints.length === 0 && (
          <div className="text-gray-400">
            Aucun achat de pack trouvé sur la fenêtre scannée.
            Essaie d’augmenter “Depuis le bloc” (plus ancien) ou “Temps max”.
          </div>
        )}
      </div>
    </div>
  );
}
