// app/recompenses/page.js
"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";

export default function RecompensesPage() {
  const [totalPrize, setTotalPrize] = useState(0);
  const [participants, setParticipants] = useState(20);
  const [rank, setRank] = useState(1);
  const [clubOwnership, setClubOwnership] = useState(0);
  const [playerShares, setPlayerShares] = useState(0);
  const [rating, setRating] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // Calculate prize distribution for every position
  const prizes = useMemo(() => {
    if (participants < 1 || totalPrize <= 0) return [];

    const equalPrize = (totalPrize * 0.5) / participants;
    const linearPool = totalPrize * 0.5;
    const result = [];

    for (let i = 1; i <= participants; i++) {
      const equal = 100 / participants;
      let percdue = (participants - i) * equal;
      let potperc = ((percdue * 256) / 100) * (2 * equal);

      if (potperc === 0) {
        percdue = 100 - (participants - 1) * equal;
        potperc = ((percdue * 256) / 100) * (2 * equal);
      }

      const linearPrize = ((potperc / 100) * linearPool) / 256;
      const total = equalPrize + linearPrize;

      result.push({
        position: i,
        percent: (total / totalPrize) * 100,
        prize: total,
      });
    }

    return result;
  }, [participants, totalPrize]);

  const teamPrize = useMemo(() => {
    if (rank < 1 || rank > participants) return 0;
    return prizes[rank - 1]?.prize || 0;
  }, [prizes, rank, participants]);

  const shareholderEarnings = useMemo(() => {
    return teamPrize * 0.1 * (clubOwnership / 100);
  }, [teamPrize, clubOwnership]);

  const influencePercent = useMemo(() => {
    if (rating === 0 || minutes === 0) return 0;
    return Math.min(1, (rating / 100) * (minutes / 3420));
  }, [rating, minutes]);

  const playerEarnings = useMemo(() => {
    const base = teamPrize * 0.001 * influencePercent;
    return base * (playerShares / 100);
  }, [teamPrize, influencePercent, playerShares]);

  const examplePayout = useMemo(() => {
    const base = teamPrize * 0.001 * (75 / 100) * (2700 / 3420);
    return base * 0.01;
  }, [teamPrize]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="py-12 px-4 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          Calculateur de Récompenses – Soccerverse
        </h1>

        <div className="w-full max-w-xl bg-gray-900 rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Nombre total d'équipes dans la ligue :</label>
            <input type="number" value={participants} onChange={(e) => setParticipants(parseInt(e.target.value))} min={1} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Cagnotte totale de la ligue ($SVC) :</label>
            <input type="number" value={totalPrize} onChange={(e) => setTotalPrize(parseFloat(e.target.value))} min={0} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Votre classement :</label>
            <input type="number" value={rank} onChange={(e) => setRank(parseInt(e.target.value))} min={1} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Pourcentage de propriété de votre club (%) :</label>
            <input type="number" value={clubOwnership} onChange={(e) => setClubOwnership(parseFloat(e.target.value))} min={0} max={100} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Pourcentage total de parts des joueurs (%) :</label>
            <input type="number" value={playerShares} onChange={(e) => setPlayerShares(parseFloat(e.target.value))} min={0} max={100} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Note du joueur (0–100) :</label>
            <input type="number" value={rating} onChange={(e) => setRating(parseInt(e.target.value))} min={0} max={100} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Minutes jouées cette saison :</label>
            <input type="number" value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value))} min={0} className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
        </div>

        <div className="bg-gray-900 p-6 mt-6 rounded-lg w-full max-w-xl">
          <h2 className="text-lg font-semibold mb-2">Résumé des Récompenses</h2>
          <p>
            <strong>Récompense brute estimée :</strong> {teamPrize.toLocaleString(undefined, { maximumFractionDigits: 0 })} $SVC
          </p>
          <p>
            <strong>Gains en tant que propriétaire :</strong> {shareholderEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })} $SVC
          </p>
          <p>
            <strong>Gains en tant que détenteur de parts de joueurs :</strong> {playerEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })} $SVC
          </p>
        </div>

        <div className="bg-gray-900 p-6 mt-6 rounded-lg w-full overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Répartition des prix</h3>
          <table className="w-full table-auto text-center">
            <thead>
              <tr>
                <th className="px-2 py-1">Position</th>
                <th className="px-2 py-1">% du total</th>
                <th className="px-2 py-1">Récompense ($SVC)</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((p) => (
                <tr key={p.position} className={p.position === rank ? "bg-teal-700" : ""}>
                  <td className="px-2 py-1">{p.position}</td>
                  <td className="px-2 py-1">{p.percent.toFixed(2)}%</td>
                  <td className="px-2 py-1">{Math.round(p.prize).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mt-8 max-w-xl text-sm">
          <p><strong>Note :</strong> La récompense par joueur est maintenant ajustée en fonction de sa note et du temps de jeu.</p>
          <p>Par exemple, un joueur avec une note de 100 et ayant joué tous les matchs touche le payout complet (0.1%).</p>
        </div>

        <div className="bg-gray-900 p-6 mt-6 rounded-lg w-full max-w-4xl">
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
                <td className="px-4 py-2">75</td>
                <td className="px-4 py-2">2700</td>
                <td className="px-4 py-2">1%</td>
                <td className="px-4 py-2">{examplePayout.toLocaleString(undefined, { maximumFractionDigits: 0 })} $SVC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}