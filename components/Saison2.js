import React, { useState } from "react";
import FinanceTable from "./FinanceTable";
import GroupedWeeksTable from "./GroupedWeeksTable";

const LABELS = {
  fr: {
    title: "Bilan Saison 2 (en cours)",
    show: "Afficher le détail par manche",
    hide: "Masquer le détail par manche",
  },
  en: {
    title: "Season 2 balance (ongoing)",
    show: "Show match detail",
    hide: "Hide match detail",
  },
  it: {
    title: "Bilancio Stagione 2 (in corso)",
    show: "Mostra dettaglio per giornata",
    hide: "Nascondi dettaglio per giornata",
  },
  es: {
    title: "Balance Temporada 2 (en curso)",
    show: "Mostrar detalle por jornada",
    hide: "Ocultar detalle por jornada",
  },
  ko: {
    title: "시즌 2 결산 (진행 중)",
    show: "라운드별 상세 보기",
    hide: "라운드별 상세 숨기기",
  },
};

export default function Saison2({ bilan, weeks, details, lang = "fr" }) {
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
