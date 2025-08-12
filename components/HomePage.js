"use client";

import Link from "next/link";
import { FaUserPlus, FaPuzzlePiece, FaDiscord } from "react-icons/fa";

const LOGO_MASCOTTE = "/logo.png";

const LABELS = {
  fr: {
    hero1: "SoccerverseBase",
    hero2: (
      <>Guide pratique pour débuter et progresser sur Soccerverse.<br />Accède rapidement aux ressources, infos et à la communauté FR.</>
    ),
    signup: "Inscription Soccerverse",
    patch: "Patch FR (noms et logos)",
    discordTitle: "Communauté française K-SOCIOS",
    discordText: (
      <>Espace d’entraide, discussion et informations pour les francophones.<br />Rejoins le Discord pour poser tes questions ou échanger avec la commu.</>
    ),
    discordBtn: "Rejoindre le Discord K-SOCIOS",
    sectionsTitle: "Sections du site",
    sections: [
      {
        href: "/comment-debuter",
        title: "Comment débuter ?",
        desc: "Guide pour bien commencer",
        featured: true,
      },
      {
        href: "/dashboard",
        title: "Dashboard",
        desc: "Viens découvrir en un coup d'oeil les résultats des clubs que tu soutiens",
      },
      {
        href: "/scouting",
        title: "Scouting",
        desc: "Détail d'un joueur, d'un club ou d'un championnat ? C'est ici que ca se passe",
      },
      {
        href: "/recompenses",
        title: "Simulateur de récompense",
        desc: "Tu peux ici simuler les récompenses de fin de saison que ce soit pour le club ou pour ses influenceurs",
      },
      {
        href: "/finance",
        title: "Analyse financière",
        desc: "Tu veux voir la situation financière d'un club ? Savoir quelle sera la situation à la fin de la saison ? Tu peux même simuler un recrutement",
      },
      {
        href: "/analyse-tactique",
        title: "Analyse tactique",
        desc: "Analyse tes 3 prochains adversaires",
      },
      {
        href: "/revenus",
        title: "Gains Joueurs",
        desc: "La grille qui détaille les salaires et gains liés aux joueurs",
      },
    ],
  },
  en: {
    hero1: "SoccerverseBase",
    hero2: (
      <>Practical guide to start and improve your Soccerverse experience.<br />Fast access to resources, info, and the international community.</>
    ),
    signup: "Sign up to Soccerverse",
    patch: "Names and logos patch",
    discordTitle: "K-SOCIOS International Community",
    discordText: (
      <>Place for support, discussion, and sharing info about Soccerverse.<br />Join our Discord to ask questions and connect with other players.</>
    ),
    discordBtn: "Join K-SOCIOS Discord",
    sectionsTitle: "Site sections",
    sections: [
      {
        href: "/comment-debuter",
        title: "Getting started",
        desc: "Guide to start well",
        featured: true,
      },
      {
        href: "/dashboard",
        title: "Dashboard",
        desc: "Discover at a glance the results of clubs you support",
      },
      {
        href: "/scouting",
        title: "Scouting",
        desc: "Details about a player, club or league? It's all here",
      },
      {
        href: "/recompenses",
        title: "Rewards simulator",
        desc: "Simulate end-of-season rewards for clubs or influencers",
      },
      {
        href: "/finance",
        title: "Financial Analysis",
        desc: "View a club's finances, forecast season end, even simulate a signing",
      },
      {
        href: "/analyse-tactique",
        title: "Tactical Analysis",
        desc: "Analyze your next 3 opponents",
      },
      {
        href: "/revenus",
        title: "Player Earnings",
        desc: "Table detailing player salaries and earnings",
      },
    ],
  },
  it: {
    hero1: "SoccerverseBase",
    hero2: (
      <>Guida pratica per iniziare e progredire su Soccerverse.<br />Accedi rapidamente a risorse, info e alla community IT.</>
    ),
    signup: "Iscrizione a Soccerverse",
    patch: "Patch IT (nomi e loghi)",
    discordTitle: "Community italiana K-SOCIOS",
    discordText: (
      <>Spazio di supporto, discussione e informazioni per gli italofoni.<br />Unisciti al Discord per fare domande o scambiare opinioni con la community.</>
    ),
    discordBtn: "Unisciti al Discord K-SOCIOS",
    sectionsTitle: "Sezioni del sito",
    sections: [
      {
        href: "/comment-debuter",
        title: "Come iniziare?",
        desc: "Guida per iniziare bene",
        featured: true,
      },
      {
        href: "/dashboard",
        title: "Dashboard",
        desc: "Scopri in un colpo d'occhio i risultati dei club che sostieni",
      },
      {
        href: "/scouting",
        title: "Scouting",
        desc: "Dettagli di un giocatore, club o campionato? È qui che succede",
      },
      {
        href: "/recompenses",
        title: "Simulatore ricompense",
        desc: "Simula i premi di fine stagione per il club o i suoi influencer",
      },
      {
        href: "/finance",
        title: "Analisi finanziaria",
        desc: "Vuoi vedere la situazione finanziaria di un club? Prevedi fine stagione o simula un acquisto",
      },
      {
        href: "/analyse-tactique",
        title: "Analisi tattica",
        desc: "Analizza i tuoi prossimi 3 avversari",
      },
      {
        href: "/revenus",
        title: "Guadagni Giocatori",
        desc: "Tabella che dettaglia stipendi e guadagni dei giocatori",
      },
    ],
  },
};

export default function HomePage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;

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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-300">
            {t.hero1}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl">{t.hero2}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xl">
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 rounded-full bg-indigo-500 hover:bg-indigo-400 px-8 py-4 text-lg font-bold text-gray-900 transition-colors w-full"
          >
            <FaUserPlus className="text-xl" /> {t.signup}
          </a>
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 rounded-full border border-indigo-500 px-8 py-4 text-lg font-bold text-indigo-400 hover:bg-indigo-500 hover:text-gray-900 transition-colors w-full"
          >
            <FaPuzzlePiece className="text-xl" /> {t.patch}
          </a>
        </div>
      </section>

      <div className="w-full flex justify-center items-center my-0">
        <div className="h-1 w-1/2 bg-gradient-to-r from-fuchsia-500 via-indigo-400 to-sky-500 rounded-full opacity-40" />
      </div>

      {/* Discord section */}
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

      {/* Site sections */}
      <main className="px-4 sm:px-6 pb-12 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">{t.sectionsTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.sections.map((s) => (
            <Link
              key={s.href}
              href={`/${lang}${s.href}`}
              className={`block p-6 rounded-xl border border-white/10 transition-colors ${
                s.featured
                  ? 'sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-fuchsia-500 to-sky-500 hover:from-fuchsia-400 hover:to-sky-400 text-gray-900'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <h3 className={`${s.featured ? 'text-2xl' : 'text-xl'} font-semibold mb-2`}>{s.title}</h3>
              <p className={`text-sm ${s.featured ? 'text-gray-800' : 'text-gray-300'}`}>{s.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

