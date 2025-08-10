"use client";
import React, { useState } from "react";

export default function AnalyseTactiquePage({ lang = "fr" }) {
  const [clubId, setClubId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const RPC_URL = "https://gsppub.soccerverse.io/";

  const fetchSchedule = async () => {
    setError("");
    setLoading(true);
    try {
      const scheduleRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "get_club_schedule",
          params: { club_id: Number(clubId), season_id: 1 },
          id: 1,
        }),
      });
      if (!scheduleRes.ok) throw new Error("schedule_failed");
      const scheduleJson = await scheduleRes.json();
      const upcoming = (scheduleJson.result?.data || [])
        .filter(m => m.played === 0)
        .sort((a, b) => a.date - b.date)
        .slice(0, 3);

      const enriched = await Promise.all(
        upcoming.map(async match => {
          const opponentId =
            match.home_club === Number(clubId)
              ? match.away_club
              : match.home_club;

          // Opponent last 5 played matches
          try {
            const oppScheduleRes = await fetch(RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "get_club_schedule",
              params: { club_id: opponentId, season_id: 1 },
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
                  const clubTactic = tacticJson.find(t => t.club_id === opponentId);
                  if (!clubTactic || !clubTactic.tactic_actions?.length) return null;
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
                    home_club: fixture.home_club,
                    away_club: fixture.away_club,
                    home_goals: fixture.home_goals,
                    away_goals: fixture.away_goals,
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

            return { ...match, opponentId, lastFive: details.filter(Boolean) };
          } catch {
            return { ...match, opponentId, lastFive: [] };
          }
        })
      );

      setMatches(enriched);
    } catch (err) {
      console.error(err);
      setError("Erreur lors des appels API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", color: "#f6f6f7", paddingTop: 60 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
        <input
          type="number"
          value={clubId}
          onChange={e => setClubId(e.target.value)}
          placeholder="ID du club"
          style={{ color: "#000", padding: 8, borderRadius: 4 }}
        />
        <button
          onClick={fetchSchedule}
          style={{
            padding: "8px 16px",
            background: "#23272e",
            color: "#3fcf60",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Analyser
        </button>
      </div>
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {matches.map(m => (
        <div key={m.fixture_id} style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
            Prochain match contre club {m.opponentId}
          </h3>
          <ul style={{ paddingLeft: 20 }}>
            {m.lastFive.map(l => (
              <li key={l.fixture_id} style={{ marginBottom: 4 }}>
                {l.home_club} {l.home_goals}-{l.away_goals} {l.away_club} |
                formation {l.formation_id}, style {l.play_style}, tempo moyen
                {" "}
                {l.avg_tempo.toFixed(2)}, tacles moyens {" "}
                {l.avg_tackling.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
