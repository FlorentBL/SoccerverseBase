"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const LANGS = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "it", label: "IT" }
];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  // Détecte la langue dans le path, sinon défaut "fr"
  const current = LANGS.find(l => pathname.startsWith("/" + l.code))?.code || "fr";

  // Retourne l'URL dans la nouvelle langue, même sous-page !
  const getHref = (lang) => {
    if (current === lang) return pathname;
    // Replace l'ancien préfixe par le nouveau, ou ajoute si absent
    if (pathname.startsWith("/fr") || pathname.startsWith("/en") || pathname.startsWith("/it"))
      return pathname.replace(/^\/(fr|en|it)/, "/" + lang);
    return "/" + lang + pathname;
  };

  return (
    <div className="flex justify-end px-4 py-2 gap-1">
      {LANGS.map(l => (
        <Link href={getHref(l.code)} key={l.code}>
          <button
            className={`text-sm px-3 py-1 rounded ml-1 ${
              current === l.code
                ? "bg-indigo-600 text-white font-bold"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
            disabled={current === l.code}
            aria-label={`Voir en ${l.label}`}
          >
            {l.label}
          </button>
        </Link>
      ))}
    </div>
  );
}
