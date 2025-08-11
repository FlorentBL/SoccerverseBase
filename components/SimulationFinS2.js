import React, { useState } from "react";
import FinanceTable from "./FinanceTable";
import RecapSynthese from "./RecapSynthese";
import GroupedWeeksTable from "./GroupedWeeksTable";

const LABELS = {
  fr: {
    title: "Simulation de recrutement",
    transfert: "Montant du transfert",
    salaire: "Salaire hebdo (SVC/match)",
    placeholderTransfert: "ex: 2000000",
    placeholderSalaire: "ex: 10000",
    show: "Afficher le détail par manche",
    hide: "Masquer le détail par manche",
  },
  en: {
    title: "Recruitment simulation",
    transfert: "Transfer amount",
    salaire: "Weekly wage (SVC/match)",
    placeholderTransfert: "e.g. 2000000",
    placeholderSalaire: "e.g. 10000",
    show: "Show match detail",
    hide: "Hide match detail",
  },
  it: {
    title: "Simulazione di reclutamento",
    transfert: "Importo trasferimento",
    salaire: "Stipendio settimanale (SVC/match)",
    placeholderTransfert: "es: 2000000",
    placeholderSalaire: "es: 10000",
    show: "Mostra dettaglio per giornata",
    hide: "Nascondi dettaglio per giornata",
  },
};

export default function SimulationFinS2({
  results,
  simData,
  transfertSim,
  salaireSim,
  setTransfertSim,
  setSalaireSim,
  lang = "fr",
}) {
  const [showDetail, setShowDetail] = useState(false);

  const baseWeeks = results?.projDetail || [];
  const simWeeks = simData?.detail || [];
  const t = LABELS[lang] || LABELS.fr;

  return (
    <div className="my-10 bg-[#23263a] rounded-xl shadow-lg p-7 border border-gray-800">
      <h2 className="text-xl font-bold mb-3 text-center text-yellow-300">{t.title}</h2>
      <div className="flex flex-wrap gap-4 mb-5 items-end justify-center">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-300">{t.transfert}</label>
          <input
            type="number"
            value={transfertSim}
            onChange={e => setTransfertSim(e.target.value)}
            className="input-field w-32"
            placeholder={t.placeholderTransfert}
            min="0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-300">{t.salaire}</label>
          <input
            type="number"
            value={salaireSim}
            onChange={e => setSalaireSim(e.target.value)}
            className="input-field w-32"
            placeholder={t.placeholderSalaire}
            min="0"
          />
        </div>
      </div>
      {simData && (
        <>
          <RecapSynthese
            soldeFin={simData.soldeFinS2}
            masseSalariale={simData.masseSalariale}
            totalRecettes={simData.totalRecettes}
            totalCharges={simData.totalCharges}
            lang={lang}
          />
          <FinanceTable bilan={simData.bilan} weeks={baseWeeks.length} isProj lang={lang} />
          <div className="mt-2 mb-4 flex justify-end">
            <button
              className="text-sm underline text-gray-300 hover:text-green-300"
              onClick={() => setShowDetail(s => !s)}
            >
              {showDetail ? t.hide : t.show}
            </button>
          </div>
          {showDetail && <GroupedWeeksTable weeks={simWeeks} lang={lang} />}
        </>
      )}
    </div>
  );
}
