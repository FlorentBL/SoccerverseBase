"use client";
import React, { useState } from "react";
const RINCON_URL = "/rincon_mapping.json";
function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " SVC";
}

export default function SoccerverseScouting() {
  const [playerId, setPlayerId] = useState("");
  const [playerInfo, setPlayerInfo] = useState(null);
  const [rinconData, setRinconData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const fetchRincon = async () => {
    if (!rinconData) {
      const resp = await fetch(RINCON_URL);
      const data = await resp.json();
      setRinconData(data);
      return data;
    }
    return rinconData;
  };

  const fetchPlayer = async () => {
    setErr("");
    setPlayerInfo(null);
    setLoading(true);
    try {
      const api = await fetch(`https://services.soccerverse.com/api/players/detailed?player_id=${playerId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErr("Aucun joueur trouvé pour cet ID.");
        setLoading(false);
        return;
      }
      const playerApi = j.items[0];
      const rincon = await fetchRincon();
      const playerRincon = rincon[playerId] ?? {};
      let nom = playerRincon.name;
      if (!nom && (playerRincon.f || playerRincon.s))
        nom = `${playerRincon.f ?? ""} ${playerRincon.s ?? ""}`.trim();
      setPlayerInfo({ ...playerApi, nom });
    } catch (e) {
      setErr("Erreur réseau ou parsing données.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#181c21", color: "#f6f6f7",
      fontFamily: "Inter, Arial, sans-serif", paddingTop: 48
    }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 32, letterSpacing: 1, textAlign: "center" }}>
        Scouting Soccerverse (détail)
      </h2>
      <div style={{
        margin: "0 auto", maxWidth: 1200,
        display: "flex", flexDirection: "column", alignItems: "center"
      }}>
        {/* Zone de recherche */}
        <div style={{
          background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008",
          width: "100%", maxWidth: 520, marginBottom: 34
        }}>
          <label style={{ fontWeight: 600, fontSize: 17 }}>ID Joueur :</label>
          <input
            type="number"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            style={{
              width: "100%", margin: "12px 0 16px 0", padding: "12px 16px", borderRadius: 6,
              border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
            }}
            placeholder="Ex : 17"
            min={1}
          />
          <button
            onClick={fetchPlayer}
            disabled={loading || !playerId}
            style={{
              background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
              border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
              cursor: loading || !playerId ? "not-allowed" : "pointer",
              boxShadow: "0 1px 5px #0004"
            }}
          >
            {loading ? "Recherche..." : "Afficher infos"}
          </button>
          {err && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{err}</div>}
        </div>

        {/* Bloc double colonne desktop / colonne mobile */}
        {playerInfo && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 32,
              marginTop: 0,
              marginBottom: 32
            }}
          >
            {/* Colonne gauche : Infos joueur */}
            <div style={{
              flex: "1 1 0",
              minWidth: 330,
              maxWidth: 450,
              background: "#181d23",
              borderRadius: 14,
              padding: 28,
              boxShadow: "0 2px 8px #0003"
            }}>
              <div style={{ fontSize: 14, color: "#ffd700", fontWeight: 500, marginBottom: 10 }}>
                Toutes les valeurs sont en SVC
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 18 }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, padding: 5 }}>Nom</td>
                    <td style={{ padding: 5 }}>{playerInfo.nom || <span style={{ color: "#ff6" }}>Non dispo</span>}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: 5 }}>Âge</td>
                    <td style={{ padding: 5 }}>{playerInfo.age || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: 5 }}>Club</td>
                    <td style={{ padding: 5 }}>{playerInfo.club || playerInfo.club_id || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: 5 }}>Position(s)</td>
                    <td style={{ padding: 5 }}>{Array.isArray(playerInfo.positions) ? playerInfo.positions.join(", ") : playerInfo.positions || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: 5 }}>Note</td>
                    <td style={{ padding: 5 }}>{playerInfo.rating || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: 5 }}>Valeur</td>
                    <td style={{ padding: 5 }}>{formatSVC(playerInfo.value)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: 5 }}>Salaire</td>
                    <td style={{ padding: 5 }}>{formatSVC(playerInfo.wages)}</td>
                  </tr>
                </tbody>
              </table>
              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  background: "#222", color: "#ffd700", fontWeight: 600, fontSize: 16, border: "none",
                  borderRadius: 5, marginTop: 16, padding: "8px 22px", cursor: "pointer"
                }}>
                {showDetails ? "Masquer les détails" : "Afficher les détails"}
              </button>
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
            </div>
            {/* Colonne droite : Iframe */}
            <div style={{
              flex: "2 1 0",
              minWidth: 350,
              background: "#181d23",
              borderRadius: 14,
              padding: 0,
              boxShadow: "0 2px 8px #0003",
              marginLeft: 0,
              display: "flex",
              flexDirection: "column"
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
                  minHeight: 650,
                  border: "none",
                  borderRadius: "0 0 14px 14px",
                  background: "#191d22"
                }}
                title="Soccer Ratings"
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
              <div style={{ marginTop: 0, textAlign: "center", padding: 12 }}>
                <a
                  href={`https://soccerratings.org/player/${playerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(90deg, #0d8bff, #4f47ff)",
                    color: "#fff", borderRadius: 8, padding: "8px 24px",
                    fontWeight: 700, fontSize: 16, textDecoration: "none"
                  }}>
                  Ouvrir sur SoccerRatings.org
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive : repasse en colonne sur écran étroit */}
      <style>{`
        @media (max-width: 900px) {
          .scouting-responsive {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
