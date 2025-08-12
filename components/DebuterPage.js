"use client";

import Image from "next/image";

export default function DebuterPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose prose-invert">
      <p>
        Soccerverse est un jeu de simulation de football connecté à la blockchain, où vous
        interagissez sur un marché dynamique de clubs et de joueurs.
      </p>
      <p>
        Vous pouvez endosser un ou plusieurs rôles&nbsp;: Entraîneur (tactiques, effectif, finances),
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
        Les échanges utilisent des tokens numériques pour acheter, vendre ou investir, et vos décisions
        impactent vos revenus comme vos résultats sportifs.
      </p>
      <p>
        Le jeu suit un calendrier compétitif (ligues, coupes, tournois), avec un fort aspect social et
        collaboratif.
      </p>
      <p>
        Pour bien commencer, le guide officiel et les vidéos d’introduction vous accompagnent pas à pas.
      </p>

      <h2>Entraîneur (FREE TO PLAY)</h2>
      <p>
        Sur l'image ci-dessous on voit que klo est le coach du RAAL La Louvière et en dessous la liste
        des influenceurs du club. Ces influenceurs possèdent des parts du club et peuvent te donner les
        pleins pouvoirs pour cette équipe. Si tu es toi-même influenceur majoritaire, tu peux t'accorder
        ces droits.
      </p>
      <Image
        src="/coach.png"
        alt="Exemple d'interface coach"
        width={800}
        height={450}
        className="rounded-lg shadow mb-4 mx-auto"
      />
      <ul>
        <li>Gère l’équipe, définit les tactiques, achète/vend des joueurs, signe les contrats.</li>
        <li>Responsable des résultats sportifs et de la santé financière du club.</li>
        <li>
          Tes gains&nbsp;: ton salaire de coach (certains influenceurs ajoutent des primes pour recruter des
          coachs de talent&nbsp;!)
        </li>
      </ul>

      <h2>Influenceur de club ou de joueur</h2>
      <ul>
        <li>Propriétaire d’une part d’un club ou d’un joueur.</li>
        <li>Participe aux décisions stratégiques et nomme/limoge les entraîneurs ou agents.</li>
        <li>
          Tes gains&nbsp;: tu reçois des dividendes pour chaque match joué. Détail dans Analyse → Gains
          joueurs. Côté club, la position de fin de saison ajoute un bonus en cas de réussite. Tu peux
          simuler ces gains dans le simulateur de récompense.
        </li>
      </ul>

      <h2>Agent</h2>
      <ul>
        <li>Défend les intérêts d’un joueur&nbsp;: contrats, transferts, moral.</li>
        <li>Intermédiaire entre entraîneurs et influenceurs.</li>
        <li>
          Tes gains&nbsp;: salaire d'agent, voir Analyse → Gains joueurs pour le détail.
        </li>
      </ul>

      <h2>Trader</h2>
      <ul>
        <li>
          Spécialiste du marché, achète et revend de l’influence (parts) pour profiter des variations de
          prix.
        </li>
        <li>
          En fonction des résultats, clubs comme joueurs peuvent changer de valeur, à toi d'acheter et
          vendre au bon moment.
        </li>
      </ul>

      <h2>Scout</h2>
      <ul>
        <li>Détecte les jeunes talents avant qu’ils n’explosent.</li>
        <li>Peut ensuite en tirer profit comme entraîneur, agent, influenceur ou trader.</li>
        <li>
          Tes gains&nbsp;: prends des parts sur ces joueurs, deviens leur agent ou négocie des contreparties
          avec d'autres agents.
        </li>
      </ul>

      <p>
        Vous n’êtes pas limité à un seul rôle&nbsp;: vous pouvez en combiner plusieurs pour multiplier vos
        opportunités.
      </p>
      <p>
        Le jeu repose sur un marché dynamique, une forte interaction entre joueurs et un mélange de
        stratégie sportive et financière.
      </p>

      <h2>Liens utiles</h2>
      <ul>
        <li>
          El Rincon del DT&nbsp;: <a href="https://elrincondeldt.com/que-es-sv.html" target="_blank" rel="noopener">Le site
          derrière le pack de noms. Son créateur se trouve sur le Discord sous le nom de Cipone&nbsp;!</a>
        </li>
        <li>
          Le guide FR officiel&nbsp;: <a href="https://guide.soccerverse.com/french" target="_blank" rel="noopener">Très complet,
          c'est la bible&nbsp;!</a>
        </li>
        <li>
          Le hub d’actualité&nbsp;: <a href="https://hub.soccerverse.com/" target="_blank" rel="noopener">https://hub.soccerverse.com/</a>
        </li>
        <li>
          Pour connaître les ratings de joueurs&nbsp;: <a href="https://soccerratings.org/players" target="_blank" rel="noopener">https://soccerratings.org/players</a>
          — attention à vérifier la situation IRL officielle du joueur.
        </li>
        <li>
          Le litepaper&nbsp;: <a href="https://soccerverse.com/soccerverse-litepaper/" target="_blank" rel="noopener">Toujours
          intéressant à connaître</a>
        </li>
      </ul>
    </div>
  );
}

