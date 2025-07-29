// app/soccerverse/revenus/page.js
"use client";
import React, { useEffect, useState } from "react";
import SVCRewardsTable from "@/components/SVCRewardsTable";

export default function RevenusSoccerverse() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/svc_rewards.json").then(r => r.json()).then(setData);
  }, []);
  return (
    <div className="min-h-screen bg-[#101217] text-white py-10 px-4">
      <div className="max-w-6xl mx-auto"> {/* <- max-w-6xl */}
        <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center gap-2">
          <span className="text-green-400">Soccerverse</span> : Revenus Agent & Actionnaire
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Devenez <b>actionnaire</b> ou <b>agent</b> et touchez des revenus réels selon les performances de vos joueurs !<br />
          Retrouvez ici tous les salaires, primes et commissions par note.
        </p>
        <SVCRewardsTable data={data} />
      </div>
    </div>
  );
}
