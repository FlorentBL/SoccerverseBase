"use client";

import React, { useState } from "react";

const FIELDS = [
  "id", "f", "s"
];

export default function RinconMappingGenerator() {
  const [status, setStatus] = useState("");
  const [count, setCount] = useState(0);

  async function handleGenerate() {
    setStatus("Téléchargement du JSON Soccerverse...");
    setCount(0);
    try {
      const resp = await fetch("https://elrincondeldt.com/sv/rincon_v1.json");
      const raw = await resp.json();
      const arr = raw.PackData.PlayerData.P; // *** Adapté ***
      setStatus(`Parsing : ${arr.length} joueurs reçus...`);

      const mapping = {};
      let skipped = 0;

      for (const p of arr) {
        if (!p || p.id == null) { skipped++; continue; }
        // Création de l'objet optimisé
        const optimized = {};
        for (const k of FIELDS) {
          if (Object.prototype.hasOwnProperty.call(p, k)) {
            optimized[k] = p[k];
          }
        }
        // Ajoute un champ nom complet lisible
        optimized.name = `${p.f ?? ""} ${p.s ?? ""}`.trim();
        mapping[String(p.id)] = optimized;
      }

      setStatus(`Mapping créé (${Object.keys(mapping).length} joueurs, ${skipped} ignorés). Génération du fichier...`);
      setCount(Object.keys(mapping).length);

      // Génération du blob JSON et téléchargement
      const blob = new Blob([JSON.stringify(mapping)], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "rincon_mapping.json";
      document.body.appendChild(link);
      link.click();
      setStatus("✅ Fichier téléchargé ! Place-le dans /public/ ou /data de ton projet.");
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      setStatus("❌ Erreur : " + e.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#181c21] text-gray-100">
      <div className="bg-[#21252b] p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center">
        <h2 className="mb-5 font-extrabold text-2xl text-blue-400 tracking-wide text-center">
          Générer le mapping Soccerverse <span className="text-green-400">optimisé</span>
        </h2>
        <p className="mb-4 text-gray-300 text-center text-base">
          Cet outil va télécharger le JSON complet puis créer et télécharger un mapping ultra-rapide pour le front.<br />
          <span className="text-yellow-300">Le mapping ne garde que les champs vraiment utiles pour le site.</span>
        </p>
        <button
          onClick={handleGenerate}
          className="bg-gradient-to-r from-blue-500 to-green-500 hover:opacity-90 transition text-white font-bold py-3 px-10 rounded-xl mb-4 shadow-lg"
        >
          Générer et Télécharger
        </button>
        <div className="min-h-[28px] text-base">{status}</div>
        {count > 0 && (
          <div className="mt-4 text-green-300 font-mono">
            Joueurs exportés : {count}
          </div>
        )}
        <div className="text-xs mt-6 text-gray-400 text-center">
          Code source optimisé.<br />
          Tu peux adapter les champs gardés dans la variable <span className="font-bold text-blue-300">FIELDS</span> en haut du fichier.
        </div>
      </div>
    </div>
  );
}
