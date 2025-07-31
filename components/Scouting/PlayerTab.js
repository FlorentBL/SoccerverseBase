import React, { useState, useRef, useEffect } from "react";

const CLUB_MAPPING_URL = "/club_mapping.json";
const PLAYER_MAPPING_URL = "/player_mapping.json";
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

const POSITIONS = {
  1: "GK", 2: "RB", 4: "LB", 8: "CM", 16: "CF", 32: "RW", 64: "LW", 128: "CB",
  256: "CDM", 512: "CAM", 1024: "RM", 2048: "LM", 4096: "RWB", 8192: "LWB", 16384: "ST", 32768: "SUB"
};
const POSITION_COLORS = {
  GK: "#b891ff",
  CB: "#8ac8e9", LB: "#e3d267", RB: "#e3d267",
  CDM: "#ffd700", CM: "#82e0aa", CAM: "#82e0aa",
  RM: "#ffd17e", LM: "#ffd17e",
  RW: "#ffb347", LW: "#ffb347",
  CF: "#f08", ST: "#f08", SUB: "#aaa"
};

function getPositionLabel(posNum) {
  if (!posNum) return "-";
  let keys = [];
  for (const [k, v] of Object.entries(POSITIONS)) {
    if ((posNum & k) !== 0) keys.push(v);
  }
  return keys.length ? keys.join(", ") : "-";
}
function getPositionColor(label) {
  return POSITION_COLORS[label] || "#fff";
}

