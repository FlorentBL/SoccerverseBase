import React, { useState } from "react";
import FinanceTable from "./FinanceTable";
import GroupedWeeksTable from "./GroupedWeeksTable";

const LABELS = {
  fr: {
    title: "Bilan Saison 1",
    show: "Afficher le détail par manche",
    hide: "Masquer le détail par manche",
  },
  en: {
    title: "Season 1 balance",
    show: "Show match detail",
    hide: "Hide match detail",
  },
  it: {
    title: "Bilancio Stagione 1",
    show: "Mostra dettaglio per giornata",
    hide: "Nascondi dettaglio per giornata",
  },
  es: {
    title: "Balance Temporada 1",
    show: "Mostrar detalle por jornada",
    hide: "Ocultar detalle por jornada",
  },
};

export default function Saison1({ bilan, weeks, details, lang = "fr" }) {
  const [showDetail, setShowDetail] = useState(false);
  const t = LABELS[lang] || LABELS.fr;
  return (
    <>
      <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">{t.title}</h2>
      <FinanceTable bilan={bilan} weeks={weeks} lang={lang} />
      <div className="mt-2 mb-4 flex justify-end">
        <button
          className="text-sm underline text-gray-300 hover:text-green-300"
          onClick={() => setShowDetail(s => !s)}
        >
          {showDetail ? t.hide : t.show}
        </button>
      </div>
      {showDetail && <GroupedWeeksTable weeks={details} lang={lang} />}
    </>
  );
}
