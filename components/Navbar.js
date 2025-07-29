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
      <nav className="max-w-7xl mx-auto flex items-center justify-center h-[68px] px-2 relative">
        {/* Ligne centrale logo + menu + buymeacoffee */}
        <div className="flex w-full items-center justify-center relative">
          {/* Logo centré */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2 top-0"
            aria-label="Accueil SoccerverseBase"
            style={{ height: 68, zIndex: 10 }}
          >
            <Image
              src="/logo.png"
              alt="SoccerverseBase logo"
              width={38}
              height={38}
              priority
              className="rounded-md"
            />
            <span className="text-[10px] mt-[-3px] font-bold text-white opacity-80 tracking-widest select-none">BASE</span>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex gap-8 text-lg font-bold items-center justify-center w-full">
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

          {/* BuyMeACoffee à droite */}
          <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2">
            <a
              href="https://buymeacoffee.com/klov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-1 rounded-full bg-yellow-300/80 hover:bg-yellow-400 transition"
              title="Buy me a coffee"
            >
              {/* Votre SVG */}
              <svg width="34" height="39" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* ...COLLE LE SVG ICI... */}
                <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00"/>
                {/* ...le reste du SVG... */}
              </svg>
            </a>
          </div>
        </div>

        {/* Burger mobile à droite */}
        <button
          className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-2xl focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {/* Menu mobile + buymeacoffee en dessous */}
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
              {/* ...SVG... */}
              <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00"/>
            </svg>
            <span className="ml-2 font-bold text-gray-900">Buy me a coffee</span>
          </a>
        </div>
      )}
    </header>
  );
}
