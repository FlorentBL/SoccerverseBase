// app/recompenses/page.js
"use client";

import React, { useState, useMemo } from "react";

export default function RecompensesPage() {
  const [totalPrize, setTotalPrize] = useState(1000);
  const [participants, setParticipants] = useState(20);
  const [rank, setRank] = useState(1);

  const sum = useMemo(() => (participants * (participants + 1)) / 2, [participants]);

  const reward = useMemo(() => {
    if (!rank || !participants || rank < 1 || rank > participants || totalPrize <= 0) return null;
    const percentage = (participants - rank + 1) / sum;
    return (totalPrize * percentage).toFixed(2);
  }, [totalPrize, participants, rank, sum]);

  const fullRewards = useMemo(() => {
    if (participants <= 0 || totalPrize <= 0) return [];
    return Array.from({ length: participants }, (_, i) => {
      const r = i + 1;
      const percentage = (participants - r + 1) / sum;
      return {
        rank: r,
        reward: (totalPrize * percentage).toFixed(2),
      };
    });
  }, [totalPrize, participants, sum]);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-center">Calculateur de Récompenses – Soccerverse</h1>

      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-md p-6 mb-10 space-y-6">
        <div>
          <label className="block mb-1 font-medium">Cagnotte totale ($SVC)</label>
          <input
            type="number"
            value={totalPrize}
            onChange={(e) => setTotalPrize(parseFloat(e.target.value))}
            min={0}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Nombre total de clubs</label>
          <input
            type="number"
            value={participants}
            onChange={(e) => setParticipants(parseInt(e.target.value))}
            min={1}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Classement de votre club</label>
          <input
            type="number"
            value={rank}
            onChange={(e) => setRank(parseInt(e.target.value))}
            min={1}
            max={participants}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
        </div>

        <div className="bg-gray-700 p-4 rounded text-center">
          <p className="text-sm text-gray-300">Récompense estimée :</p>
          <p className="text-2xl font-bold text-green-400">
            {reward !== null ? `${reward} $SVC` : "--"}
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Tableau complet des récompenses</h2>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full bg-gray-800 border border-gray-700 text-sm">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-2 text-left border-b border-gray-600">Classement</th>
                <th className="px-4 py-2 text-right border-b border-gray-600">Récompense ($SVC)</th>
              </tr>
            </thead>
            <tbody>
              {fullRewards.map((row) => (
                <tr key={row.rank} className="odd:bg-gray-800 even:bg-gray-700">
                  <td className="px-4 py-2 border-b border-gray-600">{row.rank}</td>
                  <td className="px-4 py-2 border-b border-gray-600 text-right">{row.reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-10 text-center max-w-2xl">
        Ce calcul est basé sur une répartition linéaire décroissante de la cagnotte totale. Le premier reçoit la plus grande part, et chaque rang suivant un peu moins, jusqu'au dernier.
      </p>
    </div>
  );
}