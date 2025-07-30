import React from "react";
import { formatBigSVC } from "./utils";

export default function RecapSynthese({ soldeFin, masseSalariale, totalRecettes, totalCharges }) {
  return (
    <div className="my-3 flex flex-col items-center gap-2 text-lg">
      <div>
        <span className="text-gray-200 font-bold">Solde projeté fin S2 : </span>
        <span className="font-bold text-green-400">{formatBigSVC(soldeFin)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">Masse salariale joueurs prévue S2 : </span>
        <span className="font-bold text-blue-300">{formatBigSVC(masseSalariale)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">Total recettes S2 : </span>
        <span className="font-bold text-green-200">{formatBigSVC(totalRecettes)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">Total charges S2 : </span>
        <span className="font-bold text-red-200">{formatBigSVC(totalCharges)}</span>
      </div>
    </div>
  );
}
