"use client";
import React, { useState, useEffect } from "react";

export default function AnalyseTactiquePage({ lang = "fr" }) {
  const [clubId, setClubId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clubMap, setClubMap] = useState({});

  const TEXTS = {
    fr: {
      title: "Analyse tactique",
      placeholder: "ID du club",
      analyze: "Analyser",
      loading: "Chargement...",
      error: "Erreur lors des appels API",
      nextMatchAgainst: "Prochain match contre",
      recentForm: "Forme récente",
      match: "Match",
      score: "Score",
      formation: "Formation",
      style: "Style",
      avgTempo: "Tempo moyen",
      avgTackles: "Tacles moyens",
      noData: "Aucune donnée disponible",
    },
    en: {
      title: "Tactical analysis",
      placeholder: "Club ID",
      analyze: "Analyze",
      loading: "Loading...",
      error: "Error during API calls",
      nextMatchAgainst: "Next match against",
      recentForm: "Recent form",
      match: "Match",
      score: "Score",
      formation: "Formation",
      style: "Style",
      avgTempo: "Avg tempo",
      avgTackles: "Avg tackles",
      noData: "No data available",
    },
    it: {
      title: "Analisi tattica",
      placeholder: "ID club",
      analyze: "Analizza",
      loading: "Caricamento...",
      error: "Errore durante le chiamate API",
      nextMatchAgainst: "Prossima partita contro",
      recentForm: "Forma recente",
      match: "Partita",
      score: "Punteggio",
      formation: "Formazione",
      style: "Stile",
      avgTempo: "Tempo medio",
      avgTackles: "Contrasti medi",
      noData: "Nessun dato disponibile",
    },
  };
  const t = TEXTS[lang] || TEXTS.fr;

  useEffect(() => {
    fetch("/club_mapping.json")
      .then(res => res.json())
      .then(data => setClubMap(data))
      .catch(() => {});
  }, []);

  const getClubName = id => clubMap[id]?.name || clubMap[id]?.n || String(id);
  const getClubLogo = id => clubMap[id]?.logo || null;

  const RPC_URL = "https://gsppub.soccerverse.io/";

  const getClubForm = async id => {
    try {
      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "get_club",
          params: { club_id: id },
          id: 1,
        }),
      });
      if (!res.ok) throw new Error("club_form_failed");
      const json = await res.json();
      return json.result?.form || null;
    } catch {
      return null;
    }
  };

  const fetchSchedule = async () => {
    setError("");
    setMatches([]);
    setLoading(true);
    try {
      const scheduleRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "get_club_schedule",
          params: { club_id: Number(clubId), season_id: 2 },
          id: 1,
        }),
      });
      if (!scheduleRes.ok) throw new Error("schedule_failed");
      const scheduleJson = await scheduleRes.json();
      const upcoming = (scheduleJson.result?.data || [])
        .filter(m => m.played === 0)
        .sort((a, b) => a.date - b.date)
        .slice(0, 3)
        .map(match => ({
          ...match,
          opponentId:
            match.home_club === Number(clubId) ? match.away_club : match.home_club,
          lastFive: [],
          form: null,
        }));

      setMatches(upcoming);

      await Promise.all(
        upcoming.map(async (match, idx) => {
          let form = null;
          try {
            form = await getClubForm(match.opponentId);
            const oppScheduleRes = await fetch(RPC_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "get_club_schedule",
                params: { club_id: match.opponentId, season_id: 2 },
                id: 1,
              }),
            });
            if (!oppScheduleRes.ok) throw new Error("opp_schedule_failed");
            const oppScheduleJson = await oppScheduleRes.json();
            const lastFive = (oppScheduleJson.result?.data || [])
              .filter(m => m.played === 1)
              .sort((a, b) => b.date - a.date)
              .slice(0, 5);
            const details = await Promise.all(
              lastFive.map(async gm => {
                try {
                  const fixtureRes = await fetch(RPC_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      jsonrpc: "2.0",
                      method: "get_fixture",
                      params: { fixture_id: gm.fixture_id },
                      id: 1,
                    }),
                  });
                  if (!fixtureRes.ok) throw new Error("fixture_failed");
                  const fixtureJson = await fixtureRes.json();
                  const fixture = fixtureJson.result || {};

                  const tacticRes = await fetch(
                    `https://services.soccerverse.com/api/fixture_history/tactics/${gm.fixture_id}`
                  );
                  if (!tacticRes.ok) throw new Error("tactic_failed");
                  const tacticJson = await tacticRes.json();
                  const clubTactic = tacticJson.find(
                    t => t.club_id === match.opponentId
                  );
                  if (!clubTactic || !clubTactic.tactic_actions?.length)
                    return null;
                  const action = clubTactic.tactic_actions[0];
                  const lineup = action.lineup || [];
                  const avgTempo =
                    lineup.reduce((sum, p) => sum + (p.tempo || 0), 0) /
                    (lineup.length || 1);
                  const avgTackle =
                    lineup.reduce((sum, p) => sum + (p.tackling_style || 0), 0) /
                    (lineup.length || 1);

                  return {
                    fixture_id: gm.fixture_id,
                    home_club: fixture.home_club ?? gm.home_club,
                    away_club: fixture.away_club ?? gm.away_club,
                    home_goals: fixture.home_goals ?? gm.home_goals,
                    away_goals: fixture.away_goals ?? gm.away_goals,
                    formation_id: action.formation_id,
                    play_style: action.play_style,
                    avg_tempo: avgTempo,
                    avg_tackling: avgTackle,
                  };
                } catch {
                  return null;
                }
              })
            );

            setMatches(prev => {
              const updated = [...prev];
              updated[idx] = {
                ...prev[idx],
                form,
                lastFive: details.filter(Boolean),
              };
              return updated;
            });
          } catch {
            setMatches(prev => {
              const updated = [...prev];
              updated[idx] = { ...prev[idx], form };
              return updated;
            });
          }
        })
      );
    } catch (err) {
      console.error(err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 pt-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t.title}</h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <input
            type="number"
            value={clubId}
            onChange={e => setClubId(e.target.value)}
            placeholder={t.placeholder}
            className="w-full sm:w-64 px-4 py-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={fetchSchedule}
            className="px-6 py-2 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
          >
            {t.analyze}
          </button>
        </div>
        {loading && (
          <p className="text-center text-sm text-gray-300 mb-4">{t.loading}</p>
        )}
        {error && <p className="text-center text-red-400 mb-4">{error}</p>}
        <div className="space-y-8">
          {matches.map(m => (
            <div
              key={m.fixture_id}
              className="rounded-xl bg-gray-900/80 p-6 border border-gray-700 shadow-lg hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                {getClubLogo(m.opponentId) && (
                  <img
                    src={getClubLogo(m.opponentId)}
                    alt={getClubName(m.opponentId)}
                    className="w-10 h-10 rounded-md"
                  />
                )}
                <h3 className="text-xl font-semibold">
                  {t.nextMatchAgainst}{" "}
                  <a
                    href={`https://play.soccerverse.com/club/${m.opponentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    {getClubName(m.opponentId)}
                  </a>
                </h3>
              </div>
              {m.form && (
                <p className="mb-4 text-sm text-gray-300">
                  {t.recentForm} : <span className="font-mono">{m.form}</span>
                </p>
              )}
              {m.lastFive.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-400 border-b border-white/10">
                      <tr>
                        <th className="py-2 pr-4 font-medium">{t.match}</th>
                        <th className="py-2 pr-4 font-medium">{t.score}</th>
                        <th className="py-2 pr-4 font-medium">{t.formation}</th>
                        <th className="py-2 pr-4 font-medium">{t.style}</th>
                        <th className="py-2 pr-4 font-medium">{t.avgTempo}</th>
                        <th className="py-2 pr-4 font-medium">{t.avgTackles}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {m.lastFive.map(l => (
                        <tr key={l.fixture_id} className="hover:bg-white/5">
                          <td className="py-2 pr-4">
                            <a
                              href={`https://play.soccerverse.com/club/${l.home_club}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:underline"
                            >
                              {getClubName(l.home_club)}
                            </a>
                            <span className="text-gray-400"> vs </span>
                            <a
                              href={`https://play.soccerverse.com/club/${l.away_club}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:underline"
                            >
                              {getClubName(l.away_club)}
                            </a>
                          </td>
                          <td className="py-2 pr-4">
                            {l.home_goals}-{l.away_goals}
                          </td>
                          <td className="py-2 pr-4">{l.formation_id}</td>
                          <td className="py-2 pr-4">{l.play_style}</td>
                          <td className="py-2 pr-4">{l.avg_tempo.toFixed(2)}</td>
                          <td className="py-2 pr-4">{l.avg_tackling.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400">{t.noData}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
