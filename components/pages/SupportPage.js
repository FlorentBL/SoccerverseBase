"use client";

const ADDRESS = "0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105";

const LABELS = {
  fr: {
    title: "Nous soutenir",
    intro: "Si vous souhaitez nous soutenir, vous pouvez faire un don via les options ci-dessous.",
    usdcTitle: "Envoyer des USDC sur Polygon",
    usdcText: "Adresse :",
    svcTitle: "Envoyer des SVC ingame",
    svcText: "Envoyer au compte \"klo\" (attention tout en minuscule)",
    kloAlt: "Compte klo dans Soccerverse",
  },
  en: {
    title: "Support us",
    intro: "If you want to support us, you can donate using the options below.",
    usdcTitle: "Send USDC on Polygon",
    usdcText: "Address:",
    svcTitle: "Send SVC in-game",
    svcText: "Send to account \"klo\" (all lowercase)",
    kloAlt: "klo account in Soccerverse",
  },
  es: {
    title: "Apóyanos",
    intro: "Si deseas apoyarnos, puedes donar mediante las opciones siguientes.",
    usdcTitle: "Enviar USDC en Polygon",
    usdcText: "Dirección:",
    svcTitle: "Enviar SVC en el juego",
    svcText: "Envíalo a la cuenta \"klo\" (todo en minúsculas)",
    kloAlt: "Cuenta klo en Soccerverse",
  },
  it: {
    title: "Sostienici",
    intro: "Se vuoi sostenerci, puoi fare una donazione tramite le opzioni sotto.",
    usdcTitle: "Invia USDC su Polygon",
    usdcText: "Indirizzo:",
    svcTitle: "Invia SVC in-game",
    svcText: "Invia all'account \"klo\" (tutto in minuscolo)",
    kloAlt: "Account klo su Soccerverse",
  },
  ko: {
    title: "후원하기",
    intro: "우리를 지원하고 싶다면 아래 방법으로 후원할 수 있습니다.",
    usdcTitle: "폴리곤에서 USDC 보내기",
    usdcText: "주소:",
    svcTitle: "게임 내 SVC 보내기",
    svcText: "계정 \"klo\"로 보내주세요 (모두 소문자)",
    kloAlt: "Soccerverse의 klo 계정",
  },
};

export default function SupportPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  return (
    <div className="min-h-screen text-white py-8 px-2 sm:px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-center">{t.title}</h1>
        <p className="text-center text-gray-300 mb-8">{t.intro}</p>
        <div className="space-y-8">
          <section className="bg-white/5 p-6 rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold mb-2">{t.usdcTitle}</h2>
            <p className="text-gray-300 mb-2">{t.usdcText}</p>
            <code className="break-all text-sm">{ADDRESS}</code>
          </section>
          <section className="bg-white/5 p-6 rounded-lg border border-white/10 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">{t.svcTitle}</h2>
            <p className="text-gray-300 mb-4">{t.svcText}</p>
            <img src="/klo.png" alt={t.kloAlt} className="max-w-xs rounded" />
          </section>
        </div>
      </div>
    </div>
  );
}

