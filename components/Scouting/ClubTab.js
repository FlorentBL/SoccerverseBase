import React, { useEffect, useState } from "react";

const LEAGUE_MAPPING_URL = "/league_mapping.json";

// Helper pour afficher les valeurs SVC joliment
function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (
    <span style={{ color: "#00ffd0", fontWeight: 800 }}>
      {(val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} SVC
    </span>
  );
}

// Example columns config
const COLUMNS = [
  { key: "rank", label: "#" },
  { key: "name", label: "Club" },
  { key: "manager", label: "Manager" },
  { key: "points", label: "Pts" },
  { key: "matches", label: "J" },
  { key: "wins", label: "G" },
  { key: "draws", label: "N" },
  { key: "losses", label: "P" },
  { key: "bp", label: "BP" },
  { key: "bc", label: "BC" },
  { key: "fanbase", label: "Fanbase" },
  { key: "rating", label: "Rating" },
  { key: "avg_wages", label: "🤑 Avg" },
  { key: "total_wages", label: "💸 Total" },
  { key: "value", label: "🏛️ Value" },
  { key: "balance", label: "Balance" },
  { key: "league_id", label: "Division" }
];

// Pour trier les divisions logiquement si besoin
function leagueSort(a, b, leagueMap) {
  if (!leagueMap[a] || !leagueMap[b]) return 0;
  return (leagueMap[a].sort_order || 0) - (leagueMap[b].sort_order || 0);
}

export default function LeagueRankingTable({ clubs }) {
  const [leagueMap, setLeagueMap] = useState({});
  const [sortKey, setSortKey] = useState("points");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch(LEAGUE_MAPPING_URL)
      .then((r) => r.json())
      .then(setLeagueMap)
      .catch(() => {});
  }, []);

  function getLeagueLabel(id) {
    return leagueMap?.[id]?.name || id || "-";
  }

  // Tri dynamique
  const sortedClubs = [...clubs].sort((a, b) => {
    if (sortKey === "league_id") {
      return leagueSort(a.league_id, b.league_id, leagueMap) * (sortAsc ? 1 : -1);
    }
    if (sortKey === "name") {
      return (a.name || "").localeCompare(b.name || "") * (sortAsc ? 1 : -1);
    }
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    if (typeof va === "number" && typeof vb === "number") {
      return (va - vb) * (sortAsc ? 1 : -1);
    }
    return String(va).localeCompare(String(vb)) * (sortAsc ? 1 : -1);
  });

  return (
    <div style={{ width: "100%", maxWidth: 1600, margin: "0 auto" }}>
      <div
        style={{
          background: "#181b22",
          borderRadius: 18,
          boxShadow: "0 4px 24px #000a",
          padding: 0,
          marginTop: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 27,
            fontWeight: 900,
            color: "#ffd700",
            padding: "18px 24px 0 24px",
            letterSpacing: ".01em",
          }}
        >
          Championnat : <span style={{ fontSize: 21, fontWeight: 600, color: "#b0b7e6" }}>AD Andorre - D1</span>
        </div>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1200,
              fontSize: 18,
              background: "#171924",
              color: "#fff",
              borderRadius: 12,
            }}
          >
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr
                style={{
                  background: "#13141e",
                  color: "#ffd700",
                  fontWeight: 800,
                  fontSize: 19,
                  letterSpacing: ".02em",
                }}
              >
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "9px 9px",
                      textAlign: "left",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      background: sortKey === col.key ? "#191e2b" : undefined,
                      borderRight: "1px solid #191a26",
                      userSelect: "none",
                    }}
                    onClick={() => {
                      if (sortKey === col.key) setSortAsc((asc) => !asc);
                      else {
                        setSortKey(col.key);
                        setSortAsc(false);
                      }
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ marginLeft: 7, fontSize: 16 }}>
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedClubs.map((club, idx) => (
                <tr
                  key={club.club_id}
                  style={{
                    background: idx % 2 === 0 ? "#1a1c22" : "#181b22",
                    borderBottom: "1px solid #23242e",
                    transition: "background 0.13s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#23233a")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = idx % 2 === 0
                      ? "#1a1c22"
                      : "#181b22")
                  }
                >
                  <td style={{ fontWeight: 900, color: "#ffd700", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ fontWeight: 900, color: "#3d79ff", whiteSpace: "nowrap" }}>
                    <a
                      href={`https://play.soccerverse.com/club/${club.club_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#3d79ff",
                        fontWeight: 800,
                        textDecoration: "underline",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {club.name}
                    </a>
                  </td>
                  <td style={{ color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {club.manager_name || "-"}
                  </td>
                  <td style={{ color: "#ffd700", fontWeight: 900 }}>{club.points ?? "-"}</td>
                  <td style={{ color: "#fff" }}>{club.matches ?? "-"}</td>
                  <td style={{ color: "#5fff88", fontWeight: 900 }}>{club.wins ?? "-"}</td>
                  <td style={{ color: "#ffd700" }}>{club.draws ?? "-"}</td>
                  <td style={{ color: "#ff6363" }}>{club.losses ?? "-"}</td>
                  <td style={{ color: "#fff" }}>{club.bp ?? "-"}</td>
                  <td style={{ color: "#fff" }}>{club.bc ?? "-"}</td>
                  <td style={{ color: "#6cf" }}>{club.fanbase ?? "-"}</td>
                  <td style={{ color: club.rating >= 70 ? "#6f7" : club.rating >= 60 ? "#fff" : "#ff7575", fontWeight: 900 }}>{club.rating ?? "-"}</td>
                  <td>{formatSVC(club.avg_wages)}</td>
                  <td>{formatSVC(club.total_wages)}</td>
                  <td>{formatSVC(club.value)}</td>
                  <td style={{ color: "#ffd700", fontWeight: 800 }}>{formatSVC(club.balance)}</td>
                  <td style={{ color: "#00e3ff", fontWeight: 800 }}>
                    {getLeagueLabel(club.league_id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
