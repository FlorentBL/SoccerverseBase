// app/page.js (Next.js)
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
          SoccerverseBase <span className="inline-block">⚽</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Découvrez tous les outils et statistiques pour dominer le Soccerverse.
        </p>
        <Link href="/recompenses">
          <Button className="text-lg px-6 py-4 gap-2 bg-blue-600 hover:bg-blue-700">
            Accéder au Calculateur de Récompenses
            <span className="ml-2">→</span>
          </Button>
        </Link>
      </div>

      <div className="mt-12 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:scale-105 transition duration-300 ease-in-out bg-gray-900 border border-gray-700">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-blue-400 mb-2">Récompenses</h2>
            <p className="text-gray-400 text-sm">Calculez vos gains potentiels selon votre division et classement.</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition duration-300 ease-in-out bg-gray-800 border border-gray-700 opacity-50 cursor-not-allowed">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-500 mb-2">Analyse des Joueurs</h2>
            <p className="text-gray-500 text-sm">Bientôt disponible : suivez l’évolution de vos stars.</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition duration-300 ease-in-out bg-gray-800 border border-gray-700 opacity-50 cursor-not-allowed">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-500 mb-2">Matchs et xG</h2>
            <p className="text-gray-500 text-sm">Analyse tactique poussée des matchs par écart d'OVR et xG.</p>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-16 text-center text-xs text-gray-500">
        © 2025 SoccerverseBase – Créé par les fans, pour les fans
      </footer>
    </div>
  );
}