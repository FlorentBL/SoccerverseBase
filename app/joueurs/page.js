"use client";

import React, { useState } from "react";

// Fichier mapping local (généré via l’outil précédent et placé dans /public)
const RINCON_URL = "/rincon_mapping.json";

// Conversion Soccerverse brut → SVC affichable
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

  // Chargement du mapping (lookup direct)
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
      // Appel Soccerverse API détaillé
      const api = await fetch(`https://services.soccerverse.com/api/players/detailed?player_id=${playerId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErr("Aucun joueur trouvé pour cet ID.");
        setLoading(false);
        return;
      }
      const playerApi = j.items[0];
      // Lookup rapide dans le mapping local (clé = playerId en string)
      const rincon = await fetchRincon();
      const playerRincon = rincon[playerId] ?? {};
      // Ajout du nom complet si dispo (ex: playerRincon.name ou fusion prenom/nom)
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
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      paddingTop: 48, fontFamily: "Inter, Arial, sans-serif"
    }}>
      <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 24, letterSpacing: 1 }}>
        Scouting Soccerverse (détail)
      </h2>
      <div style={{
        background: "#23272e", padding: 28, borderRadius: 12, boxShadow: "0 2px 12px #0008",
        minWidth: 340, maxWidth: 520,
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
        {playerInfo && (
          <div style={{
            marginTop: 28, background: "#181d23", borderRadius: 10, padding: 18, boxShadow: "0 2px 8px #0003"
          }}>
            <div style={{
              fontSize: 14, color: "#ffd700", fontWeight: 500, marginBottom: 6
            }}>
              Toutes les valeurs sont en SVC
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 16 }}>
              <tbody>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Nom</td><td style={{ padding: 5 }}>{playerInfo.nom || <span style={{ color: "#ff6" }}>Non dispo</span>}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Player ID</td><td style={{ padding: 5 }}>{playerInfo.player_id}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Âge</td><td style={{ padding: 5 }}>{playerInfo.age || "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Club</td><td style={{ padding: 5 }}>{playerInfo.club || playerInfo.club_id || "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Positions</td><td style={{ padding: 5 }}>{Array.isArray(playerInfo.positions) ? playerInfo.positions.join(", ") : playerInfo.positions || "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Pays</td><td style={{ padding: 5 }}>{playerInfo.country || playerInfo.country_id || "-"}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Note (overall)</td><td style={{ padding: 5 }}>{playerInfo.rating || "-"}</td></tr>
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
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Valeur</td><td style={{ padding: 5 }}>{formatSVC(playerInfo.value)}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Salaire</td><td style={{ padding: 5 }}>{formatSVC(playerInfo.wages)}</td></tr>
                <tr><td style={{ fontWeight: 700, padding: 5 }}>Dernier prix</td><td style={{ padding: 5 }}>{formatSVC(playerInfo.last_price)}</td></tr>
                {/* Ajoute tout champ voulu ici */}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
