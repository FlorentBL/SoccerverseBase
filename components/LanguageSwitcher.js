"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  // Déduit la langue courante
  const isFR = pathname.startsWith("/fr");
  // Si jamais tu veux gérer plus de pages, adapte ici
  return (
    <div className="flex justify-end px-4 py-2">
      <Link href={isFR ? pathname.replace("/fr", "/en") : pathname.replace("/en", "/fr")}>
        <button className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded ml-3">
          {isFR ? "EN" : "FR"}
        </button>
      </Link>
    </div>
  );
}
