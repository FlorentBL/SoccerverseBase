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

const translations = {
  fr: {
    heroTitle: "Bien débuter sur Soccerverse",
    heroDesc:
      "Soccerverse est un jeu de simulation de football connecté à la blockchain, où vous interagissez sur un marché dynamique de clubs et de joueurs.",
    intro: [
      "Vous pouvez endosser un ou plusieurs rôles : Entraîneur (tactiques, effectif, finances), Agent (contrats, transferts, moral), Influenceur (propriétaire et décideur stratégique), Trader (spéculation sur la valeur des parts) ou Scout (découverte de jeunes talents).",
      "Chaque semaine, vous recevez des gains en fonction des performances de vos clubs ou joueurs, ainsi qu’une prime de fin de saison.",
      "Les performances et transferts réels des joueurs influencent directement leurs notes et leur valeur dans le jeu, créant un lien permanent avec le football IRL.",
      "Les échanges utilisent des tokens numériques pour acheter, vendre ou investir, et vos décisions impactent vos revenus comme vos résultats sportifs.",
    ],
    callout:
      "Sur votre compte, vous disposez de dollars et de SVC. La valeur du SVC est affichée sur SVBase à côté du logo et sert à tous les achats sur le marché secondaire.",
    outroIntro: [
      "Le jeu suit un calendrier compétitif (ligues, coupes, tournois), avec un fort aspect social et collaboratif.",
      "Pour bien commencer, le guide officiel et les vidéos d’introduction vous accompagnent pas à pas.",
    ],
    rolesHeading: "Les rôles",
    coach: {
      title: "Entraîneur (FREE TO PLAY)",
      description:
        "Sur l'image ci-dessous on voit que klo est le coach du RAAL La Louvière et en dessous la liste des influenceurs du club. Ces influenceurs possèdent des parts du club et peuvent te donner les pleins pouvoirs pour cette équipe. Si tu es toi-même influenceur majoritaire, tu peux t'accorder ces droits.",
      imageAlt: "Exemple d'interface coach",
      bullets: [
        "Gère l’équipe, définit les tactiques, achète/vend des joueurs, signe les contrats.",
        "Responsable des résultats sportifs et de la santé financière du club.",
        "Tes gains : ton salaire de coach (certains influenceurs ajoutent des primes pour recruter des coachs de talent !)",
      ],
    },
    influencer: {
      title: "Influenceur de club ou de joueur",
      bullets: [
        "Propriétaire d’une part d’un club ou d’un joueur.",
        "Participe aux décisions stratégiques et nomme/limoge les entraîneurs ou agents.",
        "Tes gains : tu reçois des dividendes pour chaque match joué. Détail dans Analyse → Gains joueurs. Côté club, la position de fin de saison ajoute un bonus en cas de réussite. Tu peux simuler ces gains dans le simulateur de récompense.",
      ],
    },
    agent: {
      title: "Agent",
      bullets: [
        "Défend les intérêts d’un joueur : contrats, transferts, moral.",
        "Intermédiaire entre entraîneurs et influenceurs.",
        "Tes gains : salaire d'agent, voir Analyse → Gains joueurs pour le détail.",
      ],
    },
    trader: {
      title: "Trader",
      bullets: [
        "Spécialiste du marché, achète et revend de l’influence (parts) pour profiter des variations de prix.",
        "En fonction des résultats, clubs comme joueurs peuvent changer de valeur, à toi d'acheter et vendre au bon moment.",
      ],
    },
    scout: {
      title: "Scout",
      bullets: [
        "Détecte les jeunes talents avant qu’ils n’explosent.",
        "Peut ensuite en tirer profit comme entraîneur, agent, influenceur ou trader.",
        "Tes gains : prends des parts sur ces joueurs, deviens leur agent ou négocie des contreparties avec d'autres agents.",
      ],
    },
    afterRoles: [
      "Vous n’êtes pas limité à un seul rôle : vous pouvez en combiner plusieurs pour multiplier vos opportunités.",
      "Le jeu repose sur un marché dynamique, une forte interaction entre joueurs et un mélange de stratégie sportive et financière.",
    ],
    linksHeading: "Liens utiles",
    links: [
      {
        href: "https://elrincondeldt.com/que-es-sv.html",
        label:
          "El Rincon del DT : Le site derrière le pack de noms. Son créateur se trouve sur le Discord sous le nom de Cipone !",
      },
      {
        href: "https://guide.soccerverse.com/french",
        label: "Le guide FR officiel : Très complet, c'est la bible !",
      },
      {
        href: "https://hub.soccerverse.com/",
        label: "Le hub d’actualité : https://hub.soccerverse.com/",
      },
      {
        href: "https://soccerratings.org/players",
        label:
          "Pour connaître les ratings de joueurs : https://soccerratings.org/players — attention à vérifier la situation IRL officielle du joueur.",
      },
      {
        href: "https://soccerverse.com/soccerverse-litepaper/",
        label: "Le litepaper : Toujours intéressant à connaître",
      },
    ],
  },
  en: {
    heroTitle: "Getting Started with Soccerverse",
    heroDesc:
      "Soccerverse is a football simulation game connected to the blockchain, where you interact on a dynamic market of clubs and players.",
    intro: [
      "You can assume one or several roles: Coach (tactics, squad, finances), Agent (contracts, transfers, morale), Influencer (owner and strategic decision-maker), Trader (speculating on share value) or Scout (discovering young talents).",
      "Each week you receive rewards based on the performances of your clubs or players, as well as an end-of-season bonus.",
      "Real-world performances and transfers directly affect players’ ratings and value in-game, creating a permanent link with football IRL.",
      "Transactions use digital tokens to buy, sell or invest, and your decisions impact both your income and sporting results.",
    ],
    callout:
      "On your account you have dollars and SVC. The SVC value is displayed on SVBase next to the logo and is used for all purchases on the secondary market.",
    outroIntro: [
      "The game follows a competitive calendar (leagues, cups, tournaments) with a strong social and collaborative aspect.",
      "To get started, the official guide and introduction videos walk you through step by step.",
    ],
    rolesHeading: "Roles",
    coach: {
      title: "Coach (FREE TO PLAY)",
      description:
        "In the screenshot below you can see that klo is the coach of RAAL La Louvière and below the list of the club’s influencers. These influencers own shares of the club and can grant you full control of the team. If you yourself are the majority influencer, you can grant these rights to yourself.",
      imageAlt: "Coach interface example",
      bullets: [
        "Manage the team, set tactics, buy/sell players, sign contracts.",
        "Responsible for sporting results and the club’s financial health.",
        "Your earnings: your coach salary (some influencers add bonuses to recruit talented coaches!).",
      ],
    },
    influencer: {
      title: "Club or Player Influencer",
      bullets: [
        "Owner of a share in a club or a player.",
        "Takes part in strategic decisions and appoints/fires coaches or agents.",
        "Your earnings: you receive dividends for each match played. See Analysis → Player earnings for details. For clubs, the end-of-season position adds a bonus when successful. You can simulate these rewards in the reward simulator.",
      ],
    },
    agent: {
      title: "Agent",
      bullets: [
        "Defends a player’s interests: contracts, transfers, morale.",
        "Intermediary between coaches and influencers.",
        "Your earnings: agent salary; see Analysis → Player earnings for details.",
      ],
    },
    trader: {
      title: "Trader",
      bullets: [
        "Market specialist, buying and selling influence (shares) to profit from price fluctuations.",
        "Depending on results, clubs and players can change in value—buy and sell at the right moment.",
      ],
    },
    scout: {
      title: "Scout",
      bullets: [
        "Spots young talents before they explode.",
        "Can then profit as a coach, agent, influencer or trader.",
        "Your earnings: take shares in these players, become their agent or negotiate rewards with other agents.",
      ],
    },
    afterRoles: [
      "You aren't limited to a single role: you can combine several to multiply your opportunities.",
      "The game is built on a dynamic market, strong player interaction and a mix of sporting and financial strategy.",
    ],
    linksHeading: "Useful links",
    links: [
      {
        href: "https://elrincondeldt.com/que-es-sv.html",
        label:
          "El Rincon del DT: the site behind the name pack. Its creator is on Discord as Cipone!",
      },
      {
        href: "https://guide.soccerverse.com/french",
        label: "Official French guide: very comprehensive, it's the bible!",
      },
      {
        href: "https://hub.soccerverse.com/",
        label: "News hub: https://hub.soccerverse.com/",
      },
      {
        href: "https://soccerratings.org/players",
        label:
          "To check player ratings: https://soccerratings.org/players — always verify the player's official real-life situation.",
      },
      {
        href: "https://soccerverse.com/soccerverse-litepaper/",
        label: "The litepaper: always worth reading",
      },
    ],
  },
  it: {
    heroTitle: "Come iniziare su Soccerverse",
    heroDesc:
      "Soccerverse è un gioco di simulazione calcistica connesso alla blockchain, dove interagisci su un mercato dinamico di club e giocatori.",
    intro: [
      "Puoi ricoprire uno o più ruoli: Allenatore (tattiche, rosa, finanze), Agente (contratti, trasferimenti, morale), Influencer (proprietario e decisore strategico), Trader (speculazione sul valore delle quote) o Scout (scoperta di giovani talenti).",
      "Ogni settimana ricevi guadagni in base alle prestazioni dei tuoi club o giocatori, oltre a un bonus di fine stagione.",
      "Le prestazioni e i trasferimenti reali dei giocatori influenzano direttamente i loro punteggi e il loro valore nel gioco, creando un legame permanente con il calcio reale.",
      "Gli scambi utilizzano token digitali per comprare, vendere o investire, e le tue decisioni incidono sui tuoi ricavi e sui risultati sportivi.",
    ],
    callout:
      "Nel tuo account hai dollari e SVC. Il valore dell'SVC è mostrato su SVBase accanto al logo e serve per tutti gli acquisti sul mercato secondario.",
    outroIntro: [
      "Il gioco segue un calendario competitivo (campionati, coppe, tornei) con un forte aspetto sociale e collaborativo.",
      "Per iniziare al meglio, la guida ufficiale e i video introduttivi ti accompagnano passo dopo passo.",
    ],
    rolesHeading: "I ruoli",
    coach: {
      title: "Allenatore (FREE TO PLAY)",
      description:
        "Nell'immagine qui sotto si vede che klo è l'allenatore della RAAL La Louvière e sotto l'elenco degli influencer del club. Questi influencer possiedono quote del club e possono darti i pieni poteri per questa squadra. Se sei tu stesso l'influencer di maggioranza, puoi concederti questi diritti.",
      imageAlt: "Esempio di interfaccia allenatore",
      bullets: [
        "Gestisce la squadra, definisce le tattiche, compra/vende giocatori, firma i contratti.",
        "Responsabile dei risultati sportivi e della salute finanziaria del club.",
        "I tuoi guadagni: il tuo stipendio di allenatore (alcuni influencer aggiungono bonus per reclutare allenatori di talento!).",
      ],
    },
    influencer: {
      title: "Influencer di club o giocatore",
      bullets: [
        "Proprietario di una quota di un club o di un giocatore.",
        "Partecipa alle decisioni strategiche e nomina/esonera allenatori o agenti.",
        "I tuoi guadagni: ricevi dividendi per ogni partita giocata. Trovi i dettagli in Analisi → Guadagni giocatori. Per i club, la posizione di fine stagione aggiunge un bel bonus in caso di successo. Puoi simulare questi guadagni nel simulatore di ricompense.",
      ],
    },
    agent: {
      title: "Agente",
      bullets: [
        "Difende gli interessi di un giocatore: contratti, trasferimenti, morale.",
        "Intermediario tra allenatori e influencer.",
        "I tuoi guadagni: stipendio da agente, trovi i dettagli in Analisi → Guadagni giocatori.",
      ],
    },
    trader: {
      title: "Trader",
      bullets: [
        "Specialista del mercato, compra e rivende influenza (quote) per sfruttare le variazioni di prezzo.",
        "In base ai risultati, club e giocatori possono cambiare valore: sta a te comprare e vendere al momento giusto.",
      ],
    },
    scout: {
      title: "Scout",
      bullets: [
        "Individua i giovani talenti prima che esplodano.",
        "Può poi trarne profitto come allenatore, agente, influencer o trader.",
        "I tuoi guadagni: prendi quote di questi giocatori, diventa il loro agente oppure negozia ricompense con altri agenti.",
      ],
    },
    afterRoles: [
      "Non sei limitato a un solo ruolo: puoi combinarne diversi per moltiplicare le opportunità.",
      "Il gioco si basa su un mercato dinamico, una forte interazione tra giocatori e un mix di strategia sportiva e finanziaria.",
    ],
    linksHeading: "Link utili",
    links: [
      {
        href: "https://elrincondeldt.com/que-es-sv.html",
        label:
          "El Rincon del DT: il sito dietro il pacchetto di nomi. Il suo creatore è su Discord con il nome Cipone!",
      },
      {
        href: "https://guide.soccerverse.com/french",
        label: "La guida ufficiale in francese: molto completa, è la bibbia!",
      },
      {
        href: "https://hub.soccerverse.com/",
        label: "Il centro notizie: https://hub.soccerverse.com/",
      },
      {
        href: "https://soccerratings.org/players",
        label:
          "Per conoscere i rating dei giocatori: https://soccerratings.org/players — controlla sempre la situazione ufficiale reale del giocatore.",
      },
      {
        href: "https://soccerverse.com/soccerverse-litepaper/",
        label: "Il litepaper: sempre interessante da conoscere",
      },
    ],
  },
  zh: {
    heroTitle: "如何开始 Soccerverse",
    heroDesc:
      "Soccerverse 是一个连接区块链的足球模拟游戏，在动态的俱乐部和球员市场中进行互动。",
    intro: [
      "你可以扮演多个角色：教练（战术、阵容、财务）、经纪人（合同、转会、士气）、影响者（拥有者与战略决策者）、交易员（投机股份价值）或球探（发掘年轻天才）。",
      "每周根据俱乐部或球员的表现获得奖励，并在赛季末得到奖金。",
      "现实中的表现和转会会直接影响球员在游戏中的评分和价值，与现实足球保持联系。",
      "交易使用数字代币进行买卖或投资，你的决定会影响收入和成绩。",
    ],
    callout:
      "账户中有美元和 SVC。SVBase 上 logo 旁显示的 SVC 价格用于所有二级市场购买。",
    outroIntro: [
      "游戏遵循竞赛日程（联赛、杯赛、锦标赛），并具有强烈的社交与协作属性。",
      "要顺利开始，官方指南和介绍视频会一步步引导你。",
    ],
    rolesHeading: "角色",
    coach: {
      title: "教练（免费游玩）",
      description:
        "下图显示 klo 是 RAAL La Louvière 的教练，下面是俱乐部影响者列表。这些影响者持有俱乐部股份，可授予你球队的全部权限。如果你是主要影响者，也可将这些权限授予自己。",
      imageAlt: "教练界面示例",
      bullets: [
        "管理球队、设定战术、买卖球员、签合同。",
        "负责俱乐部成绩和财务健康。",
        "你的收入：教练工资（部分影响者会提供奖金以招募优秀教练！）",
      ],
    },
    influencer: {
      title: "俱乐部或球员影响者",
      bullets: [
        "持有俱乐部或球员股份。",
        "参与战略决策并任命/解雇教练或经纪人。",
        "你的收入：每场比赛获得分红，详见 分析 → 球员收益。俱乐部在赛季末的排名成功还会带来额外奖励，可在奖励模拟器中模拟。",
      ],
    },
    agent: {
      title: "经纪人",
      bullets: [
        "维护球员利益：合同、转会、士气。",
        "教练与影响者之间的中间人。",
        "你的收入：经纪人工资，详见 分析 → 球员收益。",
      ],
    },
    trader: {
      title: "交易员",
      bullets: [
        "市场专家，通过买卖股份来利用价格波动获利。",
        "根据结果，俱乐部和球员价值会变化，要在合适时机买卖。",
      ],
    },
    scout: {
      title: "球探",
      bullets: [
        "在球员成名前发现他们。",
        "随后可作为教练、经纪人、影响者或交易员获利。",
        "你的收入：持有这些球员股份，成为他们的经纪人或与其他经纪人谈判回报。",
      ],
    },
    afterRoles: [
      "你不限于一个角色，可以组合多个角色以扩大机会。",
      "游戏基于动态市场、玩家互动以及体育与金融策略的结合。",
    ],
    linksHeading: "实用链接",
    links: [
      {
        href: "https://elrincondeldt.com/que-es-sv.html",
        label: "El Rincon del DT：名称包来源，该作者在 Discord 上名为 Cipone！",
      },
      {
        href: "https://guide.soccerverse.com/french",
        label: "官方法语指南：非常全面，是圣经！",
      },
      {
        href: "https://hub.soccerverse.com/",
        label: "资讯中心：https://hub.soccerverse.com/",
      },
      {
        href: "https://soccerratings.org/players",
        label: "查看球员评分：https://soccerratings.org/players — 请核实球员现实情况。",
      },
      {
        href: "https://soccerverse.com/soccerverse-litepaper/",
        label: "Litepaper：值得一读",
      },
    ],
  },
};

