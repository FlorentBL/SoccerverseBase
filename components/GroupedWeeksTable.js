import React from "react";
import DetailWeeksTable from "./DetailWeeksTable";
import { getWeekType } from "./utils";

const TYPE_LABELS = {
  match_domicile: "📘 Matchs à domicile",
  match_exterieur: "🚌 Matchs à l’extérieur",
  transfert: "💰 Transferts",
  injection: "🏦 Injections de trésorerie",
  dividende: "📤 Versements aux actionnaires",
  autre: "❓ Autres événements",
};

export default function GroupedWeeksTable({ weeks }) {
  const grouped = {};

  weeks.forEach(week => {
    const type = getWeekType(week);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(week);
  });

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(TYPE_LABELS).map(([key, label]) =>
        grouped[key]?.length ? (
          <DetailWeeksTable key={key} weeks={grouped[key]} title={label} />
        ) : null
      )}
    </div>
  );
}
