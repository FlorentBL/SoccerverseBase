"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import SVCRate from "@/components/SVCRate";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="flex flex-col items-center px-4 pt-28 pb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-center">
          SoccerverseBase <span className="inline-block">⚽</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl text-center mb-8">
          Découvrez tous les outils et guides pour prendre l’avantage sur Soccerverse.
        </p>

        <Link
          href="/recompenses"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg mb-10 transition"
        >
          🎁 Accéder au Calculateur de Récompenses
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/10 shadow-md">
            <h3 className="text-xl font-bold text-green-400 mb-2">Récompenses</h3>
            <p className="text-sm text-gray-300">
              Calculez vos gains potentiels selon votre division et classement.
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 opacity-80 shadow">
            <h3 className="text-xl font-bold text-gray-300 mb-2">Analyse des Joueurs</h3>
            <p className="text-sm text-gray-400">
              Suivez l’évolution de vos stars et repérez les pépites (bientôt dispo).
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 opacity-80 shadow">
            <h3 className="text-xl font-bold text-gray-300 mb-2">Matchs & Statistiques</h3>
            <p className="text-sm text-gray-400">
              Analysez vos matchs et la progression de votre club sur le long terme.
            </p>
          </div>
        </div>

        <section className="w-full max-w-3xl bg-white/10 rounded-2xl p-8 border border-white/10 shadow-md">
          <h2 className="text-2xl font-bold text-green-400 mb-3">Débuter sur Soccerverse 🚀</h2>
          <ul className="mb-4 space-y-1">
            <li>
              <a
                href="https://soccerverse.com/soccerverse-litepaper"
                className="text-blue-400 underline hover:text-blue-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Litepaper Soccerverse
              </a>{" "}
              – Vision & économie du jeu.
            </li>
            <li>
              <a
                href="https://wiki.soccerverse.com/index.php/Main_Page"
                className="text-blue-400 underline hover:text-blue-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wiki Soccerverse
              </a>{" "}
              – Guide complet à lire absolument.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-green-300 mt-5 mb-2">Outils & Ressources :</h3>
          <ul className="mb-4 space-y-1">
            <li>
              <a href="https://soccerratings.org/players" className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                Soccer Ratings
              </a>{" "}
              – Note & évolution de tous les joueurs.
            </li>
            <li>
              <a href="https://www.svfootball.com/" className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                SV Football
              </a>{" "}
              – Moteur de recherche.
            </li>
            <li>
              <a href="https://hub.soccerverse.com/" className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                Soccerverse Hub
              </a>{" "}
              – Documentation technique.
            </li>
            <li>
              <a href="https://soccerversetool.vercel.app/" className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                Soccerverse Office
              </a>{" "}
              – Outils communautaires.
            </li>
            <li>
              <a href="https://elrincondeldt.com/soccerverse-prize-calculator.html" className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                Prize Calculator
              </a>{" "}
              – Simulateur de prizepool.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-green-300 mt-5 mb-2">Communauté francophone :</h3>
          <p>
            Rejoins le Discord <a href="https://discord.gg/sd5aa8TW" className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
              K-SOCIOS
            </a>{" "}pour échanger et progresser avec les meilleurs managers français !
          </p>

          <h3 className="text-lg font-semibold text-green-300 mt-5 mb-2">Conseils express pour bien débuter :</h3>
          <ul className="list-disc list-inside text-gray-200 text-sm space-y-1">
            <li>2 remplacements anticipés max, toujours garder 1 pour les imprévus.</li>
            <li>Jamais de blessé/suspendu sur le banc : range-les dans « Extra ».</li>
            <li>Le rythme rapide donne un impact immédiat, mais fatigue plus vite.</li>
            <li>Rotation : la forme baisse après chaque match, remonte chaque jour (+7/j).</li>
            <li>Ratings des joueurs actualisés tous les 6 mois : surveille leurs performances IRL !</li>
            <li>Les influences (parts) donnent accès aux votes et aux rewards.</li>
            <li>Mercato : 7 arrivées/départs max par saison. Prêts bientôt disponibles.</li>
          </ul>
        </section>

        <div className="mt-8">
          <SVCRate />
        </div>
      </main>
      <footer className="text-center text-gray-500 text-xs py-4">
        © 2025 SoccerverseBase – Créé par les fans, pour les fans
      </footer>
    </div>
  );
}
