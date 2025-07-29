"use client";
import React, { useState } from "react";
const RINCON_URL = "/rincon_mapping.json";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  // Affichage sans unité, séparateur milliers
  return val % 1
    ? val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : val.toLocaleString("fr-FR");
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
    <div className="min-h-screen bg-[#181c21] text-gray-100 font-sans flex flex-col items-center pt-14 px-2">
      <h2 className="font-extrabold text-3xl md:text-4xl mb-10 text-center tracking-wide">
        <span className="text-green-400">Soccerverse</span> &ndash; Scouting Joueur
      </h2>

      <div className="w-full max-w-3xl flex flex-col gap-8">

        {/* Recherche joueur */}
        <div className="bg-[#21252b] rounded-2xl shadow-xl p-6 md:p-8 mx-auto w-full max-w-lg flex flex-col items-center">
          <label className="font-bold text-lg mb-2 w-full text-left">ID Joueur :</label>
          <input
            type="number"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            className="w-full mb-5 p-3 rounded-lg bg-[#181d23] text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-mono text-lg"
            placeholder="Ex : 17"
            min={1}
            autoFocus
          />
          <button
            onClick={fetchPlayer}
            disabled={loading || !playerId}
            className={`w-full py-3 rounded-lg font-bold text-lg shadow transition 
              ${loading || !playerId
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-green-500 hover:opacity-90 cursor-pointer"
              }`}
          >
            {loading ? "Recherche..." : "Afficher infos"}
          </button>
          {err && <div className="text-red-400 font-bold mt-5">{err}</div>}
        </div>

        {/* Résultat scouting */}
        {playerInfo && (
          <div className="flex flex-col md:flex-row gap-8 w-full">

            {/* Infos joueur */}
            <div className="flex-1 bg-[#191f25] rounded-2xl shadow-lg p-7">
              <div className="text-xs mb-2 text-green-400 font-semibold tracking-wide">
                Toutes les valeurs sont en SVC (Soccerverse Coin)
              </div>
              <table className="w-full text-[17px] leading-snug mb-3">
                <tbody>
                  <tr>
                    <td className="font-bold pr-2 py-2 text-gray-300">Nom</td>
                    <td className="py-2">{playerInfo.nom || <span className="text-yellow-300">Non dispo</span>}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 py-2 text-gray-300">Âge</td>
                    <td className="py-2">{playerInfo.age || "-"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 py-2 text-gray-300">Club</td>
                    <td className="py-2">{playerInfo.club || playerInfo.club_id || "-"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 py-2 text-gray-300">Position(s)</td>
                    <td className="py-2">{Array.isArray(playerInfo.positions) ? playerInfo.positions.join(", ") : playerInfo.positions || "-"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 py-2 text-gray-300">Note</td>
                    <td className="py-2">{playerInfo.rating || "-"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 py-2 text-gray-300">Valeur</td>
                    <td className="py-2">{playerInfo.value !== undefined ? `${formatSVC(playerInfo.value)} SVC` : "-"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-2 py-2 text-gray-300">Salaire</td>
                    <td className="py-2">{playerInfo.wages !== undefined ? `${formatSVC(playerInfo.wages)} SVC` : "-"}</td>
                  </tr>
                </tbody>
              </table>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full mt-2 py-2 rounded font-semibold text-md bg-[#242a32] hover:bg-[#242f3a] text-yellow-300 transition"
              >
                {showDetails ? "Masquer les détails" : "Afficher plus de détails"}
              </button>
              {showDetails && (
                <table className="w-full mt-4 text-[15px] text-gray-400">
                  <tbody>
                    <tr><td className="font-bold pr-2 py-1">Player ID</td><td>{playerInfo.player_id}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Pays</td><td>{playerInfo.country || playerInfo.country_id || "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Rating GK</td><td>{playerInfo.rating_gk || "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Tackling</td><td>{playerInfo.rating_tackling || "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Passing</td><td>{playerInfo.rating_passing || "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Shooting</td><td>{playerInfo.rating_shooting || "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Stamina</td><td>{playerInfo.rating_stamina || "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Aggression</td><td>{playerInfo.rating_aggression || "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Fitness</td><td>{playerInfo.fitness ?? "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Blessé ?</td><td>{playerInfo.injured ? "Oui" : "Non"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Moral</td><td>{playerInfo.morale ?? "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Contrat</td><td>{playerInfo.contract ?? "-"}</td></tr>
                    <tr><td className="font-bold pr-2 py-1">Dernier prix</td><td>{playerInfo.last_price !== undefined ? `${formatSVC(playerInfo.last_price)} SVC` : "-"}</td></tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Analyse externe */}
            <div className="flex-1 min-w-[300px] bg-[#191f25] rounded-2xl shadow-lg overflow-hidden flex flex-col">
              <div className="text-base font-bold text-blue-400 bg-[#20252e] px-5 py-3">
                Analyse SoccerRatings.org
              </div>
              <iframe
                src={`https://soccerratings.org/player/${playerId}`}
                className="w-full min-h-[340px] md:min-h-[650px] bg-[#1b2028] border-none"
                title="Soccer Ratings"
                sandbox="allow-same-origin allow-scripts allow-popups"
                style={{ borderRadius: "0 0 16px 16px" }}
              />
              <div className="mt-0 text-center p-3">
                <a
                  href={`https://soccerratings.org/player/${playerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg px-6 py-2 font-bold text-md hover:opacity-90"
                >
                  Ouvrir sur SoccerRatings.org
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
