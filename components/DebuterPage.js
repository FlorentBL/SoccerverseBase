"use client";

import {
  FaBookOpen, FaSearch, FaChartLine, FaDiscord, FaUsers, FaCheckCircle,
  FaUserPlus, FaPuzzlePiece, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { useState } from "react";

const LOGO_MASCOTTE = "/logo.png";

// Map icônes pour injection dynamique depuis le mapping de chaque langue
const ICONS = {
  book: <FaBookOpen className="text-sky-400 text-2xl mr-2" />,
  users: <FaUsers className="text-emerald-400 text-2xl mr-2" />,
  search: <FaSearch className="text-blue-400 text-2xl mr-2" />,
  chart: <FaChartLine className="text-pink-400 text-2xl mr-2" />,
};

const LABELS = {
  fr: {
    hero1: "SoccerverseBase",
    hero2: <>Guide pratique pour débuter et progresser sur Soccerverse.<br />Accède rapidement aux ressources, infos et à la communauté FR.</>,
    signup: "Inscription Soccerverse",
    patch: "Patch FR (logos, noms)",
    discordTitle: "Communauté française K-SOCIOS",
    discordText: <>Espace d’entraide, discussion et informations pour les francophones.<br />Rejoins le Discord pour poser tes questions ou échanger avec la commu.</>,
    discordBtn: "Rejoindre le Discord K-SOCIOS",
    sections: [
      {
        key: "soccerverse",
        icon: "book",
        title: "Comprendre Soccerverse",
        content: (
          <>
            <p className="mb-3 text-gray-300">
              <b>Soccerverse</b> est un jeu de simulation de management football <b>connecté à l’actualité réelle</b> : les performances et transferts IRL influencent directement le jeu.
            </p>
            <ul className="list-none mt-2 space-y-2">
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Actionnaire</b> : investis dans des clubs ou joueurs (parts d’influence). Tu gagnes selon leurs résultats.</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Coach ou agent</b> : sois élu coach par la commu, négocie transferts, salaires, compositions...</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Décisions collectives</b> : tout se joue à plusieurs (votes pour coach, mercato, tactiques...).</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Gameplay réaliste</b> : gestion de l’effectif, finances, blessures, transferts en temps réel...</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Gains</b> : recettes chaque semaine, prime de fin de saison selon la perf du club/joueur.</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Impact IRL</b> : perf ou transfert réel = évolution dans le jeu !</span></li>
            </ul>
            <p className="text-xs text-sky-200 mt-4">
              <b>Exemple :</b> tu es agent d’un jeune ? S’il explose IRL, sa valeur grimpe dans le jeu.<br />
              Tu votes pour recruter, vendre, ou changer de coach.
            </p>
          </>
        ),
      },
      {
        key: "roles",
        icon: "users",
        title: "Les rôles dans Soccerverse",
        content: (
          <div>
            <p className="mb-6 text-gray-300">
              <b>Tu peux cumuler plusieurs rôles</b> selon tes envies : stratège, investisseur, négociateur ou dénicheur de talents.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* ENTRAÎNEUR */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-emerald-700/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaBookOpen className="text-emerald-400" /><span className="font-bold text-emerald-200">Entraîneur</span></div>
                <span className="text-xs text-emerald-300 mb-1">Le stratège</span>
                <span className="text-gray-300 text-sm flex-1">Prépare les matchs, gère mercato & effectif, décisions sportives. Diplomatie & vision !</span>
              </div>
              {/* AGENT */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-yellow-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaUserPlus className="text-yellow-300" /><span className="font-bold text-yellow-100">Agent</span></div>
                <span className="text-xs text-yellow-200 mb-1">Le négociateur</span>
                <span className="text-gray-300 text-sm flex-1">Gère transferts, contrats, carrière et moral du joueur. Intermédiaire-clé.</span>
              </div>
              {/* INFLUENCEUR */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-blue-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaUsers className="text-blue-400" /><span className="font-bold text-blue-100">Influenceur</span></div>
                <span className="text-xs text-blue-200 mb-1">L’actionnaire</span>
                <span className="text-gray-300 text-sm flex-1">Vote les grandes décisions, vise le profit sur le long terme. Plus de parts = plus de poids !</span>
              </div>
              {/* TRADER */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-pink-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaChartLine className="text-pink-400" /><span className="font-bold text-pink-100">Trader</span></div>
                <span className="text-xs text-pink-200 mb-1">Le spéculateur</span>
                <span className="text-gray-300 text-sm flex-1">Profite des variations du marché d’influence, achète bas, vends haut !</span>
              </div>
              {/* SCOUT */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-purple-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaSearch className="text-purple-300" /><span className="font-bold text-purple-100">Scout</span></div>
                <span className="text-xs text-purple-200 mb-1">Le découvreur</span>
                <span className="text-gray-300 text-sm flex-1">Repère les jeunes à potentiel. Clé pour gagner gros !</span>
              </div>
            </div>
            <p className="text-gray-500 mt-8 text-xs italic text-center"><FaCheckCircle className="inline mr-1 text-emerald-400" />Combine les rôles à volonté pour une expérience unique.</p>
          </div>
        ),
      },
      {
        key: "links",
        icon: "search",
        title: "Liens indispensables",
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
        icon: "chart",
        title: "Astuces de la commu FR",
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
    ]
  },
  en: {
    hero1: "SoccerverseBase",
    hero2: <>Practical guide to start and improve your Soccerverse experience.<br />Fast access to resources, info, and the international community.</>,
    signup: "Sign up to Soccerverse",
    patch: "Patch (logos, names)",
    discordTitle: "K-SOCIOS International Community",
    discordText: <>Place for support, discussion, and sharing info about Soccerverse.<br />Join our Discord to ask questions and connect with other players.</>,
    discordBtn: "Join K-SOCIOS Discord",
    sections: [
      {
        key: "soccerverse",
        icon: "book",
        title: "What is Soccerverse?",
        content: (
          <>
            <p className="mb-3 text-gray-300">
              <b>Soccerverse</b> is a next-gen football management simulation game <b>connected to real-life football news</b>: real performances and transfers impact the game live.
            </p>
            <ul className="list-none mt-2 space-y-2">
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Shareholder</b>: Invest in clubs or players (influence shares). Earn SVC each week based on their results.</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Coach or Agent</b>: Get elected as coach by the community, manage transfers, salaries, lineups...</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Collective Decisions</b>: Everything is decided together (votes for coach, transfers, tactics...).</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Realistic Gameplay</b>: Squad management, finances, injuries, and real-time transfers...</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Weekly Earnings</b>: Collect rewards every week, plus end-of-season bonuses based on club/player performance.</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>IRL Impact</b>: Real-life performances or transfers = evolution in the game!</span></li>
            </ul>
            <p className="text-xs text-sky-200 mt-4">
              <b>Example:</b> Acting as an agent for a young player? If he shines IRL, his value skyrockets in-game.<br />
              You vote to sign, sell, or even replace the coach.
            </p>
          </>
        ),
      },
      {
        key: "roles",
        icon: "users",
        title: "Roles in Soccerverse",
        content: (
          <div>
            <p className="mb-6 text-gray-300">
              <b>You can take on multiple roles</b> based on your style: strategist, investor, negotiator, or talent scout.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* COACH */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-emerald-700/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaBookOpen className="text-emerald-400" /><span className="font-bold text-emerald-200">Coach</span></div>
                <span className="text-xs text-emerald-300 mb-1">The Strategist</span>
                <span className="text-gray-300 text-sm flex-1">Prepare matches, manage transfer market & squad, make sporting decisions. Diplomacy & vision required!</span>
              </div>
              {/* AGENT */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-yellow-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaUserPlus className="text-yellow-300" /><span className="font-bold text-yellow-100">Agent</span></div>
                <span className="text-xs text-yellow-200 mb-1">The Negotiator</span>
                <span className="text-gray-300 text-sm flex-1">Handle transfers, contracts, player career and morale. A key middleman!</span>
              </div>
              {/* INFLUENCER */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-blue-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaUsers className="text-blue-400" /><span className="font-bold text-blue-100">Influencer</span></div>
                <span className="text-xs text-blue-200 mb-1">The Shareholder</span>
                <span className="text-gray-300 text-sm flex-1">Vote on major decisions, aim for long-term profit. More shares = more power!</span>
              </div>
              {/* TRADER */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-pink-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaChartLine className="text-pink-400" /><span className="font-bold text-pink-100">Trader</span></div>
                <span className="text-xs text-pink-200 mb-1">The Speculator</span>
                <span className="text-gray-300 text-sm flex-1">Profit from influence market fluctuations. Buy low, sell high!</span>
              </div>
              {/* SCOUT */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-purple-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaSearch className="text-purple-300" /><span className="font-bold text-purple-100">Scout</span></div>
                <span className="text-xs text-purple-200 mb-1">The Talent Finder</span>
                <span className="text-gray-300 text-sm flex-1">Spot the next big things. Essential to win big!</span>
              </div>
            </div>
            <p className="text-gray-500 mt-8 text-xs italic text-center">
              <FaCheckCircle className="inline mr-1 text-emerald-400" />
              Mix roles freely for a unique experience.
            </p>
          </div>
        ),
      },
      {
        key: "links",
        icon: "search",
        title: "Key Links",
        content: (
          <ul className="pl-1 space-y-1 text-gray-200 text-base">
            <li><a href="https://guide.soccerverse.com/english" target="_blank" rel="noopener" className="underline hover:text-sky-300">Complete EN Guide</a></li>
            <li><a href="https://wiki.soccerverse.com/index.php/Main_Page" target="_blank" rel="noopener" className="underline hover:text-sky-300">Soccerverse Wiki (EN)</a></li>
            <li><a href="https://soccerratings.org/players" target="_blank" rel="noopener" className="underline hover:text-sky-300">Live Player Ratings</a></li>
            <li><a href="https://soccerverse.com/soccerverse-litepaper/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Litepaper (Game Vision)</a></li>
            <li><a href="https://www.svfootball.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Player/Club Search</a></li>
            <li><a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Tech Hub & Docs</a></li>
            <li><a href="https://soccerversetool.vercel.app/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Soccerverse Tools</a></li>
            <li><a href="https://elrincondeldt.com/soccerverse-prize-calculator.html" target="_blank" rel="noopener" className="underline hover:text-sky-300">Prize Calculator</a></li>
          </ul>
        ),
      },
      {
        key: "tips",
        icon: "chart",
        title: "Pro Community Tips",
        content: (
          <ul className="list-disc pl-5 text-gray-300 text-base space-y-2">
            <li><b>Rotation</b>: Real fatigue (lose 26–29 fitness per match, recover +7/day). Rotate your squad!</li>
            <li><b>Subs</b>: Max 2 planned, always keep 1 in case of injury.</li>
            <li><b>No injured/suspended players on the bench</b> (risk of random lineup!)</li>
            <li><b>Ratings updated every 6 months</b> (use Transfermarkt & soccerratings).</li>
            <li><b>Salary = OVR</b> (<a href="https://svbase.vercel.app/revenus" target="_blank" rel="noopener" className="underline text-yellow-300">see table</a>), not age!</li>
            <li><b>Transfers</b>: 7 in/out max per season/club, 2 loans.</li>
            <li><b>Bids</b>: First bid starts the auction (5 days), be patient.</li>
            <li><b>Influence</b>: Weekly + end-of-season rewards.</li>
            <li><b>Wallet in game</b>: Free transactions every day.</li>
          </ul>
        ),
      }
    ]
  },
  it: {
    hero1: "SoccerverseBase",
    hero2: <>Guida pratica per iniziare e progredire su Soccerverse.<br />Accedi rapidamente alle risorse, informazioni e alla community italiana.</>,
    signup: "Iscriviti a Soccerverse",
    patch: "Patch IT (loghi, nomi)",
    discordTitle: "K-SOCIOS – Community internazionale",
discordText: <>
  Server gestito dalla community francese, ma aperto a tutti!<br />
  Scambia idee, fai domande e unisciti a manager di ogni paese.<br />
  Entra e partecipa alle discussioni in francese, inglese o italiano.
</>,
discordBtn: "Unisciti a K-SOCIOS su Discord",
    sections: [
      {
        key: "soccerverse",
        icon: "book",
        title: "Cos'è Soccerverse?",
        content: (
          <>
            <p className="mb-3 text-gray-300">
              <b>Soccerverse</b> è un gioco di simulazione calcistica di nuova generazione <b>connesso alle notizie reali</b>: le prestazioni e i trasferimenti reali influenzano il gioco in tempo reale.
            </p>
            <ul className="list-none mt-2 space-y-2">
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Azionista</b>: Investi in club o giocatori (quote d'influenza). Guadagna SVC ogni settimana in base ai risultati.</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Allenatore o Agente</b>: Vieni eletto allenatore dalla community, gestisci trasferimenti, stipendi, formazioni...</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Decisioni collettive</b>: Tutto si decide insieme (voti per allenatore, mercato, tattiche...).</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Gameplay realistico</b>: Gestione rosa, finanze, infortuni e trasferimenti in tempo reale...</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Guadagni settimanali</b>: Ricompense ogni settimana, più bonus a fine stagione in base alle prestazioni di club/giocatore.</span></li>
              <li className="flex gap-2 items-start"><FaCheckCircle className="text-sky-400 mt-1" /><span><b>Impatto reale</b>: Prestazione o trasferimento reale = evoluzione nel gioco!</span></li>
            </ul>
            <p className="text-xs text-sky-200 mt-4">
              <b>Esempio:</b> Sei agente di un giovane talento? Se esplode nella realtà, il suo valore sale alle stelle anche nel gioco.<br />
              Voti per acquistare, vendere o persino cambiare allenatore.
            </p>
          </>
        ),
      },
      {
        key: "roles",
        icon: "users",
        title: "Ruoli in Soccerverse",
        content: (
          <div>
            <p className="mb-6 text-gray-300">
              <b>Puoi ricoprire più ruoli</b> secondo il tuo stile: stratega, investitore, negoziatore o talent scout.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* ALLENATORE */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-emerald-700/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaBookOpen className="text-emerald-400" /><span className="font-bold text-emerald-200">Allenatore</span></div>
                <span className="text-xs text-emerald-300 mb-1">Lo stratega</span>
                <span className="text-gray-300 text-sm flex-1">Prepara le partite, gestisce mercato & rosa, decisioni sportive. Diplomazia & visione!</span>
              </div>
              {/* AGENTE */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-yellow-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaUserPlus className="text-yellow-300" /><span className="font-bold text-yellow-100">Agente</span></div>
                <span className="text-xs text-yellow-200 mb-1">Il negoziatore</span>
                <span className="text-gray-300 text-sm flex-1">Gestisce trasferimenti, contratti, carriera e morale del giocatore. Intermediario chiave!</span>
              </div>
              {/* INFLUENCER */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-blue-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaUsers className="text-blue-400" /><span className="font-bold text-blue-100">Influencer</span></div>
                <span className="text-xs text-blue-200 mb-1">L’azionista</span>
                <span className="text-gray-300 text-sm flex-1">Vota sulle decisioni importanti, punta al profitto a lungo termine. Più quote = più peso!</span>
              </div>
              {/* TRADER */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-pink-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaChartLine className="text-pink-400" /><span className="font-bold text-pink-100">Trader</span></div>
                <span className="text-xs text-pink-200 mb-1">Lo speculatore</span>
                <span className="text-gray-300 text-sm flex-1">Sfrutta le fluttuazioni del mercato d’influenza. Compra basso, vendi alto!</span>
              </div>
              {/* SCOUT */}
              <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-purple-500/30 shadow p-5 flex flex-col min-h-[170px]">
                <div className="flex items-center gap-2 mb-1"><FaSearch className="text-purple-300" /><span className="font-bold text-purple-100">Scout</span></div>
                <span className="text-xs text-purple-200 mb-1">Il talent scout</span>
                <span className="text-gray-300 text-sm flex-1">Scova i giovani di talento. La chiave per vincere alla grande!</span>
              </div>
            </div>
            <p className="text-gray-500 mt-8 text-xs italic text-center">
              <FaCheckCircle className="inline mr-1 text-emerald-400" />
              Combina i ruoli come vuoi per un’esperienza unica.
            </p>
          </div>
        ),
      },
      {
        key: "links",
        icon: "search",
        title: "Link utili",
        content: (
          <ul className="pl-1 space-y-1 text-gray-200 text-base">
            <li><a href="https://guide.soccerverse.com/italian" target="_blank" rel="noopener" className="underline hover:text-sky-300">Guida IT completa</a></li>
            <li><a href="https://wiki.soccerverse.com/index.php/Main_Page" target="_blank" rel="noopener" className="underline hover:text-sky-300">Wiki Soccerverse (EN)</a></li>
            <li><a href="https://soccerratings.org/players" target="_blank" rel="noopener" className="underline hover:text-sky-300">Ratings giocatori in tempo reale</a></li>
            <li><a href="https://soccerverse.com/soccerverse-litepaper/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Litepaper (visione di gioco)</a></li>
            <li><a href="https://www.svfootball.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Cerca giocatori/club</a></li>
            <li><a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Hub tecnico & articoli</a></li>
            <li><a href="https://soccerversetool.vercel.app/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Strumenti Soccerverse</a></li>
            <li><a href="https://elrincondeldt.com/soccerverse-prize-calculator.html" target="_blank" rel="noopener" className="underline hover:text-sky-300">Calcolatore premi</a></li>
          </ul>
        ),
      },
      {
        key: "tips",
        icon: "chart",
        title: "Consigli della community",
        content: (
          <ul className="list-disc pl-5 text-gray-300 text-base space-y-2">
            <li><b>Rotazioni</b>: Fatica reale (perdi 26–29 fitness/partita, recupero +7/giorno). Fai turnover!</li>
            <li><b>Cambi</b>: Massimo 2 previsti, tienine sempre 1 per infortunio.</li>
            <li><b>Mai infortunati/squalificati in panchina</b> (rischio formazione casuale!)</li>
            <li><b>Ratings aggiornati ogni 6 mesi</b> (usa Transfermarkt & soccerratings).</li>
            <li><b>Stipendio = OVR</b> (<a href="https://svbase.vercel.app/revenus" target="_blank" rel="noopener" className="underline text-yellow-300">vedi tabella</a>), non l’età!</li>
            <li><b>Trasferimenti</b>: 7 entrate/uscite max per stagione/club, 2 prestiti.</li>
            <li><b>Aste</b>: La prima offerta fa partire l’asta (5 giorni), pazienza.</li>
            <li><b>Influenza</b>: Ricompense settimanali + a fine stagione.</li>
            <li><b>Wallet in game</b>: Transazioni gratuite ogni giorno.</li>
          </ul>
        ),
      }
    ]
  }
};

export default function DebuterPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  const [openSections, setOpenSections] = useState(t.sections.map((_, idx) => idx === 0));

  const toggleSection = idx => {
    setOpenSections(openSections =>
      openSections.map((open, i) => (i === idx ? !open : open))
    );
  };

  return (
    <div className="min-h-screen text-gray-100">

      {/* Hero section */}
      <section className="relative flex flex-col items-center justify-center text-center py-32">
        <img
          src={LOGO_MASCOTTE}
          alt="Logo"
          className="absolute right-6 top-10 w-28 md:w-40 opacity-20 pointer-events-none select-none hidden md:block"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            {t.hero1}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl">{t.hero2}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xl">
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-lg font-bold text-gray-900 transition-colors w-full"
          >
            <FaUserPlus className="text-xl" /> {t.signup}
          </a>
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 rounded-full border border-emerald-500 px-8 py-4 text-lg font-bold text-emerald-400 hover:bg-emerald-500 hover:text-gray-900 transition-colors w-full"
          >
            <FaPuzzlePiece className="text-xl" /> {t.patch}
          </a>
        </div>
      </section>

      <div className="w-full flex justify-center items-center my-0">
        <div className="h-1 w-1/2 bg-gradient-to-r from-fuchsia-500 via-indigo-400 to-sky-500 rounded-full opacity-40" />
      </div>

      <section className="flex flex-col md:flex-row items-center justify-center gap-8 bg-white/5 rounded-2xl shadow-lg px-6 md:px-10 py-8 md:py-10 border border-white/10 backdrop-blur max-w-3xl mx-auto mt-10 mb-10">
        <FaDiscord className="text-5xl text-sky-400 hidden md:block mr-6" />
        <div className="flex-1 flex flex-col items-center md:items-start">
          <h2 className="text-2xl font-bold mb-2 text-white">{t.discordTitle}</h2>
          <p className="text-base text-gray-200 mb-4">{t.discordText}</p>
          <a
            href="https://discord.gg/sd5aa8TW"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-500 px-7 py-3 text-lg font-semibold shadow gap-2 text-white mb-1 transition-opacity hover:opacity-90"
          >
            <FaDiscord className="text-xl" /> {t.discordBtn}
          </a>
        </div>
      </section>

      <main className="flex flex-col items-center px-2 sm:px-4 pt-4 pb-12 w-full">
        <section className="w-full max-w-5xl mb-14 flex flex-col gap-7 mt-6">
          {t.sections.map((s, idx) => (
            <div key={s.key} className="rounded-2xl shadow-xl border border-gray-700 bg-gradient-to-tr from-gray-900/90 to-gray-800/70">
              <button
                className={`w-full flex items-center justify-between text-left px-7 py-5 focus:outline-none rounded-t-2xl transition
                  ${openSections[idx] ? "bg-gradient-to-r from-sky-950/60 to-emerald-950/50" : "bg-transparent hover:bg-gray-900/40"}`}
                onClick={() => toggleSection(idx)}
                aria-expanded={openSections[idx]}
              >
                <span className="flex items-center text-xl md:text-2xl font-bold">
                  {ICONS[s.icon]}
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
        <footer className="text-center text-gray-500 text-xs py-4 w-full"></footer>
      </main>
    </div>
  );
}
