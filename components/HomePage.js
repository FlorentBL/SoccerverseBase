"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HOMEPAGE_LABELS = {
  fr: {
    hero1: "SoccerverseBase",
    hero2: <>L’outil ultime pour dominer Soccerverse.<br />Simulateur, scouting, classement, guides & communauté francophone.</>,
    cta: "Commencer",
    cta2: "Guide débutant",
    patch: "Patch FR (logos, noms)",
    nav1: "Débuter",
    nav2: "Scouting",
    nav3: "Gains joueurs",
    nav4: "Finance",
  },
  en: {
    hero1: "SoccerverseBase",
    hero2: <>The ultimate tool for mastering Soccerverse.<br />Simulator, scouting, rankings, guides & international community.</>,
    cta: "Start now",
    cta2: "Beginner guide",
    patch: "Patch (logos, names)",
    nav1: "Getting started",
    nav2: "Scouting",
    nav3: "Player earnings",
    nav4: "Finance",
  },
  it: {
    hero1: "SoccerverseBase",
    hero2: <>Lo strumento definitivo per dominare Soccerverse.<br />Simulatore, scouting, classifiche, guide e community italiana.</>,
    cta: "Inizia ora",
    cta2: "Guida per principianti",
    patch: "Patch IT (loghi, nomi)",
    nav1: "Inizia",
    nav2: "Scouting",
    nav3: "Guadagni giocatori",
    nav4: "Finanza",
  }
};

export default function HomePage() {
  const pathname = usePathname();
  const lang = (pathname.match(/^\/(fr|en|it)/)?.[1]) || "fr";
  const t = HOMEPAGE_LABELS[lang];

  // Génère les liens corrects pour chaque langue
  const link = (page) => `/${lang}${page}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      <Navbar />

      <section className="relative w-full min-h-[420px] flex flex-col items-center justify-center bg-gradient-to-br from-sky-950 via-gray-900 to-emerald-950 pb-14 pt-10 shadow-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-500 bg-clip-text text-transparent drop-shadow-lg mb-5 text-center">
          {t.hero1}
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8 text-center max-w-3xl">{t.hero2}</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-3 w-full max-w-md">
          <Link href={link("/debuter")} className="flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 rounded-xl px-7 py-4 text-lg font-bold shadow transition w-full focus:outline-none">
            {t.cta2}
          </Link>
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-7 py-4 text-lg font-bold shadow transition w-full focus:outline-none"
          >
            {t.cta}
          </a>
        </div>
      </section>

      <section className="flex flex-col items-center px-3 mt-14 mb-14 gap-8">
        <nav className="flex flex-wrap gap-4 justify-center w-full">
          <Link href={link("/debuter")} className="bg-gray-700 hover:bg-sky-600 px-6 py-3 rounded-xl text-lg font-bold">{t.nav1}</Link>
          <Link href={link("/scouting")} className="bg-gray-700 hover:bg-purple-600 px-6 py-3 rounded-xl text-lg font-bold">{t.nav2}</Link>
          <Link href={link("/revenus")} className="bg-gray-700 hover:bg-yellow-500 px-6 py-3 rounded-xl text-lg font-bold">{t.nav3}</Link>
          <Link href={link("/finance")} className="bg-gray-700 hover:bg-green-600 px-6 py-3 rounded-xl text-lg font-bold">{t.nav4}</Link>
        </nav>
        <a
          href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
          target="_blank"
          rel="noopener"
          className="underline text-sky-300 text-lg mt-6"
        >
          {t.patch}
        </a>
      </section>
    </div>
  );
}
