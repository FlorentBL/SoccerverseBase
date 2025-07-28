"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FaBookOpen, FaSearch, FaChartLine, FaDiscord, FaYoutube, FaTrophy, FaUsers, FaArrowRight } from "react-icons/fa";

export default function DebuterPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="flex flex-col items-center text-center px-4 pt-28 pb-16">

        {/* Titre principal */}
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
          Bienvenue sur SoccerverseBase ! <span className="inline-block">⚽</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mb-8">
          <span className="text-green-400 font-bold">Nouveau sur Soccerverse ?</span><br />
          Voici le guide complet pour bien débuter, progresser et profiter à fond de l’expérience !
        </p>

        {/* SECTION K-SOCIOS */}
        <section className="w-full max-w-3xl mb-10">
          <div className="bg-gradient-to-r from-yellow-500/80 to-green-500/70 rounded-2xl shadow-lg p-7 border border-yellow-400/30 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-white text-2xl" />
              <h2 className="text-2xl font-bold text-white drop-shadow">Rejoins la communauté française K-SOCIOS ! 🇫🇷</h2>
            </div>
            <p className="text-base text-white mb-4">
              Pour poser tes questions, échanger des astuces, trouver un club, organiser des ligues FR ou juste papoter foot : <br />
              <span className="font-semibold text-yellow-100">Notre Discord K-SOCIOS t’accueille !</span>
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
              (C’est ici que tu trouveras le plus d’aide et d’entraide pour les francophones !)
            </p>
          </div>
        </section>

        {/* --- SECTIONS ESSENTIELLES --- */}
        <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

{/* 1. Comprendre Soccerverse */}
<div className="bg-white/10 rounded-2xl shadow-lg p-7 border border-white/10 flex flex-col items-start text-left">
  <div className="flex items-center gap-3 mb-2">
    <FaBookOpen className="text-blue-400 text-2xl" />
    <h2 className="text-xl font-bold">1. Comprendre Soccerverse</h2>
  </div>
  <div className="text-gray-200 text-base space-y-3">
    <p>
      <b>Soccerverse</b> est un jeu de simulation de management football en ligne, 
      unique par son lien avec le football réel : <b>les performances et transferts IRL 
      influencent directement le jeu</b> !
    </p>
    <p>
      Tu n’es pas un simple coach. Tu peux :
      <ul className="list-disc pl-6 mt-2">
        <li>
          <b>Investir</b> dans des clubs ou des joueurs en achetant des parts ("influence"). 
          Plus tu possèdes de parts, plus tu as ton mot à dire dans la gestion.
        </li>
        <li>
          <b>Prendre des rôles</b> : deviens coach, agent ou actionnaire majoritaire, chacun ayant un pouvoir réel sur les décisions du club (compo, mercato, finances…).
        </li>
        <li>
          <b>Participer à la vie du club</b> : tu votes pour nommer ou virer un coach, négocier les salaires, transférer les joueurs, choisir les tactiques, etc.
        </li>
      </ul>
    </p>
    <p>
      <b>Tout est communautaire</b> : chaque club et chaque joueur appartient à la communauté des actionnaires, agents, fans, etc. Le jeu évolue selon la stratégie, l'organisation collective et les décisions prises ensemble.
    </p>
    <p>
      <b>Les points-clés du gameplay</b> :
      <ul className="list-disc pl-6 mt-2">
        <li>
          <b>Gestion réaliste</b> : effectif, finances, mercato, entraînements, blessures, rotation... tout compte.
        </li>
        <li>
          <b>Marché en temps réel</b> : échanges, ventes aux enchères, recrutement, tout comme dans un vrai club.
        </li>
        <li>
          <b>Gains et récompenses :</b> chaque semaine, puis à la fin de la saison, tu gagnes selon la réussite de tes clubs et joueurs. 
          Plus ton club ou ton joueur performe, plus tu gagnes !
        </li>
        <li>
          <b>Impact IRL :</b> Un joueur marque en vrai ? Son rating augmente lors de la prochaine MAJ. Un club vend un joueur IRL ? Il bouge aussi dans Soccerverse.
        </li>
      </ul>
    </p>
    <p>
      <b>Ce qui rend Soccerverse unique</b> : tout est décidé par la communauté : composition d’équipe, mercato, nominations, votes, tactiques… Tu peux vraiment influencer le destin de clubs réels ou de jeunes espoirs.
    </p>
    <p className="mt-3 text-blue-300 text-sm">
      <b>Exemples :</b><br />
      – Tu es actionnaire majoritaire d’un club ? C’est toi (et les autres actionnaires) qui choisissez l’entraîneur, les recrues, etc.<br />
      – Tu es agent d’un joueur ? Tu participes à la négociation de ses contrats.<br />
      – Tu veux juste investir ? Achète des parts et reçois des récompenses selon la performance.
    </p>
  </div>
