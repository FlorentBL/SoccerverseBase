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

// ----------- TABLEAU TRIÉ --------------
function sortSquad(arr, key, asc = false) {
  return arr.slice().sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
    return asc ? ("" + av).localeCompare("" + bv) : ("" + bv).localeCompare("" + av);
  });
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
  const [sortKey, setSortKey] = useState("rating");
  const [sortAsc, setSortAsc] = useState(false);
  const loadedPlayerMap = useRef(false);

  useEffect(() => { fetchPlayerMap(); }, []);

  const fetchPlayerMap = async () => {
    if (loadedPlayerMap.current) return playerMap;
    const resp = await fetch(PLAYER_MAPPING_URL);
    const data = await resp.json();
    setPlayerMap(data);
    loadedPlayerMap.current = true;
    return data;
  };

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

  // --------- CARTE CLUB MODERNE ----------
  function renderClubCard() {
    if (!clubInfo) return null;
    return (
      <div style={{
        background: "linear-gradient(110deg, #23272e 75%, #181a20 100%)",
        borderRadius: 20,
        boxShadow: "0 8px 32px #000a",
        padding: "32px 38px 25px 38px",
        marginBottom: 28,
        width: "100%",
        maxWidth: 940,
        display: "flex",
        flexDirection: "column",
        border: "2px solid #222430"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 22, marginBottom: 10 }}>
          <img src={clubInfo.profile_pic || "/default_profile.jpg"}
            alt="Club"
            style={{ width: 72, height: 72, borderRadius: 18, border: "2px solid #ffd700", background: "#191d22" }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 34, color: "#ffd700", letterSpacing: ".03em", lineHeight: 1.05 }}>
              {clubInfo.name}
            </div>
            <div style={{ fontWeight: 600, fontSize: 18, color: "#4f47ff", marginTop: 2, display: "flex", alignItems: "center" }}>
              <span>Manager : </span>
              <span style={{
                color: "#fff", marginLeft: 6, fontWeight: 700, display: "flex", alignItems: "center"
              }}>
                <img
                  src={clubInfo.top_influencers?.[0]?.profile_pic || "/default_profile.jpg"}
                  alt=""
                  style={{
                    width: 30, height: 30, borderRadius: "50%", marginRight: 6, border: "2px solid #4f47ff", background: "#191d22"
                  }}
                />
                {clubInfo.manager_name}
              </span>
              {clubInfo.country_id && (
                <span style={{
                  color: "#ffd700", marginLeft: 18, fontWeight: 700, fontSize: 19
                }}>
                  | {clubInfo.country_id}
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, color: "#b0b8cc", marginTop: 3, letterSpacing: ".02em" }}>
              <b>ID</b> : {clubInfo.club_id} &nbsp;•&nbsp; <b>Division</b> {clubInfo.division} &nbsp;•&nbsp; <b>Fans</b> : <span style={{ color: "#ffd700" }}>{clubInfo.fans_current}</span>
            </div>
          </div>
          <div style={{ minWidth: 140, textAlign: "right" }}>
            <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 22 }}>Balance</div>
            <div style={{ fontSize: 21, fontWeight: 900, color: "#ffd700" }}>{formatSVC(clubInfo.balance)}</div>
            <div style={{ color: "#ddd", fontWeight: 600, fontSize: 15, marginTop: 6 }}>Stade</div>
            <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 20 }}>{clubInfo.stadium_size_current}</div>
          </div>
        </div>
        {/* Finances et stats */}
        <div style={{ display: "flex", gap: 38, flexWrap: "wrap", marginTop: 18, marginBottom: 18 }}>
          <div>
            <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 17 }}>Valeur</div>
            <div style={{ fontWeight: 900, color: "#ffd700", fontSize: 22 }}>{formatSVC(clubInfo.value)}</div>
          </div>
          <div>
            <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 17 }}>Salaire moyen</div>
            <div style={{ fontWeight: 900, color: "#ffd700", fontSize: 21 }}>{formatSVC(clubInfo.avg_wages)}</div>
          </div>
          <div>
            <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 17 }}>League</div>
            <div style={{ fontWeight: 800, color: "#ffd700", fontSize: 21 }}>{clubInfo.league_id}</div>
          </div>
        </div>
        {/* Ratings */}
        <div style={{ margin: "8px 0 0 0", display: "flex", flexWrap: "wrap", gap: "16px 24px" }}>
          {[
            ["⭑ Rating équipe", clubInfo.avg_player_rating],
            ["⭑ Top 21", clubInfo.avg_player_rating_top21],
            ["🏹 Shooting", clubInfo.avg_shooting],
            ["🎯 Passing", clubInfo.avg_passing],
            ["🛡️ Tackling", clubInfo.avg_tackling],
            ["🧤 GK", clubInfo.gk_rating],
          ].map(([label, val], i) => (
            <div key={i} style={{
              background: "#232644",
              color: "#ffd700",
              fontWeight: 700,
              borderRadius: 10,
              fontSize: 17,
              padding: "8px 18px",
              minWidth: 80,
              textAlign: "center",
              boxShadow: "0 2px 8px #0d0d3a28"
            }}>{label}<br /><span style={{ color: "#fff", fontSize: 20 }}>{val ?? "-"}</span>
            </div>
          ))}
        </div>
        {/* Influenceurs */}
        {clubInfo.top_influencers && clubInfo.top_influencers.length > 0 && (
          <div style={{ marginTop: 22, width: "100%" }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: "#4f47ff", marginBottom: 12 }}>Top Influenceurs</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "22px" }}>
              {clubInfo.top_influencers.slice(0, 5).map((inf, i) => (
                <div key={i} style={{
                  background: "#1b1d25",
                  borderRadius: 14,
                  padding: "14px 24px",
                  minWidth: 150,
                  textAlign: "center",
                  boxShadow: "0 2px 8px #0002"
                }}>
                  <img src={inf.profile_pic || "/default_profile.jpg"} alt={inf.name} style={{
                    width: 50, height: 50, borderRadius: "50%", objectFit: "cover", marginBottom: 8, border: "2px solid #222"
                  }} />
                  <div style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>{inf.name}</div>
                  <div style={{ color: "#ffd700", fontWeight: 800, fontSize: 16 }}>{inf.num}</div>
                  <div style={{ fontSize: 13, color: "#aaa", marginTop: 3 }}>
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

  // ----------- TABLEAU EFFECTIF PRO + TRI -----------
  function renderSquadTable() {
    if (squadLoading) return <div style={{ color: "#ffd700", fontWeight: 500, margin: 12 }}>Chargement effectif...</div>;
    if (squadErr) return <div style={{ color: "#ff4e5e", margin: 12 }}>{squadErr}</div>;
    if (!squad || squad.length === 0) return null;

    const COLUMNS = [
      { key: "name", label: "Nom" },
      { key: "position", label: "Pos." },
      { key: "rating", label: "Note" },
      { key: "rating_gk", label: "GK" },
      { key: "rating_tackling", label: "Tac." },
      { key: "rating_passing", label: "Pas." },
      { key: "rating_shooting", label: "Tir" },
      { key: "age", label: "Âge" },
      { key: "form", label: "Forme" },
      { key: "value", label: "Valeur" },
      { key: "wages", label: "Salaire" },
      { key: "fitness", label: "Fitness" },
      { key: "morale", label: "Morale" },
      { key: "agent_name", label: "Agent" },
      { key: "contract", label: "Contrat" },
      { key: "cartons", label: "Cartons" },
      { key: "country_id", label: "Pays" },
    ];

    // map squad with mapping, calculs, ...
    let squadToShow = squad.map(p => {
      const pm = playerMap?.[p.player_id];
      const name = pm?.name || (pm?.f || "") + " " + (pm?.s || "");
      const posLabel = getPositionLabel(p.position);
      return {
        ...p,
        name: name?.trim() || p.player_id,
        position: posLabel,
        age: p.dob ? (2025 - new Date(p.dob * 1000).getFullYear()) : "-",
        wages: p.wages,
        cartons: (p.yellow_cards || 0) + (p.red_cards ? " | " + p.red_cards : "")
      };
    });
    // Tri !
    squadToShow = sortSquad(squadToShow, sortKey, sortAsc);

    return (
      <div style={{
        width: "100%",
        maxWidth: 1200,
        background: "#21232e",
        borderRadius: 18,
        boxShadow: "0 4px 28px #000b",
        padding: "24px 18px 16px 18px",
        marginBottom: 32,
        marginTop: 8
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: 25,
          marginBottom: 18,
          color: "#ffd700"
        }}>Effectif du Club</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            color: "#eee",
            fontSize: 16,
            borderRadius: 12,
            minWidth: 1050
          }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr style={{ background: "#161820", fontWeight: 700, fontSize: 17 }}>
                {COLUMNS.map(col =>
                  <th key={col.key}
                    onClick={() => {
                      if (sortKey === col.key) setSortAsc(!sortAsc);
                      else { setSortKey(col.key); setSortAsc(false); }
                    }}
                    style={{
                      padding: "10px 8px", cursor: "pointer",
                      background: sortKey === col.key ? "#181b2a" : undefined,
                      color: "#ffd700", position: "relative", userSelect: "none", minWidth: 60
                    }}>
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{
                        marginLeft: 7, fontSize: 15
                      }}>{sortAsc ? "▲" : "▼"}</span>
                    )}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {squadToShow.map((p, idx) => (
                <tr key={p.player_id}
                  style={{
                    background: idx % 2 === 0 ? "#1a1c22" : "#191b20",
                    borderBottom: "1px solid #23242e",
                    boxShadow: idx === squadToShow.length - 1 ? "0 4px 24px #0002" : undefined,
                    transition: "background 0.14s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#23233a"}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#1a1c22" : "#191b20"}
                >
                  {COLUMNS.map(col => {
                    if (col.key === "name") {
                      return (
                        <td key={col.key} style={{ padding: "8px", fontWeight: 700 }}>
                          <a
                            href={`https://play.soccerverse.com/player/${p.player_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4f47ff", fontWeight: 700, textDecoration: "underline"
                            }}>
                            {p.name}
                          </a>
                        </td>
                      );
                    }
                    if (col.key === "position") {
                      return (
                        <td key={col.key} style={{
                          padding: "8px",
                          fontWeight: 700,
                          color: getPositionColor(p.position),
                          textShadow: "0 1px 1px #0004"
                        }}>{p.position}</td>
                      );
                    }
                    if (col.key === "rating") {
                      return (
                        <td key={col.key} style={{
                          padding: "8px",
                          fontWeight: 900,
                          color: (p.rating >= 75 ? "#64ffae" : (p.rating < 65 ? "#ff7575" : "#fff"))
                        }}>{p.rating ?? "-"}</td>
                      );
                    }
                    if (col.key === "value" || col.key === "wages") {
                      return (
                        <td key={col.key} style={{ padding: "8px" }}>{formatSVC(p[col.key])}</td>
                      );
                    }
                    return (
                      <td key={col.key} style={{ padding: "8px" }}>{p[col.key] ?? "-"}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div style={{
      maxWidth: 1420,
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
      {/* Effectif pro + tri */}
      {clubInfo && renderSquadTable()}
    </div>
  );
}
