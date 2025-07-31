import React, { useState, useRef } from "react";

const CLUB_MAPPING_URL = "/club_mapping.json";
const SQUAD_RPC_URL = "https://gsppub.soccerverse.io/";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " SVC";
}
function formatDate(ts) {
  if (!ts || isNaN(ts)) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR");
}
function formatDOB(ts) {
  if (!ts || isNaN(ts)) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("fr-FR");
}

const POSITIONS = [
  "", "GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "ST"
];
// Position dans l'API = integer 1 à 15

export default function ClubTab() {
  const [clubId, setClubId] = useState("");
  const [clubInfo, setClubInfo] = useState(null);
  const [clubMap, setClubMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [squad, setSquad] = useState([]);
  const [squadLoading, setSquadLoading] = useState(false);
  const [squadErr, setSquadErr] = useState("");
  const loadedMap = useRef(false);

  // 1. Fetch mapping club
  const fetchClubMap = async () => {
    if (loadedMap.current) return clubMap;
    const resp = await fetch(CLUB_MAPPING_URL);
    const data = await resp.json();
    setClubMap(data);
    loadedMap.current = true;
    return data;
  };

  // 2. Fetch main club info (REST)
  const fetchClub = async () => {
    setErr(""); setClubInfo(null); setLoading(true); setSquad([]); setSquadErr(""); setShowDetails(false);
    try {
      const clubMapData = await fetchClubMap();
      const api = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErr("Aucun club trouvé pour cet ID."); setLoading(false); return;
      }
      const clubApi = j.items[0];
      setClubInfo({
        ...clubApi,
        name: clubApi.name || clubMapData[clubId]?.name || "-"
      });
      // Et on lance aussi le fetch du squad !
      fetchSquad(clubId);
    } catch (e) {
      setErr("Erreur réseau ou parsing données.");
    } finally { setLoading(false); }
  };

  // 3. Fetch squad (RPC)
  const fetchSquad = async (clubId) => {
    setSquad([]); setSquadErr(""); setSquadLoading(true);
    try {
      const body = JSON.stringify({
        jsonrpc: "2.0",
        method: "get_squad",
        params: { club_id: Number(clubId) },
        id: 1
      });
      const resp = await fetch(SQUAD_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      const data = await resp.json();
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        setSquad(data.result);
      } else {
        setSquadErr("Aucun joueur trouvé dans l'effectif.");
      }
    } catch (e) {
      setSquadErr("Erreur réseau ou parsing effectif.");
    } finally { setSquadLoading(false); }
  };

  // 4. Table d'effectif
  function renderSquadTable() {
    if (squadLoading) return <div style={{ color: "#ffd700", fontWeight: 500, margin: 12 }}>Chargement effectif...</div>;
    if (squadErr) return <div style={{ color: "#ff4e5e", margin: 12 }}>{squadErr}</div>;
    if (!squad || squad.length === 0) return null;
    return (
      <div style={{ width: "100%", marginTop: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 10, color: "#ffd700" }}>Effectif du Club</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#20222b", color: "#eee", fontSize: 15, borderRadius: 10 }}>
            <thead>
              <tr style={{ background: "#181d23" }}>
                <th>ID</th>
                <th>Pos.</th>
                <th>Rating</th>
                <th>GK</th>
                <th>Tac.</th>
                <th>Pas.</th>
                <th>Tir</th>
                <th>Âge</th>
                <th>Forme</th>
                <th>Valeur</th>
                <th>Fitness</th>
                <th>Morale</th>
                <th>Agent</th>
                <th>Contrat</th>
                <th>Cartons</th>
                <th>Pays</th>
              </tr>
            </thead>
            <tbody>
              {squad.map(p => (
                <tr key={p.player_id} style={{ background: p.retired ? "#4446" : undefined }}>
                  <td>{p.player_id}</td>
                  <td>{POSITIONS[p.position] || "-"}</td>
                  <td style={{ fontWeight: 700 }}>{p.rating ?? "-"}</td>
                  <td>{p.rating_gk ?? "-"}</td>
                  <td>{p.rating_tackling ?? "-"}</td>
                  <td>{p.rating_passing ?? "-"}</td>
                  <td>{p.rating_shooting ?? "-"}</td>
                  <td>{p.dob ? (2025 - new Date(p.dob * 1000).getFullYear()) : "-"}</td>
                  <td>{p.form || "-"}</td>
                  <td>{formatSVC(p.value)}</td>
                  <td>{p.fitness ?? "-"}</td>
                  <td>{p.morale ?? "-"}</td>
                  <td>{p.agent_name || "-"}</td>
                  <td>{p.contract ?? "-"}</td>
                  <td>
                    <span title="Jaune">{p.yellow_cards || 0}</span>
                    {p.red_cards ? <span style={{ color: "red" }}> | <b>{p.red_cards}</b></span> : ""}
                  </td>
                  <td>{p.country_id || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. Rendu principal (inchangé, sauf ajout renderSquadTable)
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008", width: "100%", maxWidth: 520, marginBottom: 34 }}>
        <label style={{ fontWeight: 600, fontSize: 17 }}>ID Club :</label>
        <input type="number" value={clubId} onChange={e => setClubId(e.target.value)}
          style={{
            width: "100%", margin: "12px 0 16px 0", padding: "12px 16px", borderRadius: 6,
            border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
          }}
          placeholder="Ex : 5902" min={1}
        />
        <button onClick={fetchClub} disabled={loading || !clubId}
          style={{
            background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
            border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
            cursor: loading || !clubId ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
          }}
        >{loading ? "Recherche..." : "Afficher infos"}</button>
        {err && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{err}</div>}
      </div>
      {clubInfo && (
        <div style={{
          width: "100%", maxWidth: 1000, margin: "0 auto", background: "#181d23", borderRadius: 14,
          padding: 28, boxShadow: "0 2px 8px #0003"
        }}>
          <div style={{ fontSize: 14, color: "#ffd700", fontWeight: 500, marginBottom: 10 }}>Toutes les valeurs sont en SVC</div>
          {/* ... tableau clubInfo comme avant ... */}
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 18 }}>
            <tbody>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Nom</td><td style={{ padding: 5 }}>{clubInfo.name || "-"}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Club ID</td><td style={{ padding: 5 }}>{clubInfo.club_id}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Manager</td><td style={{ padding: 5 }}>{clubInfo.manager_name || "-"}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Pays</td><td style={{ padding: 5 }}>{clubInfo.country_id || "-"}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Valeur</td><td style={{ padding: 5 }}>{formatSVC(clubInfo.value)}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Balance</td><td style={{ padding: 5 }}>{formatSVC(clubInfo.balance)}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Division</td><td style={{ padding: 5 }}>{clubInfo.division ?? "-"}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>League ID</td><td style={{ padding: 5 }}>{clubInfo.league_id ?? "-"}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Stade (actuel)</td><td style={{ padding: 5 }}>{clubInfo.stadium_size_current || "-"}</td></tr>
              <tr><td style={{ fontWeight: 700, padding: 5 }}>Fans (actuel)</td><td style={{ padding: 5 }}>{clubInfo.fans_current || "-"}</td></tr>
            </tbody>
          </table>
          {/* Bloc Ratings/Stats */}
          <div style={{ margin: "32px 0 18px 0", padding: 0 }}>
            <h3 style={{ fontSize: 20, color: "#4f47ff", marginBottom: 10, fontWeight: 700 }}>Moyennes & Ratings</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "22px 40px" }}>
              <div><span style={{ color: "#ffd700" }}>⭑ Rating équipe</span><br /><b>{clubInfo.avg_player_rating ?? "-"}</b></div>
              <div><span style={{ color: "#ffd700" }}>⭑ Rating top 21</span><br /><b>{clubInfo.avg_player_rating_top21 ?? "-"}</b></div>
              <div><span style={{ color: "#ffd700" }}>🏹 Shooting</span><br /><b>{clubInfo.avg_shooting ?? "-"}</b></div>
              <div><span style={{ color: "#ffd700" }}>🎯 Passing</span><br /><b>{clubInfo.avg_passing ?? "-"}</b></div>
              <div><span style={{ color: "#ffd700" }}>🛡️ Tackling</span><br /><b>{clubInfo.avg_tackling ?? "-"}</b></div>
              <div><span style={{ color: "#ffd700" }}>🧤 GK</span><br /><b>{clubInfo.gk_rating ?? "-"}</b></div>
              <div><span style={{ color: "#ffd700" }}>💸 Avg Wages</span><br /><b>{formatSVC(clubInfo.avg_wages)}</b></div>
            </div>
          </div>
          {/* Bloc Influenceurs */}
          <div style={{ marginBottom: 10, marginTop: 14 }}>
            <h3 style={{ fontSize: 20, color: "#4f47ff", marginBottom: 10, fontWeight: 700 }}>Top Influenceurs</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {clubInfo.top_influencers && clubInfo.top_influencers.length > 0 ? clubInfo.top_influencers.slice(0, 5).map((inf, i) => (
                <div key={i} style={{
                  background: "#21242c", borderRadius: 8, padding: "10px 18px", minWidth: 120, textAlign: "center"
                }}>
                  <img src={inf.profile_pic || "/default_profile.jpg"} alt={inf.name} style={{
                    width: 40, height: 40, borderRadius: "50%", objectFit: "cover", marginBottom: 4
                  }} />
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{inf.name}</div>
                  <div style={{ color: "#ffd700", fontWeight: 700, fontSize: 15 }}>{inf.num}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>
                    {inf.last_active_unix ? formatDate(inf.last_active_unix) : ""}
                  </div>
                </div>
              )) : <span style={{ color: "#ccc" }}>Aucun</span>}
            </div>
          </div>
          {/* Bouton détail */}
          <button onClick={() => setShowDetails(!showDetails)}
            style={{
              background: "#222", color: "#ffd700", fontWeight: 600, fontSize: 16, border: "none",
              borderRadius: 5, marginTop: 18, padding: "8px 22px", cursor: "pointer"
            }}>{showDetails ? "Masquer les détails" : "Afficher les détails"}</button>
          {showDetails && (
            <table style={{ width: "100%", marginTop: 15, borderCollapse: "collapse", color: "#b0b0b0", fontSize: 16 }}>
              <tbody>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Forme</td><td style={{ padding: 5 }}>{clubInfo.form ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Division Départ</td><td style={{ padding: 5 }}>{clubInfo.division_start ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Fans Départ</td><td style={{ padding: 5 }}>{clubInfo.fans_start ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Stade Départ</td><td style={{ padding: 5 }}>{clubInfo.stadium_size_start ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Total transferts in</td><td style={{ padding: 5 }}>{clubInfo.transfers_in ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Total transferts out</td><td style={{ padding: 5 }}>{clubInfo.transfers_out ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Total Wages</td><td style={{ padding: 5 }}>{formatSVC(clubInfo.total_wages)}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Total Player Value</td><td style={{ padding: 5 }}>{formatSVC(clubInfo.total_player_value)}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>GK Rating</td><td style={{ padding: 5 }}>{clubInfo.gk_rating ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Rating Start</td><td style={{ padding: 5 }}>{clubInfo.rating_start ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Manager actif</td><td style={{ padding: 5 }}>{formatDate(clubInfo.manager_last_active_unix)}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Disponible</td><td style={{ padding: 5 }}>{clubInfo.available ? "Oui" : "Non"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Profile Pic</td><td style={{ padding: 5 }}>{clubInfo.profile_pic ? <img src={clubInfo.profile_pic} alt="Club" style={{ maxWidth: 64, borderRadius: 8 }} /> : "-"}</td></tr>
              </tbody>
            </table>
          )}
          {/* ----------- EFFECTIF --------------- */}
          {renderSquadTable()}
        </div>
      )}
    </div>
  );
}
