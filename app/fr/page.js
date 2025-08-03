"use client";

import Navbar from "@/components/Navbar";
import {
  FaBookOpen, FaSearch, FaChartLine, FaDiscord, FaYoutube,
  FaUsers, FaCheckCircle, FaUserPlus, FaPuzzlePiece, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { useState } from "react";

const LOGO_MASCOTTE = "/logo.png";

const sections = [
  {
    key: "soccerverse",
    title: "Comprendre Soccerverse",
    icon: <FaBookOpen className="text-sky-400 text-2xl mr-2" />,
    content: (
      <>
        <p className="mb-3 text-gray-300">
          <b>Soccerverse</b> est un jeu de simulation de management football <b>connecté à l’actualité réelle</b> : les performances et transferts IRL influencent directement le jeu.
        </p>
        <ul className="list-none mt-2 space-y-2">
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Actionnaire</b> : investis dans des clubs ou joueurs (parts d’influence). Tu gagnes selon leurs résultats.
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Coach ou agent</b> : sois élu coach par la commu, négocie transferts, salaires, compositions...
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Décisions collectives</b> : tout se joue à plusieurs (votes pour coach, mercato, tactiques...).
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Gameplay réaliste</b> : gestion de l’effectif, finances, blessures, transferts en temps réel...
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Gains</b> : recettes chaque semaine, prime de fin de saison selon la perf du club/joueur.
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Impact IRL</b> : perf ou transfert réel = évolution dans le jeu !
            </span>
          </li>
        </ul>
        <p className="text-xs text-sky-200 mt-4">
          <b>Exemple :</b> tu es agent d’un jeune ? S’il explose IRL, sa valeur grimpe dans le jeu.  
          Tu votes pour recruter, vendre, ou changer de coach.
        </p>
      </>
    ),
  },
  {
    key: "roles",
    title: "Les rôles dans Soccerverse",
    icon: <FaUsers className="text-emerald-400 text-2xl mr-2" />,
    content: (
      <div>
        <p className="mb-6 text-gray-300">
          <b>Tu peux cumuler plusieurs rôles</b> selon tes envies : stratège, investisseur, négociateur ou dénicheur de talents.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* ENTRAÎNEUR */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-emerald-700/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaBookOpen className="text-emerald-400" />
              <span className="font-bold text-emerald-200">Entraîneur</span>
            </div>
            <span className="text-xs text-emerald-300 mb-1">Le stratège</span>
            <span className="text-gray-300 text-sm flex-1">Prépare les matchs, gère mercato & effectif, décisions sportives. Diplomatie & vision !</span>
          </div>
          {/* AGENT */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-yellow-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaUserPlus className="text-yellow-300" />
              <span className="font-bold text-yellow-100">Agent</span>
            </div>
            <span className="text-xs text-yellow-200 mb-1">Le négociateur</span>
            <span className="text-gray-300 text-sm flex-1">Gère transferts, contrats, carrière et moral du joueur. Intermédiaire-clé.</span>
          </div>
          {/* INFLUENCEUR */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-blue-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaUsers className="text-blue-400" />
              <span className="font-bold text-blue-100">Influenceur</span>
            </div>
            <span className="text-xs text-blue-200 mb-1">L’actionnaire</span>
            <span className="text-gray-300 text-sm flex-1">Vote les grandes décisions, vise le profit sur le long terme. Plus de parts = plus de poids !</span>
          </div>
          {/* TRADER */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-pink-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaChartLine className="text-pink-400" />
              <span className="font-bold text-pink-100">Trader</span>
            </div>
            <span className="text-xs text-pink-200 mb-1">Le spéculateur</span>
            <span className="text-gray-300 text-sm flex-1">Profite des variations du marché d’influence, achète bas, vends haut !</span>
          </div>
          {/* SCOUT */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-purple-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaSearch className="text-purple-300" />
              <span className="font-bold text-purple-100">Scout</span>
            </div>
            <span className="text-xs text-purple-200 mb-1">Le découvreur</span>
            <span className="text-gray-300 text-sm flex-1">Repère les jeunes à potentiel. Clé pour gagner gros !</span>
          </div>
        </div>
        <p className="text-gray-500 mt-8 text-xs italic text-center">
          <FaCheckCircle className="inline mr-1 text-emerald-400" />
          Combine les rôles à volonté pour une expérience unique.
        </p>
      </div>
    ),
  },
  {
    key: "links",
    title: "Liens indispensables",
    icon: <FaSearch className="text-blue-400 text-2xl mr-2" />,
    content: (
      <ul className="pl-1 space-y-1 text-gray-200 text-base">
        <li><a href="https://guide.soccerverse.com/french" target="_blank" rel="noopener" className="underline hover:text-sky-300">Guide FR complet</a></li>
        <li><a href="https://wiki.soccerverse.com/index.php/Main_Page" target="_blank" rel="noopener" className="underline hover:text-sky-300">Wiki Soccerverse (EN)</a></li>
        <li><a href="https://soccerratings.org/players" target="_blank" rel="noopener" className="underline hover:text-sky-300">Ratings joueurs en temps réel</a></li>
        <li><a href="https://soccerverse.com/soccerverse-litepaper/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Litepaper (vision du jeu)</a></li>
        <li><a href="https://www.svfootball.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Recherche joueurs/clubs</a></li>
        <li><a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Hub articles & doc technique</a></li>
        <li><a href="https://soccerversetool.vercel.app/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Outils Soccerverse</a></li>
        <li><a href="https://elrincondeldt.com/soccerverse-prize-calculator.html" target="_blank" rel="noopener" className="underline hover:text-sky-300">Calculateur de récompenses</a></li>
      </ul>
    ),
  },
  {
    key: "tips",
    title: "Astuces de la commu FR",
    icon: <FaChartLine className="text-pink-400 text-2xl mr-2" />,
    content: (
      <ul className="list-disc pl-5 text-gray-300 text-base space-y-2">
        <li><b>Rotation</b> : fatigue réelle (perte 26–29 fitness/match, récup +7/jour). Fais tourner !</li>
        <li><b>Remplacements</b> : Max 2 anticipés, garde 1 pour blessure.</li>
        <li><b>Jamais de blessés/suspendus sur le banc</b> (risque compo aléatoire !)</li>
        <li><b>Ratings MAJ tous les 6 mois</b> (utilise Transfermarkt & soccerratings).</li>
        <li><b>Salaire = OVR</b> (<a href="https://svbase.vercel.app/revenus" target="_blank" rel="noopener" className="underline text-yellow-300">voir le tableau</a>), pas l’âge !</li>
        <li><b>Transferts</b> : 7 départs/arrivées max/saison/club, 2 prêts.</li>
        <li><b>Enchères</b> : 1ère mise = lancement (5 jours), patience.</li>
        <li><b>Influence</b> : Récompenses chaque semaine + en fin de saison.</li>
        <li><b>Wallet in game</b> : Transactions gratuites chaque jour.</li>
      </ul>
    ),
  }
];

export default function DebuterPage() {
  const [openSections, setOpenSections] = useState(sections.map((_, idx) => idx === 0));

  const toggleSection = idx => {
    setOpenSections(openSections =>
      openSections.map((open, i) => (i === idx ? !open : open))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      <Navbar />

      {/* Hero section sobre */}
      <section className="relative w-full min-h-[420px] flex flex-col items-center justify-center bg-gradient-to-br from-sky-950 via-gray-900 to-emerald-950 pb-14 pt-8 shadow-2xl">
        <img
          src={LOGO_MASCOTTE}
          alt="Logo"
          className="absolute right-6 top-10 w-28 md:w-40 opacity-20 pointer-events-none select-none hidden md:block"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-500 bg-clip-text text-transparent drop-shadow-lg mb-3 mt-8 text-center">
          SoccerverseBase
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8 text-center max-w-2xl">
          Guide pratique pour débuter et progresser sur Soccerverse.<br />
          Accède rapidement aux ressources, infos et à la communauté FR.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg mt-2">
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 rounded-xl px-7 py-4 text-lg font-bold shadow transition w-full focus:outline-none"
          >
            <FaUserPlus className="text-xl" /> Inscription Soccerverse
          </a>
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-7 py-4 text-lg font-bold shadow transition w-full focus:outline-none"
          >
            <FaPuzzlePiece className="text-xl" /> Patch FR (logos, noms)
          </a>
        </div>
      </section>

      {/* Séparateur sobre */}
      <div className="w-full flex justify-center items-center my-0">
        <div className="h-1 w-1/2 bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400 rounded-full opacity-40" />
      </div>

      {/* Discord K-SOCIOS sobre */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-8 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-lg px-6 md:px-10 py-8 md:py-10 border border-emerald-600/20 max-w-3xl mx-auto mt-10 mb-10">
        <FaDiscord className="text-5xl text-sky-400 hidden md:block mr-6" />
        <div className="flex-1 flex flex-col items-center md:items-start">
          <h2 className="text-2xl font-bold mb-2 text-white">Communauté française K-SOCIOS</h2>
          <p className="text-base text-gray-200 mb-4">
            Espace d’entraide, discussion et informations pour les francophones.<br />
            Rejoins le Discord pour poser tes questions ou échanger avec la commu.
          </p>
          <a
            href="https://discord.gg/sd5aa8TW"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center bg-sky-700 hover:bg-sky-900 transition rounded-xl px-7 py-3 text-lg font-semibold shadow gap-2 text-white mb-1"
          >
            <FaDiscord className="text-xl" /> Rejoindre le Discord K-SOCIOS
          </a>
        </div>
      </section>

      <main className="flex flex-col items-center px-2 sm:px-4 pt-4 pb-12 w-full">

        {/* Accordéon sections (sobre) */}
        <section className="w-full max-w-5xl mb-14 flex flex-col gap-7 mt-6">
          {sections.map((s, idx) => (
            <div key={s.key} className="rounded-2xl shadow-xl border border-gray-700 bg-gradient-to-tr from-gray-900/90 to-gray-800/70">
              <button
                className={`w-full flex items-center justify-between text-left px-7 py-5 focus:outline-none rounded-t-2xl transition
                  ${openSections[idx] ? "bg-gradient-to-r from-sky-950/60 to-emerald-950/50" : "bg-transparent hover:bg-gray-900/40"}`}
                onClick={() => toggleSection(idx)}
                aria-expanded={openSections[idx]}
              >
                <span className="flex items-center text-xl md:text-2xl font-bold">
                  {s.icon}
                  {s.title}
                </span>
                {openSections[idx] ? (
                  <FaChevronUp className="text-sky-300 text-xl" />
                ) : (
                  <FaChevronDown className="text-gray-400 text-xl" />
                )}
              </button>
              {openSections[idx] && (
                <div className="px-7 pb-6 pt-1 transition-all duration-300 text-base">
                  {s.content}
                </div>
              )}
            </div>
          ))}
        </section>

        <footer className="text-center text-gray-500 text-xs py-4 w-full">
       
        </footer>
      </main>
    </div>
  );
}