"use client";
import React, { useState } from "react";

export default function TransactionAnalysis() {
  const [username, setUsername] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch("https://gsppub.soccerverse.io/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "get_user_share_transactions",
          params: { name: username },
          id: 1,
        }),
      });
      const json = await res.json();
      setTransactions(json.result || []);
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => new Date(ts * 1000).toLocaleDateString();

  return (
    <div className="min-h-screen text-white py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center sm:text-left">
          Analyse des transactions
        </h1>
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            className="flex-1 rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
            disabled={loading || !username}
          >
            {loading ? "Chargement..." : "Rechercher"}
          </button>
        </form>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left py-1 pr-2">Nom</th>
                  <th className="text-left py-1 pr-2">Type</th>
                  <th className="text-left py-1 pr-2">Part</th>
                  <th className="text-right py-1 pr-2">Quantité</th>
                  <th className="text-left py-1 pr-2">Autre</th>
                  <th className="text-left py-1 pr-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="py-1 pr-2">{t.name}</td>
                    <td className="py-1 pr-2">{t.type}</td>
                    <td className="py-1 pr-2">{t.share?.type} {t.share?.id}</td>
                    <td className="py-1 pr-2 text-right">{t.num}</td>
                    <td className="py-1 pr-2">{t.other_name}</td>
                    <td className="py-1 pr-2">{formatDate(t.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          searched && !loading && (
            <div className="text-gray-400">Aucune transaction</div>
          )
        )}
      </div>
    </div>
  );
}

