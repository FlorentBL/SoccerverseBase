"use client";

import Image from "next/image";
import {
  FaChalkboardTeacher,
  FaUserTie,
  FaHandshake,
  FaChartLine,
  FaSearch,
  FaCoins,
  FaExternalLinkAlt,
} from "react-icons/fa";

export default function DebuterPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-20 text-white">
      <header className="text-center space-y-6">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-fuchsia-500 to-sky-500 bg-clip-text text-transparent">
          Bien débuter sur Soccerverse
        </h1>
        <p className="text-gray-300 max-w-3xl mx-auto">
          Soccerverse est un jeu de simulation de football connecté à la blockchain, où vous interagissez sur un marché dynamique de clubs et de joueurs.
        </p>
      </header>

      <section className="prose prose-invert max-w-none space-y-4">
        <p>
          Vous pouvez endosser un ou plusieurs rôles : Entraîneur (tactiques, effectif, finances), Agent (contrats, transferts, moral), Influenceur (propriétaire et décideur stratégique), Trader (spéculation sur la valeur des parts) ou Scout (découverte de jeunes talents).
        </p>
        <p>
          Chaque semaine, vous recevez des gains en fonction des performances de vos clubs ou joueurs, ainsi qu’une prime de fin de saison.
        </p>
        <p>
          Les performances et transferts réels des joueurs influencent directement leurs notes et leur valeur dans le jeu, créant un lien permanent avec le football IRL.
        </p>
        <p>
          Les échanges utilisent des tokens numériques pour acheter, vendre ou investir, et vos décisions impactent vos revenus comme vos résultats sportifs.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-3">
          <FaCoins className="text-yellow-400 text-xl flex-shrink-0" />
          <p className="text-sm leading-relaxed">
            Sur votre compte, vous disposez de dollars et de SVC. La valeur du SVC est affichée sur SVBase à côté du logo et sert à tous les achats sur le marché secondaire.
          </p>
        </div>
        <p>
          Le jeu suit un calendrier compétitif (ligues, coupes, tournois), avec un fort aspect social et collaboratif.
        </p>
        <p>
          Pour bien commencer, le guide officiel et les vidéos d’introduction vous accompagnent pas à pas.
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Les rôles</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <FaChalkboardTeacher className="text-fuchsia-400 text-2xl" />
              <h3 className="text-xl font-semibold">Entraîneur (FREE TO PLAY)</h3>
            </div>
            <p>
              Sur l'image ci-dessous on voit que klo est le coach du RAAL La Louvière et en dessous la liste des influenceurs du club. Ces influenceurs possèdent des parts du club et peuvent te donner les pleins pouvoirs pour cette équipe. Si tu es toi-même influenceur majoritaire, tu peux t'accorder ces droits.
            </p>
            <Image src="/coach.png" alt="Exemple d'interface coach" width={800} height={450} className="rounded-lg" />
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Gère l’équipe, définit les tactiques, achète/vend des joueurs, signe les contrats.</li>
              <li>Responsable des résultats sportifs et de la santé financière du club.</li>
              <li>Tes gains : ton salaire de coach (certains influenceurs ajoutent des primes pour recruter des coachs de talent !)</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <FaUserTie className="text-sky-400 text-2xl" />
              <h3 className="text-xl font-semibold">Influenceur de club ou de joueur</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Propriétaire d’une part d’un club ou d’un joueur.</li>
              <li>Participe aux décisions stratégiques et nomme/limoge les entraîneurs ou agents.</li>
              <li>Tes gains : tu reçois des dividendes pour chaque match joué. Détail dans Analyse → Gains joueurs. Côté club, la position de fin de saison ajoute un bonus en cas de réussite. Tu peux simuler ces gains dans le simulateur de récompense.</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <FaHandshake className="text-green-400 text-2xl" />
              <h3 className="text-xl font-semibold">Agent</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Défend les intérêts d’un joueur : contrats, transferts, moral.</li>
              <li>Intermédiaire entre entraîneurs et influenceurs.</li>
              <li>Tes gains : salaire d'agent, voir Analyse → Gains joueurs pour le détail.</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <FaChartLine className="text-amber-400 text-2xl" />
              <h3 className="text-xl font-semibold">Trader</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Spécialiste du marché, achète et revend de l’influence (parts) pour profiter des variations de prix.</li>
              <li>En fonction des résultats, clubs comme joueurs peuvent changer de valeur, à toi d'acheter et vendre au bon moment.</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <FaSearch className="text-purple-400 text-2xl" />
              <h3 className="text-xl font-semibold">Scout</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Détecte les jeunes talents avant qu’ils n’explosent.</li>
              <li>Peut ensuite en tirer profit comme entraîneur, agent, influenceur ou trader.</li>
              <li>Tes gains : prends des parts sur ces joueurs, deviens leur agent ou négocie des contreparties avec d'autres agents.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="prose prose-invert max-w-none space-y-4">
        <p>Vous n’êtes pas limité à un seul rôle : vous pouvez en combiner plusieurs pour multiplier vos opportunités.</p>
        <p>Le jeu repose sur un marché dynamique, une forte interaction entre joueurs et un mélange de stratégie sportive et financière.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Liens utiles</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            href="https://elrincondeldt.com/que-es-sv.html"
            target="_blank"
            rel="noopener"
          >
            <FaExternalLinkAlt className="text-sky-400 mt-1" />
            <span>
              El Rincon del DT : Le site derrière le pack de noms. Son créateur se trouve sur le Discord sous le nom de Cipone !
            </span>
          </a>
          <a
            className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            href="https://guide.soccerverse.com/french"
            target="_blank"
            rel="noopener"
          >
            <FaExternalLinkAlt className="text-sky-400 mt-1" />
            <span>Le guide FR officiel : Très complet, c'est la bible !</span>
          </a>
          <a
            className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            href="https://hub.soccerverse.com/"
            target="_blank"
            rel="noopener"
          >
            <FaExternalLinkAlt className="text-sky-400 mt-1" />
            <span>Le hub d’actualité : https://hub.soccerverse.com/</span>
          </a>
          <a
            className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            href="https://soccerratings.org/players"
            target="_blank"
            rel="noopener"
          >
            <FaExternalLinkAlt className="text-sky-400 mt-1" />
            <span>
              Pour connaître les ratings de joueurs : https://soccerratings.org/players — attention à vérifier la situation IRL officielle du joueur.
            </span>
          </a>
          <a
            className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors sm:col-span-2"
            href="https://soccerverse.com/soccerverse-litepaper/"
            target="_blank"
            rel="noopener"
          >
            <FaExternalLinkAlt className="text-sky-400 mt-1" />
            <span>Le litepaper : Toujours intéressant à connaître</span>
          </a>
        </div>
      </section>
    </div>
  );
}

