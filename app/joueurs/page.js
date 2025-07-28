"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function InfosJoueursPage() {
  const [playerId, setPlayerId] = useState("");
  const [soccerverseData, setSoccerverseData] = useState(null);
  const [tmData, setTmData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchPlayerData(id) {
    setLoading(true);
    setError("");
    setSoccerverseData(null);
    setTmData(null);

    try {
      // 1. Récupérer nom joueur Soccerverse
      const resSV = await fetch(`https://services.soccerverse.com/api/players/${id}`);
      if (!resSV.ok) throw new Error("Joueur introuvable sur Soccerverse.");
      const dataSV = await resSV.json();
      setSoccerverseData(dataSV);

      // 2. Chercher sur Transfermarkt via le nom
      const name = dataSV.name;
      if (!name) throw new Error("Nom introuvable.");
      const resTMSearch = await fetch(`https://transfermarkt-api.fly.dev/players/search/${encodeURIComponent(name)}`);
      const dataTMSearch = await resTMSearch.json();

      // On prend le premier résultat ou on affiche une erreur si aucun
      if (!dataTMSearch.length) throw new Error("Joueur non trouvé sur Transfermarkt.");
      const tmId = dataTMSearch[0].id;
      const resTM = await fetch(`https://transfermarkt-api.fly.dev/players/${tmId}`);
      const dataTM = await resTM.json();
      setTmData(dataTM);

    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 pt-28 pb-16">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Infos Joueur Soccerverse</h1>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (playerId) fetchPlayerData(playerId);
          }}
          className="flex gap-2 mb-6"
        >
          <input
            type="number"
            placeholder="ID Soccerverse"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            className="w-full p-2 rounded text-black"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold"
          >
            Rechercher
          </button>
        </form>

        {loading && <div className="text-center text-gray-400">Chargement...</div>}
        {error && <div className="text-center text-red-400">{error}</div>}

        {playerId && (
          <div className="flex flex-col gap-4 mt-4">
            {/* Liens directs */}
            <div className="flex gap-4 justify-center mb-2">
              <Link
                href={`https://play.soccerverse.com/player/${playerId}`}
                className="underline text-blue-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                Page Soccerverse
              </Link>
              <Link
                href={`https://soccerratings.org/player/${playerId}`}
                className="underline text-blue-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                Soccerratings
              </Link>
            </div>

            {/* Bloc infos Soccerverse */}
            {soccerverseData && (
              <div className="bg-gray-800 rounded-xl p-4 shadow">
                <h2 className="font-bold text-xl mb-1">{soccerverseData.name}</h2>
                <div className="text-gray-300">
                  <div>Club: {soccerverseData.clubName || "?"}</div>
                  <div>Poste: {soccerverseData.position || "?"}</div>
                  <div>Âge: {soccerverseData.age || "?"}</div>
                  {/* Ajoute ici d'autres infos de l’API Soccerverse dispo */}
                </div>
              </div>
            )}

            {/* Bloc infos Transfermarkt */}
            {tmData && (
              <div className="bg-gray-900 rounded-xl p-4 shadow">
                <h2 className="font-bold text-lg mb-2">Infos Transfermarkt</h2>
                <div className="text-gray-300">
                  <div>Nom: {tmData.name}</div>
                  <div>Club: {tmData.club?.name}</div>
                  <div>Nationalité: {tmData.nationality}</div>
                  <div>Âge: {tmData.age}</div>
                  <div>Poste: {tmData.position}</div>
                  <div>Valeur marchande: {tmData.marketValue}</div>
                  {/* Ajoute ici tout ce qui te paraît utile depuis la réponse API */}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
