import React, { useState } from "react";
import FinanceTable from "./FinanceTable";
import RecapSynthese from "./RecapSynthese";
import GroupedWeeksTable from "./GroupedWeeksTable";

const LABELS = {
  fr: {
    title: "Projection Fin Saison 2",
    show: "Afficher le détail par manche",
    hide: "Masquer le détail par manche",
  },
  en: {
    title: "End of Season 2 Projection",
    show: "Show match detail",
    hide: "Hide match detail",
  },
  it: {
    title: "Proiezione Fine Stagione 2",
    show: "Mostra dettaglio per giornata",
    hide: "Nascondi dettaglio per giornata",
  },
  es: {
    title: "Proyección fin Temporada 2",
    show: "Mostrar detalle por jornada",
    hide: "Ocultar detalle por jornada",
  },
  ko: {
    title: "시즌 2 종료 예상",
    show: "라운드별 상세 보기",
    hide: "라운드별 상세 숨기기",
  },
};

export default function ProjectionFinS2({ bilan, nbJoursTotal, detailProj, recap, lang = "fr" }) {
  const [showDetail, setShowDetail] = useState(false);
  const t = LABELS[lang] || LABELS.fr;

  if (showDetail) {
    console.log("🔎 [ProjectionFinS2] detailProj passed to GroupedWeeksTable:", detailProj);
    if (!Array.isArray(detailProj)) {
      console.error("❌ detailProj N'EST PAS un array !", detailProj);
    } else {
      detailProj.forEach((w, i) => {
        if (!w || typeof w !== "object") {
          console.error(`❌ Semaine invalide à l'index ${i}:`, w);
        } else {
          // Ajoute ici FIELD_ORDER si tu veux un contrôle strict de toutes les clés métiers
          // FIELD_ORDER.forEach(k => {
          //   if (!(k in w)) {
          //     console.warn(`⚠️  Clé absente "${k}" à l'index ${i}:`, w);
          //   }
          // });
        }
      });
    }
  }

  return (
    <>
      <h2 className="text-lg font-bold mt-8 mb-3 text-yellow-300 text-center">
        {t.title}
      </h2>
      <FinanceTable bilan={bilan} weeks={nbJoursTotal} isProj lang={lang} />
      {/* Affiche le recap synthèse en utilisant les props */}
      <RecapSynthese {...recap} lang={lang} />
      <div className="mt-2 mb-4 flex justify-end">
        <button
          className="text-sm underline text-gray-300 hover:text-green-300"
          onClick={() => setShowDetail(s => !s)}
        >
          {showDetail ? t.hide : t.show}
        </button>
      </div>
      {showDetail && <GroupedWeeksTable weeks={detailProj} lang={lang} />}
    </>
  );
}
