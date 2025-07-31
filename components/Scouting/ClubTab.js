import React, { useState, useRef, useEffect } from "react";

const PLAYER_MAPPING_URL = "/player_mapping.json";
const LEAGUE_MAPPING_URL = "/league_mapping.json";
const SQUAD_RPC_URL = "https://gsppub.soccerverse.io/";

// Normalisation Soccerverse <-> foot classique
const POSITION_NORMALIZE = {
  DMC: "CDM",
  AMC: "CAM",
  LWB: "LWB",
  RWB: "RWB",
  RCB: "CB",
  LCB: "CB",
  RCM: "CM",
  LCM: "CM",
  RST: "ST",
  LST: "ST",
};

const POSITION_ORDER = [
  "GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST", "SUB"
];

const POSITION_COLORS = {
  GK: "#b891ff", CB: "#8ac8e9", LB: "#e3d267", RB: "#e3d267", CDM: "#ffd700",
  CM: "#82e0aa", CAM: "#82e0aa", RM: "#ffd17e", LM: "#ffd17e",
  RW: "#ffb347", LW: "#ffb347", CF: "#f08", ST: "#f08", SUB: "#aaa"
};

function normalizePos(pos) {
  return POSITION_NORMALIZE[pos] || pos;
}
function getPositionOrder(label) {
  if (!label) return 999;
  const main = normalizePos(label.split(",")[0].trim());
  const idx = POSITION_ORDER.indexOf(main);
  return idx === -1 ? 999 : idx;
}
function getPositionColor(label) {
  if (!label) return "#fff";
  const main = normalizePos(label.split(",")[0].trim());
  return POSITION_COLORS[main] || "#fff";
}
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
const POSITIONS_BITMASK = {
  1: "GK", 2: "RB", 4: "LB", 8: "CM", 16: "CF", 32: "RW", 64: "LW", 128: "CB",
  256: "CDM", 512: "CAM", 1024: "RM", 2048: "LM", 4096: "RWB", 8192: "LWB", 16384: "ST", 32768: "SUB"
};
function getPositionLabel(posNum) {
  if (!posNum) return "-";
  let keys = [];
  for (const [k, v] of Object.entries(POSITIONS_BITMASK)) {
    if ((posNum & k) !== 0) keys.push(v);
  }
  return keys.length ? keys.join(", ") : "-";
}

function sortSquad(arr, key, asc = false) {
  if (key === "positions") {
    return arr.slice().sort((a, b) => {
      const av = getPositionOrder(a.principal);
      const bv = getPositionOrder(b.principal);
      return asc ? av - bv : bv - av;
    });
  }
  const av = a => a[key], bv = b => b[key];
  return arr.slice().sort((a, b) => {
    if (av(a) === undefined || av(a) === null) return 1;
    if (bv(b) === undefined || bv(b) === null) return -1;
    if (typeof av(a) === "number" && typeof bv(b) === "number") return asc ? av(a) - bv(b) : bv(b) - av(a);
    return asc ? ("" + av(a)).localeCompare("" + bv(b)) : ("" + bv(b)).localeCompare("" + av(a));
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
      } else {
        setSquadErr("Aucun joueur trouvé dans l'effectif.");
      }
    } catch (e) {
      setSquadErr("Erreur réseau ou parsing effectif.");
    } finally { setSquadLoading(false); }
  };

  function getLeagueLabel(id) {
    return leagueMap?.[id]?.name || id || "-";
  }

  // ----------- Carte club pro, liens, etc -----------
  function renderClubCard() { .../* (identique à ta version précédente, non modifiée ici) */ }

  // ----------- Effectif : pro, compact, tri, principal + secondaires, stats contextuelles -----------
  function renderSquadTable() {
    if (squadLoading) return <div style={{ color: "#ffd700", fontWeight: 500, margin: 12 }}>Chargement effectif...</div>;
    if (squadErr) return <div style={{ color: "#ff4e5e", margin: 12 }}>{squadErr}</div>;
    if (!squad || squad.length === 0) return null;

    const COLUMNS = [
      { key: "name", label: "Nom" },
      { key: "positions", label: "Pos." },
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
      // Prend positions de l'API détaillée d'abord, puis du mapping, puis fallback bitmask
      let principal = "-";
      let secondaires = [];
      if (p.positions && Array.isArray(p.positions) && p.positions.length > 0) {
        principal = normalizePos(p.positions[0]);
        secondaires = p.positions.slice(1).map(normalizePos);
      } else if (pm?.positions && pm.positions.length > 0) {
        principal = normalizePos(pm.positions[0]);
        secondaires = pm.positions.slice(1).map(normalizePos);
      } else if (p.position) {
        principal = getPositionLabel(p.position);
      }
      const isGK = principal === "GK";
      return {
        ...p,
        name: name?.trim() || p.player_id,
        positions: [principal, ...secondaires].filter(Boolean).join(", "),
        principal,
        secondaires,
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
              {squadToShow.map((p, idx) => {
                const isGK = p.principal === "GK";
                return (
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
                      // Nom lien
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
                      // Positions
                      if (col.key === "positions") {
                        return (
                          <td key={col.key} style={{
                            padding: "7px",
                            fontWeight: 900,
                            color: getPositionColor(p.principal),
                            textShadow: "0 1px 1px #0004",
                            whiteSpace: "nowrap"
                          }}>
                            {p.principal}
                            {p.secondaires && p.secondaires.length > 0 && (
                              <span style={{ color: "#aaa", marginLeft: 5, fontWeight: 700, fontSize: "90%" }}>
                                ({p.secondaires.join(", ")})
                              </span>
                            )}
                          </td>
                        );
                      }
                      // Note GK
                      if (col.key === "rating_gk")
                        return (
                          <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap", fontWeight: 900, color: isGK ? "#b891ff" : "#888" }}>
                            {isGK ? (p.rating_gk ?? "-") : "-"}
                          </td>
                        );
                      // Les autres notes de champ : on masque si GK
                      if (["rating_tackling", "rating_passing", "rating_shooting"].includes(col.key))
                        return (
                          <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap", fontWeight: 900 }}>
                            {!isGK ? (p[col.key] ?? "-") : "-"}
                          </td>
                        );
                      // Note générale
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
                      // Valeur & salaire
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
                );
              })}
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
