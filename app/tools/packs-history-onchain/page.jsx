// /app/tools/packs-history-onchain/page.jsx
"use client";

import React, { useMemo, useState } from "react";

const fmtUSD = (n) =>
  typeof n === "number"
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : "—";
const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "—");
const fmtBlock = (bn) => (bn ? `#${bn}` : "—");
const short = (h) => (h ? `${h.slice(0, 10)}…` : "—");

async function fetchWithTimeout(resource, options = {}, ms = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default function PacksHistoryOnchain() {
  const [username, setUsername] = useState("");
  const [fromBlock, setFromBlock] = useState("0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [wallet, setWallet] = useState("");
  const [txs, setTxs] = useState([]); // {hash, block, time, from, to, amountUSDC}

  const totalUSD = useMemo(
    () => txs.reduce((s, t) => s + (Number(t.amountUSDC) || 0), 0),
    [txs]
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
    setTxs([]);

    try {
      // Appelle l’API (elle résoudra le wallet à partir du pseudo)
      const res = await fetchWithTimeout(
        "/api/packs/history_onchain",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            fromBlock: Number(fromBlock) || 0,
          }),
        },
        90_000
      );

      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) {
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      setWallet(j.wallet || "");
      setTxs(Array.isArray(j.txs) ? j.txs : []);
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

        {/* Contrôles */}
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
            placeholder="Depuis le bloc (ex: 77000000)"
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

        {/* Erreur */}
        {!!error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-300">
            {error}
          </div>
        )}

        {/* Wallet */}
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

        {/* Achats USDC → contrats de vente */}
        {txs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">
              Achats (USDC sortants vers Shop) — total {fmtUSD(totalUSD)}
            </h2>
            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="text-left py-2 px-3">Tx</th>
                    <th className="text-left py-2 px-3">Bloc</th>
                    <th className="text-left py-2 px-3">To</th>
                    <th className="text-right py-2 px-3">Montant (USDC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {txs.map((t) => (
                    <tr key={t.hash} className="hover:bg-white/5">
                      <td className="py-2 px-3">
                        <a
                          className="text-indigo-400 hover:underline"
                          href={`https://polygonscan.com/tx/${t.hash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {short(t.hash)}
                        </a>
                      </td>
                      <td className="py-2 px-3">{fmtBlock(t.block)}</td>
                      <td className="py-2 px-3">{t.to}</td>
                      <td className="py-2 px-3 text-right">
                        {fmtInt(t.amountUSDC)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && !error && wallet && txs.length === 0 && (
          <div className="text-gray-400">
            Aucun paiement USDC vers les contrats de vente trouvés dans la
            fenêtre. Essaie un bloc de départ plus ancien.
          </div>
        )}
      </div>
    </div>
  );
}
