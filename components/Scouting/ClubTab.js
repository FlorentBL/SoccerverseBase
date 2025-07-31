import React, { useState, useRef, useEffect } from "react";

const PLAYER_MAPPING_URL = "/player_mapping.json";
const LEAGUE_MAPPING_URL = "/league_mapping.json";
const SQUAD_RPC_URL = "https://gsppub.soccerverse.io/";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (
    <span style={{ color: "#00ffd0", fontWeight: 700 }}>
      {(val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} SVC
    </span>
  );
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
const POSITION_ORDER = ["GK","RB","CB","LB","RWB","LWB","CDM","CM","CAM","LM","RM","LW","RW","CF","ST","SUB"];
const POSITION_COLORS = {
  GK: "#b891ff", CB: "#8ac8e9", LB: "#e3d267", RB: "#e3d267", CDM: "#ffd700",
  CM: "#82e0aa", CAM: "#82e0aa", RM: "#ffd17e", LM: "#ffd17e",
  RW: "#ffb347", LW: "#ffb347", CF: "#f08", ST: "#f08", SUB: "#aaa"
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
  if (!label) return "#fff";
  const base = label.split(",")[0].trim();
  return POSITION_COLORS[base] || "#fff";
}
function getPositionOrder(label) {
  if (!label) return 999;
  const main = label.split(",")[0].trim();
  const idx = POSITION_ORDER.indexOf(main);
  return idx === -1 ? 999 : idx;
}
function sortSquad(arr, key, asc = false) {
  return arr.slice().sort((a, b) => {
    if (key === "position") {
      const av = getPositionOrder(a.position);
      const bv = getPositionOrder(b.position);
      return asc ? av - bv : bv - av;
    }
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
  const [leagueMap, setLeagueMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [squad, setSquad] = useState([]);
  const [squadLoading, setSquadLoading] = useState(false);
  const [squadErr, setSquadErr] = useState("");
  const [sortKey, setSortKey] = useState("rating");
  const [sortAsc, setSortAsc] = useState(false);
  const [sumValue, setSumValue] = useState(0);
  const loadedPlayerMap = useRef(false);

  useEffect(() => { fetchPlayerMap(); fetchLeagueMap(); }, []);
  const fetchPlayerMap = async () => {
    if (loadedPlayerMap.current) return playerMap;
    const resp = await fetch(PLAYER_MAPPING_URL);
    const data = await resp.json();
    setPlayerMap(data);
    loadedPlayerMap.current = true;
    return data;
  };
  const fetchLeagueMap = async () => {
    const resp = await fetch(LEAGUE_MAPPING_URL);
    const data = await resp.json();
    setLeagueMap(data);
  };

  const fetchClub = async () => {
    setErr(""); setClubInfo(null); setLoading(true); setSquad([]); setSquadErr("");
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

      // 👇 Ajoute ce bloc pour calculer la somme
      let total = 0;
      for (const p of data.result.data) {
        if (p.value && !isNaN(p.value)) total += p.value;
      }
      setSumValue(total);
    } else {
      setSquadErr("Aucun joueur trouvé dans l'effectif.");
      setSumValue(0); // <== reset à zéro si pas d'effectif
    }
  } catch (e) {
    setSquadErr("Erreur réseau ou parsing effectif.");
    setSumValue(0);
  } finally { setSquadLoading(false); }
};


  function getLeagueLabel(id) {
    return leagueMap?.[id]?.name || id || "-";
  }

  // ---------- CLUB CARD 1 ligne, compact et pro ----------
function renderClubCard() {
  if (!clubInfo) return null;
  return (
    <div style={{
      background: "linear-gradient(110deg, #23272e 75%, #181a20 100%)",
      borderRadius: 20,
      boxShadow: "0 8px 32px #000a",
      padding: "28px 38px 12px 38px",
      marginBottom: 28,
      width: "100%",
      maxWidth: 1200,
      border: "2px solid #222430",
      display: "flex",
      flexDirection: "column",
      gap: 5
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <img src={clubInfo.profile_pic || "/default_profile.jpg"}
          alt="Club"
          style={{ width: 65, height: 65, borderRadius: 18, border: "2px solid #ffd700", background: "#191d22" }}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 900, fontSize: 28, color: "#ffd700", lineHeight: 1.05 }}>
            <a href={`https://play.soccerverse.com/club/${clubInfo.club_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#ffd700", textDecoration: "underline" }}>
              {clubInfo.name}
            </a>
          </div>
          <div style={{ fontWeight: 600, fontSize: 17, color: "#4f47ff", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            Manager : <span style={{ color: "#fff", fontWeight: 700 }}>{clubInfo.manager_name}</span>
            <span style={{ color: "#ffd700", marginLeft: 11, fontWeight: 700 }}>{clubInfo.country_id}</span>
            {/* ID du club avec lien */}
            <span style={{ color: "#b0b8cc", marginLeft: 11 }}>| ID: 
              <a
                href={`https://play.soccerverse.com/club/${clubInfo.club_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#4f47ff", fontWeight: 700, marginLeft: 3, textDecoration: "underline" }}
                title="Voir la page du club"
              >
                {clubInfo.club_id}
              </a>
            </span>
            {/* Division avec lien */}
            <span style={{ color: "#b0b8cc", marginLeft: 8 }}>• Division: 
              <a
                href={`https://play.soccerverse.com/league/${clubInfo.league_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ffd700", fontWeight: 700, marginLeft: 3, textDecoration: "underline" }}
                title="Voir la page de la division"
              >
                {getLeagueLabel(clubInfo.league_id)}
              </a>
            </span>
            <span style={{ color: "#b0b8cc", marginLeft: 8 }}>• Fans: <span style={{ color: "#ffd700" }}>{clubInfo.fans_current}</span></span>
          </div>
        </div>
        <div style={{ minWidth: 150, textAlign: "right", alignSelf: "flex-start" }}>
          <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 21 }}>Balance</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#ffd700" }}>{formatSVC(clubInfo.balance)}</div>
          <div style={{ color: "#ddd", fontWeight: 600, fontSize: 14, marginTop: 5 }}>Stade</div>
          <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 18 }}>{clubInfo.stadium_size_current}</div>
        </div>
      </div>
      {/* Stats sur 1 seule ligne */}
      <div style={{
        display: "flex", gap: 20, marginTop: 9, alignItems: "center", flexWrap: "wrap"
      }}>
        <div>
          <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 15 }}>Valeur</div>
  <div style={{ fontWeight: 900, color: "#ffd700", fontSize: 18 }}>{formatSVC(sumValue)}</div>
        </div>
        <div>
          <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 15 }}>Salaire moyen</div>
          <div style={{ fontWeight: 900, color: "#ffd700", fontSize: 17 }}>{formatSVC(clubInfo.avg_wages)}</div>
        </div>
        <div>
          <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 15 }}>League</div>
          <div style={{ fontWeight: 800, color: "#ffd700", fontSize: 17 }}>{getLeagueLabel(clubInfo.league_id)}</div>
        </div>
        <div style={{
          display: "flex", gap: 11, alignItems: "center", flexWrap: "nowrap", marginLeft: 28
        }}>
          {[
            ["⭑ Rating équipe", clubInfo.avg_player_rating],
            ["⭑ Top 21", clubInfo.avg_player_rating_top21],
            ["🏹 Shooting", clubInfo.avg_shooting],
            ["🎯 Passing", clubInfo.avg_passing],
            ["🛡️ Tackling", clubInfo.avg_tackling],
            ["🧤 GK", clubInfo.gk_rating],
          ].map(([label, val], i) => (
            <div key={i} style={{
              background: "#232644", color: "#ffd700", fontWeight: 700, borderRadius: 9,
              fontSize: 15, padding: "6px 12px", minWidth: 62, textAlign: "center", display: "inline-block"
            }}>
              <span style={{ marginRight: 3 }}>{label}</span>
              <span style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginLeft: 3 }}>{val ?? "-"}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Influenceurs 1 ligne, scroll horizontal */}
      {clubInfo.top_influencers && clubInfo.top_influencers.length > 0 && (
        <div style={{ marginTop: 10, width: "100%" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#4f47ff", marginBottom: 6 }}>Top Influenceurs</div>
          <div style={{
            display: "flex", flexDirection: "row", gap: "17px", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 3
          }}>
            {clubInfo.top_influencers.map((inf, i) => (
              <div key={i} style={{
                background: "#1b1d25",
                borderRadius: 10,
                padding: "8px 18px",
                minWidth: 120,
                textAlign: "center",
                boxShadow: "0 2px 8px #0002",
                display: "inline-block"
              }}>
                <img src={inf.profile_pic || "/default_profile.jpg"} alt={inf.name} style={{
                  width: 35, height: 35, borderRadius: "50%", objectFit: "cover", marginBottom: 5, border: "2px solid #222"
                }} />
                <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{inf.name}</div>
                <div style={{ color: "#ffd700", fontWeight: 800, fontSize: 14 }}>{inf.num}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
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


  // ----------- EFFECTIF : TABLEAU PRO, ultra compact, sortable ----------
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
    squadToShow = sortSquad(squadToShow, sortKey, sortAsc);

    return (
      <div style={{
        width: "100%",
        maxWidth: 1450,
        background: "#21232e",
        borderRadius: 15,
        boxShadow: "0 4px 22px #000a",
        padding: "10px 8px 8px 8px",
        marginBottom: 28,
        marginTop: 6
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: 23,
          marginBottom: 6,
          color: "#ffd700"
        }}>Effectif du Club</div>
        <div style={{ overflowX: "auto" }}>
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
                {COLUMNS.map(col => (
                  <th key={col.key}
                    onClick={() => {
                      if (sortKey === col.key) setSortAsc(s => !s);
                      else { setSortKey(col.key); setSortAsc(false); }
                    }}
                    style={{
                      padding: "7px 6px",
                      cursor: "pointer",
                      background: sortKey === col.key ? "#191e2b" : undefined,
                      color: "#ffd700", userSelect: "none", minWidth: 52,
                      whiteSpace: "nowrap", textAlign: "left", fontWeight: 800, fontSize: 16
                    }}>
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{
                        marginLeft: 5, fontSize: 13
                      }}>{sortAsc ? "▲" : "▼"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {squadToShow.map((p, idx) => (
                <tr key={p.player_id}
                  style={{
                    background: idx % 2 === 0 ? "#1a1c22" : "#181b22",
                    borderBottom: "1px solid #23242e",
                    transition: "background 0.13s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#23233a"}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#1a1c22" : "#181b22"}
                >
                  {COLUMNS.map(col => {
                    if (col.key === "name") {
                      return (
                        <td key={col.key} style={{ padding: "7px", fontWeight: 700, whiteSpace: "nowrap" }}>
                          <a
                            href={`https://play.soccerverse.com/player/${p.player_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4f47ff", fontWeight: 700, textDecoration: "underline", whiteSpace: "nowrap"
                            }}>
                            {p.name}
                          </a>
                        </td>
                      );
                    }
                    if (col.key === "position") {
                      return (
                        <td key={col.key} style={{
                          padding: "7px",
                          fontWeight: 900,
                          color: getPositionColor(p.position),
                          textShadow: "0 1px 1px #0004",
                          whiteSpace: "nowrap"
                        }}>{p.position}</td>
                      );
                    }
                    if (col.key === "rating") {
                      return (
                        <td key={col.key} style={{
                          padding: "7px",
                          fontWeight: 900,
                          color: (p.rating >= 75 ? "#64ffae" : (p.rating < 65 ? "#ff7575" : "#fff")),
                          whiteSpace: "nowrap"
                        }}>{p.rating ?? "-"}</td>
                      );
                    }
                    if (col.key === "value" || col.key === "wages") {
                      return (
                        <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap" }}>{formatSVC(p[col.key])}</td>
                      );
                    }
                    return (
                      <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap" }}>{p[col.key] ?? "-"}</td>
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

  // ----------- Rendu principal -----------
  return (
    <div style={{
      maxWidth: 1500,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Saisie ID club */}
      <div style={{
        background: "#23272e",
        padding: 22,
        borderRadius: 13,
        boxShadow: "0 2px 12px #0008",
        width: "100%",
        maxWidth: 480,
        marginBottom: 32
      }}>
        <label style={{ fontWeight: 600, fontSize: 17 }}>ID Club :</label>
        <input type="number" value={clubId} onChange={e => setClubId(e.target.value)}
          style={{
            width: "100%", margin: "12px 0 14px 0", padding: "11px 16px", borderRadius: 6,
            border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
          }}
          placeholder="Ex : 5902" min={1}
        />
        <button onClick={fetchClub} disabled={loading || !clubId}
          style={{
            background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
            border: "none", borderRadius: 6, padding: "10px 26px", fontWeight: 700, fontSize: 16,
            cursor: loading || !clubId ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
          }}
        >{loading ? "Recherche..." : "Afficher infos"}</button>
        {err && <div style={{ color: "#ff4e5e", marginTop: 13, fontWeight: 600 }}>{err}</div>}
      </div>
      {/* Carte club */}
      {clubInfo && renderClubCard()}
      {/* Effectif + tri */}
      {clubInfo && renderSquadTable()}
    </div>
  );
}
