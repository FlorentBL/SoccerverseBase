"use client";
import React, { useState, useMemo } from "react";
import { Info } from "lucide-react";

function formatSVC(val) {
  const isInt = Number.isInteger(val);
  return isInt
    ? val.toLocaleString("fr-FR")
    : val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const columns = [
  { key: "rating", label: "Note", tip: "Note globale" },
  { key: "wage", label: "Salaire" },
  { key: "infPay", label: "Prime Infl.", tip: "Prime influenceur (proportionnelle à la part détenue)" },
  { key: "starter", label: "Titulaire", tip: "Doit jouer au moins 45 min" },
  { key: "goal", label: "But" },
  { key: "assist", label: "Assist" },
  { key: "cleanSheet", label: "C.Sheet", tip: "Clean sheet : Gardiens/défenseurs, min 70min" },
  { key: "agentWage", label: "Agent", tip: "Rémun. agent (par match)" }
];

export default function SVCRewardsTable({ data }) {
  const [minRating, setMinRating] = useState(50);
  const [maxRating, setMaxRating] = useState(99);

  const filtered = useMemo(
    () => data.filter(row => row.rating >= minRating && row.rating <= maxRating),
    [data, minRating, maxRating]
  );

  return (
    <div className="bg-[#181c23] rounded-2xl shadow-2xl overflow-x-auto py-10 px-4 sm:px-14 max-w-full">
      {/* Filtres */}
      <div className="flex flex-wrap gap-7 mb-5 justify-center items-end">
        <label className="flex flex-col items-center text-base text-gray-200 font-semibold">
          Note min.
          <input
            type="number"
            min={50}
            max={99}
            value={minRating}
            onChange={e => setMinRating(Math.min(99, Math.max(50, +e.target.value)))}
            className="bg-[#101217] text-white rounded-md px-3 py-2 w-20 mt-1 text-center border border-gray-700 font-bold focus:ring-2 focus:ring-green-400 outline-none transition"
          />
        </label>
        <label className="flex flex-col items-center text-base text-gray-200 font-semibold">
          Note max.
          <input
            type="number"
            min={50}
            max={99}
            value={maxRating}
            onChange={e => setMaxRating(Math.max(50, Math.min(99, +e.target.value)))}
            className="bg-[#101217] text-white rounded-md px-3 py-2 w-20 mt-1 text-center border border-gray-700 font-bold focus:ring-2 focus:ring-green-400 outline-none transition"
          />
        </label>
      </div>

      {/* Rappel unité */}
      <div className="text-sm text-green-400 font-semibold mb-4 text-center">
        Toutes les valeurs du tableau sont exprimées en SVC (Soccerverse Coin)
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[1100px] text-center text-[17px] font-medium">
          <thead>
            <tr className="bg-[#23282f] text-white">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 font-bold whitespace-nowrap text-[15px] border-b-2 border-[#262b32]"
                  style={{ position: "relative" }}
                >
                  <div className="flex items-center justify-center gap-1">
                    {col.label}
                    {col.tip && (
                      <span className="group relative cursor-pointer">
                        <Info size={15} className="text-green-400" />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none bg-black bg-opacity-90 text-gray-200 text-xs rounded shadow-md px-2 py-1 z-10 whitespace-nowrap transition-opacity">
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
              <tr
                key={row.rating}
                className="border-b border-[#23282f] hover:bg-[#232a34] transition"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-2 whitespace-nowrap ${col.key === "rating" ? "font-bold text-green-300" : ""}`}
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
      </div>

      <div className="text-xs text-gray-400 mt-6 space-y-1 px-1 text-center">
        <div>
          <b>Titulaire :</b> doit jouer au moins 45 minutes. <br />
          <b>Clean Sheet :</b> seulement pour gardiens/défenseurs ayant joué au moins 70 min, aucun but encaissé.<br />
          <b>Prime Influenceur :</b> proportionnelle à la part détenue.<br />
          <b>Rémunération Agent :</b> versée à chaque match joué.
        </div>
      </div>
    </div>
  );
}
