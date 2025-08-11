"use client";
import React, { useState, useEffect } from "react";

export default function AnalyseTactiquePage({ lang = "fr" }) {
  const [clubId, setClubId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});
  const [expanded, setExpanded] = useState({});

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
      player: "Joueur",
      tempo: "Tempo",
      tackles: "Tacles",
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
      player: "Player",
      tempo: "Tempo",
      tackles: "Tackles",
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
      player: "Giocatore",
      tempo: "Tempo",
      tackles: "Contrasti",
      noData: "Nessun dato disponibile",
    },
  };
  const t = TEXTS[lang] || TEXTS.fr;

  const FORMATION_MAP = {
    fr: {
      0: "4-4-2",
      1: "4-3-3",
      2: "4-5-1",
      3: "3-4-3",
      4: "3-5-2",
      5: "3-3-4",
      6: "5-4-1",
      7: "5-3-2",
      8: "5-2-3",
      9: "4-4-2 (Losange)",
      10: "4-3-3 Ailiers",
      11: "4-5-1 Défensif",
      12: "4-2-3-1",
      13: "4-4-1-1",
      14: "4-3-1-2",
      15: "3-4-1-2",
      16: "5-3-2 Libéro",
      17: "5-3-2 Défensif",
      18: "4-2-4",
      19: "4-2-2-2",
      20: "3-4-2-1",
      21: "4-1-3-2",
      22: "3-2-2-2-1",
    },
    en: {
      0: "4-4-2",
      1: "4-3-3",
      2: "4-5-1",
      3: "3-4-3",
      4: "3-5-2",
      5: "3-3-4",
      6: "5-4-1",
      7: "5-3-2",
      8: "5-2-3",
      9: "4-4-2 (Diamond)",
      10: "4-3-3 Wingers",
      11: "4-5-1 Defensive",
      12: "4-2-3-1",
      13: "4-4-1-1",
      14: "4-3-1-2",
      15: "3-4-1-2",
      16: "5-3-2 Libero",
      17: "5-3-2 Defensive",
      18: "4-2-4",
      19: "4-2-2-2",
      20: "3-4-2-1",
      21: "4-1-3-2",
      22: "3-2-2-2-1",
    },
    it: {
      0: "4-4-2",
      1: "4-3-3",
      2: "4-5-1",
      3: "3-4-3",
      4: "3-5-2",
      5: "3-3-4",
      6: "5-4-1",
      7: "5-3-2",
      8: "5-2-3",
      9: "4-4-2 (a rombo)",
      10: "4-3-3 Ali",
      11: "4-5-1 Difensivo",
      12: "4-2-3-1",
      13: "4-4-1-1",
      14: "4-3-1-2",
      15: "3-4-1-2",
      16: "5-3-2 Libero",
      17: "5-3-2 Difensivo",
      18: "4-2-4",
      19: "4-2-2-2",
      20: "3-4-2-1",
      21: "4-1-3-2",
      22: "3-2-2-2-1",
    },
  };

  const STYLE_MAP = {
    fr: {
      0: "Normale (N)",
      1: "Défensive (D)",
      2: "Offensive (O)",
      3: "Passes (P)",
      4: "Contre-attaque (C)",
      5: "Ballons longs (L)",
    },
    en: {
      0: "Normal (N)",
      1: "Defensive (D)",
      2: "Offensive (O)",
      3: "Passing (P)",
      4: "Counter-attack (C)",
      5: "Long balls (L)",
    },
    it: {
      0: "Normale (N)",
      1: "Difensiva (D)",
      2: "Offensiva (O)",
      3: "Passaggi (P)",
      4: "Contropiede (C)",
      5: "Palle lunghe (L)",
    },
  };

  useEffect(() => {
    fetch("/club_mapping.json")
      .then(res => res.json())
      .then(data => setClubMap(data))
      .catch(() => {});
    fetch("/player_mapping.json")
      .then(res => res.json())
      .then(data => setPlayerMap(data))
      .catch(() => {});
  }, []);

  const getClubName = id => clubMap[id]?.name || clubMap[id]?.n || String(id);
  const getClubLogo = id =>
    clubMap[id]?.logo || `https://elrincondeldt.com/sv/photos/teams/${id}.png`;
  const getPlayerName = id => playerMap[id]?.name || String(id);

  const toggleExpand = id =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

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
    setExpanded({});
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
                    lineup,
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
    <div className="min-h-screen pt-24 px-4">
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
              className="rounded-xl bg-gray-900 p-6 border border-gray-700 text-gray-100 shadow-lg hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                {clubId && (
                  <img
                    src={getClubLogo(Number(clubId))}
                    alt={getClubName(Number(clubId))}
                    className="w-10 h-10 rounded-md"
                  />
                )}
                <span className="text-gray-400">vs</span>
                <img
                  src={getClubLogo(m.opponentId)}
                  alt={getClubName(m.opponentId)}
                  className="w-10 h-10 rounded-md"
                />
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
                        <React.Fragment key={l.fixture_id}>
                          <tr
                            className="hover:bg-white/5 cursor-pointer"
                            onClick={() => toggleExpand(l.fixture_id)}
                          >
                            <td className="py-2 pr-4">
                              <span className="inline-flex items-center gap-1">
                                <img
                                  src={getClubLogo(l.home_club)}
                                  alt={getClubName(l.home_club)}
                                  className="w-5 h-5 rounded-sm"
                                />
                                <a
                                  href={`https://play.soccerverse.com/club/${l.home_club}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:underline"
                                >
                                  {getClubName(l.home_club)}
                                </a>
                              </span>
                              <span className="text-gray-400 mx-1">vs</span>
                              <span className="inline-flex items-center gap-1">
                                <img
                                  src={getClubLogo(l.away_club)}
                                  alt={getClubName(l.away_club)}
                                  className="w-5 h-5 rounded-sm"
                                />
                                <a
                                  href={`https://play.soccerverse.com/club/${l.away_club}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:underline"
                                >
                                  {getClubName(l.away_club)}
                                </a>
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              <a
                                href={`https://play.soccerverse.com/match/${l.fixture_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:underline"
                              >
                                {l.home_goals}-{l.away_goals}
                              </a>
                            </td>
                            <td className="py-2 pr-4">
                              {FORMATION_MAP[lang]?.[l.formation_id] ?? l.formation_id}
                            </td>
                            <td className="py-2 pr-4">
                              {STYLE_MAP[lang]?.[l.play_style] ?? l.play_style}
                            </td>
                            <td className="py-2 pr-4">{l.avg_tempo.toFixed(2)}</td>
                            <td className="py-2 pr-4">{l.avg_tackling.toFixed(2)}</td>
                          </tr>
                          {expanded[l.fixture_id] && l.lineup && l.lineup.length > 0 && (
                            <tr>
                              <td colSpan={6} className="py-2">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead className="text-gray-400">
                                      <tr>
                                        <th className="py-1 pr-4 font-medium">{t.player}</th>
                                        <th className="py-1 pr-4 font-medium">{t.tempo}</th>
                                        <th className="py-1 pr-4 font-medium">{t.tackles}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {l.lineup.map(p => (
                                        <tr key={p.player_id}>
                                          <td className="py-1 pr-4">
                                            {getPlayerName(p.player_id)}
                                          </td>
                                          <td className="py-1 pr-4">{p.tempo}</td>
                                          <td className="py-1 pr-4">{p.tackling_style}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
