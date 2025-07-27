// app/recompenses/page.js
"use client";

import React, { useState, useMemo } from "react";

export default function RecompensesPage() {
  const [totalPrize, setTotalPrize] = useState(0);
  const [participants, setParticipants] = useState(20);
  const [rank, setRank] = useState(1);
  const [clubOwnership, setClubOwnership] = useState(0);
  const [playerShares, setPlayerShares] = useState(0);
  const [rating, setRating] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const basePrize = useMemo(() => {
    if (!rank || !participants || rank < 1 || rank > participants || totalPrize <= 0) return 0;
    const sum = (participants * (participants + 1)) / 2;
    const percentage = (participants - rank + 1) / sum;
    return totalPrize * percentage;
  }, [totalPrize, participants, rank]);

  const shareholderEarnings = useMemo(() => {
    return (basePrize * (clubOwnership / 100)).toFixed(2);
  }, [basePrize, clubOwnership]);

  const playerEarnings = useMemo(() => {
    return (basePrize * (playerShares / 100)).toFixed(2);
  }, [basePrize, playerShares]);

  const influencePercent = useMemo(() => {
    if (rating === 0 || minutes === 0) return 0;
    return Math.min(1, (rating / 100) * (minutes / 2700));
  }, [rating, minutes]);

  const payoutPlayer = useMemo(() => {
    return (basePrize * 0.001 * influencePercent).toFixed(2);
  }, [basePrize, influencePercent]);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        Calculateur de Récompenses – Soccerverse
      </h1>

      <div className="w-full max-w-xl bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block mb-1 font-medium">Nombre total d'équipes dans la ligue :</label>
          <input type="number" value={participants} onChange={(e) => setParticipants(parseInt(e.target.value))} min={1} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Cagnotte totale de la ligue ($SVC) :</label>
          <input type="number" value={totalPrize} onChange={(e) => setTotalPrize(parseFloat(e.target.value))} min={0} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Votre classement :</label>
          <input type="number" value={rank} onChange={(e) => setRank(parseInt(e.target.value))} min={1} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Pourcentage de propriété de votre club (%) :</label>
          <input type="number" value={clubOwnership} onChange={(e) => setClubOwnership(parseFloat(e.target.value))} min={0} max={100} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Pourcentage total de parts des joueurs (%) :</label>
          <input type="number" value={playerShares} onChange={(e) => setPlayerShares(parseFloat(e.target.value))} min={0} max={100} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Note du joueur (0–100) :</label>
          <input type="number" value={rating} onChange={(e) => setRating(parseInt(e.target.value))} min={0} max={100} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Minutes jouées cette saison :</label>
          <input type="number" value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value))} min={0} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
      </div>

      <div className="bg-gray-800 p-6 mt-6 rounded-lg w-full max-w-xl">
        <h2 className="text-lg font-semibold mb-2">Résumé des Récompenses</h2>
        <p><strong>Récompense brute estimée :</strong> {basePrize.toFixed(2)} $SVC</p>
        <p><strong>Gains en tant que propriétaire :</strong> {shareholderEarnings} $SVC</p>
        <p><strong>Gains en tant que détenteur de parts de joueurs :</strong> {playerEarnings} $SVC</p>
      </div>

      <div className="bg-yellow-100 text-yellow-800 p-4 rounded mt-8 max-w-xl text-sm">
        <p><strong>Note :</strong> La récompense par joueur est maintenant ajustée en fonction de sa note et du temps de jeu.</p>
        <p>Par exemple, un joueur avec une note de 100 et ayant joué tous les matchs touche le payout complet (0.1%).</p>
      </div>

      <div className="bg-gray-800 p-6 mt-6 rounded-lg w-full max-w-4xl">
        <h3 className="text-lg font-semibold mb-4">Exemple d'influence sur un joueur</h3>
        <table className="w-full table-auto text-left">
          <thead>
            <tr>
              <th className="px-4 py-2">Joueur</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2">Minutes jouées</th>
              <th className="px-4 py-2">% Influence</th>
              <th className="px-4 py-2">Payout ($SVC)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">Exemple</td>
              <td className="px-4 py-2">{rating}</td>
              <td className="px-4 py-2">{minutes}</td>
              <td className="px-4 py-2">{(influencePercent * 100).toFixed(1)}%</td>
              <td className="px-4 py-2">{payoutPlayer} $SVC</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}