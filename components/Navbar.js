"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";

const menuItems = [
  { href: "/recompenses", label: "Calculateur de Récompenses" },
  { href: "/revenus", label: "Gains Joueurs" },
  { href: "/scouting", label: "Scouting" }, // Page unique avec les onglets
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="hidden md:flex gap-6 text-sm font-bold items-center">
          {menuItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-green-400"
            >
              {label}
            </Link>
          ))}
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4">
          <ul className="space-y-2">
            {menuItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 border-b border-gray-700 hover:text-green-400 font-bold"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
