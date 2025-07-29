"use client";
import React, { useState } from "react";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " SVC";
}
function formatDate(ts) {
  if (!ts || isNaN(ts)) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR");
}

export default function LeagueTablePage() {
  const [leagueId, setLeagueId] = useState("");
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [details, setDetails] = useState({}); // {club_id: {clubInfo, loading}}

  const fetchTable = async () => {
    setErr("");
    setStandings([]);
    setLoading(true);
    try {
      const api = await fetch(`https://services.soccerverse.com/api/league_tables?league_id=${leagueId}`);
      const j = await api.json();
      if (!Array.isArray(j) || j.length === 0) {
        setErr("Aucun championnat trouvé ou aucune équipe.");
        setLoading(false);
        return;
      }
      setStandings(j.sort((a, b) => b.pts - a.pts)); // tri sur points
    } catch (e) {
      setErr("Erreur réseau ou parsing données.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats avancées club à la demande
  const fetchClubDetails = async (club_id) => {
    setDetails(d => ({ ...d, [club_id]: { loading: true, clubInfo: null } }));
    try {
      const api = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${club_id}`);
      const j = await api.json();
      if (j.items && j.items[0]) {
        setDetails(d => ({ ...d, [club_id]: { loading: false, clubInfo: j.items[0] } }));
      } else {
        setDetails(d => ({ ...d, [club_id]: { loading: false, clubInfo: null } }));
      }
    } catch (e) {
      setDetails(d => ({ ...d, [club_id]: { loading: false, clubInfo: null } }));
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#181c21", color: "#f6f6f7",
      fontFamily: "Inter, Arial, sans-serif", paddingTop: 48
    }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 32, letterSpacing: 1, textAlign: "center" }}>
        Tableau Championnat Soccerverse
      </h2>
      <div style={{ margin: "0 auto", maxWidth: 1100, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Recherche */}
        <div style={{
          background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008",
          width: "100%", maxWidth: 520, marginBottom: 34
        }}>
          <label style={{ fontWeight: 600, fontSize: 17 }}>ID Championnat (league_id) :</label>
          <input
            type="number"
            value={leagueId}
            onChange={e => setLeagueId(e.target.value)}
            style={{
              width: "100%", margin: "12px 0 16px 0", padding: "12px 16px", borderRadius: 6,
              border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
            }}
            placeholder="Ex : 549"
            min={1}
          />
          <button
            onClick={fetchTable}
            disabled={loading || !leagueId}
            style={{
              background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
              border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
              cursor: loading || !leagueId ? "not-allowed" : "pointer",
              boxShadow: "0 1px 5px #0004"
            }}
          >
            {loading ? "Recherche..." : "Afficher classement"}
          </button>
          {err && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{err}</div>}
        </div>

        {standings.length > 0 && (
          <div style={{
            width: "100%", maxWidth: 1100, background: "#181d23",
            borderRadius: 16, padding: 18, marginBottom: 30, boxShadow: "0 2px 8px #0003"
          }}>
            <div style={{ fontSize: 17, color: "#ffd700", fontWeight: 500, marginBottom: 12 }}>
              Classement {standings[0].division ? `(Division ${standings[0].division})` : ""}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 16 }}>
                <thead>
                  <tr style={{ background: "#22252a" }}>
                    <th>#</th>
                    <th>Club</th>
                    <th>Manager</th>
                    <th>Pts</th>
                    <th>J</th>
                    <th>G</th>
                    <th>N</th>
                    <th>P</th>
                    <th>BP</th>
                    <th>BC</th>
                    <th>Fanbase</th>
                    <th>Rating</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((club, idx) => (
                    <React.Fragment key={club.club_id}>
                      <tr style={{ background: idx % 2 === 0 ? "#22252a" : "#181d23" }}>
                        <td style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>
                          <img src={club.manager_profile_pic || "/default_profile.jpg"} alt={club.manager_name} style={{
                            width: 24, height: 24, borderRadius: "50%", verticalAlign: "middle", marginRight: 8, border: "1px solid #444"
                          }} />
                          {club.club_id}
                        </td>
                        <td>{club.manager_name || "-"}</td>
                        <td style={{ fontWeight: 700 }}>{club.pts}</td>
                        <td>{club.played}</td>
                        <td>{club.won}</td>
                        <td>{club.drawn}</td>
                        <td>{club.lost}</td>
                        <td>{club.goals_for}</td>
                        <td>{club.goals_against}</td>
                        <td>{club.fanbase || "-"}</td>
                        <td>{club.avg_player_rating || "-"}</td>
                        <td>
                          <button
                            style={{
                              background: "#222", color: "#ffd700", border: "none", borderRadius: 6,
                              padding: "4px 12px", fontWeight: 600, cursor: "pointer", fontSize: 15
                            }}
                            onClick={() => fetchClubDetails(club.club_id)}
                            disabled={details[club.club_id]?.loading}
                          >
                            {details[club.club_id]?.loading ? "..." : "Stats"}
                          </button>
                        </td>
                      </tr>
                      {/* Détails stats avancées */}
                      {details[club.club_id]?.clubInfo && (
                        <tr style={{ background: "#23252e" }}>
                          <td colSpan={13}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "26px 40px", padding: "16px 4px" }}>
                              <div>
                                <span style={{ color: "#ffd700" }}>💸 Avg Wages</span><br />
                                <b>{formatSVC(details[club.club_id].clubInfo.avg_wages)}</b>
                              </div>
                              <div>
                                <span style={{ color: "#ffd700" }}>💸 Total Wages</span><br />
                                <b>{formatSVC(details[club.club_id].clubInfo.total_wages)}</b>
                              </div>
                              <div>
                                <span style={{ color: "#ffd700" }}>🏦 Total Value</span><br />
                                <b>{formatSVC(details[club.club_id].clubInfo.total_player_value)}</b>
                              </div>
                              <div>
                                <span style={{ color: "#ffd700" }}>⭑ Rating Top 21</span><br />
                                <b>{details[club.club_id].clubInfo.avg_player_rating_top21 ?? "-"}</b>
                              </div>
                              <div>
                                <span style={{ color: "#ffd700" }}>🏹 Shooting</span><br />
                                <b>{details[club.club_id].clubInfo.avg_shooting ?? "-"}</b>
                              </div>
                              <div>
                                <span style={{ color: "#ffd700" }}>🎯 Passing</span><br />
                                <b>{details[club.club_id].clubInfo.avg_passing ?? "-"}</b>
                              </div>
                              <div>
                                <span style={{ color: "#ffd700" }}>🛡️ Tackling</span><br />
                                <b>{details[club.club_id].clubInfo.avg_tackling ?? "-"}</b>
                              </div>
                              <div>
                                <span style={{ color: "#ffd700" }}>🧤 GK</span><br />
                                <b>{details[club.club_id].clubInfo.gk_rating ?? "-"}</b>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 14 }}>
              Pour voir les stats avancées d'un club, clique sur <span style={{ color: "#ffd700" }}>Stats</span>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
