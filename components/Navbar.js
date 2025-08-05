"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX, FiCoffee } from "react-icons/fi";
import { usePathname } from "next/navigation";

const MENU_LABELS = {
  fr: [
    { href: "/revenus", label: "Gains Joueurs" },
    { href: "/scouting", label: "Scouting" },
    { href: "/finance", label: "Analyse financière" },
  ],
  en: [
    { href: "/revenus", label: "Player Earnings" },
    { href: "/scouting", label: "Scouting" },
    { href: "/finance", label: "Financial Analysis" },
  ],
  it: [
    { href: "/revenus", label: "Guadagni Giocatori" },
    { href: "/scouting", label: "Scouting" },
    { href: "/finance", label: "Analisi finanziaria" },
  ],
};

const LANGS = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const currentLang =
    LANGS.find((l) => pathname.startsWith("/" + l.code))?.code || "fr";
  const menuItems = MENU_LABELS[currentLang];

  function getLangHref(targetLang) {
    if (pathname.startsWith("/fr") || pathname.startsWith("/en") || pathname.startsWith("/it")) {
      return pathname.replace(/^\/(fr|en|it)/, "/" + targetLang);
    }
    return "/" + targetLang + pathname;
  }

  const getPageHref = (href) => `/${currentLang}${href}`;

  return (
    <header className="fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 mt-4">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-3">
          <Link
            href={`/${currentLang}`}
            aria-label="Accueil SoccerverseBase"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="SoccerverseBase logo"
              width={36}
              height={36}
              className="rounded-md"
            />
          </Link>

          <ul className="hidden md:flex gap-6 text-sm font-semibold">
            {menuItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={getPageHref(href)}
                  className="relative px-2 py-1 group"
                >
                  <span className="group-hover:text-white transition-colors">
                    {label}
                  </span>
                  <span className="absolute left-1/2 -bottom-1 h-0.5 w-0 bg-gradient-to-r from-fuchsia-500 to-sky-500 transition-all group-hover:w-full group-hover:left-0" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href="https://buymeacoffee.com/klov"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 text-gray-900"
            >
              <FiCoffee />
            </a>

            <div className="hidden md:flex gap-1">
              {LANGS.map((l) => (
                <Link
                  key={l.code}
                  href={getLangHref(l.code)}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentLang === l.code
                      ? "bg-white/20 text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <button
              className="md:hidden p-2 rounded-full bg-white/10"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6 text-2xl">
          {menuItems.map(({ href, label }) => (
            <Link
              key={href}
              href={getPageHref(href)}
              className="hover:text-fuchsia-400"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-3 mt-6">
            {LANGS.map((l) => (
              <Link
                key={l.code}
                href={getLangHref(l.code)}
                className={`px-3 py-1 rounded ${
                  currentLang === l.code
                    ? "bg-fuchsia-500 text-white"
                    : "bg-white/10 text-gray-300"
                }`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

