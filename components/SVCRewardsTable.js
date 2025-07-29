// components/SVCRewardsTable.js
"use client";
import React, { useState, useMemo } from "react";
import { Info } from "lucide-react";

// Nouveau format, plus de "SVC" dans la case !
function formatSVC(val) {
  const isInt = Number.isInteger(val);
  return isInt
    ? val.toLocaleString("fr-FR")
    : val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const columns = [
  { key: "rating", label: "Note" },
  { key: "wage", label: "Salaire" },
  { key: "infPay", label: "Prime Influenceur", tip: "Proportionnelle à la part détenue sur le joueur." },
  { key: "starter", label: "Titulaire", tip: "Doit jouer au moins 45 minutes." },
  { key: "goal", label: "But" },
  { key: "assist", label: "Passe décisive" },
  { key: "cleanSheet", label: "Clean Sheet", tip: "Gardien/défenseur : min 70 min, aucun but encaissé." },
  { key: "agentWage", label: "Rémun. Agent", tip: "Par match joué, cumulable sur plusieurs joueurs." }
];

export default function SVCRewardsTable({ data }) {
  const [minRating, setMinRating] = useState(50);
  const [maxRating, setMaxRating] = useState(99);

  const filtered = useMemo(
    () => data.filter(row => row.rating >= minRating && row.rating <= maxRating),
    [data, minRating, maxRating]
  );

  return (
    <div className="bg-[#181c23] rounded-2xl shadow-xl overflow-x-auto py-6 px-2 sm:px-8">
      <div className="flex flex-wrap gap-4 mb-4 justify-center items-end">
        <label className="flex flex-col items-center text-sm text-gray-300">
          Note min.
          <input
            type="number"
            min={50}
            max={99}
            value={minRating}
            onChange={e => setMinRating(Math.min(99, Math.max(50, +e.target.value)))}
            className="bg-gray-900 text-white rounded px-2 py-1 w-16 mt-1 text-center border border-gray-700"
          />
        </label>
        <label className="flex flex-col items-center text-sm text-gray-300">
          Note max.
          <input
            type="number"
            min={50}
            max={99}
            value={maxRating}
            onChange={e => setMaxRating(Math.max(50, Math.min(99, +e.target.value)))}
            className="bg-gray-900 text-white rounded px-2 py-1 w-16 mt-1 text-center border border-gray-700"
          />
        </label>
      </div>

      {/* Ajout du rappel SVC ici */}
      <div className="text-sm text-green-400 font-semibold mb-2 text-center">
        Toutes les valeurs du tableau sont exprimées en SVC (Soccerverse Coin).
      </div>

      <table className="w-full text-center text-sm sm:text-base table-fixed">
        <thead>
          <tr className="bg-[#22272f] text-white">
            {columns.map(col => (
              <th key={col.key} className="px-1 py-2 font-semibold whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  {col.label}
                  {col.tip && (
                    <span className="group relative cursor-pointer">
                      <Info size={14} className="text-green-400" />
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none bg-gray-900 text-gray-200 text-xs rounded shadow-md px-2 py-1 z-10 whitespace-nowrap transition-opacity">
                        {col.tip}
                      </span>
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(row => (
            <tr key={row.rating} className="border-b border-gray-800 hover:bg-[#22272f]">
              {columns.map(col => (
                <td
                  key={col.key}
                  className="px-1 py-2 font-mono whitespace-nowrap"
                >
                  {col.key === "rating"
                    ? row[col.key]
                    : formatSVC(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-400 mt-5 space-y-1 px-1">
        <div>
          <b>Titulaire :</b> doit jouer au moins 45 minutes.<br />
          <b>Clean Sheet :</b> uniquement pour gardien/défenseur ayant joué au moins 70 min, aucun but encaissé.<br />
          <b>Prime Influenceur :</b> proportionnelle à la part détenue.<br />
          <b>Rémunération Agent :</b> versée à chaque match joué.
        </div>
      </div>
    </div>
  );
}
