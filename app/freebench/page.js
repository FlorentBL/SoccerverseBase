"use client";
import React, { useEffect, useState, useMemo } from "react";

// --- CONFIG
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const TABLE = "freebench_players";

// Utils
function formatSVC(val) {
  if (!val || isNaN(val)) return "-";
  return (
    <span style={{ color: "#64ffae", fontWeight: 700 }}>
      {(val / 10000).toLocaleString("fr-FR")} SVC
    </span>
  );
}
function ageFromDob(dob) {
  if (!dob) return "-";
  return 2025 - new Date(dob * 1000).getFullYear();
}
function getDeltaColor(val) {
  if (val > 0) return "#49f067";
  if (val < 0) return "#e04b4b";
  return "#fff";
}

// --- Colonnes dynamiques
const columns = [
  { key: "name", label: "Nom", style: { fontWeight: 700, minWidth: 120 }, sortable: true },
  { key: "country_id", label: "Pays", style: { minWidth: 50 }, sortable: true },
  { key: "rating", label: "Note", style: { fontWeight: 900, minWidth: 40 }, sortable: true },
  { key: "position", label: "Pos.", style: { minWidth: 50 }, sortable: true },
  { key: "age", label: "Âge", style: { minWidth: 30 }, sortable: true },
  { key: "value", label: "Valeur", style: { minWidth: 80 }, sortable: true },
  { key: "wages", label: "Salaire", style: { minWidth: 80 }, sortable: true },
  { key: "team_name", label: "Club actuel", style: { minWidth: 120 }, sortable: true },
  { key: "current_ovr_fiche", label: "Ovr Fiche", style: { minWidth: 40 }, sortable: true },
  { key: "current_ovr_team", label: "Ovr Club", style: { minWidth: 40 }, sortable: true },
  { key: "delta_ovr_team", label: "Delta", style: { minWidth: 40 }, sortable: true },
  { key: "fiche", label: "Fiche", style: { minWidth: 40 } },
];

function sortData(data, key, asc) {
  return [...data].sort((a, b) => {
    let av = a[key], bv = b[key];
    if (key === "age") { av = ageFromDob(a.dob); bv = ageFromDob(b.dob); }
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
    return asc
      ? ("" + av).localeCompare("" + bv)
      : ("" + bv).localeCompare("" + av);
  });
}

export default function FreebenchTable() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("rating");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => { fetchFreebench(); }, []);

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
    setPlayers(data.filter(p => p.name && p.name !== "NULL")); // Exclure NULL
    setLoading(false);
  }

  // Trie dynamique + Age
  const playersSorted = useMemo(() => {
    let arr = players.map(p => ({
      ...p,
      age: ageFromDob(p.dob)
    }));
    if (sortKey && columns.find(c => c.key === sortKey)?.sortable) {
      arr = sortData(arr, sortKey, sortAsc);
    }
    return arr;
  }, [players, sortKey, sortAsc]);

  return (
    <div style={{
      width: "100%",
      maxWidth: 1450,
      margin: "0 auto",
      marginTop: 32,
      marginBottom: 32,
      background: "#21232e",
      borderRadius: 15,
      boxShadow: "0 4px 22px #000a",
      padding: "10px 18px 18px 18px"
    }}>
      <div style={{
        fontWeight: 900,
        fontSize: 29,
        marginBottom: 12,
        color: "#ffd700"
      }}>Freebench Soccerverse (joueurs sans contrat)</div>
      <div style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ color: "#ffd700", fontWeight: 500, margin: 12 }}>Chargement effectif...</div>
        ) : (
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#fff",
            fontSize: 16,
            minWidth: 1100,
            whiteSpace: "nowrap"
          }}>
            <thead>
              <tr style={{ background: "#181b2a", color: "#ffd700" }}>
                {columns.map(col => (
                  <th key={col.key}
                    onClick={() => col.sortable && (
                      sortKey === col.key ? setSortAsc(s => !s) : (setSortKey(col.key), setSortAsc(false))
                    )}
                    style={{
                      padding: "7px 6px",
                      userSelect: "none",
                      textAlign: "left",
                      fontWeight: 800,
                      fontSize: 16,
                      ...col.style,
                      cursor: col.sortable ? "pointer" : undefined,
                      background: sortKey === col.key ? "#23233a" : "#181b2a",
                      color: "#ffd700"
                    }}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span style={{ marginLeft: 5, fontSize: 13 }}>
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {playersSorted.map((p, idx) => (
                <tr key={p.player_id}
                  style={{
                    background: idx % 2 === 0 ? "#1a1c22" : "#181b22",
                    borderBottom: "1px solid #23242e"
                  }}
                >
                  <td style={{ ...columns[0].style }}>
                    <a
                      href={`https://play.soccerverse.com/player/${p.player_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#4f47ff",
                        fontWeight: 700,
                        textDecoration: "underline"
                      }}
                    >
                      {p.name}
                    </a>
                  </td>
                  <td style={columns[1].style}>{p.country_id || "-"}</td>
                  <td style={{
                    ...columns[2].style,
                    color: p.rating >= 75 ? "#64ffae" : (p.rating < 65 ? "#ff7575" : "#fff")
                  }}>
                    {p.rating ?? "-"}
                  </td>
                  <td style={columns[3].style}>{p.position ?? "-"}</td>
                  <td style={columns[4].style}>{p.age ?? "-"}</td>
                  <td style={columns[5].style}>{formatSVC(p.value)}</td>
                  <td style={columns[6].style}>{formatSVC(p.wages)}</td>
                  <td style={columns[7].style}>{p.team_name || "-"}</td>
                  <td style={columns[8].style}>{p.current_ovr_fiche ?? "-"}</td>
                  <td style={columns[9].style}>{p.current_ovr_team ?? "-"}</td>
                  <td style={{
                    ...columns[10].style,
                    color: getDeltaColor(p.delta_ovr_team)
                  }}>
                    {p.delta_ovr_team ?? "-"}
                  </td>
                  <td style={columns[11].style}>
                    <a
                      href={`https://play.soccerverse.com/player/${p.player_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#ffd700",
                        color: "#23232c",
                        fontWeight: 900,
                        borderRadius: 6,
                        padding: "6px 13px",
                        textDecoration: "none",
                        fontSize: 15
                      }}
                    >
                      Fiche
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && playersSorted.length === 0 && (
          <div style={{ color: "#ffd700", margin: 18 }}>Aucun joueur trouvé.</div>
        )}
      </div>
    </div>
  );
}
