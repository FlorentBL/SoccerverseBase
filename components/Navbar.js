"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scoutingOpen, setScoutingOpen] = useState(false);
  const [scoutingTimeout, setScoutingTimeout] = useState(null);

  const scoutingItems = [
    { href: "/joueurs", label: "Joueurs" },
    { href: "/clubs", label: "Clubs" },
    { href: "/championnats", label: "Championnat" },
  ];

  // Menus principaux sans Convertisseur SVC ni Fitness
  const menuItems = [
    { href: "/recompenses", label: "Calculateur de Récompenses" },
    { href: "/revenus", label: "Gains Joueurs" },
  ];

  return (
    <header className="bg-gray-800 text-white shadow-md fixed top-0 left-0 w-full z-50">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2" aria-label="Accueil SoccerverseBase">
          <Image
            src="/logo.png"
            alt="SoccerverseBase logo"
            width={38}
            height={38}
            priority
            className="rounded-md"
          />
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-6 text-sm font-medium items-center">
          {menuItems.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-green-400">
              {label}
            </Link>
          ))}

          {/* Menu déroulant SCOUTING avec délai */}
          <div
            className="relative group"
            onMouseEnter={() => {
              if (scoutingTimeout) clearTimeout(scoutingTimeout);
              setScoutingOpen(true);
            }}
            onMouseLeave={() => {
              const timeout = setTimeout(() => setScoutingOpen(false), 120);
              setScoutingTimeout(timeout);
            }}
          >
            <button
              className="flex items-center gap-1 hover:text-green-400 font-semibold px-2"
              tabIndex={0}
              aria-haspopup="true"
              aria-expanded={scoutingOpen}
            >
              Scouting <FiChevronDown />
            </button>
            <div
              className={`absolute left-0 mt-2 w-44 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 transition-all duration-150
              ${scoutingOpen ? "block" : "hidden"}`}
            >
              {scoutingItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-4 py-2 hover:bg-gray-800 hover:text-green-400 transition"
                  onClick={() => setScoutingOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-2xl focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {/* Menu mobile avec sous-menu Scouting */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4">
          <ul className="space-y-2">
            {menuItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 border-b border-gray-700 hover:text-green-400"
                >
                  {label}
                </Link>
              </li>
            ))}
            {/* Scouting dropdown mobile */}
            <li>
              <button
                onClick={() => setScoutingOpen(!scoutingOpen)}
                className="flex items-center w-full py-2 border-b border-gray-700 hover:text-green-400 font-semibold"
              >
                <span className="flex-1 text-left">Scouting</span>
                <FiChevronDown className={`transition-transform ${scoutingOpen ? "rotate-180" : ""}`} />
              </button>
              {scoutingOpen && (
                <ul className="pl-4 mt-1 space-y-1">
                  {scoutingItems.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => {
                          setMenuOpen(false);
                          setScoutingOpen(false);
                        }}
                        className="block py-1 text-sm hover:text-green-400"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
