"use client";
import React, { useEffect, useState } from "react";
import SVCRewardsTable from "@/components/SVCRewardsTable";

// -- labels multilingues (à compléter selon besoin) --
const LABELS = {
  fr: {
    title: (
      <>
        <span className="text-green-400">Soccerverse</span>
        <span className="block sm:inline">: Revenus Agent & Actionnaire</span>
      </>
    ),
    desc: (
      <>
        Devenez <b>actionnaire</b> ou <b>agent</b> et touchez des revenus réels selon les performances de vos joueurs !<br />
        Retrouvez ici tous les salaires, primes et commissions par note.
      </>
    )
  },
  en: {
    title: (
      <>
        <span className="text-green-400">Soccerverse</span>
        <span className="block sm:inline">: Agent & Shareholder Earnings</span>
      </>
    ),
    desc: (
      <>
        Become a <b>shareholder</b> or <b>agent</b> and earn real rewards based on your players’ performances!<br />
        Find here all salaries, bonuses, and commissions by rating.
      </>
    )
  },
  it: {
    title: (
      <>
        <span className="text-green-400">Soccerverse</span>
        <span className="block sm:inline">: Entrate Agente & Azionista</span>
      </>
    ),
    desc: (
      <>
        Diventa <b>azionista</b> o <b>agente</b> e ricevi premi reali secondo le prestazioni dei tuoi giocatori!<br />
        Qui trovi tutti gli stipendi, bonus e commissioni per valore.
      </>
    )
  }
};

export default function RevenusPage({ lang = "fr" }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/svc_rewards.json").then(r => r.json()).then(setData);
  }, []);
  const t = LABELS[lang] || LABELS.fr;

  return (
    <div className="min-h-screen bg-[#101217] text-white py-8 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left leading-tight">
          {t.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-6 text-center sm:text-left">
          {t.desc}
        </p>
        <SVCRewardsTable data={data} lang={lang} />
      </div>
    </div>
  );
}
