"use client";
import React, { useEffect, useState } from "react";
import SVCRewardsTable from "@/components/SVCRewardsTable";

const LABELS = {
  fr: {
    title1: "Soccerverse",
    title2: ": Revenus Agent & Actionnaire",
    desc: "Devenez actionnaire ou agent et touchez des revenus réels selon les performances de vos joueurs ! Retrouvez ici tous les salaires, primes et commissions par note.",
  },
  en: {
    title1: "Soccerverse",
    title2: ": Agent & Shareholder Earnings",
    desc: "Become a shareholder or agent and earn real rewards based on your players’ performances! Find here all salaries, bonuses, and commissions by rating.",
  },
  it: {
    title1: "Soccerverse",
    title2: ": Entrate Agente & Azionista",
    desc: "Diventa azionista o agente e ricevi premi reali secondo le prestazioni dei tuoi giocatori! Qui trovi tutti gli stipendi, bonus e commissioni per valore.",
  },
  es: {
    title1: "Soccerverse",
    title2: ": Ingresos Agente & Accionista",
    desc: "Conviértete en accionista o agente y gana recompensas reales según el rendimiento de tus jugadores. Aquí están todos los salarios, primas y comisiones por nota.",
  },
  ko: {
    title1: "Soccerverse",
    title2: ": 에이전트 & 주주 수익",
    desc: "주주나 에이전트가 되어 선수의 성과에 따라 실제 보상을 받으세요! 여기에서 모든 급여, 보너스, 커미션을 평점별로 확인하세요.",
  },
};

export default function RevenusPage({ lang = "fr" }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/svc_rewards.json").then(r => r.json()).then(setData);
  }, []);
  const t = LABELS[lang] || LABELS.fr;

  return (
    <div className="min-h-screen text-white py-8 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left leading-tight">
          <span className="text-indigo-400">{t.title1}</span>
          <span className="block sm:inline">{t.title2}</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-6 text-center sm:text-left">
          {t.desc}
        </p>
        <SVCRewardsTable data={data} lang={lang} />
      </div>
    </div>
  );
}
