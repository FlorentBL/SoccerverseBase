"use client";

import React, { useMemo, useRef, useState } from "react";

const fmtUSD = (n) =>
  typeof n === "number"
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : "—";
const fmtBlock = (bn) => (bn ? `#${bn}` : "—");

export default function PacksHistoryOnchain() {
  const [username, setUsername] = useState("");
  const [fromBlock, setFromBlock] = useState("");   // optionnel
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wallet, setWallet] = useState("");
  const [spent, setSpent] = useState([]);
  const [mints, setMints] = useState([]);
  const [sortKey, setSortKey] = useState("usd");
  const [sortDir, setSortDir] = useState("desc");
  const abortRef = useRef(null);

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
    setSpent([]);
    setMints([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const body = { name, maxSecs: 60 };
      if (fromBlock && /^\d+$/.test(fromBlock)) body.fromBlock = Number(fromBlock);

      const res = await fetch("/api/packs/history_onchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Réponse non JSON (HTTP ${res.status})`);
      }
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Erreur API (HTTP ${res.status})`);
      }

      setWallet(data.wallet || "");
      setSpent(Array.isArray(data.spentPackUSDByClub) ? data.spentPackUSDByClub : []);
      setMints(Array.isArray(data.mints) ? data.mints : []);
    } catch (e) {
      if (e?.name === "AbortError") {
        setError("Requête annulée.");
      } else {
        setError(e?.message || "Erreur inconnue");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function abort() {
    abortRef.current?.abort();
  }

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Test — Packs history (on‑chain)</h1>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            className="rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur Soccerverse"
          />
          <input
            className="rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
            value={fromBlock}
            onChange={(e) => setFromBlock(e.target.value)}
            placeholder="fromBlock (optionnel)"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={run}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              disabled={loading || !username.trim()}
            >
              {loading ? "Chargement..." : "Lancer"}
            </button>
            {loading && (
              <button
                type="button"
                onClick={abort}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-300">
            {error}
          </div>
        )}

        {wallet && (
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

        {spent.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">
              Dépenses packs réelles par club — total {fmtUSD(totalUSD)}
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

        {mints.length > 0 && (
          <section className="mb-20">
            <h2 className="text-2xl font-semibold mb-3">Mints (audit)</h2>
            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="text-left py-2 px-3">Tx</th>
                    <th className="text-left py-2 px-3">Bloc</th>
                    <th className="text-right py-2 px-3">unitUSDC</th>
                    <th className="text-right py-2 px-3">numPacks</th>
                    <th className="text-right py-2 px-3">totalUSDC</th>
                    <th className="text-right py-2 px-3">totalInf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {mints.map((m) => (
                    <tr key={m.tx} className="hover:bg-white/5">
                      <td className="py-2 px-3">
                        <a
                          className="text-indigo-400 hover:underline"
                          href={`https://polygonscan.com/tx/${m.tx}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {m.tx.slice(0, 10)}…
                        </a>
                      </td>
                      <td className="py-2 px-3">{fmtBlock(m.blockNumber)}</td>
                      <td className="py-2 px-3 text-right">{fmtUSD(Number(m.unitUSDC) || 0)}</td>
                      <td className="py-2 px-3 text-right">{Number(m.numPacks) || 0}</td>
                      <td className="py-2 px-3 text-right">{fmtUSD(Number(m.totalUSDC) || 0)}</td>
                      <td className="py-2 px-3 text-right">{Number(m.totalInf) || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              * Coût réparti sur toutes les influences retournées par
              <code className="mx-1 px-1 rounded bg-gray-800">preview</code> au bloc de l’achat.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
