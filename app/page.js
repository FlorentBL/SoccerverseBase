"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  FaBookOpen, FaSearch, FaChartLine, FaDiscord, FaYoutube,
  FaUsers, FaCheckCircle, FaUserPlus, FaPuzzlePiece, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { useState } from "react";

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
        <li><b>Salaire = OVR</b> (<a href="https://elrincondeldt.com/soccerverse-agente-de-jugador.html" target="_blank" rel="noopener" className="underline text-yellow-300">voir le tableau</a>), pas l’âge !</li>
        <li><b>Transferts</b> : 7 départs/arrivées max/saison/club, 2 prêts.</li>
        <li><b>Enchères</b> : 1ère mise = lancement (5 jours), patience.</li>
        <li><b>Influence</b> : Récompenses chaque semaine + en fin de saison.</li>
        <li><b>Wallet in game</b> : Transactions gratuites chaque jour.</li>
      </ul>
    ),
  }
];

export default function DebuterPage() {
  const [openSections, setOpenSections] = useState(sections.map((_, idx) => idx === 0)); // Ouvre la 1ère section par défaut

  const toggleSection = idx => {
    setOpenSections(openSections =>
      openSections.map((open, i) => (i === idx ? !open : open))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      <Navbar />
      <main className="flex flex-col items-center px-2 sm:px-4 pt-28 pb-16 w-full">
        {/* Titre principal */}
        <h1 className="text-4xl md:text-6xl font-extrabold mb-2 bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-500 bg-clip-text text-transparent drop-shadow-lg">
          SoccerverseBase <span className="align-middle">⚽</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-8 text-center">
          <span className="text-emerald-400 font-bold">Débute sur Soccerverse ?</span><br />
          Ce guide te donne tout pour progresser vite, comprendre les règles, et rejoindre la communauté FR !
        </p>

        {/* Boutons Inscription & Patch FR */}
        <div className="flex flex-col sm:flex-row gap-5 mb-10 w-full max-w-2xl">
          <a
            href="https://play.soccerverse.com/home"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 rounded-xl px-6 py-4 text-lg font-bold shadow transition w-full"
          >
            <FaUserPlus className="text-2xl" /> Inscription Soccerverse
          </a>
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 py-4 text-lg font-bold shadow transition w-full"
          >
            <FaPuzzlePiece className="text-2xl" /> Patch FR (logos, noms)
          </a>
        </div>

        {/* Discord K-SOCIOS */}
        <section className="w-full max-w-3xl mb-10">
          <div className="bg-gradient-to-r from-gray-800/90 via-gray-900/95 to-gray-800/80 rounded-2xl shadow-lg p-7 border border-emerald-600/20 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-emerald-400 text-2xl" />
              <h2 className="text-2xl font-bold text-white drop-shadow">Rejoins la communauté française K-SOCIOS ! 🇫🇷</h2>
            </div>
            <p className="text-base text-gray-200 mb-4">
              Questions, conseils, entraide, ligues FR, actualités ?  
              <span className="font-semibold text-emerald-300 block">Le Discord K-SOCIOS est là pour tous les francophones !</span>
            </p>
            <a
              href="https://discord.gg/sd5aa8TW"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center bg-sky-700 hover:bg-sky-900 transition rounded-xl px-8 py-4 text-lg font-semibold shadow-lg gap-2 text-white"
            >
              <FaDiscord className="text-2xl" /> Rejoindre le Discord K-SOCIOS
            </a>
            <p className="text-sm text-emerald-200 mt-4">
              (C’est ici que tu trouveras l’entraide la plus active pour les francophones !)
            </p>
          </div>
        </section>

        {/* --- Sections Accordéon --- */}
        <section className="w-full max-w-5xl mb-14 flex flex-col gap-7">
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

        {/* --- FAQ Débutants --- */}
        <section className="w-full max-w-4xl text-left mb-12">
          <h2 className="text-2xl font-bold text-sky-400 mb-4 text-center">FAQ Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Comment investir ?</b>
              <div className="text-sm text-gray-300 mt-1">Achète des packs influence pour clubs/joueurs sur le store, ou sur le marché secondaire.</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Puis-je gérer plusieurs clubs ?</b>
              <div className="text-sm text-gray-300 mt-1">Oui, multi-compte autorisé, mais attention à bien séparer tes wallets.</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Les salaires dépendent de l’âge ?</b>
              <div className="text-sm text-gray-300 mt-1">Non, uniquement du rating OVR (<a href="https://elrincondeldt.com/soccerverse-agente-de-jugador.html" target="_blank" rel="noopener" className="underline">voir tableau</a>).</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Où suivre les updates ?</b>
              <div className="text-sm text-gray-300 mt-1">Le <a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline">Hub</a> et le <a href="https://discord.gg/soccerverse" target="_blank" rel="noopener" className="underline">Discord global</a> sont tes alliés.</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Comment améliorer mon équipe ?</b>
              <div className="text-sm text-gray-300 mt-1">Scout régulièrement, vise les jeunes à potentiel IRL, optimise les remplacements.</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Existe-t-il des tutos vidéo ?</b>
              <div className="text-sm text-gray-300 mt-1">Principalement en anglais/espagnol sur Youtube. Pas encore de chaîne FR officielle (à venir !).</div>
            </div>
          </div>
        </section>

        {/* --- Communauté et entraide --- */}
        <section className="w-full max-w-4xl text-left mb-8">
          <h2 className="text-2xl font-bold text-emerald-300 mb-4 text-center">Communauté & Entraide</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <a href="https://discord.gg/soccerverse" target="_blank" rel="noopener" className="bg-sky-700 hover:bg-sky-800 transition rounded-xl px-8 py-4 text-xl flex items-center gap-3 shadow-lg mb-4 md:mb-0">
              <FaDiscord className="text-2xl" /> Discord FR/EN officiel
            </a>
            <a href="https://www.youtube.com/results?search_query=soccerverse+game" target="_blank" rel="noopener" className="bg-red-600 hover:bg-red-800 transition rounded-xl px-8 py-4 text-xl flex items-center gap-3 shadow-lg">
              <FaYoutube className="text-2xl" /> Youtube (Tutos/Gameplay)
            </a>
          </div>
          <div className="text-center text-sm text-gray-400 mt-4">
            Besoin d’aide ? Rejoins notre <a href="https://discord.gg/sd5aa8TW" target="_blank" rel="noopener" className="underline text-emerald-300 hover:text-emerald-400">Discord K-SOCIOS FR</a>, le <a href="https://discord.gg/soccerverse" target="_blank" rel="noopener" className="underline text-sky-300 hover:text-sky-500">Discord global</a> ou pose tes questions sur Twitter !
          </div>
        </section>

        <footer className="text-center text-gray-500 text-xs py-4 w-full">
          © 2025 SoccerverseBase – Guide débutant par la communauté FR
        </footer>
      </main>
    </div>
  );
}
