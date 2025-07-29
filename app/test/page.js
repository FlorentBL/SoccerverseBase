"use client";

import Navbar from "@/components/Navbar";
import {
  FaBookOpen, FaSearch, FaChartLine, FaDiscord, FaUsers, FaCheckCircle, FaUserPlus, FaPuzzlePiece
} from "react-icons/fa";
import { useState } from "react";

const LOGO_MASCOTTE = "/logo.png";

const roles = [
  {
    title: "Coach",
    icon: <FaBookOpen className="text-sky-300 text-2xl" />,
    description: "Dirige l’équipe en match, prépare la tactique, motive les joueurs.",
    forWhom: "Pour les stratèges qui aiment mener leur équipe à la victoire."
  },
  {
    title: "Agent",
    icon: <FaUserPlus className="text-yellow-300 text-2xl" />,
    description: "Négocie transferts, contrats, protège la carrière des joueurs.",
    forWhom: "Pour les négociateurs qui flairent les bonnes affaires."
  },
  {
    title: "Influenceur",
    icon: <FaUsers className="text-blue-400 text-2xl" />,
    description: "Vote les décisions majeures, investit dans les clubs/joueurs.",
    forWhom: "Pour les investisseurs et fans d’influence dans la gestion."
  },
  {
    title: "Trader",
    icon: <FaChartLine className="text-pink-300 text-2xl" />,
    description: "Achète et revend des parts de clubs/joueurs, profite du marché.",
    forWhom: "Pour les amateurs de bourse ou de paris sportifs."
  },
  {
    title: "Scout",
    icon: <FaSearch className="text-purple-300 text-2xl" />,
    description: "Repère les jeunes talents et mise sur leur futur.",
    forWhom: "Pour les dénicheurs et passionnés de scouting."
  }
];

