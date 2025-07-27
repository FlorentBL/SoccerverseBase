// app/recompenses/page.js
"use client";

import React, { useState } from "react";

const multipliers = {
  diamond: 1.0,
  platinum: 0.7,
  gold: 0.5,
  silver: 0.3,
  bronze: 0.15,
  iron: 0.05,
  stone: 0.01,
};

const baseReward = 1000;

export default function RecompensesPage() {
  const [division, setDivision] = useState("diamond");
  const [position, setPosition] = useState(1);
  const [participants, setParticipants] = useState(20);

  const calculateReward = () => {
    if (!position || !participants || position < 1 || position > participants) return 0;
    const ratio = (participants - position + 1) / participants;
    const mult = multipliers[division] || 0;
    return (baseReward * mult * ratio).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-center">Calculateur de Récompenses</h1>

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block mb-1 font-medium">Division</label>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          >
            <option value="diamond">Diamant</option>
            <option value="platinum">Platine</option>
            <option value="gold">Or</option>
            <option value="silver">Argent</option>
            <option value="bronze">Bronze</option>
            <option value="iron">Fer</option>
            <option value="stone">Pierre</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Position finale</label>
          <input
            type="number"
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            min={1}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Nombre de clubs dans la division</label>
          <input
            type="number"
            value={participants}
            onChange={(e) => setParticipants(parseInt(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            min={1}
          />
        </div>

        <div className="mt-6 bg-gray-700 rounded p-4 text-center">
          <p className="text-sm text-gray-300">Récompense estimée :</p>
          <p className="text-2xl font-bold text-blue-400">{calculateReward()} $SOC</p>
        </div>
      </div>
    </div>
  );
}