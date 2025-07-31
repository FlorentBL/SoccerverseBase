import React, { useState, useRef } from "react";

const CLUB_MAPPING_URL = "/club_mapping.json";
const COUNTRY_MAPPING_URL = "/country_mapping.json";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " SVC";
}

const COLUMNS = [
  { key: "rank", label: "#", sortable: false },
  { key: "club", label: "Club", sortable: true },
  { key: "manager_name", label: "Manager", sortable: true },
  { key: "pts", label: "Pts", sortable: true },
  { key: "played", label: "J", sortable: true },
  { key: "won", label: "G", sortable: true },
  { key: "drawn", label: "N", sortable: true },
  { key: "lost", label: "P", sortable: true },
  { key: "goals_for", label: "BP", sortable: true },
  { key: "goals_against", label: "BC", sortable: true },
  { key: "fanbase", label: "Fanbase", sortable: true },
  { key: "avg_player_rating", label: "Rating", sortable: true },
  { key: "avg_wages", label: "💸Avg", sortable: true, details: true },
  { key: "total_wages", label: "💸Total", sortable: true, details: true },
  { key: "total_player_value", label: "🏦Value", sortable: true, details: true },
  { key: "balance", label: "Balance", sortable: true, details: true },
  { key: "transfers_in", label: "In", sortable: true, details: true },
  { key: "transfers_out", label: "Out", sortable: true, details: true },
  { key: "avg_player_rating_top21", label: "Top21", sortable: true, details: true },
  { key: "avg_shooting", label: "🏹", sortable: true, details: true },
  { key: "avg_passing", label: "🎯", sortable: true, details: true },
  { key: "avg_tackling", label: "🛡️", sortable: true, details: true },
  { key: "gk_rating", label: "🧤", sortable: true, details: true },
];