export default function AccueilSoccerverseBase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      <Navbar />

      {/* Intro clarity box */}
      <div className="w-full flex justify-center pt-5">
        <div className="bg-sky-900/80 border border-sky-400/40 px-6 py-3 rounded-xl shadow max-w-2xl text-center text-base md:text-lg font-semibold text-white">
          <span>
            <b>Soccerverse</b> est un <b>jeu de management de football</b> où tu incarnes coach, agent ou investisseur. 
            <span className="text-sky-300 font-bold block md:inline"> Joue à ton rythme, progresse et gagne !</span>
          </span>
        </div>
      </div>

      {/* Hero section */}
      <section className="relative w-full min-h-[370px] flex flex-col items-center justify-center bg-gradient-to-br from-sky-950 via-gray-900 to-emerald-950 pb-10 pt-8 shadow-2xl">
        <img
          src={LOGO_MASCOTTE}
          alt="Logo"
          className="absolute right-6 top-10 w-28 md:w-40 opacity-20 pointer-events-none select-none hidden md:block"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-500 bg-clip-text text-transparent drop-shadow-lg mb-3 mt-8 text-center">
          SoccerverseBase
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-6 text-center max-w-2xl">
          Prends ta place dans le plus grand univers de foot décentralisé : dirige, investis, négocie, et marque l’histoire du jeu !
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg mt-2">
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 rounded-xl px-7 py-4 text-lg font-bold shadow transition w-full focus:outline-none"
          >
            <FaUserPlus className="text-xl" /> Commencer maintenant
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

      {/* Bandeau chiffres clés */}
      <section className="w-full flex justify-center mt-6 mb-10">
        <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-6 bg-gradient-to-r from-sky-900/80 via-emerald-900/70 to-sky-900/80 rounded-2xl shadow-lg border border-sky-500/10 max-w-4xl w-full">
          <div className="flex flex-col items-center min-w-[110px]">
            <span className="text-3xl font-bold text-sky-300">5 350</span>
            <span className="text-sm text-gray-200 mt-1">Clubs jouables</span>
          </div>
          <div className="flex flex-col items-center min-w-[110px]">
            <span className="text-3xl font-bold text-emerald-300">145 000</span>
            <span className="text-sm text-gray-200 mt-1">Joueurs réels</span>
          </div>
          <div className="flex flex-col items-center min-w-[110px]">
            <span className="text-3xl font-bold text-pink-300">322</span>
            <span className="text-sm text-gray-200 mt-1">Ligues</span>
          </div>
          <div className="flex flex-col items-center min-w-[110px]">
            <span className="text-3xl font-bold text-yellow-200">+3 000</span>
            <span className="text-sm text-gray-200 mt-1">Managers actifs</span>
          </div>
          <div className="flex flex-col items-center min-w-[110px]">
            <span className="text-3xl font-bold text-purple-300">100%</span>
            <span className="text-sm text-gray-200 mt-1">Multijoueur</span>
          </div>
        </div>
      </section>

      {/* Communauté Discord */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-8 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-lg px-6 md:px-10 py-8 md:py-10 border border-emerald-600/20 max-w-3xl mx-auto mb-10">
        <FaDiscord className="text-5xl text-sky-400 hidden md:block mr-6" />
        <div className="flex-1 flex flex-col items-center md:items-start">
          <h2 className="text-2xl font-bold mb-2 text-white">Communauté française K-SOCIOS</h2>
          <p className="text-base text-gray-200 mb-4">
            Espace d’entraide, discussions, astuces, infos en direct.<br />
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

      {/* Simplicity + Process */}
      <div className="flex flex-col items-center bg-emerald-800/80 border border-emerald-400/40 rounded-xl py-3 px-4 mt-6 max-w-2xl mx-auto">
        <span className="font-semibold text-white text-lg">Débuter, c'est simple :</span>
        <ul className="text-emerald-100 text-sm mt-2 list-disc list-inside text-left">
          <li>Inscription en 30s : Discord, Google, e-mail, etc.</li>
          <li>Choisis ton ou tes rôles, ou découvre tout en même temps.</li>
          <li>Progresse à ton rythme : la commu t’aide si besoin.</li>
        </ul>
      </div>

      {/* Rôles */}
      <section className="w-full max-w-5xl mx-auto px-3 mt-10 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 text-center">Choisis ton style de jeu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, idx) => (
            <div key={idx} className="bg-gray-900/90 border-l-4 rounded-xl shadow p-5 flex flex-col border-sky-500/30 hover:border-sky-400 transition-all min-h-[170px]">
              <div className="flex items-center mb-2">
                {role.icon}
                <span className="font-bold text-lg text-white ml-2">{role.title}</span>
              </div>
              <span className="text-gray-300 text-sm mb-1">{role.description}</span>
              <span className="text-sky-200 text-xs">{role.forWhom}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs italic text-center mt-5">
          <FaCheckCircle className="inline mr-1 text-emerald-400" />
          Tu peux cumuler les rôles ou te spécialiser, à toi de jouer.
        </p>
      </section>

      {/* Étapes simples */}
      <section className="w-full max-w-3xl mx-auto px-2 mt-10 mb-8">
        <h2 className="text-xl font-bold mb-4 text-white text-center">Comment ça marche&nbsp;?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="flex flex-col items-center p-4 bg-gray-900/80 rounded-xl shadow">
            <FaUserPlus className="text-3xl text-sky-300 mb-2" />
            <span className="font-bold text-white mb-1">1. Je m’inscris</span>
            <span className="text-gray-300 text-sm text-center">30s via Discord, Google, ou e-mail</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-900/80 rounded-xl shadow">
            <FaBookOpen className="text-3xl text-emerald-300 mb-2" />
            <span className="font-bold text-white mb-1">2. Je choisis mon rôle</span>
            <span className="text-gray-300 text-sm text-center">Coach, agent, trader, ou tout tester</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-900/80 rounded-xl shadow">
            <FaChartLine className="text-3xl text-pink-300 mb-2" />
            <span className="font-bold text-white mb-1">3. Je joue & je progresse</span>
            <span className="text-gray-300 text-sm text-center">Découvre, gagne, et rejoins la commu !</span>
          </div>
        </div>
      </section>

      

      {/* Liens essentiels */}
      <section className="w-full max-w-2xl mx-auto px-2 mt-5 mb-6">
        <h2 className="text-xl font-bold mb-3 text-white flex items-center gap-2">
          <FaSearch className="text-sky-400" /> Liens essentiels pour progresser
        </h2>
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
      </section>

      {/* Astuces communautaires */}
      <section className="w-full max-w-2xl mx-auto px-2 mb-12">
        <h2 className="text-xl font-bold mb-3 text-white flex items-center gap-2">
          <FaChartLine className="text-pink-400" /> Astuces pour bien débuter
        </h2>
        <ul className="list-disc pl-5 text-gray-300 text-base space-y-2">
          <li><b>Rotation :</b> fatigue réelle (perte 26–29 fitness/match, récup +7/jour). Fais tourner !</li>
          <li><b>Remplacements :</b> max 2 anticipés, garde 1 pour blessure.</li>
          <li><b>Jamais de blessés/suspendus sur le banc</b> (risque compo aléatoire !)</li>
          <li><b>Ratings MAJ tous les 6 mois</b> (utilise Transfermarkt & soccerratings).</li>
          <li><b>Salaire = OVR</b> (<a href="https://svbase.vercel.app/revenus" target="_blank" rel="noopener" className="underline text-yellow-300">voir le tableau</a>), pas l’âge !</li>
          <li><b>Transferts :</b> 7 départs/arrivées max/saison/club, 2 prêts.</li>
          <li><b>Influence :</b> récompenses chaque semaine + en fin de saison.</li>
          <li><b>Wallet in game :</b> transactions gratuites chaque jour.</li>
        </ul>
      </section>

      <footer className="text-center text-gray-500 text-xs py-4 w-full">
        SoccerverseBase &copy; {new Date().getFullYear()} – Guide non-officiel, commu FR indépendante
      </footer>
    </div>
  );
}
