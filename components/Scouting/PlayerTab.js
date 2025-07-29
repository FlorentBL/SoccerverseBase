import React, { useState, useRef } from "react";

const PLAYER_MAPPING_URL = "/player_mapping.json";

// Icônes light sans dépendance externe
function getEmoji(label) {
  switch (label) {
    case "Rating GK": return "🧤";
    case "Tackling": return "🛡️";
    case "Passing": return "🎯";
    case "Shooting": return "🏹";
    case "Stamina": return "💪";
    case "Aggression": return "🔥";
    case "Fitness": return "⚡";
    case "Moral": return "🙂";
    case "Dernier prix": return "💸";
    default: return "";
  }
}

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " SVC";
}

export default function PlayerTab() {
  const [playerId, setPlayerId] = useState("");
  const [playerInfo, setPlayerInfo] = useState(null);
  const [playerMap, setPlayerMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const loadedMap = useRef(false);

  const fetchPlayerMap = async () => {
    if (loadedMap.current) return playerMap;
    const resp = await fetch(PLAYER_MAPPING_URL);
    const data = await resp.json();
    setPlayerMap(data);
    loadedMap.current = true;
    return data;
  };

  const fetchPlayer = async () => {
    setErr(""); setPlayerInfo(null); setLoading(true);
    try {
      const playerMapData = await fetchPlayerMap();
      const api = await fetch(`https://services.soccerverse.com/api/players/detailed?player_id=${playerId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErr("Aucun joueur trouvé pour cet ID."); setLoading(false); return;
      }
      const playerApi = j.items[0];
      const playerRincon = playerMapData[playerId] ?? {};
      let nom = playerRincon.name || "";
      if (!nom && (playerRincon.f || playerRincon.s))
        nom = `${playerRincon.f ?? ""} ${playerRincon.s ?? ""}`.trim();
      setPlayerInfo({ ...playerApi, nom });
    } catch (e) {
      setErr("Erreur réseau ou parsing données.");
    } finally { setLoading(false); }
  };

  // Bloc détails stylé
  function PlayerDetailsCard() {
    if (!playerInfo) return null;
    return (
      <div
        style={{
          width: "100%",
          background: "linear-gradient(115deg, #23272e 80%, #1a1c23 100%)",
          borderRadius: 18,
          boxShadow: "0 4px 20px #000b",
          padding: "36px 36px 28px 36px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          maxWidth: 750,
          border: "2px solid #282d38",
        }}
      >
        <div style={{ fontSize: 15, color: "#ffd700", fontWeight: 600, marginBottom: 14, letterSpacing: ".04em" }}>
          Toutes les valeurs sont en SVC
        </div>
        <div style={{
          display: "flex", width: "100%", justifyContent: "space-between", gap: 30, flexWrap: "wrap"
        }}>
          {/* Colonne gauche : identité joueur */}
          <div style={{ minWidth: 210, maxWidth: 320, flex: 1 }}>
            <div style={{ fontSize: 25, fontWeight: 800, color: "#fff", marginBottom: 10 }}>{playerInfo.nom || <span style={{ color: "#ff6" }}>Non dispo</span>}</div>
            <div style={{ fontSize: 16, color: "#ffd700", fontWeight: 600, marginBottom: 6 }}>
              {playerInfo.positions && (Array.isArray(playerInfo.positions) ? playerInfo.positions.join(", ") : playerInfo.positions)}
            </div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>Âge : <span style={{ fontWeight: 700 }}>{playerInfo.age || "-"}</span></div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>
              Club : {playerInfo.club || playerInfo.club_id || "-"}
              {playerInfo.club_id && (
                <> <a href={`https://play.soccerverse.com/club/${playerInfo.club_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#4f47ff", marginLeft: 8, fontSize: 14, fontWeight: 600 }}>Lien</a></>
              )}
            </div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>Note : <b style={{ color: "#76ffb1" }}>{playerInfo.rating || "-"}</b></div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>Valeur : <span style={{ fontWeight: 700 }}>{formatSVC(playerInfo.value)}</span></div>
            <div style={{ fontSize: 16, marginBottom: 4, color: "#eee" }}>Salaire : <span style={{ fontWeight: 700 }}>{formatSVC(playerInfo.wages)}</span></div>
          </div>
          {/* Colonne droite : stats */}
          <div style={{
            minWidth: 210, flex: 1, background: "#21232e", borderRadius: 12, padding: "14px 22px 10px 18px", boxShadow: "0 1px 8px #0002", marginBottom: 6
          }}>
            <table style={{ width: "100%", color: "#dde6f7", fontSize: 15, borderCollapse: "collapse" }}>
              <tbody>
                <tr><td>{getEmoji("Rating GK")} <b>GK</b></td><td style={{ textAlign: "right", fontWeight: 700 }}>{playerInfo.rating_gk || "-"}</td></tr>
                <tr><td>{getEmoji("Tackling")} <b>Tackling</b></td><td style={{ textAlign: "right", fontWeight: 700 }}>{playerInfo.rating_tackling || "-"}</td></tr>
                <tr><td>{getEmoji("Passing")} <b>Passing</b></td><td style={{ textAlign: "right", fontWeight: 700 }}>{playerInfo.rating_passing || "-"}</td></tr>
                <tr><td>{getEmoji("Shooting")} <b>Shooting</b></td><td style={{ textAlign: "right", fontWeight: 700 }}>{playerInfo.rating_shooting || "-"}</td></tr>
                <tr><td>{getEmoji("Stamina")} <b>Stamina</b></td><td style={{ textAlign: "right", fontWeight: 700 }}>{playerInfo.rating_stamina || "-"}</td></tr>
                <tr><td>{getEmoji("Aggression")} <b>Aggression</b></td><td style={{ textAlign: "right" }}>{playerInfo.rating_aggression || "-"}</td></tr>
                <tr><td>{getEmoji("Fitness")} <b>Fitness</b></td><td style={{ textAlign: "right" }}>{playerInfo.fitness ?? "-"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* Détails avancés */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: showDetails ? "#222" : "linear-gradient(90deg, #0d8bff, #4f47ff)",
            color: "#ffd700", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, margin: "18px 0 0 0",
            padding: "8px 22px", cursor: "pointer", boxShadow: "0 1px 6px #0004"
          }}
        >{showDetails ? "Masquer les détails" : "Afficher les détails"}</button>
        {showDetails && (
          <div style={{
            marginTop: 15, width: "100%", background: "#22252d", borderRadius: 12, boxShadow: "0 1px 8px #0003",
            padding: "16px 18px", border: "1.5px solid #2c3244"
          }}>
            <table style={{ width: "100%", color: "#d2d7e6", fontSize: 15, borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={{ fontWeight: 600, padding: "6px 8px" }}>Player ID</td><td style={{ padding: "6px 8px" }}>{playerInfo.player_id}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: "6px 8px" }}>Pays</td><td style={{ padding: "6px 8px" }}>{playerInfo.country || playerInfo.country_id || "-"}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: "6px 8px" }}>Blessé ?</td><td style={{ padding: "6px 8px" }}>{playerInfo.injured ? "Oui" : "Non"}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: "6px 8px" }}>Moral</td><td style={{ padding: "6px 8px" }}>{playerInfo.morale ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: "6px 8px" }}>Contrat</td><td style={{ padding: "6px 8px" }}>{playerInfo.contract ?? "-"}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: "6px 8px" }}>Dernier prix</td><td style={{ padding: "6px 8px" }}>{formatSVC(playerInfo.last_price)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
        {/* Liens rapides */}
        <div style={{
          display: "flex", gap: 16, justifyContent: "center", alignItems: "center", margin: "26px 0 0 0", width: "100%", flexWrap: "wrap"
        }}>
          <a
            href={`https://www.transfermarkt.fr/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(playerInfo.nom || "")}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "linear-gradient(90deg, #2050b0, #40bff7)",
              color: "#fff", borderRadius: 8, padding: "10px 28px",
              fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 2px 6px #0af2"
            }}>
            Voir sur Transfermarkt
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Saisie ID joueur */}
      <div style={{ background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008", width: "100%", maxWidth: 520, marginBottom: 34 }}>
        <label style={{ fontWeight: 600, fontSize: 17 }}>ID Joueur :</label>
        <input type="number" value={playerId} onChange={e => setPlayerId(e.target.value)}
          style={{
            width: "100%", margin: "12px 0 16px 0", padding: "12px 16px", borderRadius: 6,
            border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
          }}
          placeholder="Ex : 17" min={1}
        />
        <button onClick={fetchPlayer} disabled={loading || !playerId}
          style={{
            background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
            border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
            cursor: loading || !playerId ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
          }}
        >{loading ? "Recherche..." : "Afficher infos"}</button>
        {err && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{err}</div>}
      </div>
      {/* Carte détaillée + iframe */}
      {playerInfo && (
        <div style={{ width: "100%", maxWidth: 1200 }}>
          <PlayerDetailsCard />
          {/* Bloc Iframe SoccerRatings */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            margin: "0 auto",
            marginTop: 0,
            width: "100%",
            flexWrap: "wrap"
          }}>
            <div style={{
              flex: "1 1 440px",
              minWidth: 360,
              background: "#181d23",
              borderRadius: 14,
              padding: 0,
              boxShadow: "0 2px 8px #0003",
              display: "flex",
              flexDirection: "column",
              marginBottom: 18
            }}>
              <div style={{
                fontSize: 16, fontWeight: 700, color: "#4f47ff",
                background: "#21252b", padding: "11px 20px", borderRadius: "14px 14px 0 0"
              }}>
                Analyse SoccerRatings.org
              </div>
              <iframe
                src={`https://soccerratings.org/player/${playerId}`}
                style={{
                  width: "100%",
                  minHeight: 450,
                  border: "none",
                  borderRadius: "0 0 0 0",
                  background: "#191d22"
                }}
                title="Soccer Ratings"
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
              <div style={{ textAlign: "center", padding: 12 }}>
                <a href={`https://soccerratings.org/player/${playerId}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-block", background: "linear-gradient(90deg, #0d8bff, #4f47ff)",
                    color: "#fff", borderRadius: 8, padding: "8px 24px",
                    fontWeight: 700, fontSize: 16, textDecoration: "none"
                  }}>
                  Ouvrir sur SoccerRatings.org
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
