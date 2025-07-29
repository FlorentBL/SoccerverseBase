import React, { useState, useRef } from "react";

const CLUB_MAPPING_URL = "/club_mapping.json";
const COUNTRY_MAPPING_URL = "/country_mapping.json";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " SVC";
}

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

  const loadedClubMap = useRef(false);
  const loadedCountryMap = useRef(false);

  // Charge le mapping des clubs
  const fetchClubMap = async () => {
    if (loadedClubMap.current) return clubMap;
    const resp = await fetch(CLUB_MAPPING_URL);
    const data = await resp.json();
    setClubMap(data);
    loadedClubMap.current = true;
    return data;
  };

  // Charge le mapping des pays/divisions
  const fetchCountryMap = async () => {
    if (loadedCountryMap.current) return countryMap;
    const resp = await fetch(COUNTRY_MAPPING_URL);
    const data = await resp.json();
    setCountryMap(data);
    loadedCountryMap.current = true;
    return data;
  };

  // Mise à jour du menu pays au premier rendu
  React.useEffect(() => {
    fetchCountryMap();
    fetchClubMap();
  }, []);

  // Remise à zéro de la division si on change de pays
  React.useEffect(() => {
    setDivision("");
  }, [country]);

  // Recherche du classement, charge aussi les mappings
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

  // Charge les stats avancées de tous les clubs
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

  // Rendu principal
  const selectedCountry = countryMap.find(c => c.code === country);
  const selectedDivision = selectedCountry?.divisions.find(d => d.leagueId === Number(division));

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
          {/* Header enrichi */}
          <div style={{ fontSize: 17, color: "#ffd700", fontWeight: 500, marginBottom: 12 }}>
            {selectedCountry && selectedDivision
              ? <>Championnat : <span style={{ color: "#4f47ff" }}>{selectedCountry.flag} {selectedCountry.country} - {selectedDivision.label}</span></>
              : "Classement"}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 15, textAlign: "center" }}>
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
                  <th>💸Avg</th>
                  <th>💸Total</th>
                  <th>🏦Value</th>
                  <th>Top21</th>
                  <th>🏹</th>
                  <th>🎯</th>
                  <th>🛡️</th>
                  <th>🧤</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((club, idx) => {
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
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 14 }}>
            Toutes les stats sont directement affichées (API “details” massivement utilisée).
          </div>
        </div>
      )}
    </div>
  );
}
