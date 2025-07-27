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

  const allRewards = useMemo(() => {
    if (!participants || totalPrize <= 0) return [];
    return Array.from({ length: participants }, (_, i) => {
      const r = i + 1;
      const pct = (participants - r + 1) / sum;
      return {
        rank: r,
        amount: (totalPrize * pct).toFixed(2),
      };
    });
  }, [participants, totalPrize, sum]);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6 text-center">Calculateur de Récompenses – Soccerverse</h1>

      <div className="w-full max-w-lg bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
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
          <label className="block mb-1 font-medium">Classement final</label>
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
          <p className="text-2xl font-bold text-blue-400">
            {reward !== null ? `${reward} $SVC` : "--"}
          </p>
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-8 text-center max-w-md">
        Le calcul est basé sur une répartition linéaire décroissante d'une cagnotte totale :
        le 1er reçoit la plus grande part, et le dernier la plus petite, proportionnellement à son classement.
      </p>

      {allRewards.length > 0 && (
        <div className="mt-10 w-full max-w-md overflow-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Récompenses complètes</h2>
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-2">Classement</th>
                <th className="px-4 py-2">Montant ($SVC)</th>
              </tr>
            </thead>
            <tbody>
              {allRewards.map((entry) => (
                <tr key={entry.rank} className="border-b border-gray-600">
                  <td className="px-4 py-2">{entry.rank}</td>
                  <td className="px-4 py-2">{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
