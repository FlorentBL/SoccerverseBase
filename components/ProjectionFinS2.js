import React, { useState } from "react";
import FinanceTable from "./FinanceTable";
import DetailWeeksTable from "./DetailWeeksTable";
import RecapSynthese from "./RecapSynthese";

export default function ProjectionFinS2({ bilan, nbJoursTotal, detailProj, recap }) {
  const [showDetail, setShowDetail] = useState(false);
  return (
    <>
      <h2 className="text-lg font-bold mt-8 mb-3 text-yellow-300 text-center">Projection Fin Saison 2</h2>
      <FinanceTable bilan={bilan} weeks={nbJoursTotal} isProj />
      <RecapSynthese {...recap} />
      <div className="mt-2 mb-4 flex justify-end">
        <button
          className="text-sm underline text-gray-300 hover:text-green-300"
          onClick={() => setShowDetail(s => !s)}
        >
          {showDetail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
        </button>
      </div>
      {showDetail && <DetailWeeksTable weeks={detailProj} title="Détail par manche (projection)" />}
    </>
  );
}
