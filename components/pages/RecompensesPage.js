"use client";
import React, { useState, useMemo } from "react";

const LABELS = {
  fr: {
    title: "Calculateur de Récompenses – Soccerverse",
    totalTeams: "Nombre total d'équipes dans la ligue :",
    totalPrize: "Cagnotte totale de la ligue ($SVC) :",
    rank: "Votre classement :",
    clubOwnership: "Pourcentage de propriété de votre club (%) :",
    playerShares: "Pourcentage total de parts des joueurs (%) :",
    rating: "Note du joueur (0–100) :",
    minutes: "Minutes jouées cette saison :",
    summary: "Résumé des Récompenses",
    baseReward: "Récompense brute estimée :",
    ownerEarnings: "Gains en tant que propriétaire :",
    playerEarnings: "Gains en tant que détenteur de parts de joueurs :",
    noteLabel: "Note :",
    noteText:
      "La récompense par joueur est maintenant ajustée en fonction de sa note et du temps de jeu.",
    noteExample:
      "Par exemple, un joueur avec une note de 100 et ayant joué tous les matchs touche le payout complet (0.1%).",
    exampleTitle: "Exemple d'influence sur un joueur",
    columns: {
      player: "Joueur",
      rating: "Note",
      minutes: "Minutes jouées",
      influence: "% Influence",
      payout: "Payout ($SVC)",
    },
  },
  en: {
    title: "Rewards Calculator – Soccerverse",
    totalTeams: "Total number of teams in the league:",
    totalPrize: "Total league prize pool ($SVC):",
    rank: "Your rank:",
    clubOwnership: "Your club ownership percentage (%):",
    playerShares: "Total player share percentage (%):",
    rating: "Player rating (0–100):",
    minutes: "Minutes played this season:",
    summary: "Rewards Summary",
    baseReward: "Estimated base reward:",
    ownerEarnings: "Earnings as owner:",
    playerEarnings: "Earnings as player shareholder:",
    noteLabel: "Note:",
    noteText:
      "The reward per player is now adjusted according to rating and playing time.",
    noteExample:
      "For example, a player with a rating of 100 who played every match receives the full payout (0.1%).",
    exampleTitle: "Example of influence on a player",
    columns: {
      player: "Player",
      rating: "Rating",
      minutes: "Minutes played",
      influence: "% Influence",
      payout: "Payout ($SVC)",
    },
  },
  it: {
    title: "Calcolatore di Ricompense – Soccerverse",
    totalTeams: "Numero totale di squadre nella lega:",
    totalPrize: "Montepremi totale della lega ($SVC):",
    rank: "La tua posizione in classifica:",
    clubOwnership: "Percentuale di proprietà del tuo club (%):",
    playerShares: "Percentuale totale di quote dei giocatori (%):",
    rating: "Valutazione del giocatore (0–100):",
    minutes: "Minuti giocati in questa stagione:",
    summary: "Riepilogo Ricompense",
    baseReward: "Ricompensa base stimata:",
    ownerEarnings: "Guadagni come proprietario:",
    playerEarnings: "Guadagni come azionista dei giocatori:",
    noteLabel: "Nota:",
    noteText:
      "La ricompensa per giocatore è ora adeguata in base alla valutazione e al tempo di gioco.",
    noteExample:
      "Ad esempio, un giocatore con valutazione 100 che ha giocato tutte le partite riceve il payout completo (0,1%).",
    exampleTitle: "Esempio di influenza su un giocatore",
    columns: {
      player: "Giocatore",
      rating: "Valutazione",
      minutes: "Minuti giocati",
      influence: "% Influenza",
      payout: "Payout ($SVC)",
    },
  },
};

export default function RecompensesPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
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
    <div className="min-h-screen text-gray-100">
      <div className="py-12 px-4 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t.title}</h1>

        <div className="w-full max-w-xl bg-gray-900 rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">{t.totalTeams}</label>
            <input
              type="number"
              value={participants}
              onChange={(e) => setParticipants(parseInt(e.target.value))}
              min={1}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{t.totalPrize}</label>
            <input
              type="number"
              value={totalPrize}
              onChange={(e) => setTotalPrize(parseFloat(e.target.value))}
              min={0}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{t.rank}</label>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(parseInt(e.target.value))}
              min={1}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{t.clubOwnership}</label>
            <input
              type="number"
              value={clubOwnership}
              onChange={(e) => setClubOwnership(parseFloat(e.target.value))}
              min={0}
              max={100}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{t.playerShares}</label>
            <input
              type="number"
              value={playerShares}
              onChange={(e) => setPlayerShares(parseFloat(e.target.value))}
              min={0}
              max={100}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{t.rating}</label>
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              min={0}
              max={100}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{t.minutes}</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value))}
              min={0}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
        </div>

        <div className="bg-gray-900 p-6 mt-6 rounded-lg w-full max-w-xl">
          <h2 className="text-lg font-semibold mb-2">{t.summary}</h2>
          <p>
            <strong>{t.baseReward}</strong> {basePrize.toFixed(2)} $SVC
          </p>
          <p>
            <strong>{t.ownerEarnings}</strong> {shareholderEarnings} $SVC
          </p>
          <p>
            <strong>{t.playerEarnings}</strong> {playerEarnings} $SVC
          </p>
        </div>

        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mt-8 max-w-xl text-sm">
          <p>
            <strong>{t.noteLabel}</strong> {t.noteText}
          </p>
          <p>{t.noteExample}</p>
        </div>

        <div className="bg-gray-900 p-6 mt-6 rounded-lg w-full max-w-4xl">
          <h3 className="text-lg font-semibold mb-4">{t.exampleTitle}</h3>
          <table className="w-full table-auto text-left">
            <thead>
              <tr>
                <th className="px-4 py-2">{t.columns.player}</th>
                <th className="px-4 py-2">{t.columns.rating}</th>
                <th className="px-4 py-2">{t.columns.minutes}</th>
                <th className="px-4 py-2">{t.columns.influence}</th>
                <th className="px-4 py-2">{t.columns.payout}</th>
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
    </div>
  );
}

