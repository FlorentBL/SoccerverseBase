"use client";

import { useEffect, useState } from "react";

async function fetchJson(body) {
  const res = await fetch("https://gsppub.soccerverse.io/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function getRatingAt(history, ts) {
  let rating = null;
  for (const entry of history) {
    if (entry.date_updated <= ts) {
      rating = entry.rating;
    } else {
      break;
    }
  }
  return rating;
}

export default function TransferHistoryPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const seasons = [1, 2];
      let allTransfers = [];

      for (const season of seasons) {
        const json = await fetchJson({
          jsonrpc: "2.0",
          method: "get_all_transfer_history",
          params: { season_id: season },
          id: 1,
        });
        if (json?.result?.data) {
          allTransfers.push(...json.result.data);
        }
      }

      const playerIds = Array.from(new Set(allTransfers.map((t) => t.player_id)));
      const ratingMap = {};
      await Promise.all(
        playerIds.map(async (id) => {
          const json = await fetchJson({
            jsonrpc: "2.0",
            method: "get_player_rating_history",
            params: { player_id: id },
            id: 1,
          });
          ratingMap[id] = json?.result?.data || [];
        })
      );

      const withRatings = allTransfers.map((t) => ({
        ...t,
        rating: getRatingAt(ratingMap[t.player_id] || [], t.date),
      }));

      setTransfers(withRatings);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Historique des transferts</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Joueur</th>
              <th className="p-2">Montant</th>
              <th className="p-2">Club →</th>
              <th className="p-2">Club ←</th>
              <th className="p-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-100">
                <td className="p-2">{new Date(t.date * 1000).toLocaleDateString()}</td>
                <td className="p-2">{t.player_id}</td>
                <td className="p-2">{(t.amount / 1e8).toFixed(2)}M</td>
                <td className="p-2">{t.club_id_from}</td>
                <td className="p-2">{t.club_id_to}</td>
                <td className="p-2">{t.rating ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

