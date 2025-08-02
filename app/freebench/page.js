"use client";
import React, { useEffect, useState } from "react";

const POSITIONS = { 1: "GK", 2: "LB", 4: "CB", 8: "RB", 16: "LM", 32: "CM", 64: "RM", 128: "LW", 256: "CF", 512: "RW" };

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
  const [minRating, setMinRating] = useState("");
  const [ratings, setRatings] = useState({}); // player_id -> { current, projected }

  // 1. Récupère la liste des free agents
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

  // 2. Récupère les ratings pour chaque player_id du tableau affiché
  useEffect(() => {
    async function fetchRatings() {
      const ids = players.map(p => p.player_id);
      const toFetch = ids.filter(id => ratings[id] === undefined).slice(0, 30); // Limite à 30 joueurs max en une fois
      if (toFetch.length === 0) return;
      const newRatings = {};
      await Promise.all(
        toFetch.map(async id => {
          try {
            const res = await fetch(`https://soccerratings.org/api/player/${id}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.nodata === 0) {
              newRatings[id] = {
                current: data.current_rating?.overall ?? null,
                projected: data.projected_rating?.overall ?? null
              };
            }
          } catch (e) {}
        })
      );
      if (Object.keys(newRatings).length > 0)
        setRatings(r => ({ ...r, ...newRatings }));
    }
    if (players.length > 0) fetchRatings();
    // eslint-disable-next-line
  }, [players]);

  const filteredPlayers = players.filter(
    p => !minRating || p.rating >= parseInt(minRating)
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Freebench – Joueurs sans contrat</h1>
      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label htmlFor="min-rating" className="block font-semibold mb-1">Note minimale</label>
          <input
            type="number"
            id="min-rating"
            value={minRating}
            min={0}
            max={99}
            onChange={e => setMinRating(e.target.value)}
            className="border rounded px-2 py-1 w-24"
            placeholder="Ex: 65"
          />
        </div>
      </div>
      {loading && <div>Chargement…</div>}
      {err && <div className="text-red-600">{err}</div>}
      {!loading && !err && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-3 py-2 border">ID</th>
                <th className="px-3 py-2 border">Pays</th>
                <th className="px-3 py-2 border">Âge</th>
                <th className="px-3 py-2 border">OVR</th>
                <th className="px-3 py-2 border">Poste</th>
                <th className="px-3 py-2 border">Valeur</th>
                <th className="px-3 py-2 border">Salaire</th>
                <th className="px-3 py-2 border">Current</th>
                <th className="px-3 py-2 border">Projected</th>
                <th className="px-3 py-2 border">Δ OVR</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((p) => {
                const rating = ratings[p.player_id];
                return (
                  <tr key={p.player_id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-1 border text-center">{p.player_id}</td>
                    <td className="px-3 py-1 border text-center">{p.country_id}</td>
                    <td className="px-3 py-1 border text-center">{timestampToAge(p.dob)}</td>
                    <td className="px-3 py-1 border text-center">{p.rating}</td>
                    <td className="px-3 py-1 border text-center">{POSITIONS[p.position] || p.position}</td>
                    <td className="px-3 py-1 border text-right">{p.value?.toLocaleString("fr-FR")}</td>
                    <td className="px-3 py-1 border text-right">{p.wages?.toLocaleString("fr-FR")}</td>
                    <td className="px-3 py-1 border text-center">
                      {rating?.current ?? <span className="text-gray-400">…</span>}
                    </td>
                    <td className="px-3 py-1 border text-center">
                      {rating?.projected ?? <span className="text-gray-400">…</span>}
                    </td>
                    <td className="px-3 py-1 border text-center">
                      {(rating?.current != null && rating?.projected != null)
                        ? ((rating.projected - rating.current) > 0 ? "+" : "") + (rating.projected - rating.current)
                        : <span className="text-gray-400">…</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPlayers.length === 0 && (
            <div className="text-center p-4 text-gray-500">Aucun joueur ne correspond au filtre.</div>
          )}
        </div>
      )}
    </div>
  );
}
