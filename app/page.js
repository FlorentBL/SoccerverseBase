// app/page.js
"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import SVCRate from "@/components/SVCRate";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="flex flex-col items-center justify-center text-center px-4 pt-28 pb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          SoccerverseBase <span className="inline-block">⚽</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-8">
          Découvrez tous les outils et statistiques pour dominer le Soccerverse.
        </p>
        <Link
          href="/recompenses"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold mb-12"
        >
          Accéder au Calculateur de Récompenses →
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h3 className="text-xl font-bold text-blue-400 mb-2">Récompenses</h3>
            <p className="text-sm text-gray-300">
              Calculez vos gains potentiels selon votre division et classement.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 opacity-70">
            <h3 className="text-xl font-bold text-gray-400 mb-2">Analyse des Joueurs</h3>
            <p className="text-sm text-gray-400">
              Bientôt disponible : suivez l’évolution de vos stars.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 opacity-70">
            <h3 className="text-xl font-bold text-gray-400 mb-2">Matchs et xG</h3>
            <p className="text-sm text-gray-400">
              Analyse tactique poussée des matchs par écart d’OVR et xG.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <SVCRate />
        </div>
      </main>
      <footer className="text-center text-gray-500 text-xs py-4">
        © 2025 SoccerverseBase – Créé par les fans, pour les fans
      </footer>
    </div>
  );
}
