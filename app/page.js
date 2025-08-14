// /app/page.js

import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
    if (lang.startsWith("it")) {
      redirect("/it");
    }
    if (lang.startsWith("zh")) {
      redirect("/zh");
    }
    // Sinon, fallback vers FR :
    redirect("/fr");
  } else {
    // Côté client (au cas où, par sécurité)
    if (navigator.language.startsWith("en")) {
      redirect("/en");
    } else if (navigator.language.startsWith("it")) {
      redirect("/it");
    } else if (navigator.language.startsWith("zh")) {
      redirect("/zh");
    } else {
      redirect("/fr");
    }
  }
  return null;
}