</div>


          {/* 2. S’inscrire & installer le pack FR */}
          <div className="bg-white/10 rounded-2xl shadow-lg p-7 border border-white/10 flex flex-col items-start text-left">
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-green-400 text-2xl" />
              <h2 className="text-xl font-bold">2. Inscription & Patch Communauté</h2>
            </div>
            <ul className="list-disc pl-6 text-gray-200 text-base space-y-2">
              <li><b>Inscris-toi ici (penses a nous pour le parrainage : On est dans le discord K-Socios !) :</b> <a href="https://play.soccerverse.com/&pack=https://elrincondeldt.com/sv/rincon_v1.json" target="_blank" rel="noopener" className="underline text-green-300 hover:text-green-500">Créer un compte Soccerverse</a></li>
              <li>Installe le <b>Pack FR</b> (noms, logos, photos officielles) via ce <a href="https://elrincondeldt.com/sv/rincon_v1.json" target="_blank" rel="noopener" className="underline text-yellow-300 hover:text-yellow-500">fichier</a> (juste cliquer !)</li>
              <li>Vérifie que tu vois bien les noms/logos d’équipes françaises.</li>
            </ul>
          </div>

          {/* 3. Les liens magiques */}
          <div className="bg-white/10 rounded-2xl shadow-lg p-7 border border-white/10 flex flex-col items-start text-left">
            <div className="flex items-center gap-3 mb-2">
              <FaSearch className="text-purple-400 text-2xl" />
              <h2 className="text-xl font-bold">3. Les liens INDISPENSABLES</h2>
            </div>
            <ul className="pl-3 space-y-1 text-gray-200 text-base">
              <li><a href="https://guide.soccerverse.com/french" target="_blank" rel="noopener" className="underline hover:text-blue-300">Guide FR complet</a></li>
              <li><a href="https://wiki.soccerverse.com/index.php/Main_Page" target="_blank" rel="noopener" className="underline hover:text-blue-300">Wiki Soccerverse (anglais)</a></li>
              <li><a href="https://soccerratings.org/players" target="_blank" rel="noopener" className="underline hover:text-blue-300">Ratings à jour de tous les joueurs</a></li>
              <li><a href="https://soccerverse.com/soccerverse-litepaper/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Litepaper officiel</a></li>
              <li><a href="https://www.svfootball.com/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Recherche rapide joueurs/clubs</a></li>
              <li><a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Hub communautaire & articles</a></li>
              <li><a href="https://soccerversetool.vercel.app/" target="_blank" rel="noopener" className="underline hover:text-blue-300">Outils & calculateurs Soccerverse</a></li>
              <li><a href="https://elrincondeldt.com/soccerverse-prize-calculator.html" target="_blank" rel="noopener" className="underline hover:text-blue-300">Calculateur de récompenses</a></li>
            </ul>
          </div>

          {/* 4. Questions de débutant / Astuces */}
          <div className="bg-white/10 rounded-2xl shadow-lg p-7 border border-white/10 flex flex-col items-start text-left">
            <div className="flex items-center gap-3 mb-2">
              <FaChartLine className="text-pink-400 text-2xl" />
              <h2 className="text-xl font-bold">4. Astuces de la commu FR</h2>
            </div>
            <ul className="list-disc pl-6 text-gray-200 text-base space-y-2">
              <li><b>Rotation !</b> Les joueurs se fatiguent (perte 26–29 fitness par match de 90min, récup +7/jour). Pense à la rotation de l’effectif.</li>
              <li><b>Remplacements :</b> Max 2 anticipés, garde 1 pour blessure sinon tu finis à 10 !</li>
              <li><b>Jamais de blessés/suspendus sur le banc</b> (risque compo aléatoire !)</li>
              <li><b>Les ratings sont mis à jour tous les 6 mois</b>, regarde Transfermarkt et soccerratings.org pour anticiper !</li>
              <li><b>Gère bien tes finances :</b> Le salaire dépend du rating OVR du joueur (<a href="https://elrincondeldt.com/soccerverse-agente-de-jugador.html" target="_blank" rel="noopener" className="underline hover:text-yellow-300">tableau salaires ici</a>), pas de l’âge !</li>
              <li><b>Marché des transferts :</b> max 7 départs/arrivées par saison/club, 2 prêts.</li>
              <li><b>Enchères</b> : la 1ère mise lance l’enchère (5 jours), n’achète pas trop tôt !</li>
              <li><b>Influence & récompenses</b> : tu gagnes chaque semaine selon tes parts et à la fin de la saison via le classement du club.</li>
              <li><b>Wallet in game :</b> permet des transactions gratuites chaque jour.</li>
            </ul>
          </div>

        </section>

        {/* --- FAQ Débutants --- */}
        <section className="w-full max-w-4xl text-left mb-12">
          <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">FAQ Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Comment investir ?</b>
              <div className="text-sm text-gray-300 mt-1">Achetez des packs influence pour clubs/joueurs sur le store, ou sur le marché secondaire. Plus d’infos dans le <a href="https://guide.soccerverse.com/french" target="_blank" rel="noopener" className="underline">guide</a>.</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Puis-je gérer plusieurs clubs ?</b>
              <div className="text-sm text-gray-300 mt-1">Oui, multi-compte autorisé, mais attention à bien séparer tes wallets !</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Les salaires dépendent de l’âge ?</b>
              <div className="text-sm text-gray-300 mt-1">Non, uniquement du rating OVR (voir <a href="https://elrincondeldt.com/soccerverse-agente-de-jugador.html" target="_blank" rel="noopener" className="underline">tableau</a>).</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Où suivre les updates ?</b>
              <div className="text-sm text-gray-300 mt-1">Le <a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline">Hub</a> et le <a href="https://discord.gg/soccerverse" target="_blank" rel="noopener" className="underline">Discord global</a> sont tes alliés !</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Comment améliorer mon équipe ?</b>
              <div className="text-sm text-gray-300 mt-1">Scout régulièrement, surveille les jeunes à haut potentiel IRL, et optimise les remplacements !</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <b>Existe-t-il des tutos vidéo ?</b>
              <div className="text-sm text-gray-300 mt-1">Majoritairement en anglais/espagnol sur Youtube. Pas encore de chaîne FR officielle… mais la commu s’active !</div>
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
