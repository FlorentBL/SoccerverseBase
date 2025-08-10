"use client";
import React, { useState } from "react";

const LABELS = {
  fr: {
    title: "Dashboard utilisateur",
    name: "Nom",
    placeholder: "ex: klo",
    submit: "Chercher",
    loading: "Chargement…",
    error: "Erreur de chargement",
    club: "Club",
    lastMatch: "Dernier match",
    position: "Position",
    noClub: "Aucun club trouvé",
  },
  en: {
    title: "User dashboard",
    name: "Name",
    placeholder: "e.g. klo",
    submit: "Search",
    loading: "Loading…",
    error: "Loading error",
    club: "Club",
    lastMatch: "Last match",
    position: "Position",
    noClub: "No club found",
  },
  it: {
    title: "Dashboard utente",
    name: "Nome",
    placeholder: "es: klo",
    submit: "Cerca",
    loading: "Caricamento…",
    error: "Errore di caricamento",
    club: "Club",
    lastMatch: "Ultima partita",
    position: "Posizione",
    noClub: "Nessun club trovato",
  }
};

async function fetchShareBalances(name) {
  let page = 1;
  let totalPages = 1;
  const items = [];
  while (page <= totalPages) {
    const res = await fetch(`https://services.soccerverse.com/api/share_balances?page=${page}&per_page=100&sort_order=asc&name=${encodeURIComponent(name)}&countries=false&leagues=false`);
    if (!res.ok) throw new Error("share");
    const data = await res.json();
    totalPages = data.total_pages || 1;
    items.push(...(data.items || []));
    page++;
  }
  return items;
}

export default function DashboardPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  const [name, setName] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setClubs([]);
    setLoading(true);
    try {
      const balances = await fetchShareBalances(name);
      const clubMap = new Map();
      balances.forEach((it) => {
        if (it.club_id) clubMap.set(it.club_id, it.league_id);
      });
      const entries = Array.from(clubMap.entries());
      const results = await Promise.all(
        entries.map(async ([clubId, leagueId]) => {
          let lastFixture = null;
          let position = null;
          try {
            const fRes = await fetch("https://gsppub.soccerverse.io/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "get_clubs_last_fixture",
                params: { club_id: Number(clubId) },
                id: 1,
              }),
            });
            if (fRes.ok) {
              const fData = await fRes.json();
              lastFixture = fData.result?.data || null;
            }
          } catch (e) {}
          try {
            const lRes = await fetch(`https://services.soccerverse.com/api/league_tables?league_id=${leagueId}`);
            if (lRes.ok) {
              const lData = await lRes.json();
              const entry = lData.find((c) => c.club_id === Number(clubId));
              position = entry?.new_position ?? null;
            }
          } catch (e) {}
          return { clubId, lastFixture, position };
        })
      );
      setClubs(results);
    } catch (e) {
      setErr(t.error);
    } finally {
      setLoading(false);
    }
  };

  function renderMatch(f, clubId) {
    if (!f) return "-";
    const isHome = f.home_club === Number(clubId);
    const goalsFor = isHome ? f.home_goals : f.away_goals;
    const goalsAgainst = isHome ? f.away_goals : f.home_goals;
    const opponent = isHome ? f.away_club : f.home_club;
    return `${goalsFor}-${goalsAgainst} vs ${opponent}`;
  }

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-white tracking-tight">{t.title}</h1>
        <form className="flex gap-2 mb-8 justify-center" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">{t.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-600 rounded p-2 w-40 bg-[#202330] text-white"
              placeholder={t.placeholder}
              required
            />
          </div>
          <button type="submit" className="bg-green-500 text-black font-bold rounded px-5 py-2 shadow hover:bg-green-400 transition">
            {t.submit}
          </button>
        </form>
        {loading && <div className="text-white text-center my-8">{t.loading}</div>}
        {err && <div className="text-red-400 text-center my-8">{err}</div>}
        {!loading && !err && clubs.length === 0 && (
          <div className="text-gray-300 text-center">{t.noClub}</div>
        )}
        {clubs.length > 0 && (
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-3 py-2">{t.club}</th>
                <th className="px-3 py-2">{t.lastMatch}</th>
                <th className="px-3 py-2">{t.position}</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((c) => (
                <tr key={c.clubId} className="border-b border-gray-700">
                  <td className="px-3 py-2">{c.clubId}</td>
                  <td className="px-3 py-2">{renderMatch(c.lastFixture, c.clubId)}</td>
                  <td className="px-3 py-2">{c.position ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
