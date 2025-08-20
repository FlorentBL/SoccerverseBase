"use client";
import React, { useState, useMemo } from "react";
import { Info } from "lucide-react";
import Tooltip from "@/components/Tooltip";

// LABELS multilingues (tableau)
const LABELS = {
  fr: {
    columns: [
      { key: "rating", label: "Note", tip: "Note globale" },
      { key: "wage", label: "Salaire" },
      { key: "infPay", label: "Prime Infl.", tip: "Prime influenceur (proportionnelle à la part détenue)" },
      { key: "starter", label: "Titulaire", tip: "Doit jouer au moins 45 min" },
      { key: "goal", label: "But" },
      { key: "assist", label: "Assist" },
      { key: "cleanSheet", label: "C.Sheet", tip: "Clean sheet : Gardiens/défenseurs, min 70min" },
      { key: "agentWage", label: "Agent", tip: "Rémun. agent (par match)" }
    ],
    noteMin: "Note min.",
    noteMax: "Note max.",
    allSVC: "Toutes les valeurs du tableau sont exprimées en SVC (Soccerverse Coin)",
    scroll: "↔️ Faites défiler le tableau horizontalement",
    legend: <>
      <b>Titulaire :</b> doit jouer au moins 45 minutes. <br />
      <b>Clean Sheet :</b> seulement pour gardiens/défenseurs ayant joué au moins 70 min, aucun but encaissé.<br />
      <b>Prime Influenceur :</b> proportionnelle à la part détenue.<br />
      <b>Rémunération Agent :</b> versée à chaque match joué.
    </>
  },
  en: {
    columns: [
      { key: "rating", label: "Rating", tip: "Overall rating" },
      { key: "wage", label: "Salary" },
      { key: "infPay", label: "Influencer bonus", tip: "Influencer bonus (proportional to your share)" },
      { key: "starter", label: "Starter", tip: "Must play at least 45 min" },
      { key: "goal", label: "Goal" },
      { key: "assist", label: "Assist" },
      { key: "cleanSheet", label: "C.Sheet", tip: "Clean sheet: GK/DEF, min 70 min" },
      { key: "agentWage", label: "Agent", tip: "Agent reward (per match)" }
    ],
    noteMin: "Min rating",
    noteMax: "Max rating",
    allSVC: "All values in the table are shown in SVC (Soccerverse Coin)",
    scroll: "↔️ Scroll table horizontally",
    legend: <>
      <b>Starter:</b> must play at least 45 minutes. <br />
      <b>Clean Sheet:</b> only for GK/DEF with at least 70 min played and 0 goals conceded.<br />
      <b>Influencer bonus:</b> proportional to your share.<br />
      <b>Agent reward:</b> paid for every match played.
    </>
  },
  it: {
    columns: [
      { key: "rating", label: "Valutazione", tip: "Valutazione globale" },
      { key: "wage", label: "Stipendio" },
      { key: "infPay", label: "Bonus Influencer", tip: "Bonus influencer (proporzionale alla quota posseduta)" },
      { key: "starter", label: "Titolare", tip: "Deve giocare almeno 45 min" },
      { key: "goal", label: "Gol" },
      { key: "assist", label: "Assist" },
      { key: "cleanSheet", label: "C.Sheet", tip: "Clean sheet: portieri/difensori, almeno 70min" },
      { key: "agentWage", label: "Agente", tip: "Compenso agente (per partita)" }
    ],
    noteMin: "Valutazione min.",
    noteMax: "Valutazione max.",
    allSVC: "Tutti i valori della tabella sono espressi in SVC (Soccerverse Coin)",
    scroll: "↔️ Scorri la tabella orizzontalmente",
    legend: <>
      <b>Titolare:</b> deve giocare almeno 45 minuti. <br />
      <b>Clean Sheet:</b> solo per portieri/difensori con almeno 70 min e 0 gol subiti.<br />
      <b>Bonus influencer:</b> proporzionale alla quota.<br />
      <b>Compenso agente:</b> versato ogni partita giocata.
    </>
  },
  es: {
    columns: [
      { key: "rating", label: "Nota", tip: "Nota global" },
      { key: "wage", label: "Salario" },
      { key: "infPay", label: "Prima Influencer", tip: "Prima de influencer (proporcional a la parte poseída)" },
      { key: "starter", label: "Titular", tip: "Debe jugar al menos 45 min" },
      { key: "goal", label: "Gol" },
      { key: "assist", label: "Asistencia" },
      { key: "cleanSheet", label: "C.Sheet", tip: "Portería a cero: porteros/defensores, mín 70 min" },
      { key: "agentWage", label: "Agente", tip: "Pago al agente (por partido)" }
    ],
    noteMin: "Nota mín.",
    noteMax: "Nota máx.",
    allSVC: "Todos los valores de la tabla se expresan en SVC (Soccerverse Coin)",
    scroll: "↔️ Desplaza la tabla horizontalmente",
    legend: <>
      <b>Titular:</b> debe jugar al menos 45 minutos. <br />
      <b>Portería a cero:</b> solo para porteros/defensores con al menos 70 min y 0 goles en contra.<br />
      <b>Prima de influencer:</b> proporcional a la parte poseída.<br />
      <b>Pago al agente:</b> se paga por cada partido jugado.
    </>
  }
};