export default function LeagueTab() {
  const [country, setCountry] = useState("");
  const [division, setDivision] = useState("");
  const [standings, setStandings] = useState([]);
  const [clubsDetails, setClubsDetails] = useState({});
  const [clubMap, setClubMap] = useState({});
  const [countryMap, setCountryMap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Nouvel état pour le tri
  const [sortCol, setSortCol] = useState("pts");
  const [sortAsc, setSortAsc] = useState(false);

  const loadedClubMap = useRef(false);
  const loadedCountryMap = useRef(false);

  const fetchClubMap = async () => {
    if (loadedClubMap.current) return clubMap;
    const resp = await fetch(CLUB_MAPPING_URL);
    const data = await resp.json();
    setClubMap(data);
    loadedClubMap.current = true;
    return data;
  };

  const fetchCountryMap = async () => {
    if (loadedCountryMap.current) return countryMap;
    const resp = await fetch(COUNTRY_MAPPING_URL);
    const data = await resp.json();
    setCountryMap(data);
    loadedCountryMap.current = true;
    return data;
  };

  React.useEffect(() => {
    fetchCountryMap();
    fetchClubMap();
  }, []);

  React.useEffect(() => {
    setDivision("");
  }, [country]);

  const fetchTable = async () => {
    setErr("");
    setStandings([]);
    setClubsDetails({});
    setLoading(true);
    try {
      const selectedCountry = countryMap.find(c => c.code === country);
      const selectedDivision = selectedCountry?.divisions.find(d => d.leagueId === Number(division));
      if (!selectedDivision) throw new Error("Division non trouvée");
      const api = await fetch(`https://services.soccerverse.com/api/league_tables?league_id=${division}`);
      const j = await api.json();
      if (!Array.isArray(j) || j.length === 0) {
        setErr("Aucun championnat trouvé ou aucune équipe.");
        setLoading(false);
        return;
      }
      setStandings(j.sort((a, b) => b.pts - a.pts));
      setTimeout(() => fetchAllClubsDetails(j.map(c => c.club_id)), 100);
    } catch (e) {
      setErr("Erreur réseau ou parsing données.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClubsDetails = async (clubIds) => {
    setDetailsLoading(true);
    const details = {};
    for (const club_id of clubIds) {
      try {
        const api = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${club_id}`);
        const j = await api.json();
        if (j.items && j.items[0]) details[club_id] = j.items[0];
      } catch { /* ignore */ }
    }
    setClubsDetails(details);
    setDetailsLoading(false);
  };

  const selectedCountry = countryMap.find(c => c.code === country);
  const selectedDivision = selectedCountry?.divisions.find(d => d.leagueId === Number(division));

  // Génère une fonction de comparaison adaptée selon la colonne (et si elle vient de details)
  function getSortFn(colKey, asc) {
    return (a, b) => {
      let valA, valB;
      const col = COLUMNS.find(c => c.key === colKey);
      if (col.details) {
        valA = clubsDetails[a.club_id]?.[colKey];
        valB = clubsDetails[b.club_id]?.[colKey];
      } else if (colKey === "club") {
        valA = clubMap[a.club_id]?.name || a.club_id;
        valB = clubMap[b.club_id]?.name || b.club_id;
      } else if (colKey === "rank") {
        valA = a.rank || 0; valB = b.rank || 0;
      } else {
        valA = a[colKey];
        valB = b[colKey];
      }
      if (valA === undefined || valA === null) valA = -Infinity;
      if (valB === undefined || valB === null) valB = -Infinity;

      if (typeof valA === "string") {
        const cmp = valA.localeCompare(valB, "fr");
        return asc ? cmp : -cmp;
      }
      if (!isNaN(valA) && !isNaN(valB)) {
        return asc ? valA - valB : valB - valA;
      }
      return 0;
    };
  }

  // Standings trié selon sortCol/sortAsc
  const standingsSorted = [...standings].sort(getSortFn(sortCol, sortAsc));

  // Affichage flèche
  const sortArrow = col => {
    if (col.key !== sortCol) return "";
    return sortAsc ? " ▲" : " ▼";
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008", width: "100%", maxWidth: 520, marginBottom: 34 }}>
        <label style={{ fontWeight: 600, fontSize: 17, marginBottom: 6, display: "block" }}>Pays :</label>
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          style={{
            width: "100%", marginBottom: 14, padding: "12px 16px", borderRadius: 6,
            border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
          }}>
          <option value="">Sélectionner un pays</option>
          {[...countryMap]
            .sort((a, b) => a.country.localeCompare(b.country, "fr"))
            .map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.country}</option>
            ))}
        </select>
        <label style={{ fontWeight: 600, fontSize: 17, marginBottom: 6, display: "block" }}>Division :</label>
        <select
          value={division}
          onChange={e => setDivision(e.target.value)}
          style={{
            width: "100%", marginBottom: 18, padding: "12px 16px", borderRadius: 6,
            border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
          }}
          disabled={!selectedCountry}>
          <option value="">Sélectionner une division</option>
          {selectedCountry?.divisions.map(d => (
            <option key={d.leagueId} value={d.leagueId}>{d.label} (ID {d.leagueId})</option>
          ))}
        </select>

        <button onClick={fetchTable} disabled={loading || !country || !division}
          style={{
            background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
            border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
            cursor: loading || !country || !division ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
          }}
        >{loading ? "Recherche..." : detailsLoading ? "Chargement stats clubs..." : "Afficher classement"}</button>
        {err && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{err}</div>}
      </div>

      {standings.length > 0 && (
        <div style={{ width: "100%", maxWidth: 1200, background: "#181d23", borderRadius: 16, padding: 18, marginBottom: 30, boxShadow: "0 2px 8px #0003" }}>
          <div style={{ fontSize: 17, color: "#ffd700", fontWeight: 500, marginBottom: 12 }}>
            {selectedCountry && selectedDivision
              ? <>Championnat : <span style={{ color: "#4f47ff" }}>{selectedCountry.flag} {selectedCountry.country} - {selectedDivision.label}</span></>
              : "Classement"}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 15, textAlign: "center" }}>
              <thead>
                <tr style={{ background: "#22252a" }}>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      style={{ cursor: col.sortable ? "pointer" : undefined, minWidth: 56, fontWeight: 700 }}
                      onClick={() => col.sortable && (
                        col.key === sortCol
                          ? setSortAsc(!sortAsc)
                          : (setSortCol(col.key), setSortAsc(false))
                      )}
                    >
                      {col.label}{sortArrow(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standingsSorted.map((club, idx) => {
                  const d = clubsDetails[club.club_id] || {};
                  return (
                    <tr key={club.club_id} style={{ background: idx % 2 === 0 ? "#22252a" : "#181d23" }}>
                      <td>{idx + 1}</td>
                      <td>
                        <a href={`https://play.soccerverse.com/club/${club.club_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#4f47ff", fontWeight: 700 }}>
                          {clubMap[club.club_id]?.name || club.club_id}
                        </a>
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
                      <td style={{ fontWeight: 700 }}>{club.avg_player_rating || "-"}</td>
                      <td style={{ color: "#8fff6f", fontWeight: 700 }}>{formatSVC(d.avg_wages)}</td>
                      <td style={{ color: "#8fff6f", fontWeight: 700 }}>{formatSVC(d.total_wages)}</td>
                      <td style={{ color: "#6fffe6", fontWeight: 700 }}>{formatSVC(d.total_player_value)}</td>
                      <td style={{ color: "#ffd700", fontWeight: 700 }}>{formatSVC(d.balance)}</td>
                      <td style={{ color: "#b2ff5a", fontWeight: 700 }}>{d.transfers_in ?? "-"}</td>
                      <td style={{ color: "#ffb26b", fontWeight: 700 }}>{d.transfers_out ?? "-"}</td>
                      <td style={{ color: "#ffd700", fontWeight: 700 }}>{d.avg_player_rating_top21 ?? "-"}</td>
                      <td style={{ color: "#ff8c47", fontWeight: 700 }}>{d.avg_shooting ?? "-"}</td>
                      <td style={{ color: "#7fbfff", fontWeight: 700 }}>{d.avg_passing ?? "-"}</td>
                      <td style={{ color: "#66e", fontWeight: 700 }}>{d.avg_tackling ?? "-"}</td>
                      <td style={{ color: "#d49fff", fontWeight: 700 }}>{d.gk_rating ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
