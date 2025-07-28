"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  FaBookOpen, FaSearch, FaChartLine, FaDiscord, FaYoutube,
  FaUsers, FaCheckCircle, FaUserPlus, FaPuzzlePiece, FaArrowRight
} from "react-icons/fa";

export default function DebuterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-800 text-white">
      <Navbar />
      <main className="flex flex-col items-center text-center px-4 pt-28 pb-16">

        {/* Titre principal */}
        <h1 className="text-4xl md:text-6xl font-extrabold mb-2 bg-gradient-to-r from-green-400 via-yellow-300 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
          Bienvenue sur SoccerverseBase ⚽
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mb-8">
          <span className="text-green-400 font-bold">Nouveau sur Soccerverse&nbsp;?</span><br />
          Voici le guide ultra-complet pour tout comprendre et réussir tes débuts !
        </p>

        {/* Boutons Inscription et Patch */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <a
            href="https://play.soccerverse.com/home"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 transition shadow-lg rounded-xl px-8 py-4 text-xl font-bold"
          >
            <FaUserPlus className="text-2xl" />
            Inscris-toi sur Soccerverse
          </a>
          <a
            href="https://play.soccerverse.com/?pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-600 transition shadow-lg rounded-xl px-8 py-4 text-xl font-bold"
          >
            <FaPuzzlePiece className="text-2xl" />
            Installer le Pack FR (logos, noms)
          </a>
        </div>

        {/* SECTION K-SOCIOS */}
        <section className="w-full max-w-3xl mb-10">
          <div className="bg-gradient-to-r from-yellow-500/80 to-green-500/90 rounded-2xl shadow-xl p-7 border border-yellow-400/20 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-white text-2xl" />
              <h2 className="text-2xl font-bold text-white drop-shadow">Rejoins la communauté française K-SOCIOS ! 🇫🇷</h2>
            </div>
            <p className="text-base text-white mb-4">
              Besoin d'aide, envie de discuter, trouver un club ou progresser plus vite ?<br />
              <span className="font-semibold text-yellow-100">Notre Discord K-SOCIOS t’accueille !</span>
            </p>
            <a
              href="https://discord.gg/sd5aa8TW"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center bg-blue-700 hover:bg-blue-900 transition rounded-xl px-8 py-4 text-lg font-semibold shadow-lg gap-2 text-white"
            >
              <FaDiscord className="text-2xl" /> Rejoindre le Discord K-SOCIOS
            </a>
            <p className="text-sm text-yellow-100 mt-4">
              (Pour tous les francophones, tous niveaux !)
            </p>
          </div>
        </section>

        {/* --- SECTIONS ESSENTIELLES --- */}
        <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">

          {/* 1. Comprendre Soccerverse */}
          <div className="bg-gray-900/80 rounded-2xl shadow-xl p-7 border border-white/10 flex flex-col items-start text-left transition hover:scale-[1.01] hover:border-green-400">
            <div className="flex items-center gap-3 mb-3">
              <FaBookOpen className="text-green-400 text-2xl" />
              <h2 className="text-xl font-bold">1. Comprendre Soccerverse</h2>
            </div>
            <div className="text-gray-200 text-base space-y-3">
              <p>
                <b>Soccerverse</b> est un jeu de simulation de management football connecté à l’actualité : <b>les vraies perfs et transferts influencent le jeu !</b>
              </p>
              <ul className="list-none mt-2 space-y-2">
                <li className="flex gap-2 items-start">
                  <FaCheckCircle className="text-green-400 mt-1" />
                  <span>
                    <b>Actionnaire</b> : investis dans des clubs ou joueurs (parts d’influence). Tu gagnes selon leurs résultats !
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <FaCheckCircle className="text-green-400 mt-1" />
                  <span>
                    <b>Coach ou agent</b> : tu peux être élu coach par la communauté, négocier les transferts, salaires, compositions…
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <FaCheckCircle className="text-green-400 mt-1" />
                  <span>
                    <b>Tout se joue collectivement :</b> votes pour toutes les grandes décisions (coach, mercato, tactiques, budget, etc.).
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <FaCheckCircle className="text-green-400 mt-1" />
                  <span>
                    <b>Gameplay réaliste :</b> effectif, finances, blessures, rotation, transferts en temps réel, etc.
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <FaCheckCircle className="text-green-400 mt-1" />
                  <span>
                    <b>Gains :</b> chaque semaine (recettes, primes, influence), plus grosse récompense en fin de saison selon la perf du club ou joueur.
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <FaCheckCircle className="text-green-400 mt-1" />
                  <span>
                    <b>Tout évolue selon l’IRL :</b> une perf ou un transfert réel = une évolution dans le jeu !
                  </span>
                </li>
              </ul>
              <p className="text-blue-300 text-sm mt-3">
                <b>Exemple :</b> Tu es agent d’un jeune espoir ? S’il explose IRL, sa valeur in-game grimpe. Tu votes pour recruter, vendre, changer de coach ou entraîner ton club préféré avec les autres fans.
              </p>
            </div>
          </div>

          {/* 2. S’inscrire & installer le pack FR */}
          <div className="bg-gray-900/80 rounded-2xl shadow-xl p-7 border border-white/10 flex flex-col items-start text-left transition hover:scale-[1.01] hover:border-yellow-400">
            <div className="flex items-center gap-3 mb-3">
              <FaUserPlus className="text-yellow-400 text-2xl" />
              <h2 className="text-xl font-bold">2. Inscription & Patch FR</h2>
            </div>
            <ul className="list-none mt-2 space-y-3 text-gray-200 text-base">
              <li className="flex gap-2 items-center">
                <FaArrowRight className="text-yellow-400" />
                <span>
                  <b>Inscris-toi ici :</b>{" "}
                  <a href="https://play.soccerverse.com/home" target="_blank" rel="noopener" className="underline text-yellow-300 hover:text-yellow-500 font-semibold">
                    play.soccerverse.com
                  </a>
                </span>
              </li>
              <li className="flex gap-2 items-center">
                <FaArrowRight className="text-yellow-400" />
                <span>
                  <b>Installe le pack FR (logos, noms officiels) :</b>{" "}
                  <a href="https://play.soccerverse.com/?pack=https://elrincondeldt.com/sv/rincon_v1.json" target="_blank" rel="noopener" className="underline text-yellow-300 hover:text-yellow-500 font-semibold">
                    pack officiel
                  </a>
                </span>
              </li>
              <li className="flex gap-2 items-center">
                <FaArrowRight className="text-yellow-400" />
                <span>
                  Vérifie bien que tu vois les vrais logos et noms en jeu !
                </span>
              </li>
            </ul>
          </div>

          {/* 3. Les liens magiques */}
          <div className="bg-gray-900/80 rounded-2xl shadow-xl p-7 border border-white/10 flex flex-col items-start text-left transition hover:scale-[1.01] hover:border-purple-400">
            <div className="flex items-center gap-3 mb-3">
              <FaSearch className="text-purple-400 text-2xl" />
              <h2 className="text-xl font-bold">3. Liens INDISPENSABLES</h2>
            </div>
            <ul className="pl-3 space-y-1 text-gray-200 text-base">
              <li><a href="https://guide.soccerverse.com/french" target="_blank" rel="noopener" className="underline hover:text-blue-300">Guide FR complet</a></li>
              <li><a href="https://wiki.soccerverse.com/index.php/Main_Page" target="_blank" rel="noopener" className="underline hover:text-blue-300">Wiki Soccerverse (EN)</a></li>
              <li><a href="https://soccerratings.org/players" target="_blank" rel="noopener" className="underline hover:text-blue-300">Ratings joueurs en temps réel</a></li>
              <li><a href="https://soccerverse.com/soccerverse-litepaper/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Litepaper (vision du jeu)</a></li>
              <li><a href="https://www.svfootball.com/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Recherche joueurs/clubs</a></li>
              <li><a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Hub articles & doc technique</a></li>
              <li><a href="https://soccerversetool.vercel.app/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Outils Soccerverse</a></li>
              <li><a href="https://elrincondeldt.com/soccerverse-prize-calculator.html" target="_blank" rel="noopener" className="underline hover:text-blue-300">Calculateur de récompenses</a></li>
            </ul>
          </div>

          {/* 4. Astuces de la commu */}
          <div className="bg-gray-900/80 rounded-2xl shadow-xl p-7 border border-white/10 flex flex-col items-start text-left transition hover:scale-[1.01] hover:border-pink-400">
            <div className="flex items-center gap-3 mb-3">
              <FaChartLine className="text-pink-400 text-2xl" />
              <h2 className="text-xl font-bold">4. Astuces de la commu FR</h2>
            </div>
            <ul className="list-disc pl-6 text-gray-200 text-base space-y-2">
              <li><b>Rotation :</b> Les joueurs se fatiguent (perte 26–29 fitness par match, récup +7/jour). Pense à faire tourner !</li>
              <li><b>Remplacements :</b> Max 2 anticipés, garde 1 pour blessure (sinon tu finis à 10 !).</li>
              <li><b>Jamais de blessés/suspendus sur le banc</b> (risque compo aléatoire !).</li>
              <li><b>Ratings MAJ tous les 6 mois</b>, anticipe avec Transfermarkt & soccerratings.</li>
              <li><b>Salaire = OVR :</b> Le salaire dépend du rating, pas de l’âge (<a href="https://elrincondeldt.com/soccerverse-agente-de-jugador.html" target="_blank" rel="noopener" className="underline text-yellow-300">tableau salaires</a>).</li>
              <li><b>Transferts :</b> 7 départs/arrivées max par saison/club, 2 prêts.</li>
              <li><b>Enchères :</b> Première mise = lancement (5 jours), sois patient.</li>
              <li><b>Influence :</b> Récompenses chaque semaine, gros gain en fin de saison via le classement.</li>
              <li><b>Wallet in game :</b> Transactions gratuites chaque jour.</li>
            </ul>
          </div>

        </section>

        {/* --- FAQ Débutants --- */}
        <section className="w-full max-w-4xl text-left mb-12">
          <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">FAQ Rapide</h2>
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
          <h2 className="text-2xl font-bold text-blue-300 mb-4 text-center">Communauté & Entraide</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <a href="https://discord.gg/soccerverse" target="_blank" rel="noopener" className="bg-blue-600 hover:bg-blue-800 transition rounded-xl px-8 py-4 text-xl flex items-center gap-3 shadow-lg mb-4 md:mb-0">
              <FaDiscord className="text-2xl" /> Discord FR/EN officiel
            </a>
            <a href="https://www.youtube.com/results?search_query=soccerverse+game" target="_blank" rel="noopener" className="bg-red-600 hover:bg-red-800 transition rounded-xl px-8 py-4 text-xl flex items-center gap-3 shadow-lg">
              <FaYoutube className="text-2xl" /> Youtube (Tutos/Gameplay)
            </a>
          </div>
          <div className="text-center text-sm text-gray-400 mt-4">
            Besoin d’aide ? Rejoins notre <a href="https://discord.gg/sd5aa8TW" target="_blank" rel="noopener" className="underline text-yellow-200 hover:text-yellow-400">Discord K-SOCIOS FR</a>, le <a href="https://discord.gg/soccerverse" target="_blank" rel="noopener" className="underline text-blue-300 hover:text-blue-500">Discord global</a> ou pose tes questions sur Twitter !
          </div>
        </section>

        <footer className="text-center text-gray-500 text-xs py-4 w-full">
          © 2025 SoccerverseBase – Guide débutant par la communauté FR
        </footer>
      </main>
    </div>
  );
}