function formatSVC(val, lang) {
  // Format selon la langue, FR/IT: virgule, EN: point
  if (lang === "en") {
    return Number(val).toLocaleString("en-US", { minimumFractionDigits: 0 });
  } else if (lang === "it") {
    return Number(val).toLocaleString("it-IT", { minimumFractionDigits: 0 });
  } else {
    return Number(val).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
  }
}

export default function SVCRewardsTable({ data, lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  const [minRating, setMinRating] = useState(50);
  const [maxRating, setMaxRating] = useState(99);

  const filtered = useMemo(
    () => data.filter(row => row.rating >= minRating && row.rating <= maxRating),
    [data, minRating, maxRating]
  );

  return (
    <div className="bg-[#181c23] rounded-2xl shadow-2xl overflow-x-auto py-7 px-2 sm:px-14 max-w-full">
      {/* Filtres */}
      <div className="flex flex-wrap gap-5 mb-5 justify-center items-end">
        <label className="flex flex-col items-center text-base text-gray-200 font-semibold">
          {t.noteMin}
          <input
            type="number"
            min={50}
            max={99}
            value={minRating}
            onChange={e => setMinRating(Math.min(99, Math.max(50, +e.target.value)))}
            className="input-field w-20 mt-1 text-center font-bold"
          />
        </label>
        <label className="flex flex-col items-center text-base text-gray-200 font-semibold">
          {t.noteMax}
          <input
            type="number"
            min={50}
            max={99}
            value={maxRating}
            onChange={e => setMaxRating(Math.max(50, Math.min(99, +e.target.value)))}
            className="input-field w-20 mt-1 text-center font-bold"
          />
        </label>
      </div>

      <div className="text-sm text-indigo-400 font-semibold mb-4 text-center">
        {t.allSVC}
      </div>

      <div className="sm:hidden text-center text-gray-400 text-xs pb-2">
        {t.scroll}
      </div>

      <div className="overflow-x-auto -mx-2 sm:mx-0" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[600px] text-center text-[14px] sm:text-[17px] font-medium">
          <thead>
            <tr className="bg-[#23282f] text-white">
              {t.columns.map(col => (
                <th
                  key={col.key}
                  className="px-2 sm:px-4 py-2 sm:py-3 font-bold whitespace-nowrap text-[13px] sm:text-[15px] border-b-2 border-[#262b32]"
                  style={{ position: "relative" }}
                >
                  <div className="flex items-center justify-center gap-1">
                    {col.label}
                    {col.tip && (
                      <Tooltip content={col.tip}>
                        <Info size={14} className="text-indigo-400 cursor-pointer" />
                      </Tooltip>
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
                {t.columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-2 sm:px-4 py-2 whitespace-nowrap ${col.key === "rating" ? "font-bold text-indigo-300" : ""}`}
                  >
                    {col.key === "rating"
                      ? row[col.key]
                      : formatSVC(row[col.key], lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400 mt-6 space-y-1 px-1 text-center">
        <div>{t.legend}</div>
      </div>
    </div>
  );
}
