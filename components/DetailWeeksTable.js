import React from "react";
import { FIELD_ORDER, FIELD_LABELS, COST_FIELDS, formatSVC, formatDate } from "./utils";

export default function DetailWeeksTable({ weeks, title }) {
  return (
    <div className="bg-[#1e2130] rounded-xl shadow-sm p-4 text-xs border border-[#2c2f45] mb-6">

      {title && <h3 className="font-bold mb-3 text-gray-200">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-[#363a57] text-xs text-gray-100">
          <thead className="bg-[#202330]">
            <tr>
              <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">Week</th>
              <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">Date</th>
              {FIELD_ORDER.map(k => (
                <th key={k} className="px-2 py-1 border-b border-[#363a57] font-semibold text-gray-300">{FIELD_LABELS[k] || k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i} className={i % 2 ? "bg-[#222436]" : "bg-[#1b1e29]"}>
                <td className="px-2 py-1 border-b border-[#363a57]">{w.game_week || i + 1}</td>
                <td className="px-2 py-1 border-b border-[#363a57]">{formatDate(w.date)}</td>
                {FIELD_ORDER.map(k => (
                  <td
                    key={k}
                    className={
                      "px-2 py-1 border-b border-[#363a57] text-right font-mono " +
                      (COST_FIELDS.includes(k) && w[k] !== 0 ? "text-red-400" : "")
                    }
                  >
                    {formatSVC(w[k] ?? 0, k)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
