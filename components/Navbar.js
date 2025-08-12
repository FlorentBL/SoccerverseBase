"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX, FiCoffee } from "react-icons/fi";
import { usePathname } from "next/navigation";
import SVCRate from "./SVCRate";

const MENU_LABELS = {
  fr: [
    { href: "/comment-debuter", label: "Débuter" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/scouting", label: "Scouting" },
    { href: "/recompenses", label: "Simulateur de récompense" },
    {
      label: "Analyse",
      children: [
        { href: "/finance", label: "Finances d'un club" },
        { href: "/analyse-tactique", label: "Tactique" },
        { href: "/revenus", label: "Gains joueurs" },
      ],
    },
  ],
    en: [
      { href: "/comment-debuter", label: "Getting started" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/scouting", label: "Scouting" },
      { href: "/recompenses", label: "Rewards simulator" },
    {
      label: "Analysis",
      children: [
        { href: "/finance", label: "Club finances" },
        { href: "/analyse-tactique", label: "Tactical" },
        { href: "/revenus", label: "Player earnings" },
      ],
    },
  ],
    it: [
      { href: "/comment-debuter", label: "Come iniziare" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/scouting", label: "Scouting" },
      { href: "/recompenses", label: "Simulatore ricompense" },
    {
      label: "Analisi",
      children: [
        { href: "/finance", label: "Finanze del club" },
        { href: "/analyse-tactique", label: "Tattica" },
        { href: "/revenus", label: "Guadagni giocatori" },
      ],
    },
    ],
    zh: [
      { href: "/comment-debuter", label: "入门" },
      { href: "/dashboard", label: "仪表盘" },
      { href: "/scouting", label: "球探" },
      { href: "/recompenses", label: "奖励模拟器" },
      {
        label: "分析",
        children: [
          { href: "/finance", label: "俱乐部财务" },
          { href: "/analyse-tactique", label: "战术" },
          { href: "/revenus", label: "球员收益" },
        ],
      },
    ],
  };

const LANGS = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
  { code: "zh", label: "ZH" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const currentLang =
    LANGS.find((l) => pathname.startsWith("/" + l.code))?.code || "fr";
  const menuItems = MENU_LABELS[currentLang];

  function getLangHref(targetLang) {
    if (pathname.startsWith("/fr") || pathname.startsWith("/en") || pathname.startsWith("/it") || pathname.startsWith("/zh")) {
      return pathname.replace(/^\/(fr|en|it|zh)/, "/" + targetLang);
    }
    return "/" + targetLang + pathname;
  }

  const getPageHref = (href) => `/${currentLang}${href}`;

  return (
    <header className="fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 mt-4">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-5 py-3 text-gray-100">
          <div className="flex items-center gap-3">
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
            <SVCRate className="hidden md:inline-block" />
          </div>

          <ul className="hidden md:flex gap-6 text-sm font-medium">
            {menuItems.map((item) => (
              <li key={item.label || item.href} className="relative group">
                {item.children ? (
                  <>
                    <span className="px-2 py-1 cursor-pointer transition-colors group-hover:text-indigo-400">
                      {item.label}
                    </span>
                    <ul className="absolute left-0 top-full hidden group-hover:block bg-black/80 backdrop-blur-md rounded-md shadow-lg py-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={getPageHref(child.href)}
                            className="block whitespace-nowrap px-4 py-2 hover:bg-white/10"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={getPageHref(item.href)}
                    className="relative px-2 py-1 group"
                  >
                    <span className="transition-colors group-hover:text-indigo-400">
                      {item.label}
                    </span>
                    <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-indigo-500 transition-all group-hover:w-full" />
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href="https://buymeacoffee.com/klov"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-gray-900"
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
                      ? "bg-indigo-500 text-gray-900"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <button
              className="md:hidden p-2 rounded-md bg-white/10"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-2xl text-gray-100">
          {menuItems.map((item) => (
            item.children ? (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <span>{item.label}</span>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={getPageHref(child.href)}
                    className="text-xl hover:text-indigo-400"
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.href}
                href={getPageHref(item.href)}
                className="hover:text-indigo-400"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          ))}
          <SVCRate />
          <div className="flex gap-3 mt-6">
            {LANGS.map((l) => (
              <Link
                key={l.code}
                href={getLangHref(l.code)}
                className={`px-3 py-1 rounded ${
                  currentLang === l.code
                    ? "bg-indigo-500 text-gray-900"
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

