"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const menuItems = [
  { href: "/revenus", label: "Gains Joueurs" },
  { href: "/scouting", label: "Scouting" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-800 text-white shadow-md fixed top-0 left-0 w-full z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-8 h-[68px] relative">
        {/* Bloc centré: logo + menu */}
        <div className="flex items-center gap-8 mx-auto">
          {/* Logo à gauche */}
          <Link href="/" aria-label="Accueil SoccerverseBase" className="flex items-center gap-1 mr-2">
            <Image
              src="/logo.png"
              alt="SoccerverseBase logo"
              width={38}
              height={38}
              priority
              className="rounded-md"
            />
            {/* Optionnel: texte sous le logo */}
            {/* <span className="text-xs font-bold ml-1">BASE</span> */}
          </Link>
          {/* Menu horizontal */}
          <div className="flex items-center gap-8 font-bold text-xl">
            {menuItems.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-green-400 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
        {/* Café à droite */}
        <div className="flex items-center">
          <a
            href="https://buymeacoffee.com/klov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center w-12 h-12 rounded-full bg-yellow-300/80 hover:bg-yellow-400 transition"
            title="Buy me a coffee"
          >
            {/* SVG café, version stylée */}
            <svg width="27" height="39" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00"/>
              <ellipse cx="13.5" cy="11" rx="7.5" ry="3" stroke="#0D0C22" strokeWidth="2" fill="#FFDD00"/>
              <ellipse cx="13.5" cy="27" rx="7.5" ry="3" stroke="#0D0C22" strokeWidth="2" fill="#FFDD00"/>
              <rect x="6" y="11" width="15" height="16" rx="7.5" fill="#FFDD00" stroke="#0D0C22" strokeWidth="2"/>
            </svg>
          </a>
        </div>
      </nav>
    </header>
  );
}
