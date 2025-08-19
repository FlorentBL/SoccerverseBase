// app/transactions/page.jsx
"use client";
import React, { useEffect, useState } from "react";

export default function TransactionAnalysis() {
  const [username, setUsername] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});
  const suggestions = [
    "SoccerversePortugal",
    "paul90c",
    "NachoHeras",
    "Luucasmb",
  ];

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const [clubRes, playerRes] = await Promise.all([
          fetch("/club_mapping.json"),
          fetch("/player_mapping.json"),
        ]);
        const [clubData, playerData] = await Promise.all([
          clubRes.json(),
          playerRes.json(),
        ]);
        setClubMap(clubData);
        setPlayerMap(playerData);
      } catch {
        /* ignore mapping errors */
      }
    };
    loadMaps();
  }, []);

  const handleSubmit = async (e, nameArg) => {
    e?.preventDefault();
    const searchName = nameArg ?? username;
    if (!searchName.trim()) return;
    setUsername(searchName);
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchName.trim() }),
      });

      if (!res.ok) {
        const maybeJson = await res.json().catch(() => ({}));
        const msg =
          maybeJson?.error?.message ||
          maybeJson?.error ||
          `Erreur serveur (${res.status})`;
        throw new Error(msg);
      }

      const json = await res.json();
      setTransactions(Array.isArray(json.result) ? json.result : []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts && ts !== 0) return "-";
    const d = new Date(Number(ts) * 1000);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("fr-FR");
  };

  const getClubName = (id) => clubMap[id]?.name || clubMap[id]?.n || String(id);
  const getPlayerName = (id) => {
    const p = playerMap[id];
    if (!p) return String(id);
    return p.name || [p.f, p.s].filter(Boolean).join(" ");
  };
  const renderUser = (name) => {
    if (!name) return "-";
    const href = `https://play.soccerverse.com/profile/${name}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:underline"
      >
        {name}
      </a>
    );
  };
  const renderShare = (share) => {
    if (!share || !share.id) return "-";
    let label = share.id;
    let link = "";
    let prefix = "";
    if (share.type === "club") {
      label = getClubName(share.id);
      link = `https://play.soccerverse.com/club/${share.id}`;
      prefix = "Club";
    } else if (share.type === "player") {
      label = getPlayerName(share.id);
      link = `https://play.soccerverse.com/player/${share.id}`;
      prefix = "Joueur";
    } else if (share.type === "user") {
      label = share.id;
      link = `https://play.soccerverse.com/profile/${share.id}`;
      prefix = "Utilisateur";
    }
    return (
      <div>
        {prefix && <span className="mr-1">{prefix}:</span>}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            {label}
          </a>
        ) : (
          label
        )}
      </div>
    );
  };

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
            disabled={loading || !username.trim()}
          >
            {loading ? "Chargement..." : "Rechercher"}
          </button>
        </form>

        <div className="mb-6">
          <p className="mb-2 text-sm text-gray-300">Suggestions :</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSubmit(null, s)}
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-red-400 mb-4">{error}</div>}

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="text-left py-2 pr-2">Nom</th>
                    <th className="text-left py-2 pr-2">Type</th>
                    <th className="text-left py-2 pr-2">Part</th>
                    <th className="text-right py-2 pr-2">Quantité</th>
                    <th className="text-left py-2 pr-2">Autre</th>
                    <th className="text-left py-2 pr-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {transactions.map((t, i) => (
                    <tr
                      key={`${t.name}-${t?.share?.type}-${t?.share?.id}-${t.date}-${i}`}
                      className="hover:bg-white/5"
                    >
                      <td className="py-2 pr-2">{renderUser(t?.name)}</td>
                      <td className="py-2 pr-2">{t?.type ?? "-"}</td>
                      <td className="py-2 pr-2">{renderShare(t?.share)}</td>
                      <td className="py-2 pr-2 text-right">{t?.num ?? "-"}</td>
                      <td className="py-2 pr-2">{renderUser(t?.other_name)}</td>
                      <td className="py-2 pr-2">{formatDate(t?.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          searched && !loading && <div className="text-gray-400">Aucune transaction</div>
        )}
      </div>
    </div>
  );
}
