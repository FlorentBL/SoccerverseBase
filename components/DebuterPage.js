"use client";

import Image from "next/image";

export default function DebuterPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-16 text-white">
      <section className="prose prose-invert max-w-none space-y-4">
        <p>
          Soccerverse est un jeu de simulation de football connecté à la blockchain, où vous
          interagissez sur un marché dynamique de clubs et de joueurs.
        </p>
        <p>
          Vous pouvez endosser un ou plusieurs rôles : Entraîneur (tactiques, effectif, finances),
          Agent (contrats, transferts, moral), Influenceur (propriétaire et décideur stratégique),
          Trader (spéculation sur la valeur des parts) ou Scout (découverte de jeunes talents).
        </p>
        <p>
          Chaque semaine, vous recevez des gains en fonction des performances de vos clubs ou joueurs,
          ainsi qu’une prime de fin de saison.
        </p>
        <p>
          Les performances et transferts réels des joueurs influencent directement leurs notes et leur
          valeur dans le jeu, créant un lien permanent avec le football IRL.
        </p>
        <p>
          Les échanges utilisent des tokens numériques pour acheter, vendre ou investir, et vos
          décisions impactent vos revenus comme vos résultats sportifs.
        </p>
        <p>
          Le jeu suit un calendrier compétitif (ligues, coupes, tournois), avec un fort aspect social et
          collaboratif.
        </p>
        <p>
          Pour bien commencer, le guide officiel et les vidéos d’introduction vous accompagnent pas à
          pas.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Les rôles</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-neutral-900 p-6 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-semibold">Entraîneur (FREE TO PLAY)</h3>
            <p>
              Sur l'image ci-dessous on voit que klo est le coach du RAAL La Louvière et en dessous la
              liste des influenceurs du club. Ces influenceurs possèdent des parts du club et peuvent te
              donner les pleins pouvoirs pour cette équipe. Si tu es toi-même influenceur majoritaire,
              tu peux t'accorder ces droits.
            </p>
            <Image
              src="/coach.png"
              alt="Exemple d'interface coach"
              width={800}
              height={450}
              className="rounded-lg shadow"
            />
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Gère l’équipe, définit les tactiques, achète/vend des joueurs, signe les contrats.</li>
              <li>Responsable des résultats sportifs et de la santé financière du club.</li>
              <li>
                Tes gains : ton salaire de coach (certains influenceurs ajoutent des primes pour recruter
                des coachs de talent !)
              </li>
            </ul>
          </div>

          <div className="bg-neutral-900 p-6 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-semibold">Influenceur de club ou de joueur</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Propriétaire d’une part d’un club ou d’un joueur.</li>
              <li>Participe aux décisions stratégiques et nomme/limoge les entraîneurs ou agents.</li>
              <li>
                Tes gains : tu reçois des dividendes pour chaque match joué. Détail dans Analyse → Gains
                joueurs. Côté club, la position de fin de saison ajoute un bonus en cas de réussite. Tu
                peux simuler ces gains dans le simulateur de récompense.
              </li>
            </ul>
          </div>

          <div className="bg-neutral-900 p-6 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-semibold">Agent</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Défend les intérêts d’un joueur : contrats, transferts, moral.</li>
              <li>Intermédiaire entre entraîneurs et influenceurs.</li>
              <li>
                Tes gains : salaire d'agent, voir Analyse → Gains joueurs pour le détail.
              </li>
            </ul>
          </div>

          <div className="bg-neutral-900 p-6 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-semibold">Trader</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>
                Spécialiste du marché, achète et revend de l’influence (parts) pour profiter des
                variations de prix.
              </li>
              <li>
                En fonction des résultats, clubs comme joueurs peuvent changer de valeur, à toi d'acheter
                et vendre au bon moment.
              </li>
            </ul>
          </div>

          <div className="bg-neutral-900 p-6 rounded-lg shadow space-y-4 md:col-span-2">
            <h3 className="text-xl font-semibold">Scout</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Détecte les jeunes talents avant qu’ils n’explosent.</li>
              <li>Peut ensuite en tirer profit comme entraîneur, agent, influenceur ou trader.</li>
              <li>
                Tes gains : prends des parts sur ces joueurs, deviens leur agent ou négocie des
                contreparties avec d'autres agents.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="prose prose-invert max-w-none space-y-4">
        <p>
          Vous n’êtes pas limité à un seul rôle : vous pouvez en combiner plusieurs pour multiplier vos
          opportunités.
        </p>
        <p>
          Le jeu repose sur un marché dynamique, une forte interaction entre joueurs et un mélange de
          stratégie sportive et financière.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Liens utiles</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>
            <a
              className="text-blue-400 hover:underline"
              href="https://elrincondeldt.com/que-es-sv.html"
              target="_blank"
              rel="noopener"
            >
              El Rincon del DT : Le site derrière le pack de noms. Son créateur se trouve sur le Discord
              sous le nom de Cipone !
            </a>
          </li>
          <li>
            <a
              className="text-blue-400 hover:underline"
              href="https://guide.soccerverse.com/french"
              target="_blank"
              rel="noopener"
            >
              Le guide FR officiel : Très complet, c'est la bible !
            </a>
          </li>
          <li>
            <a
              className="text-blue-400 hover:underline"
              href="https://hub.soccerverse.com/"
              target="_blank"
              rel="noopener"
            >
              Le hub d’actualité : https://hub.soccerverse.com/
            </a>
          </li>
          <li>
            <a
              className="text-blue-400 hover:underline"
              href="https://soccerratings.org/players"
              target="_blank"
              rel="noopener"
            >
              Pour connaître les ratings de joueurs : https://soccerratings.org/players — attention à
              vérifier la situation IRL officielle du joueur.
            </a>
          </li>
          <li>
            <a
              className="text-blue-400 hover:underline"
              href="https://soccerverse.com/soccerverse-litepaper/"
              target="_blank"
              rel="noopener"
            >
              Le litepaper : Toujours intéressant à connaître
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}

