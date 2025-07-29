"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";

const menuItems = [
  { href: "/revenus", label: "Gains Joueurs" },
  { href: "/scouting", label: "Scouting" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-800 text-white shadow-md fixed top-0 left-0 w-full z-50">
      <nav className="flex flex-col items-center max-w-full py-3 px-2">
        {/* Logo centré */}
        <Link href="/" className="flex items-center justify-center mb-2" aria-label="Accueil SoccerverseBase">
          <Image
            src="/logo.png"
            alt="SoccerverseBase logo"
            width={38}
            height={38}
            priority
            className="rounded-md"
          />
        </Link>

        {/* Desktop menu CENTRE */}
        <div className="hidden md:flex gap-8 text-base font-bold items-center justify-center">
          {menuItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-green-400 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Burger mobile à droite (absolu pour pas décentrer le reste) */}
        <button
          className="absolute top-3 right-4 md:hidden text-2xl focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4">
          <ul className="space-y-2 text-center">
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
