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
      <nav className="max-w-7xl mx-auto px-4 py-0 h-[68px] flex items-center justify-between relative">
        {/* Bloc menu centré (logo + liens) */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-8">
            {/* Logo à gauche du menu */}
            <Link
              href="/"
              aria-label="Accueil SoccerverseBase"
              className="flex items-center gap-1"
            >
              <Image
                src="/logo.png"
                alt="SoccerverseBase logo"
                width={38}
                height={38}
                priority
                className="rounded-md"
              />
            </Link>
            {/* Liens du menu - cachés sur mobile */}
            <div className="hidden md:flex items-center gap-8 font-bold text-xl">
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
          </div>
        </div>

        {/* BuyMeACoffee: toujours à droite */}
        <div className="flex items-center md:ml-6">
          <a
            href="https://buymeacoffee.com/klov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center w-12 h-12 rounded-full bg-yellow-300/80 hover:bg-yellow-400 transition justify-center"
            title="Buy me a coffee"
          >
            {/* Ton SVG custom ici */}
            <svg width="27" height="39" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00"/>
              {/* Ajoute ici les autres paths si besoin */}
            </svg>
          </a>
        </div>

        {/* Burger menu (mobile uniquement) */}
        <button
          className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-3xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {/* Menu mobile déroulant */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4 pt-2 absolute top-[68px] left-0 w-full z-40">
          <ul className="space-y-2">
            {menuItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 border-b border-gray-700 hover:text-green-400 font-bold text-lg"
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
