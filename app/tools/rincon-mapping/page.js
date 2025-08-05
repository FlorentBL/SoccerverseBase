"use client";
import React, { useState } from "react";

// Personnalise ici les champs à garder
const PLAYER_FIELDS = ["id", "f", "s"];
const CLUB_FIELDS = ["id", "n"];
const LEAGUE_FIELDS = ["id", "n"];

export default function SoccerverseMappingGenerator() {
  const [status, setStatus] = useState("");
  const [counts, setCounts] = useState({});

  async function handleGenerate() {
    setStatus("Téléchargement du JSON Soccerverse...");
    setCounts({});
    try {
      const resp = await fetch("https://elrincondeldt.com/sv/rincon_v1.json");
      const raw = await resp.json();

      // Extraction
      // 1. Joueurs
      const arrPlayers = raw.PackData.PlayerData.P || [];
      const playerMapping = {};
      for (const p of arrPlayers) {
        if (!p || p.id == null) continue;
        const obj = {};
        for (const k of PLAYER_FIELDS) if (k in p) obj[k] = p[k];
        obj.name = `${p.f ?? ""} ${p.s ?? ""}`.trim();
        playerMapping[String(p.id)] = obj;
      }

      // 2. Clubs
      const arrClubs = raw.PackData.ClubData.C || [];
      const clubMapping = {};
      for (const c of arrClubs) {
        if (!c || c.id == null) continue;
        const obj = {};
        for (const k of CLUB_FIELDS) if (k in c) obj[k] = c[k];
        obj.name = c.n ?? ""; // nom du club
        clubMapping[String(c.id)] = obj;
      }

      // 3. Ligues
      const arrLeagues = raw.PackData.LeagueData.L || [];
      const leagueMapping = {};
      for (const l of arrLeagues) {
        if (!l || l.id == null) continue;
        const obj = {};
        for (const k of LEAGUE_FIELDS) if (k in l) obj[k] = l[k];
        obj.name = l.n ?? ""; // nom de la ligue
        leagueMapping[String(l.id)] = obj;
      }

      // Génère les fichiers
      const download = (data, filename) => {
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1000);
      };

      download(playerMapping, "player_mapping.json");
      download(clubMapping, "club_mapping.json");
      download(leagueMapping, "league_mapping.json");

      setStatus("✅ Fichiers téléchargés ! Place-les dans /public/ ou /data de ton projet.");
      setCounts({
        joueurs: Object.keys(playerMapping).length,
        clubs: Object.keys(clubMapping).length,
        ligues: Object.keys(leagueMapping).length,
      });
    } catch (e) {
      setStatus("❌ Erreur : " + e.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-100">
      <div className="bg-[#21252b] p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center">
        <h2 className="mb-5 font-extrabold text-2xl text-blue-400 tracking-wide text-center">
          Générer les mappings Soccerverse <span className="text-green-400">optimisés</span>
        </h2>
        <p className="mb-4 text-gray-300 text-center text-base">
          Cet outil va télécharger le JSON Soccerverse complet, puis créer et télécharger automatiquement :<br />
          <span className="text-yellow-300">player_mapping.json, club_mapping.json, league_mapping.json</span>
        </p>
        <button
          onClick={handleGenerate}
          className="bg-gradient-to-r from-blue-500 to-green-500 hover:opacity-90 transition text-white font-bold py-3 px-10 rounded-xl mb-4 shadow-lg"
        >
          Générer et Télécharger
        </button>
        <div className="min-h-[28px] text-base">{status}</div>
        {(counts.joueurs || counts.clubs || counts.ligues) && (
          <div className="mt-4 text-green-300 font-mono">
            Joueurs : {counts.joueurs}<br />
            Clubs : {counts.clubs}<br />
            Ligues : {counts.ligues}
          </div>
        )}
        <div className="text-xs mt-6 text-gray-400 text-center">
          Tu peux adapter les champs à extraire dans <span className="font-bold text-blue-300">PLAYER_FIELDS</span>, <span className="font-bold text-green-300">CLUB_FIELDS</span>, <span className="font-bold text-pink-300">LEAGUE_FIELDS</span>.<br />
          Le champ <span className="font-bold">name</span> est ajouté pour affichage direct dans les tableaux.
        </div>
      </div>
    </div>
  );
}
