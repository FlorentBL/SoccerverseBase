import React, { useState, useRef } from "react";

const PLAYER_MAPPING_URL = "/player_mapping.json";

function getEmoji(label) {
  switch (label) {
    case "Rating GK": return <span style={{ color: "#b891ff" }}>🧤</span>;
    case "Tackling": return <span style={{ color: "#77e5ff" }}>🛡️</span>;
    case "Passing": return <span style={{ color: "#ff8cfa" }}>🎯</span>;
    case "Shooting": return <span style={{ color: "#ffb347" }}>🏹</span>;
    case "Stamina": return <span style={{ color: "#ffe074" }}>💪</span>;
    case "Aggression": return <span style={{ color: "#ff5959" }}>🔥</span>;
    case "Fitness": return <span style={{ color: "#ffd000" }}>⚡</span>;
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

  function PlayerDetailsCard() {
    if (!playerInfo) return null;
    return (
      <div
        style={{
          margin: "0 auto",
          width: "100%",
          maxWidth: 650,
          background: "linear-gradient(115deg, #23272e 80%, #1a1c23 100%)",
          borderRadius: 18,
          boxShadow: "0 4px 20px #000b",
          padding: "36px 36px 28px 36px",
          marginBottom: 34,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "2px solid #282d38",
        }}
      >
        <div style={{ fontSize: 15, color: "#ffd700", fontWeight: 600, marginBottom: 14, letterSpacing: ".04em", alignSelf: "flex-start" }}>
          Toutes les valeurs sont en SVC
        </div>
        <div style={{
          display: "flex", width: "100%", justifyContent: "center", gap: 34, flexWrap: "wrap", alignItems: "flex-start"
        }}>
          {/* Colonne gauche : identité joueur */}
          <div style={{ minWidth: 220, maxWidth: 350, flex: 1 }}>
            <div style={{ fontSize: 27, fontWeight: 900, color: "#fff", marginBottom: 6, lineHeight: 1.1 }}>
              {playerInfo.nom || <span style={{ color: "#ff6" }}>Non dispo</span>}
              {playerInfo.player_id && (
                <>{" "}
                  <a
                    href={`https://play.soccerverse.com/player/${playerInfo.player_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#76b4ff",
                      fontWeight: 700,
                      fontSize: 18,
                      textDecoration: "underline",
                      marginLeft: 4,
                    }}
                    title="Voir le joueur sur Soccerverse"
                  >
                    ({playerInfo.player_id})
                  </a>
                </>
              )}
            </div>
            <div style={{ fontSize: 16, color: "#ffd700", fontWeight: 700, marginBottom: 5 }}>
              {playerInfo.positions && (Array.isArray(playerInfo.positions) ? playerInfo.positions.join(", ") : playerInfo.positions)}
            </div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>
              Âge : <span style={{ fontWeight: 700 }}>{playerInfo.age || "-"}</span>
            </div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>
              Club :{" "}
              {playerInfo.club_id ? (
                <a
                  href={`https://play.soccerverse.com/club/${playerInfo.club_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4f47ff", fontWeight: 700, textDecoration: "underline", fontSize: 16 }}
                  title="Voir le club"
                >
                  {playerInfo.club_id}
                </a>
              ) : (
                playerInfo.club || "-"
              )}
            </div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>
              Note : <b style={{ color: "#76ffb1" }}>{playerInfo.rating || "-"}</b>
            </div>
            <div style={{ fontSize: 16, marginBottom: 2, color: "#eee" }}>
              Valeur : <span style={{ fontWeight: 700 }}>{formatSVC(playerInfo.value)}</span>
            </div>
            <div style={{ fontSize: 16, marginBottom: 6, color: "#eee" }}>
              Salaire : <span style={{ fontWeight: 700 }}>{formatSVC(playerInfo.wages)}</span>
            </div>
          </div>
          {/* Colonne droite : stats */}
          <div style={{
            minWidth: 210,
            flex: 1,
            background: "#21232e",
            borderRadius: 16,
            padding: "22px 28px 12px 22px",
            boxShadow: "0 2px 16px #0002",
            marginBottom: 6,
            marginTop: 8,
            alignSelf: "center"
          }}>
            <table style={{ width: "100%", color: "#dde6f7", fontSize: 16, borderCollapse: "collapse" }}>
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
        {/* Liens rapides */}
        <div style={{
          display: "flex", gap: 0, justifyContent: "center", alignItems: "center", margin: "32px 0 0 0", width: "100%", flexWrap: "wrap"
        }}>
          <a
            href={`https://www.transfermarkt.fr/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(playerInfo.nom || "")}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "linear-gradient(90deg, #2050b0, #40bff7)",
              color: "#fff",
              borderRadius: 8,
              padding: "14px 34px",
              fontWeight: 700,
              fontSize: 17,
              textDecoration: "none",
              boxShadow: "0 2px 8px #0af2",
              margin: "0 auto"
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