export default function ClubTab() {
  const [clubId, setClubId] = useState("");
  const [clubInfo, setClubInfo] = useState(null);
  const [playerMap, setPlayerMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [squad, setSquad] = useState([]);
  const [squadLoading, setSquadLoading] = useState(false);
  const [squadErr, setSquadErr] = useState("");
  const loadedPlayerMap = useRef(false);

  useEffect(() => {
    fetchPlayerMap();
  }, []);

  const fetchPlayerMap = async () => {
    if (loadedPlayerMap.current) return playerMap;
    const resp = await fetch(PLAYER_MAPPING_URL);
    const data = await resp.json();
    setPlayerMap(data);
    loadedPlayerMap.current = true;
    return data;
  };

  // Fetch club info
  const fetchClub = async () => {
    setErr(""); setClubInfo(null); setLoading(true); setSquad([]); setSquadErr(""); setShowDetails(false);
    try {
      const api = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErr("Aucun club trouvé pour cet ID."); setLoading(false); return;
      }
      const clubApi = j.items[0];
      setClubInfo(clubApi);
      fetchSquad(clubId);
    } catch (e) {
      setErr("Erreur réseau ou parsing données.");
    } finally { setLoading(false); }
  };

  // Fetch squad
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
      if (data.result && Array.isArray(data.result.data) && data.result.data.length > 0) {
        setSquad(data.result.data);
      } else {
        setSquadErr("Aucun joueur trouvé dans l'effectif.");
      }
    } catch (e) {
      setSquadErr("Erreur réseau ou parsing effectif.");
    } finally { setSquadLoading(false); }
  };

  // Carte club "Hero"
  function renderClubCard() {
    if (!clubInfo) return null;
    return (
      <div style={{
        background: "linear-gradient(115deg, #23272e 70%, #1a1c23 100%)",
        borderRadius: 20,
        boxShadow: "0 6px 32px #000a",
        padding: "36px 36px 20px 36px",
        marginBottom: 28,
        width: "100%",
        maxWidth: 900,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        border: "2px solid #282d38"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginBottom: 12 }}>
          <img src={clubInfo.profile_pic || "/default_profile.jpg"}
            alt="Club"
            style={{ width: 72, height: 72, borderRadius: 18, border: "2px solid #ffd700", background: "#191d22" }}
          />
          <div>
            <div style={{ fontWeight: 900, fontSize: 33, color: "#ffd700", letterSpacing: ".03em" }}>
              {clubInfo.name}
            </div>
            <div style={{ fontWeight: 500, fontSize: 20, color: "#4f47ff", marginTop: 2 }}>
              Manager : <b style={{ color: "#fff" }}>{clubInfo.manager_name}</b>
              {clubInfo.country_id && (
                <span style={{ color: "#ffd700", marginLeft: 18 }}>
                  | <span style={{ fontWeight: 700 }}>{clubInfo.country_id}</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, color: "#c0c7d7", marginTop: 1 }}>
              ID : {clubInfo.club_id} &nbsp; • &nbsp; Division {clubInfo.division} &nbsp; • &nbsp; Fans : <b>{clubInfo.fans_current}</b>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 50, flexWrap: "wrap", marginTop: 20, marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>Valeur</div>
            <div style={{ fontWeight: 700, color: "#ffd700", fontSize: 22 }}>{formatSVC(clubInfo.value)}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>Balance</div>
            <div style={{ fontWeight: 700, color: "#ffd700", fontSize: 22 }}>{formatSVC(clubInfo.balance)}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>Stade</div>
            <div style={{ fontWeight: 700, color: "#ffd700", fontSize: 22 }}>{clubInfo.stadium_size_current}</div>
          </div>
        </div>
        {/* Ratings */}
        <div style={{ display: "flex", gap: 36, flexWrap: "wrap", marginTop: 18, marginBottom: 18 }}>
          <div style={{ color: "#4f47ff", fontWeight: 700, fontSize: 19, minWidth: 140 }}>Moyennes & Ratings</div>
          {[
            ["⭑ Rating équipe", clubInfo.avg_player_rating],
            ["⭑ Top 21", clubInfo.avg_player_rating_top21],
            ["🏹 Shooting", clubInfo.avg_shooting],
            ["🎯 Passing", clubInfo.avg_passing],
            ["🛡️ Tackling", clubInfo.avg_tackling],
            ["🧤 GK", clubInfo.gk_rating],
            ["💸 Avg Wages", formatSVC(clubInfo.avg_wages)]
          ].map(([label, val], i) => (
            <div key={i} style={{
              background: "#232644",
              color: "#ffd700",
              fontWeight: 700,
              borderRadius: 8,
              fontSize: 17,
              padding: "6px 14px",
              minWidth: 88,
              textAlign: "center",
              marginRight: 4,
              boxShadow: "0 2px 6px #0d0d3a44"
            }}>{label} <br /><span style={{ color: "#fff", fontSize: 19 }}>{val ?? "-"}</span>
            </div>
          ))}
        </div>
        {/* Influenceurs */}
        {clubInfo.top_influencers && clubInfo.top_influencers.length > 0 && (
          <div style={{ marginTop: 10, width: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: 19, color: "#4f47ff", marginBottom: 8 }}>Top Influenceurs</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "22px" }}>
              {clubInfo.top_influencers.slice(0, 5).map((inf, i) => (
                <div key={i} style={{
                  background: "#21242c",
                  borderRadius: 12,
                  padding: "12px 24px",
                  minWidth: 140,
                  textAlign: "center",
                  boxShadow: "0 2px 8px #0004"
                }}>
                  <img src={inf.profile_pic || "/default_profile.jpg"} alt={inf.name} style={{
                    width: 48, height: 48, borderRadius: "50%", objectFit: "cover", marginBottom: 6
                  }} />
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>{inf.name}</div>
                  <div style={{ color: "#ffd700", fontWeight: 800, fontSize: 15 }}>{inf.num}</div>
                  <div style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>
                    {inf.last_active_unix ? formatDate(inf.last_active_unix) : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tableau d’effectif visuel
  function renderSquadTable() {
    if (squadLoading) return <div style={{ color: "#ffd700", fontWeight: 500, margin: 12 }}>Chargement effectif...</div>;
    if (squadErr) return <div style={{ color: "#ff4e5e", margin: 12 }}>{squadErr}</div>;
    if (!squad || squad.length === 0) return null;
    return (
      <div style={{
        width: "100%",
        maxWidth: 1100,
        background: "#21232e",
        borderRadius: 18,
        boxShadow: "0 4px 22px #0007",
        padding: "28px 18px 16px 18px",
        marginBottom: 18,
        marginTop: 4
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: 25,
          marginBottom: 16,
          color: "#ffd700"
        }}>Effectif du Club</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#eee",
            fontSize: 16,
            borderRadius: 10,
            minWidth: 900
          }}>
            <thead>
              <tr style={{ background: "#191d22", fontWeight: 700, fontSize: 17 }}>
                <th style={{ padding: "8px" }}>Nom</th>
                <th style={{ padding: "8px" }}>Pos.</th>
                <th style={{ padding: "8px" }}>Note</th>
                <th style={{ padding: "8px" }}>GK</th>
                <th style={{ padding: "8px" }}>Tac.</th>
                <th style={{ padding: "8px" }}>Pas.</th>
                <th style={{ padding: "8px" }}>Tir</th>
                <th style={{ padding: "8px" }}>Âge</th>
                <th style={{ padding: "8px" }}>Forme</th>
                <th style={{ padding: "8px" }}>Valeur</th>
                <th style={{ padding: "8px" }}>Fitness</th>
                <th style={{ padding: "8px" }}>Morale</th>
                <th style={{ padding: "8px" }}>Agent</th>
                <th style={{ padding: "8px" }}>Contrat</th>
                <th style={{ padding: "8px" }}>Cartons</th>
                <th style={{ padding: "8px" }}>Pays</th>
              </tr>
            </thead>
            <tbody>
              {squad.map(p => {
                const pm = playerMap?.[p.player_id];
                const name = pm?.name || (pm?.f || "") + " " + (pm?.s || "");
                const posLabel = getPositionLabel(p.position);
                return (
                  <tr key={p.player_id} style={{ background: p.retired ? "#4446" : undefined }}>
                    <td style={{ padding: "6px 8px", fontWeight: 700 }}>
                      <a
                        href={`https://play.soccerverse.com/player/${p.player_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#4f47ff", fontWeight: 700, textDecoration: "underline"
                        }}>
                        {name?.trim() || p.player_id}
                      </a>
                    </td>
                    <td style={{
                      padding: "6px 8px",
                      fontWeight: 700,
                      color: getPositionColor(posLabel),
                    }}>{posLabel}</td>
                    <td style={{
                      padding: "6px 8px",
                      fontWeight: 900,
                      color: (p.rating >= 75 ? "#64ffae" : (p.rating < 65 ? "#ff7575" : "#fff"))
                    }}>{p.rating ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.rating_gk ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.rating_tackling ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.rating_passing ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.rating_shooting ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.dob ? (2025 - new Date(p.dob * 1000).getFullYear()) : "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.form || "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{formatSVC(p.value)}</td>
                    <td style={{ padding: "6px 8px" }}>{p.fitness ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.morale ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.agent_name || "-"}</td>
                    <td style={{ padding: "6px 8px" }}>{p.contract ?? "-"}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <span title="Jaune">{p.yellow_cards || 0}</span>
                      {p.red_cards ? <span style={{ color: "red" }}> | <b>{p.red_cards}</b></span> : ""}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{p.country_id || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div style={{
      maxWidth: 1400,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Saisie ID club */}
      <div style={{
        background: "#23272e",
        padding: 24,
        borderRadius: 14,
        boxShadow: "0 2px 12px #0008",
        width: "100%",
        maxWidth: 520,
        marginBottom: 34
      }}>
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
      {/* Carte club pro */}
      {clubInfo && renderClubCard()}
      {/* Effectif pro */}
      {clubInfo && renderSquadTable()}
    </div>
  );
}
