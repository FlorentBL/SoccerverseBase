"use client";
import React, { useState, useRef } from "react";

// URLs mapping pour lookup rapide local (optimise le scouting + affichage nom)
const PLAYER_MAPPING_URL = "/player_mapping.json";
const CLUB_MAPPING_URL = "/club_mapping.json";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " SVC";
}
function formatDate(ts) {
  if (!ts || isNaN(ts)) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR");
}

export default function SoccerverseScoutingTabs() {
  const [tab, setTab] = useState("player");
  // Onglet Joueur
  const [playerId, setPlayerId] = useState("");
  const [playerInfo, setPlayerInfo] = useState(null);
  const [playerMap, setPlayerMap] = useState({});
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [errPlayer, setErrPlayer] = useState("");
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);

  // Onglet Club
  const [clubId, setClubId] = useState("");
  const [clubInfo, setClubInfo] = useState(null);
  const [clubMap, setClubMap] = useState({});
  const [loadingClub, setLoadingClub] = useState(false);
  const [errClub, setErrClub] = useState("");
  const [showClubDetails, setShowClubDetails] = useState(false);

  // Onglet Championnat
  const [leagueId, setLeagueId] = useState("");
  const [standings, setStandings] = useState([]);
  const [clubsDetails, setClubsDetails] = useState({});
  const [loadingLeague, setLoadingLeague] = useState(false);
  const [errLeague, setErrLeague] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Mappings chargés une seule fois
  const loadedPlayerMap = useRef(false);
  const loadedClubMap = useRef(false);

  // ----- CHARGEMENT MAPPING joueurs/clubs -----
  const fetchPlayerMap = async () => {
    if (loadedPlayerMap.current) return playerMap;
    const resp = await fetch(PLAYER_MAPPING_URL);
    const data = await resp.json();
    setPlayerMap(data);
    loadedPlayerMap.current = true;
    return data;
  };
  const fetchClubMap = async () => {
    if (loadedClubMap.current) return clubMap;
    const resp = await fetch(CLUB_MAPPING_URL);
    const data = await resp.json();
    setClubMap(data);
    loadedClubMap.current = true;
    return data;
  };

  // ----- SCOUTING JOUEUR -----
  const fetchPlayer = async () => {
    setErrPlayer("");
    setPlayerInfo(null);
    setLoadingPlayer(true);
    try {
      const playerMapData = await fetchPlayerMap();
      const api = await fetch(`https://services.soccerverse.com/api/players/detailed?player_id=${playerId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErrPlayer("Aucun joueur trouvé pour cet ID.");
        setLoadingPlayer(false);
        return;
      }
      const playerApi = j.items[0];
      const playerRincon = playerMapData[playerId] ?? {};
      let nom = playerRincon.name || "";
      if (!nom && (playerRincon.f || playerRincon.s))
        nom = `${playerRincon.f ?? ""} ${playerRincon.s ?? ""}`.trim();
      setPlayerInfo({ ...playerApi, nom });
    } catch (e) {
      setErrPlayer("Erreur réseau ou parsing données.");
    } finally {
      setLoadingPlayer(false);
    }
  };

  // ----- SCOUTING CLUB -----
  const fetchClub = async () => {
    setErrClub("");
    setClubInfo(null);
    setLoadingClub(true);
    try {
      const clubMapData = await fetchClubMap();
      const api = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErrClub("Aucun club trouvé pour cet ID.");
        setLoadingClub(false);
        return;
      }
      const clubApi = j.items[0];
      // Ajout du nom local si besoin
      setClubInfo({
        ...clubApi,
        name: clubApi.name || clubMapData[clubId]?.name || "-"
      });
    } catch (e) {
      setErrClub("Erreur réseau ou parsing données.");
    } finally {
      setLoadingClub(false);
    }
  };

  // ----- SCOUTING CHAMPIONNAT -----
  const fetchTable = async () => {
    setErrLeague("");
    setStandings([]);
    setClubsDetails({});
    setLoadingLeague(true);
    try {
      await fetchClubMap();
      const api = await fetch(`https://services.soccerverse.com/api/league_tables?league_id=${leagueId}`);
      const j = await api.json();
      if (!Array.isArray(j) || j.length === 0) {
        setErrLeague("Aucun championnat trouvé ou aucune équipe.");
        setLoadingLeague(false);
        return;
      }
      setStandings(j.sort((a, b) => b.pts - a.pts));
      setTimeout(() => fetchAllClubsDetails(j.map(c => c.club_id)), 100);
    } catch (e) {
      setErrLeague("Erreur réseau ou parsing données.");
    } finally {
      setLoadingLeague(false);
    }
  };
  // Charge stats avancées pour tous les clubs du classement
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

  return (
    <div style={{ minHeight: "100vh", background: "#181c21", color: "#f6f6f7", fontFamily: "Inter, Arial, sans-serif", paddingTop: 60 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32 }}>
        <button onClick={() => setTab("player")}
          style={{
            fontWeight: 800, fontSize: 17, border: "none", borderRadius: 10, padding: "12px 34px",
            background: tab === "player" ? "#21252b" : "#23272e", color: tab === "player" ? "#3fcf60" : "#ccc",
            boxShadow: tab === "player" ? "0 4px 16px #0d8bff22" : "none", cursor: "pointer"
          }}>Joueur</button>
        <button onClick={() => setTab("club")}
          style={{
            fontWeight: 800, fontSize: 17, border: "none", borderRadius: 10, padding: "12px 34px",
            background: tab === "club" ? "#21252b" : "#23272e", color: tab === "club" ? "#3fcf60" : "#ccc",
            boxShadow: tab === "club" ? "0 4px 16px #0d8bff22" : "none", cursor: "pointer"
          }}>Club</button>
        <button onClick={() => setTab("league")}
          style={{
            fontWeight: 800, fontSize: 17, border: "none", borderRadius: 10, padding: "12px 34px",
            background: tab === "league" ? "#21252b" : "#23272e", color: tab === "league" ? "#3fcf60" : "#ccc",
            boxShadow: tab === "league" ? "0 4px 16px #0d8bff22" : "none", cursor: "pointer"
          }}>Championnat</button>
      </div>

      {/* -------- JOUEUR -------- */}
      {tab === "player" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Zone de recherche */}
          <div style={{ background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008", width: "100%", maxWidth: 520, marginBottom: 34 }}>
            <label style={{ fontWeight: 600, fontSize: 17 }}>ID Joueur :</label>
            <input type="number" value={playerId} onChange={e => setPlayerId(e.target.value)}
              style={{
                width: "100%", margin: "12px 0 16px 0", padding: "12px 16px", borderRadius: 6,
                border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
              }}
              placeholder="Ex : 17" min={1}
            />
            <button onClick={fetchPlayer} disabled={loadingPlayer || !playerId}
              style={{
                background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
                border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
                cursor: loadingPlayer || !playerId ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
              }}
            >{loadingPlayer ? "Recherche..." : "Afficher infos"}</button>
            {errPlayer && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{errPlayer}</div>}
          </div>
          {playerInfo && (
            <div style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 32, marginBottom: 32 }}>
              {/* Infos joueur */}
              <div style={{
                flex: "1 1 0", minWidth: 330, maxWidth: 450, background: "#181d23",
                borderRadius: 14, padding: 28, boxShadow: "0 2px 8px #0003"
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
                <button onClick={() => setShowPlayerDetails(!showPlayerDetails)}
                  style={{
                    background: "#222", color: "#ffd700", fontWeight: 600, fontSize: 16, border: "none",
                    borderRadius: 5, marginTop: 16, padding: "8px 22px", cursor: "pointer"
                  }}>{showPlayerDetails ? "Masquer les détails" : "Afficher les détails"}</button>
                {showPlayerDetails && (
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
                flex: "2 1 0", minWidth: 350, background: "#181d23", borderRadius: 14, padding: 0,
                boxShadow: "0 2px 8px #0003", marginLeft: 0, display: "flex", flexDirection: "column"
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
          )}
        </div>
      )}

      {/* -------- CLUB -------- */}
      {tab === "club" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Recherche */}
          <div style={{ background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008", width: "100%", maxWidth: 520, marginBottom: 34 }}>
            <label style={{ fontWeight: 600, fontSize: 17 }}>ID Club :</label>
            <input type="number" value={clubId} onChange={e => setClubId(e.target.value)}
              style={{
                width: "100%", margin: "12px 0 16px 0", padding: "12px 16px", borderRadius: 6,
                border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
              }}
              placeholder="Ex : 5902" min={1}
            />
            <button onClick={fetchClub} disabled={loadingClub || !clubId}
              style={{
                background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
                border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
                cursor: loadingClub || !clubId ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
              }}
            >{loadingClub ? "Recherche..." : "Afficher infos"}</button>
            {errClub && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{errClub}</div>}
          </div>
          {clubInfo && (
            <div style={{
              width: "100%", maxWidth: 1000, margin: "0 auto", background: "#181d23", borderRadius: 14,
              padding: 28, boxShadow: "0 2px 8px #0003"
            }}>
              <div style={{ fontSize: 14, color: "#ffd700", fontWeight: 500, marginBottom: 10 }}>Toutes les valeurs sont en SVC</div>
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
              <button onClick={() => setShowClubDetails(!showClubDetails)}
                style={{
                  background: "#222", color: "#ffd700", fontWeight: 600, fontSize: 16, border: "none",
                  borderRadius: 5, marginTop: 18, padding: "8px 22px", cursor: "pointer"
                }}>{showClubDetails ? "Masquer les détails" : "Afficher les détails"}</button>
              {showClubDetails && (
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
            </div>
          )}
        </div>
      )}

      {/* -------- CHAMPIONNAT -------- */}
      {tab === "league" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008", width: "100%", maxWidth: 520, marginBottom: 34 }}>
            <label style={{ fontWeight: 600, fontSize: 17 }}>ID Championnat (league_id) :</label>
            <input type="number" value={leagueId} onChange={e => setLeagueId(e.target.value)}
              style={{
                width: "100%", margin: "12px 0 16px 0", padding: "12px 16px", borderRadius: 6,
                border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
              }}
              placeholder="Ex : 549" min={1}
            />
            <button onClick={fetchTable} disabled={loadingLeague || !leagueId}
              style={{
                background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
                border: "none", borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 17,
                cursor: loadingLeague || !leagueId ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
              }}
            >{loadingLeague ? "Recherche..." : detailsLoading ? "Chargement stats clubs..." : "Afficher classement"}</button>
            {errLeague && <div style={{ color: "#ff4e5e", marginTop: 15, fontWeight: 600 }}>{errLeague}</div>}
          </div>
          {standings.length > 0 && (
            <div style={{ width: "100%", maxWidth: 1200, background: "#181d23", borderRadius: 16, padding: 18, marginBottom: 30, boxShadow: "0 2px 8px #0003" }}>
              <div style={{ fontSize: 17, color: "#ffd700", fontWeight: 500, marginBottom: 12 }}>
                Classement {standings[0].division ? `(Division ${standings[0].division})` : ""}
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
      )}
    </div>
  );
}
