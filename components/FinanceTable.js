import React from "react";
import { FIELD_ORDER, FIELD_LABELS, COST_FIELDS, formatSVC } from "./utils";

export default function FinanceTable({ bilan, weeks, isProj }) {
  return (
    <div className="bg-[#23263a] text-white rounded-xl shadow-lg p-5 mb-2 border border-gray-800">
      <table className="w-full text-base">
        <thead>
          <tr>
            <th className="py-1 pr-4 text-left text-gray-400 font-semibold">Flux</th>
            <th className="py-1 text-right text-gray-400 font-semibold">
              Montant {weeks && ("(" + (isProj ? "projection " : "total ") + weeks + " journées)")}
            </th>
          </tr>
        </thead>
        <tbody>
          {FIELD_ORDER.map(k =>
            <tr key={k} className="border-b border-[#2d3146] hover:bg-[#21262b] transition">
              <td className="py-1 pr-4 text-gray-200">{FIELD_LABELS[k] || k}</td>
              <td
                className={
                  "py-1 text-right font-mono " +
                  (COST_FIELDS.includes(k) && bilan[k] !== 0 ? "text-red-400 font-semibold" : "")
                }
              >
                {formatSVC(bilan[k] ?? 0, k)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
