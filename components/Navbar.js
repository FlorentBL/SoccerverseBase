// components/Navbar.js
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const menuItems = [
    { href: "/convertisseur", label: "Convertisseur SVC" },
    { href: "/recompenses", label: "Calculateur de Récompenses" },
    { href: "/joueurs", label: "Infos Joueurs" },
    { href: "/fitness", label: "Calculateur Fitness" },
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
          {/* Optionnel: tu peux rajouter le texte "SoccerverseBase" en petit à droite du logo :
          <span className="ml-2 font-bold text-lg hidden sm:inline">SoccerverseBase</span>
          */}
        </Link>

        <div className="hidden md:flex gap-6 text-sm font-medium">
          {menuItems.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-green-400">
              {label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden text-2xl focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

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
          </ul>
        </div>
      )}
    </header>
  );
}
