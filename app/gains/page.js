"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import fullData from "@/data/gains_full_usd.json";

export default function GainsPage() {
  const rows = fullData;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-800 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent">
          Gains & Salaires des Joueurs
        </h1>

        <section className="bg-gray-900 rounded-2xl shadow-xl p-6 mb-10 border border-yellow-600">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Rôles possibles</h2>
          <p className="mb-2">
            Vous pouvez jouer en tant qu'<strong>actionniste</strong> (influencer) ou
            <strong> agent de joueur</strong>. Ces deux rôles peuvent se combiner avec celui de <strong>scout</strong>.
          </p>
          <p>
            Les <strong>SVC</strong> affichés sont ceux versés pour <strong>100% des influences</strong> du joueur. Si vous possédez moins d'influences,
            vous recevez une part proportionnelle.
          </p>
        </section>

        <section className="bg-gray-900 rounded-2xl shadow-xl p-6 mb-10 border border-yellow-600">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Conditions de gain</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Clean Sheet</strong> : Uniquement pour les Gardiens et Défenseurs titulaires pendant au moins 70 minutes</li>
            <li><strong>Titulaire</strong> : Le joueur doit jouer au moins 45 minutes</li>
            <li><strong>Starter</strong> : Minimum 45 minutes pour toucher la prime de titularisation</li>
          </ul>
        </section>

        <section className="bg-gray-900 rounded-2xl shadow-xl p-6 border border-yellow-600">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Table des gains (en $)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base text-white border-collapse">
              <thead>
                <tr className="bg-yellow-800 text-yellow-100">
                  <th className="px-3 py-2 text-left">Rating</th>
                  <th className="px-3 py-2 text-left">Wage</th>
                  <th className="px-3 py-2 text-left">Inf. Pay</th>
                  <th className="px-3 py-2 text-left">Starter</th>
                  <th className="px-3 py-2 text-left">Goal</th>
                  <th className="px-3 py-2 text-left">Assist</th>
                  <th className="px-3 py-2 text-left">Clean Sheet</th>
                  <th className="px-3 py-2 text-left">Agent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rating} className="even:bg-gray-800 hover:bg-gray-700">
                    <td className="px-3 py-2">{row.rating}</td>
                    <td className="px-3 py-2">${row.wage}</td>
                    <td className="px-3 py-2">${row.infPay}</td>
                    <td className="px-3 py-2">${row.starter}</td>
                    <td className="px-3 py-2">${row.goal}</td>
                    <td className="px-3 py-2">${row.assist}</td>
                    <td className="px-3 py-2">${row.clean}</td>
                    <td className="px-3 py-2">${row.agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
