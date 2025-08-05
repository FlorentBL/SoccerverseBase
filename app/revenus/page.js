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
    <div className="min-h-screen text-white py-8 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left leading-tight">
      <span className="text-green-400">Soccerverse</span>
      <span className="block sm:inline">: Revenus Agent & Actionnaire</span>
    </h1>
    <p className="text-base sm:text-lg text-gray-300 mb-6 text-center sm:text-left">
      Devenez <b>actionnaire</b> ou <b>agent</b> et touchez des revenus réels selon les performances de vos joueurs !<br />
      Retrouvez ici tous les salaires, primes et commissions par note.
    </p>
    <SVCRewardsTable data={data} />
  </div>
</div>
  );
}
