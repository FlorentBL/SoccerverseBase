"use client";
import React, { useEffect, useState } from "react";

// Mapping position pour affichage lisible
const POSITIONS = {
  1: "GK",
  2: "LB",
  4: "CB",
  8: "RB",
  16: "LM",
  32: "CM",
  64: "RM",
  128: "LW",
  256: "CF",
  512: "RW",
  // ... autres si besoin
};

function timestampToAge(dob) {
  if (!dob) return "?";
  const birth = new Date(dob * 1000);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function FreebenchPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function fetchFreebench() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("https://gsppub.soccerverse.io/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "test",
            jsonrpc: "2.0",
            method: "get_freebench",
            params: {}
          }),
        });
        const data = await res.json();
        setPlayers(data.result?.data || []);
      } catch (e) {
        setErr("Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    fetchFreebench();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Freebench – Joueurs sans contrat</h1>
      {loading && <div>Chargement…</div>}
      {err && <div className="text-red-600">{err}</div>}
      {!loading && !err && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-3 py-2 border">ID</th>
                <th className="px-3 py-2 border">Pays</th>
                <th className="px-3 py-2 border">Âge</th>
                <th className="px-3 py-2 border">OVR</th>
                <th className="px-3 py-2 border">Poste</th>
                <th className="px-3 py-2 border">Valeur</th>
                <th className="px-3 py-2 border">Salaire</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.player_id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-1 border text-center">{p.player_id}</td>
                  <td className="px-3 py-1 border text-center">{p.country_id}</td>
                  <td className="px-3 py-1 border text-center">{timestampToAge(p.dob)}</td>
                  <td className="px-3 py-1 border text-center">{p.rating}</td>
                  <td className="px-3 py-1 border text-center">{POSITIONS[p.position] || p.position}</td>
                  <td className="px-3 py-1 border text-right">{p.value?.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-1 border text-right">{p.wages?.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
