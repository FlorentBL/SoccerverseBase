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
      <nav className="relative flex flex-col items-center max-w-full py-3 px-2">
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

        {/* Menu desktop centré */}
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

        {/* Buy me a coffee bouton (desktop only, right aligned, absolute) */}
        <div className="hidden md:block absolute right-8 top-3">
          <a
            href="https://buymeacoffee.com/klov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-1 rounded-full bg-yellow-300/80 hover:bg-yellow-400 transition"
            title="Buy me a coffee"
          >
            <svg width="27" height="39" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* ... (TON SVG ICI, inchangé) ... */}
              <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00"/>
              {/* ...le reste de ton SVG... */}
            </svg>
          </a>
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

      {/* Mobile menu + BuyMeACoffee sous le menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-4 flex flex-col items-center">
          <ul className="space-y-2 text-center w-full">
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
              {/* ...SVG identique ici aussi... */}
              <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00"/>
              {/* ...le reste du SVG... */}
            </svg>
            <span className="ml-2 font-bold text-gray-900">Buy me a coffee</span>
          </a>
        </div>
      )}
    </header>
  );
}
