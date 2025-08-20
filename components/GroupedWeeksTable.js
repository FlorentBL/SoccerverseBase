import React from "react";
import DetailWeeksTable from "./DetailWeeksTable";
import { getWeekType } from "./utils";

const TYPE_LABELS = {
  fr: {
    match_domicile: "📘 Matchs à domicile",
    match_exterieur: "🚌 Matchs à l’extérieur",
    transfert: "💰 Transferts",
    injection: "🏦 Injections de trésorerie",
    competition: "🏆 Compétitions",
    autre: "❓ Autres événements",
  },
  en: {
    match_domicile: "📘 Home matches",
    match_exterieur: "🚌 Away matches",
    transfert: "💰 Transfers",
    injection: "🏦 Cash injections",
    competition: "🏆 Competitions",
    autre: "❓ Other events",
  },
  it: {
    match_domicile: "📘 Partite in casa",
    match_exterieur: "🚌 Partite in trasferta",
    transfert: "💰 Trasferimenti",
    injection: "🏦 Iniezioni di cassa",
    competition: "🏆 Competizioni",
    autre: "❓ Altri eventi",
  },
  es: {
    match_domicile: "📘 Partidos en casa",
    match_exterieur: "🚌 Partidos fuera",
    transfert: "💰 Traspasos",
    injection: "🏦 Inyecciones de efectivo",
    competition: "🏆 Competiciones",
    autre: "❓ Otros eventos",
  }
};

export default function GroupedWeeksTable({ weeks, lang = "fr" }) {
  const grouped = {};

  weeks.forEach(week => {
    const type = getWeekType(week);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(week);
  });

  const labels = TYPE_LABELS[lang] || TYPE_LABELS.fr;

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(labels).map(([key, label]) =>
        grouped[key]?.length ? (
          <DetailWeeksTable key={key} weeks={grouped[key]} title={label} lang={lang} />
        ) : null
      )}
    </div>
  );
}
