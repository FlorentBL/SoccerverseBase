import React from "react";
import { FIELD_ORDER, FIELD_LABELS, COST_FIELDS, formatSVC } from "./utils";

const TABLE_LABELS = {
  fr: { flux: "Flux", amount: "Montant", total: "total ", projection: "projection ", days: "journées" },
  en: { flux: "Flow", amount: "Amount", total: "total ", projection: "projection ", days: "days" },
  it: { flux: "Flusso", amount: "Importo", total: "totale ", projection: "proiezione ", days: "giornate" },
  es: { flux: "Flujo", amount: "Monto", total: "total ", projection: "proyección ", days: "jornadas" }
};

export default function FinanceTable({ bilan, weeks, isProj, lang = "fr" }) {
  const t = TABLE_LABELS[lang] || TABLE_LABELS.fr;
  return (
    <div className="bg-[#23263a] text-white rounded-xl shadow-lg p-5 mb-2 border border-gray-800">
      <table className="w-full text-base">
        <thead>
          <tr>
            <th className="py-1 pr-4 text-left text-gray-400 font-semibold">{t.flux}</th>
            <th className="py-1 text-right text-gray-400 font-semibold">
              {t.amount}
              {weeks && (
                " (" +
                (isProj ? t.projection : t.total) +
                weeks +
                " " +
                t.days +
                ")"
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {FIELD_ORDER.map(k => (
            <tr key={k} className="border-b border-[#2d3146] hover:bg-[#21262b] transition">
              <td className="py-1 pr-4 text-gray-200">{FIELD_LABELS[lang][k] || FIELD_LABELS.fr[k] || k}</td>
              <td
                className={
                  "py-1 text-right font-mono " +
                  (COST_FIELDS.includes(k) && bilan[k] !== 0 ? "text-red-400 font-semibold" : "")
                }
              >
                {formatSVC(bilan[k] ?? 0, k, lang)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
