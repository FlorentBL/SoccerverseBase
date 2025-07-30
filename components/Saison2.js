import React, { useState } from "react";
import FinanceTable from "./FinanceTable";
import DetailWeeksTable from "./DetailWeeksTable";
import GroupedWeeksTable from "./GroupedWeeksTable";

export default function Saison2({ bilan, weeks, details }) {
  const [showDetail, setShowDetail] = useState(false);
  return (
    <>
      <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 2 (en cours)</h2>
      <FinanceTable bilan={bilan} weeks={weeks} />
      <div className="mt-2 mb-4 flex justify-end">
        <button
          className="text-sm underline text-gray-300 hover:text-green-300"
          onClick={() => setShowDetail(s => !s)}
        >
          {showDetail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
        </button>
      </div>
      {showDetail && <GroupedWeeksTable weeks={details} />}
    </>
  );
}
