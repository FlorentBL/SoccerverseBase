"use client";
import Image from "next/image";

const LABELS = {
  fr: {
    title: "Nous soutenir",
    usdcTitle: "Envoyer des USDC (Polygon)",
    usdcAddress: "Adresse : 0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105",
    usdcNote: "Scanne ce QR code pour envoyer des USDC.",
    svcTitle: "Envoyer des SVC en jeu",
    svcDesc: "Compte : klo (attention, tout en minuscule)",
    svcNote: "Tu peux envoyer des SVC directement en jeu sur le compte \"klo\".",
  },
  en: {
    title: "Support us",
    usdcTitle: "Send USDC (Polygon)",
    usdcAddress: "Address: 0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105",
    usdcNote: "Scan this QR code to send USDC.",
    svcTitle: "Send in-game SVC",
    svcDesc: "Account: klo (all lowercase)",
    svcNote: "You can send SVC in game to the account \"klo\".",
  },
  es: {
    title: "Apóyanos",
    usdcTitle: "Enviar USDC (Polygon)",
    usdcAddress: "Dirección: 0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105",
    usdcNote: "Escanea este código QR para enviar USDC.",
    svcTitle: "Enviar SVC en el juego",
    svcDesc: "Cuenta: klo (todo en minúsculas)",
    svcNote: "Puedes enviar SVC en el juego a la cuenta \"klo\".",
  },
  it: {
    title: "Sostienici",
    usdcTitle: "Invia USDC (Polygon)",
    usdcAddress: "Indirizzo: 0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105",
    usdcNote: "Scansiona questo QR code per inviare USDC.",
    svcTitle: "Invia SVC in gioco",
    svcDesc: "Account: klo (tutto in minuscolo)",
    svcNote: "Puoi inviare SVC nel gioco all'account \"klo\".",
  },
  ko: {
    title: "후원하기",
    usdcTitle: "USDC 보내기 (Polygon)",
    usdcAddress: "주소: 0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105",
    usdcNote: "USDC를 보내려면 QR 코드를 스캔하세요.",
    svcTitle: "게임 내 SVC 보내기",
    svcDesc: "계정: klo (모두 소문자에 주의)",
    svcNote: "게임에서 'klo' 계정으로 SVC를 보낼 수 있습니다.",
  },
};

export default function SupportPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-12">
      <h1 className="text-3xl font-bold text-center">{t.title}</h1>
      <section className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">{t.usdcTitle}</h2>
        <p className="break-all">{t.usdcAddress}</p>
        <p>{t.usdcNote}</p>
        <Image src="/wallet.png" alt="USDC QR" width={200} height={200} className="mx-auto" />
      </section>
      <section className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">{t.svcTitle}</h2>
        <p>{t.svcDesc}</p>
        <p>{t.svcNote}</p>
        <Image src="/klo.png" alt="klo account" width={200} height={200} className="mx-auto" />
      </section>
    </div>
  );
}
