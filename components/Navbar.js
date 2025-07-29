"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";

// Menu items à gauche et à droite si besoin (ici tout au centre)
const menuItems = [
  { href: "/revenus", label: "Gains Joueurs" },
  { href: "/scouting", label: "Scouting" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-800 text-white shadow-md fixed top-0 left-0 w-full z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-[68px] px-6">
        {/* Menu + logo + menu */}
        <div className="flex flex-1 items-center justify-center gap-8 relative">
          {/* Menu items */}
          <div className="hidden md:flex gap-10 text-lg font-bold items-center">
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

          {/* Logo centré, jamais cassé */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 select-none"
            aria-label="Accueil SoccerverseBase"
            style={{ zIndex: 20 }}
          >
            <Image
              src="/logo.png"
              alt="SoccerverseBase logo"
              width={38}
              height={38}
              priority
              className="rounded-md"
            />
            <span className="text-[10px] mt-[-3px] font-bold text-white opacity-80 tracking-widest">BASE</span>
          </Link>
        </div>

        {/* BuyMeACoffee */}
        <div className="hidden md:flex flex-none items-center ml-8">
          <a
            href="https://buymeacoffee.com/klov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-300/80 hover:bg-yellow-400 transition"
            title="Buy me a coffee"
          >
            {/* SVG complet : */}
            <svg width="27" height="39" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="13.5" cy="7.5" rx="11.5" ry="5.5" fill="#FFDD00"/>
              <rect x="2" y="7" width="23" height="27" rx="8" fill="#FFDD00"/>
              <ellipse cx="13.5" cy="7.5" rx="11.5" ry="5.5" stroke="#0D0C22" strokeWidth="2"/>
              <rect x="2" y="7" width="23" height="27" rx="8" stroke="#0D0C22" strokeWidth="2"/>
              <ellipse cx="13.5" cy="7.5" rx="6.5" ry="2.5" fill="#F9C700"/>
              <ellipse cx="13.5" cy="7.5" rx="6.5" ry="2.5" stroke="#0D0C22" strokeWidth="1"/>
              <ellipse cx="13.5" cy="32" rx="7" ry="3" fill="#F9C700" stroke="#0D0C22" strokeWidth="1"/>
              <rect x="8.5" y="12" width="10" height="17" rx="5" fill="#FFF7B2"/>
              <rect x="8.5" y="12" width="10" height="17" rx="5" stroke="#0D0C22" strokeWidth="1"/>
            </svg>
          </a>
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden text-2xl focus:outline-none absolute right-4 top-1/2 -translate-y-1/2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4 flex flex-col items-center">
          <ul className="space-y-2 text-center w-full mt-2">
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
          <a
            href="https://buymeacoffee.com/klov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center mt-3 p-2 rounded-full bg-yellow-300/80 hover:bg-yellow-400 transition"
            title="Buy me a coffee"
          >
            <svg width="27" height="39" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="13.5" cy="7.5" rx="11.5" ry="5.5" fill="#FFDD00"/>
              <rect x="2" y="7" width="23" height="27" rx="8" fill="#FFDD00"/>
              <ellipse cx="13.5" cy="7.5" rx="11.5" ry="5.5" stroke="#0D0C22" strokeWidth="2"/>
              <rect x="2" y="7" width="23" height="27" rx="8" stroke="#0D0C22" strokeWidth="2"/>
              <ellipse cx="13.5" cy="7.5" rx="6.5" ry="2.5" fill="#F9C700"/>
              <ellipse cx="13.5" cy="7.5" rx="6.5" ry="2.5" stroke="#0D0C22" strokeWidth="1"/>
              <ellipse cx="13.5" cy="32" rx="7" ry="3" fill="#F9C700" stroke="#0D0C22" strokeWidth="1"/>
              <rect x="8.5" y="12" width="10" height="17" rx="5" fill="#FFF7B2"/>
              <rect x="8.5" y="12" width="10" height="17" rx="5" stroke="#0D0C22" strokeWidth="1"/>
            </svg>
            <span className="ml-2 font-bold text-gray-900">Buy me a coffee</span>
          </a>
        </div>
      )}
    </header>
  );
}