export default function DebuterPage({ lang = "fr" }) {
  const t = translations[lang] || translations.fr;
  return (
    <div className="relative overflow-hidden text-white">
      {/* decorative blurred circles */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[32rem] w-[32rem] rounded-full bg-sky-600/30 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20 space-y-24">
        <header className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-400 bg-clip-text text-transparent">
              {t.heroTitle}
            </span>
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">{t.heroDesc}</p>
        </header>

        <section className="prose prose-invert max-w-none space-y-4">
          {t.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="relative p-4 rounded-xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 backdrop-blur">
            <div className="absolute -top-4 -left-4 h-10 w-10 flex items-center justify-center rounded-full bg-yellow-400 text-slate-950">
              <FaCoins />
            </div>
            <p className="text-sm leading-relaxed pl-8">{t.callout}</p>
          </div>
          {t.outroIntro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
            {t.rolesHeading}
          </h2>
          <div className="space-y-6 md:flex md:space-y-0 md:gap-6">
            <div className="md:w-1/2">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4 shadow-xl transition-colors hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-fuchsia-700">
                    <FaChalkboardTeacher className="text-white text-xl" />
                  </span>
                  <h3 className="text-xl font-semibold">{t.coach.title}</h3>
                </div>
                <p>{t.coach.description}</p>
                <Image src="/coach.png" alt={t.coach.imageAlt} width={800} height={450} className="rounded-lg" />
                <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
                  {t.coach.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-6 md:w-1/2">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4 shadow-xl transition-colors hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-700">
                    <FaUserTie className="text-white text-xl" />
                  </span>
                  <h3 className="text-xl font-semibold">{t.influencer.title}</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
                  {t.influencer.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4 shadow-xl transition-colors hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700">
                    <FaHandshake className="text-white text-xl" />
                  </span>
                  <h3 className="text-xl font-semibold">{t.agent.title}</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
                  {t.agent.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4 shadow-xl transition-colors hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
                    <FaChartLine className="text-white text-xl" />
                  </span>
                  <h3 className="text-xl font-semibold">{t.trader.title}</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
                  {t.trader.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4 shadow-xl transition-colors hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700">
                    <FaSearch className="text-white text-xl" />
                  </span>
                  <h3 className="text-xl font-semibold">{t.scout.title}</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
                  {t.scout.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="prose prose-invert max-w-3xl mx-auto text-center space-y-4">
          {t.afterRoles.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            {t.linksHeading}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.links.map((link, i) => (
              <a
                key={i}
                className="group flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                href={link.href}
                target="_blank"
                rel="noopener"
              >
                <FaExternalLinkAlt className="text-sky-400 mt-1 group-hover:scale-110 transition-transform" />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
