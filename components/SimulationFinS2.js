import React, { useState } from "react";
import FinanceTable from "./FinanceTable";
import DetailWeeksTable from "./DetailWeeksTable";
import RecapSynthese from "./RecapSynthese";
import { generateSimulatedDetail } from "./utils";
import GroupedWeeksTable from "./GroupedWeeksTable";

export default function SimulationFinS2({
  results, simData, transfertSim, salaireSim, setTransfertSim, setSalaireSim
}) {
  const [showDetail, setShowDetail] = useState(false);

  const baseWeeks = results?.projDetail || [];
  const simWeeks = simData?.detail || [];

  return (
    <div className="my-10 bg-[#23263a] rounded-xl shadow-lg p-7 border border-gray-800">
      <h2 className="text-xl font-bold mb-3 text-center text-yellow-300">Simulation de recrutement</h2>
      <div className="flex flex-wrap gap-4 mb-5 items-end justify-center">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-300">Montant du transfert</label>
          <input
            type="number"
            value={transfertSim}
            onChange={e => setTransfertSim(e.target.value)}
            className="border border-gray-600 rounded p-2 w-32 bg-[#202330] text-white"
            placeholder="ex: 2000000"
            min="0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-300">Salaire hebdo (SVC/match)</label>
          <input
            type="number"
            value={salaireSim}
            onChange={e => setSalaireSim(e.target.value)}
            className="border border-gray-600 rounded p-2 w-32 bg-[#202330] text-white"
            placeholder="ex: 10000"
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
          />
          <FinanceTable bilan={simData.bilan} weeks={baseWeeks.length} isProj />
          <div className="mt-2 mb-4 flex justify-end">
            <button
              className="text-sm underline text-gray-300 hover:text-green-300"
              onClick={() => setShowDetail(s => !s)}
            >
              {showDetail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
            </button>
          </div>
          {showDetail && <GroupedWeeksTable weeks={simWeeks} />}
        </>
      )}
    </div>
  );
}
