"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";

const menuItems = [
  { href: "/revenus", label: "Gains Joueurs" },
  { href: "/scouting", label: "Scouting" },
];

const BuyMeCoffee = ({ className = "" }) => (
  <a
    href="https://buymeacoffee.com/klov"
    target="_blank"
    rel="noopener noreferrer"
    className={
      "flex items-center justify-center rounded-full bg-yellow-300/80 hover:bg-yellow-400 transition w-14 h-14 ml-4 " +
      className
    }
    title="Buy me a coffee"
    style={{ minWidth: 56, minHeight: 56 }}
  >
    {/* Utilise ici ton SVG, tu peux remplacer le contenu si tu veux */}
    <svg width="27" height="39" viewBox="0 0 27 39" fill="none">
      <circle cx="19" cy="19" r="19" fill="#E1C44A" />
      <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00" />
    </svg>
  </a>
);

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-800 text-white shadow-md fixed top-0 left-0 w-full z-50">
      <nav className="max-w-6xl mx-auto flex items-center justify-center px-8 h-[68px] relative">
        {/* Desktop row */}
        <div className="hidden md:flex items-center gap-8 w-full justify-center">
          {/* Logo juste à gauche du menu */}
          <Link href="/" aria-label="Accueil SoccerverseBase" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="SoccerverseBase logo"
              width={38}
              height={38}
              priority
              className="rounded-md"
            />
            <span className="text-xs font-bold ml-1">BASE</span>
          </Link>
          {/* Menu items */}
          {menuItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-green-400 font-bold text-2xl transition-colors"
            >
              {label}
            </Link>
          ))}
          {/* Café à la fin */}
          <BuyMeCoffee />
        </div>

        {/* Burger menu (mobile) */}
        <div className="md:hidden flex items-center justify-between w-full">
          {/* Logo centré */}
          <div className="flex-1 flex justify-center">
            <Link href="/" aria-label="Accueil SoccerverseBase" className="flex items-center gap-1">
              <Image
                src="/logo.png"
                alt="SoccerverseBase logo"
                width={38}
                height={38}
                priority
                className="rounded-md"
              />
              <span className="text-xs font-bold ml-1">BASE</span>
            </Link>
          </div>
          <button
            className="text-3xl"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
        </div>
      </nav>
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col">
          <div className="flex items-center justify-between p-6">
            <div className="flex-1 flex justify-center">
              <Image
                src="/logo.png"
                alt="SoccerverseBase logo"
                width={38}
                height={38}
                priority
                className="rounded-md"
              />
              <span className="text-xs font-bold ml-1">BASE</span>
            </div>
            <button
              className="text-4xl"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
            >
              <FiX />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-start items-center gap-8 mt-8">
            {menuItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block text-2xl font-bold py-2 hover:text-green-400 transition"
              >
                {label}
              </Link>
            ))}
            {/* Coffee sous le menu */}
            <div className="mt-6">
              <BuyMeCoffee />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
