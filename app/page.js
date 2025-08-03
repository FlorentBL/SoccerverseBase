// /app/page.js

import { redirect } from "next/navigation";

export default function Home({ params }) {
  // Vérifie si on est en environnement "Edge" (middleware), pour accéder aux headers
  if (typeof window === "undefined") {
    // Côté serveur (SSR)
    // Next.js injecte les headers dans `headers()` (Edge Runtime)
    // On va chercher "accept-language"
    const acceptLanguage = headers().get("accept-language") || "";
    // Cherche la langue principale (avant le ';' ou ',')
    const lang = acceptLanguage.split(/[,;]/)[0];
    // Simple match (étends à d'autres langues si besoin)
    if (lang.startsWith("fr")) {
      redirect("/fr");
    }
    if (lang.startsWith("en")) {
      redirect("/en");
    }
    // Ajoute d'autres langues ici si besoin, exemple italien :
    // if (lang.startsWith("it")) { redirect("/it"); }
    // Sinon, fallback vers FR :
    redirect("/fr");
  } else {
    // Côté client (au cas où, par sécurité)
    if (navigator.language.startsWith("en")) {
      redirect("/en");
    } else {
      redirect("/fr");
    }
  }
  return null;
}

// Ajoute cette import en haut du fichier :
import { headers } from "next/headers";
