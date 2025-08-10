"use client";
import React, { useState, useEffect } from "react";

const LABELS = {
  fr: {
    title: "Dashboard utilisateur",
    name: "Nom",
    placeholder: "ex: klo",
    submit: "Chercher",
    loading: "Chargement…",
    error: "Erreur de chargement",
    club: "Club",
    shares: "Parts",
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
    shares: "Shares",
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
    shares: "Quote",
    lastMatch: "Ultima partita",
    position: "Posizione",
    noClub: "Nessun club trovato",
  },
};

const CLUB_MAPPING_URL = "/club_mapping.json";

async function fetchShareBalances(name) {
  let page = 1;
  let totalPages = 1;
  const items = [];
  while (page <= totalPages) {
    const res = await fetch(
      `https://services.soccerverse.com/api/share_balances?page=${page}&per_page=100&sort_order=asc&name=${encodeURIComponent(
        name
      )}&countries=false&leagues=false`
    );
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
  const [clubNames, setClubNames] = useState({});
  const [sortField, setSortField] = useState("shares");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch(CLUB_MAPPING_URL)
      .then((r) => r.json())
      .then((d) => setClubNames(d))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setClubs([]);
    setLoading(true);
    try {
      const balances = await fetchShareBalances(name);
      const clubMap = new Map();
      balances.forEach((it) => {
        if (it.share_type !== "club" || !it.club_id) return;
        const entry =
          clubMap.get(it.club_id) || { leagueId: it.league_id, shares: 0 };
        entry.shares += it.num;
        if (!entry.leagueId && it.league_id) entry.leagueId = it.league_id;
        clubMap.set(it.club_id, entry);
      });
      const results = await Promise.all(
        Array.from(clubMap.entries()).map(async ([clubId, { leagueId, shares }]) => {
          let lastFixture = null;
          let lastFixtureRaw = null;
          let position = null;
          try {
            const fRes = await fetch("https://gsppub.soccerverse.io/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              cache: "no-store",
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "get_clubs_last_fixture",
                params: { club_id: Number(clubId) },
                id: 1,
              }),
            });
            if (fRes.ok) {
              const fData = await fRes.json();
              lastFixtureRaw = fData;
              const r = fData.result;
              lastFixture = r && r.data ? r.data : r || null;
            }
          } catch (e) {}
          try {
            const lRes = await fetch(
              `https://services.soccerverse.com/api/league_tables?league_id=${leagueId}`
            );
            if (lRes.ok) {
              const lData = await lRes.json();
              const entry = lData.find((c) => c.club_id === Number(clubId));
              position = entry?.new_position ?? null;
            }
          } catch (e) {}
          return { clubId, shares, lastFixture, lastFixtureRaw, position };
        })
      );
      setClubs(results);
    } catch (e) {
      setErr(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedClubs = [...clubs].sort((a, b) => {
    if (sortField === "club") {
      const nameA = clubNames[a.clubId]?.name || String(a.clubId);
      const nameB = clubNames[b.clubId]?.name || String(b.clubId);
      return nameA.localeCompare(nameB) * (sortAsc ? 1 : -1);
    }
    if (sortField === "shares") {
      return (a.shares - b.shares) * (sortAsc ? 1 : -1);
    }
    if (sortField === "position") {
      const posA = a.position ?? Infinity;
      const posB = b.position ?? Infinity;
      return (posA - posB) * (sortAsc ? 1 : -1);
    }
    return 0;
  });

  const renderMatch = (f, clubId) => {
    if (!f) return "-";
    const isHome = f.home_club === Number(clubId);
    const goalsFor = isHome ? f.home_goals : f.away_goals;
    const goalsAgainst = isHome ? f.away_goals : f.home_goals;
    const opponentId = isHome ? f.away_club : f.home_club;
    const opponentName = clubNames[opponentId]?.name || opponentId;
    return (
      <a
        href={`https://play.soccerverse.com/match/${f.fixture_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:text-indigo-300 underline"
      >
        {goalsFor}-{goalsAgainst} vs {opponentName}
      </a>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-white tracking-tight">
          {t.title}
        </h1>
        <form className="flex gap-2 mb-8 justify-center" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">
              {t.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-600 rounded p-2 w-40 bg-[#202330] text-white"
              placeholder={t.placeholder}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 text-black font-bold rounded px-5 py-2 shadow hover:bg-green-400 transition"
          >
            {t.submit}
          </button>
        </form>
        {loading && <div className="text-white text-center my-8">{t.loading}</div>}
        {err && <div className="text-red-400 text-center my-8">{err}</div>}
        {!loading && !err && sortedClubs.length === 0 && (
          <div className="text-gray-300 text-center">{t.noClub}</div>
        )}
        {sortedClubs.length > 0 && (
          <>
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                <tr>
                  <th
                    onClick={() => handleSort("club")}
                    className="px-3 py-2 cursor-pointer"
                  >
                    {t.club} {sortField === "club" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("shares")}
                    className="px-3 py-2 cursor-pointer"
                  >
                    {t.shares} {sortField === "shares" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th className="px-3 py-2">{t.lastMatch}</th>
                  <th
                    onClick={() => handleSort("position")}
                    className="px-3 py-2 cursor-pointer"
                  >
                    {t.position} {sortField === "position" && (sortAsc ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedClubs.map((c) => (
                  <tr key={c.clubId} className="border-b border-gray-700">
                    <td className="px-3 py-2">
                      <a
                        href={`https://play.soccerverse.com/club/${c.clubId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {clubNames[c.clubId]?.name || c.clubId}
                      </a>
                    </td>
                    <td className="px-3 py-2">{c.shares.toLocaleString()}</td>
                    <td className="px-3 py-2">{renderMatch(c.lastFixture, c.clubId)}</td>
                    <td className="px-3 py-2">{c.position ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 space-y-4 text-xs text-gray-400">
              {sortedClubs.map((c) => (
                <div key={c.clubId}>
                  <div className="font-semibold mb-1">
                    {clubNames[c.clubId]?.name || c.clubId}
                  </div>
                  <pre className="bg-gray-800 p-2 overflow-x-auto">
                    {JSON.stringify(c.lastFixtureRaw, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
