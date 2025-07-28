// app/joueurs/page.js
"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function JoueursPage() {
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
      // 1. Soccerverse API: Récupérer infos joueur
      const resSV = await fetch(`https://services.soccerverse.com/api/players/${id}`);
      if (!resSV.ok) throw new Error("Joueur introuvable sur Soccerverse.");
      const dataSV = await resSV.json();
      setSoccerverseData(dataSV);

      // 2. Transfermarkt API: Chercher joueur via le nom
      const name = dataSV.name;
      if (!name) throw new Error("Nom introuvable.");
      const resTMSearch = await fetch(
        `https://transfermarkt-api.fly.dev/players/search/${encodeURIComponent(name)}`
      );
      const dataTMSearch = await resTMSearch.json();

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

        {/* Aperçu des liens externes */}
        <div className="flex gap-6 justify-center mb-8">
          {/* Carte Soccerverse */}
          <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center shadow min-w-[180px]">
            <img
              src="/soccerverse_logo.png"
              alt="Soccerverse"
              className="h-8 mb-2"
              style={{ filter: "drop-shadow(0 1px 2px #0008)" }}
            />
            <div className="font-semibold mb-1">Soccerverse</div>
            <Link
              href={`https://play.soccerverse.com/player/${playerId || 1}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir la fiche
            </Link>
            <span className="text-xs text-gray-400">ID : {playerId || "—"}</span>
          </div>
          {/* Carte Soccerratings */}
          <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center shadow min-w-[180px]">
            <img
              src="/soccerratings_logo.png"
              alt="SoccerRatings"
              className="h-8 mb-2"
              style={{ filter: "drop-shadow(0 1px 2px #0008)" }}
            />
            <div className="font-semibold mb-1">SoccerRatings</div>
            <Link
              href={`https://soccerratings.org/player/${playerId || 1}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir la fiche
            </Link>
            <span className="text-xs text-gray-400">ID : {playerId || "—"}</span>
          </div>
        </div>

        {/* Formulaire de recherche */}
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
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold"
          >
            Rechercher
          </button>
        </form>

        {/* Affichage des messages */}
        {loading && (
          <div className="text-center text-gray-400">Chargement…</div>
        )}
        {error && (
          <div className="text-center text-red-400 mb-4">{error}</div>
        )}

        {/* Affichage des infos */}
        {soccerverseData && (
          <div className="bg-gray-800 rounded-xl p-4 shadow mb-4">
            <h2 className="font-bold text-xl mb-1">{soccerverseData.name}</h2>
            <div className="text-gray-300">
              <div>Club : {soccerverseData.clubName || "?"}</div>
              <div>Poste : {soccerverseData.position || "?"}</div>
              <div>Âge : {soccerverseData.age || "?"}</div>
              {/* Ajoute ici d'autres champs Soccerverse si tu veux */}
            </div>
          </div>
        )}

        {tmData && (
          <div className="bg-gray-900 rounded-xl p-4 shadow mb-4">
            <h2 className="font-bold text-lg mb-2">Infos Transfermarkt</h2>
            <div className="text-gray-300">
              <div>Nom : {tmData.name || "?"}</div>
              <div>Club : {tmData.club?.name || "?"}</div>
              <div>Nationalité : {tmData.nationality || "?"}</div>
              <div>Âge : {tmData.age || "?"}</div>
              <div>Poste : {tmData.position || "?"}</div>
              <div>Valeur marchande : {tmData.marketValue || "?"}</div>
              {/* Ajoute ici tous les autres champs TM que tu veux */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
