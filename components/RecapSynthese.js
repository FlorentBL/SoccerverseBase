import React from "react";
import { formatBigSVC } from "./utils";

const LABELS = {
  fr: {
    soldeFin: "Solde projeté fin S2 : ",
    masseSalariale: "Masse salariale joueurs prévue S2 : ",
    totalRecettes: "Total recettes S2 : ",
    totalCharges: "Total charges S2 : ",
  },
  en: {
    soldeFin: "Projected balance end of S2: ",
    masseSalariale: "Projected player wage bill S2: ",
    totalRecettes: "Total income S2: ",
    totalCharges: "Total expenses S2: ",
  },
    it: {
      soldeFin: "Saldo previsto fine S2: ",
      masseSalariale: "Stipendio giocatori previsto S2: ",
      totalRecettes: "Totale entrate S2: ",
      totalCharges: "Totale spese S2: ",
    },
    zh: {
      soldeFin: "赛季2预计余额：",
      masseSalariale: "赛季2预计球员工资总额：",
      totalRecettes: "赛季2总收入：",
      totalCharges: "赛季2总支出：",
    },
  };

export default function RecapSynthese({ soldeFin, masseSalariale, totalRecettes, totalCharges, lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  return (
    <div className="my-3 flex flex-col items-center gap-2 text-lg">
      <div>
        <span className="text-gray-200 font-bold">{t.soldeFin}</span>
        <span className="font-bold text-green-400">{formatBigSVC(soldeFin, lang)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">{t.masseSalariale}</span>
        <span className="font-bold text-blue-300">{formatBigSVC(masseSalariale, lang)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">{t.totalRecettes}</span>
        <span className="font-bold text-green-200">{formatBigSVC(totalRecettes, lang)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">{t.totalCharges}</span>
        <span className="font-bold text-red-200">{formatBigSVC(totalCharges, lang)}</span>
      </div>
    </div>
  );
}
