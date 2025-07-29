import React, { useState, useRef } from "react";

const PLAYER_MAPPING_URL = "/player_mapping.json";

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

      {/* Infos joueur + liens rapides + Iframe */}
      {playerInfo && (
        <div style={{ width: "100%", maxWidth: 1200 }}>
          {/* Infos générales (toujours au-dessus) */}
          <div style={{
            width: "100%",
            background: "#181d23",
            borderRadius: 14,
            padding: "28px 32px",
            boxShadow: "0 2px 8px #0003",
            marginBottom: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start"
          }}>
            <div style={{ fontSize: 14, color: "#ffd700", fontWeight: 500, marginBottom: 10 }}>Toutes les valeurs sont en SVC</div>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 18 }}>
              <tbody>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Nom</td><td style={{ padding: 5 }}>{playerInfo.nom || <span style={{ color: "#ff6" }}>Non dispo</span>}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Âge</td><td style={{ padding: 5 }}>{playerInfo.age || "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Club</td>
                  <td style={{ padding: 5 }}>
                    {playerInfo.club || playerInfo.club_id || "-"}
                    {playerInfo.club_id && (
                      <> <a href={`https://play.soccerverse.com/club/${playerInfo.club_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#4f47ff", marginLeft: 8, fontSize: 14 }}>Lien</a></>
                    )}
                  </td>
                </tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Position(s)</td><td style={{ padding: 5 }}>{Array.isArray(playerInfo.positions) ? playerInfo.positions.join(", ") : playerInfo.positions || "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Note</td><td style={{ padding: 5 }}>{playerInfo.rating || "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Valeur</td><td style={{ padding: 5 }}>{formatSVC(playerInfo.value)}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Salaire</td><td style={{ padding: 5 }}>{formatSVC(playerInfo.wages)}</td></tr>
              </tbody>
            </table>
            <button onClick={() => setShowDetails(!showDetails)}
              style={{
                background: "#222", color: "#ffd700", fontWeight: 600, fontSize: 16, border: "none",
                borderRadius: 5, marginTop: 16, padding: "8px 22px", cursor: "pointer"
              }}>{showDetails ? "Masquer les détails" : "Afficher les détails"}</button>
            {showDetails && (
              <table style={{ width: "100%", marginTop: 15, borderCollapse: "collapse", color: "#b0b0b0", fontSize: 16 }}>
                <tbody>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Player ID</td><td style={{ padding: 5 }}>{playerInfo.player_id}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Pays</td><td style={{ padding: 5 }}>{playerInfo.country || playerInfo.country_id || "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Rating GK</td><td style={{ padding: 5 }}>{playerInfo.rating_gk || "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Tackling</td><td style={{ padding: 5 }}>{playerInfo.rating_tackling || "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Passing</td><td style={{ padding: 5 }}>{playerInfo.rating_passing || "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Shooting</td><td style={{ padding: 5 }}>{playerInfo.rating_shooting || "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Stamina</td><td style={{ padding: 5 }}>{playerInfo.rating_stamina || "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Aggression</td><td style={{ padding: 5 }}>{playerInfo.rating_aggression || "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Fitness</td><td style={{ padding: 5 }}>{playerInfo.fitness ?? "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Blessé ?</td><td style={{ padding: 5 }}>{playerInfo.injured ? "Oui" : "Non"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Moral</td><td style={{ padding: 5 }}>{playerInfo.morale ?? "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Contrat</td><td style={{ padding: 5 }}>{playerInfo.contract ?? "-"}</td></tr>
                  <tr><td style={{ fontWeight: 700, padding: 5 }}>Dernier prix</td><td style={{ padding: 5 }}>{formatSVC(playerInfo.last_price)}</td></tr>
                </tbody>
              </table>
            )}

            {/* Bloc liens rapides */}
            <div style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              alignItems: "center",
              margin: "22px 0 0 0",
              width: "100%",
              flexWrap: "wrap"
            }}>
              <a
                href={`https://www.transfermarkt.fr/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(playerInfo.nom || "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "linear-gradient(90deg, #2050b0, #40bff7)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 28px",
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px #0af2"
                }}
              >
                Voir sur Transfermarkt
              </a>
              <a
                href={`https://www.sofascore.com/fr/recherche?q=${encodeURIComponent(playerInfo.nom || "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "linear-gradient(90deg, #17b978, #43e97b)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 28px",
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px #0af2"
                }}
              >
                Voir sur SofaScore
              </a>
            </div>
          </div>

          {/* Bloc Iframe SoccerRatings (full width sur mobile, 2/3 sur desktop) */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            margin: "0 auto",
            marginTop: 0,
            width: "100%",
            flexWrap: "wrap"
          }}>
            {/* SoccerRatings.org */}
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
