"use client";
import React, { useEffect, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const TABLE = "freebench_players";

function formatSVC(val) {
  if (!val || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR") + " SVC";
}

export default function FreebenchPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFreebench();
  }, []);

  async function fetchFreebench() {
    setLoading(true);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const data = await res.json();
    setPlayers(data);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 18 }}>
      <h1 style={{ fontWeight: 900, fontSize: 32, color: "#ffd700", marginBottom: 12 }}>
        Freebench Soccerverse (joueurs sans contrat)
      </h1>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div style={{
          borderRadius: 16, boxShadow: "0 2px 22px #0003", background: "#23272e",
          padding: 14, overflowX: "auto", marginTop: 15
        }}>
          <table style={{ width: "100%", color: "#fff", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr style={{ background: "#181b2a", color: "#ffd700" }}>
                <th>Joueur</th>
                <th>Pays</th>
                <th>Âge</th>
                <th>Note</th>
                <th>Position</th>
                <th>Valeur</th>
                <th>Salaire</th>
                <th>Club actuel</th>
                <th>Ovr Fiche</th>
                <th>Ovr Club</th>
                <th>Delta Ovr</th>
                <th>Voir</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => (
                <tr key={p.player_id} style={{
                  background: idx % 2 === 0 ? "#1a1c22" : "#181b22",
                  borderBottom: "1px solid #23242e"
                }}>
                  <td style={{ fontWeight: 700 }}>
                    {p.name || "-"}
                  </td>
                  <td>{p.country_id}</td>
                  <td>
                    {p.dob ? (2025 - new Date(p.dob * 1000).getFullYear()) : "-"}
                  </td>
                  <td style={{ fontWeight: 900, color: p.rating >= 75 ? "#64ffae" : (p.rating < 65 ? "#ff7575" : "#fff") }}>
                    {p.rating ?? "-"}
                  </td>
                  <td>{p.position}</td>
                  <td>{formatSVC(p.value)}</td>
                  <td>{formatSVC(p.wages)}</td>
                  <td>
                    {p.team_name || "-"}
                  </td>
                  <td>{p.current_ovr_fiche ?? "-"}</td>
                  <td>{p.current_ovr_team ?? "-"}</td>
                  <td style={{
                    color:
                      p.delta_ovr_team > 0 ? "#49f067" :
                      p.delta_ovr_team < 0 ? "#e04b4b" : "#fff"
                  }}>
                    {p.delta_ovr_team ?? "-"}
                  </td>
                  <td>
                    <a
                      href={`https://play.soccerverse.com/player/${p.player_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#ffd700", color: "#23232c", fontWeight: 900,
                        borderRadius: 6, padding: "6px 13px", textDecoration: "none", fontSize: 15
                      }}
                    >
                      Fiche
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {players.length === 0 && (
            <div style={{ color: "#ffd700", margin: 18 }}>Aucun joueur trouvé.</div>
          )}
        </div>
      )}
    </div>
  );
}
