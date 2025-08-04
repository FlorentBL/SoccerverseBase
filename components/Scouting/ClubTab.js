import React, { useState, useRef, useEffect } from "react";

const PLAYER_MAPPING_URL = "/player_mapping.json";
const LEAGUE_MAPPING_URL = "/league_mapping.json";
const SQUAD_RPC_URL = "https://gsppub.soccerverse.io/";

const LOCALES = { fr: "fr-FR", en: "en-US", it: "it-IT" };

const T = {
  fr: {
    idLabel: "ID Club :",
    idPlaceholder: "Ex : 5902",
    showInfo: "Afficher infos",
    searching: "Recherche...",
    errorNotFound: "Aucun club trouvé pour cet ID.",
    errorNetwork: "Erreur réseau ou parsing données.",
    squadLoading: "Chargement effectif...",
    squadError: "Aucun joueur trouvé dans l'effectif.",
    squadErrorNetwork: "Erreur réseau ou parsing effectif.",
    manager: "Manager",
    division: "Division",
    fans: "Fans",
    balance: "Balance",
    stadium: "Stade",
    value: "Valeur",
    avgWage: "Salaire moyen",
    league: "League",
    teamRating: "⭑ Rating équipe",
    top21: "⭑ Top 21",
    shooting: "🏹 Shooting",
    passing: "🎯 Passing",
    tackling: "🛡️ Tackling",
    gk: "🧤 GK",
    topInfluencers: "Top Influenceurs",
    squadTitle: "Effectif du Club",
    columns: {
      name: "Nom",
      positions: "Pos.",
      rating: "Note",
      rating_gk: "GK",
      rating_tackling: "Tac.",
      rating_passing: "Pas.",
      rating_shooting: "Tir",
      age: "Âge",
      form: "Forme",
      matches: "Matchs",
      goals: "Buts",
      assists: "Passes décisives",
      value: "Valeur",
      wages: "Salaire",
      morale: "Morale",
      agent_name: "Agent",
      contract: "Contrat",
      cartons: "Cartons",
      country_id: "Pays",
    },
    moraleGood: "Bonne morale",
    moraleNeutral: "Morale neutre",
    moraleBad: "Mauvaise morale",
  },
  en: {
    idLabel: "Club ID:",
    idPlaceholder: "Eg: 5902",
    showInfo: "Show info",
    searching: "Searching...",
    errorNotFound: "No club found for this ID.",
    errorNetwork: "Network or parsing error.",
    squadLoading: "Loading squad...",
    squadError: "No players found in the squad.",
    squadErrorNetwork: "Network or squad parsing error.",
    manager: "Manager",
    division: "Division",
    fans: "Fans",
    balance: "Balance",
    stadium: "Stadium",
    value: "Value",
    avgWage: "Avg wage",
    league: "League",
    teamRating: "⭑ Team rating",
    top21: "⭑ Top 21",
    shooting: "🏹 Shooting",
    passing: "🎯 Passing",
    tackling: "🛡️ Tackling",
    gk: "🧤 GK",
    topInfluencers: "Top Influencers",
    squadTitle: "Club Squad",
    columns: {
      name: "Name",
      positions: "Pos.",
      rating: "Rating",
      rating_gk: "GK",
      rating_tackling: "Tackling",
      rating_passing: "Passing",
      rating_shooting: "Shooting",
      age: "Age",
      form: "Form",
      matches: "Matches",
      goals: "Goals",
      assists: "Assists",
      value: "Value",
      wages: "Wages",
      morale: "Morale",
      agent_name: "Agent",
      contract: "Contract",
      cartons: "Cards",
      country_id: "Country",
    },
    moraleGood: "Good morale",
    moraleNeutral: "Neutral morale",
    moraleBad: "Bad morale",
  },
  it: {
    idLabel: "ID Club:",
    idPlaceholder: "Es: 5902",
    showInfo: "Mostra info",
    searching: "Ricerca...",
    errorNotFound: "Nessun club trovato per questo ID.",
    errorNetwork: "Errore di rete o di parsing.",
    squadLoading: "Caricamento rosa...",
    squadError: "Nessun giocatore trovato nella rosa.",
    squadErrorNetwork: "Errore di rete o di parsing rosa.",
    manager: "Manager",
    division: "Divisione",
    fans: "Tifosi",
    balance: "Bilancio",
    stadium: "Stadio",
    value: "Valore",
    avgWage: "Salario medio",
    league: "Lega",
    teamRating: "⭑ Valutazione squadra",
    top21: "⭑ Top 21",
    shooting: "🏹 Tiro",
    passing: "🎯 Passaggi",
    tackling: "🛡️ Contrasto",
    gk: "🧤 Portiere",
    topInfluencers: "Top Influencer",
    squadTitle: "Rosa del club",
    columns: {
      name: "Nome",
      positions: "Pos.",
      rating: "Valut.",
      rating_gk: "GK",
      rating_tackling: "Contr.",
      rating_passing: "Pass.",
      rating_shooting: "Tiro",
      age: "Età",
      form: "Forma",
      matches: "Partite",
      goals: "Gol",
      assists: "Assist",
      value: "Valore",
      wages: "Salario",
      morale: "Morale",
      agent_name: "Agente",
      contract: "Contratto",
      cartons: "Cartellini",
      country_id: "Paese",
    },
    moraleGood: "Buona morale",
    moraleNeutral: "Morale neutro",
    moraleBad: "Cattiva morale",
  },
};

const SOCCERVERSE_POSITIONS_ORDER = [
  "GK", "LB", "CB", "RB",
  "DML", "DMR", "DMC",
  "LM", "CM", "RM",
  "AML", "AMR", "AM",
  "FL", "FC", "FR"
];
const POSITION_COLORS = {
  GK: "#b891ff", CB: "#8ac8e9", LB: "#e3d267", RB: "#e3d267",
  DML: "#ffd700", DMR: "#ffd700", DMC: "#ffd700",
  CM: "#82e0aa", LM: "#ffd17e", RM: "#ffd17e",
  AM: "#b2bcf5", AML: "#b2bcf5", AMR: "#b2bcf5",
  FC: "#ffb347", FL: "#ffb347", FR: "#ffb347"
};
function getPositionColor(label) {
  if (!label) return "#fff";
  return POSITION_COLORS[label] || "#fff";
}
function formatSVC(val, lang) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (
    <span style={{ color: "#00ffd0", fontWeight: 700 }}>
      {(val / 10000).toLocaleString(LOCALES[lang] || LOCALES.fr, { maximumFractionDigits: 0 })} SVC
    </span>
  );
}
function formatDate(ts, lang) {
  if (!ts || isNaN(ts)) return "-";
  const d = new Date(ts * 1000);
  const locale = LOCALES[lang] || LOCALES.fr;
  return d.toLocaleDateString(locale) + " " + d.toLocaleTimeString(locale);
}
function sortSquad(arr, key, asc = false) {
  return arr.slice().sort((a, b) => {
    if (key === "positions") {
      const av = SOCCERVERSE_POSITIONS_ORDER.indexOf((a.positionsArr && a.positionsArr[0]) || "");
      const bv = SOCCERVERSE_POSITIONS_ORDER.indexOf((b.positionsArr && b.positionsArr[0]) || "");
      return asc ? av - bv : bv - av;
    }
    const av = a[key], bv = b[key];
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
    return asc ? ("" + av).localeCompare("" + bv) : ("" + bv).localeCompare("" + av);
  });
}
function renderMorale(morale, t) {
  let color = "#b0b8cc";
  if (morale === 1) color = "#19e36d";
  else if (morale === 0) color = "#ffd700";
  else if (morale === -1) color = "#ff4e5e";
  return (
    <span style={{
      display: "inline-block",
      width: 16, height: 16,
      borderRadius: "50%",
      background: color,
      border: "2px solid #23242e",
      verticalAlign: "middle"
    }} title={morale === 1 ? t.moraleGood : morale === 0 ? t.moraleNeutral : t.moraleBad}></span>
  );
}


export default function ClubTab({ lang = "fr" }) {
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
  const t = T[lang] || T.fr;

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

  // FETCH PRINCIPAL CLUB + EFFECTIF + POSITIONS
  const fetchClub = async () => {
    setErr(""); setClubInfo(null); setLoading(true); setSquad([]); setSquadErr("");
    try {
      const api = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      const j = await api.json();
      if (!j.items || j.items.length === 0) {
        setErr(t.errorNotFound); setLoading(false); return;
      }
      const clubApi = j.items[0];
      setClubInfo(clubApi);
      await fetchSquad(clubId);
    } catch (e) {
      setErr(t.errorNetwork);
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
        // Fetch detailed positions and season stats
        const detailedSquad = await Promise.all(
          data.result.data.map(async p => {
            try {
              const [detailResp, statsResp] = await Promise.all([
                fetch(`https://services.soccerverse.com/api/players/detailed?player_id=${p.player_id}`),
                fetch(SQUAD_RPC_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "get_league_player_data",
                    params: { player_id: p.player_id },
                    id: p.player_id
                  })
                })
              ]);
              const detail = await detailResp.json();
              const statsJson = await statsResp.json();
              const positionsArr = (detail.items && detail.items[0]?.positions) || [];
              const stats = statsJson.result?.data?.[0] || {};
              return {
                ...p,
                positionsArr,
                matches: stats.apearances ?? 0,
                goals: stats.goals ?? 0,
                assists: stats.assists ?? 0,
              };
            } catch (e) {
              return { ...p, positionsArr: [], matches: 0, goals: 0, assists: 0 };
            }
          })
        );
        setSquad(detailedSquad);
      } else {
        setSquadErr(t.squadError);
      }
    } catch (e) {
      setSquadErr(t.squadErrorNetwork);
    } finally { setSquadLoading(false); }
  };

  function getLeagueLabel(id) {
    return leagueMap?.[id]?.name || id || "-";
  }

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
              {t.manager} : <span style={{ color: "#fff", fontWeight: 700 }}>{clubInfo.manager_name}</span>
              <span style={{ color: "#ffd700", marginLeft: 11, fontWeight: 700 }}>{clubInfo.country_id}</span>
              <span style={{ color: "#b0b8cc", marginLeft: 11 }}>| ID:
                <a href={`https://play.soccerverse.com/club/${clubInfo.club_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#4f47ff", fontWeight: 700, marginLeft: 3, textDecoration: "underline" }}>{clubInfo.club_id}</a>
              </span>
              <span style={{ color: "#b0b8cc", marginLeft: 8 }}>• {t.division}:
                <a href={`https://play.soccerverse.com/league/${clubInfo.league_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#ffd700", fontWeight: 700, marginLeft: 3, textDecoration: "underline" }}>{getLeagueLabel(clubInfo.league_id)}</a>
              </span>
              <span style={{ color: "#b0b8cc", marginLeft: 8 }}>• {t.fans}: <span style={{ color: "#ffd700" }}>{clubInfo.fans_current}</span></span>
            </div>
          </div>
          <div style={{ minWidth: 150, textAlign: "right", alignSelf: "flex-start" }}>
            <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 21 }}>{t.balance}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#ffd700" }}>{formatSVC(clubInfo.balance, lang)}</div>
            <div style={{ color: "#ddd", fontWeight: 600, fontSize: 14, marginTop: 5 }}>{t.stadium}</div>
            <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 18 }}>{clubInfo.stadium_size_current}</div>
          </div>
        </div>
        <div style={{
          display: "flex", gap: 20, marginTop: 9, alignItems: "center", flexWrap: "wrap"
        }}>
          <div>
            <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 15 }}>{t.value}</div>
            <div style={{ fontWeight: 900, color: "#ffd700", fontSize: 18 }}>{formatSVC(clubInfo.value, lang)}</div>
          </div>
          <div>
            <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 15 }}>{t.avgWage}</div>
            <div style={{ fontWeight: 900, color: "#ffd700", fontSize: 17 }}>{formatSVC(clubInfo.avg_wages, lang)}</div>
          </div>
          <div>
            <div style={{ color: "#b2bcf5", fontWeight: 700, fontSize: 15 }}>{t.league}</div>
            <div style={{ fontWeight: 800, color: "#ffd700", fontSize: 17 }}>{getLeagueLabel(clubInfo.league_id)}</div>
          </div>
          <div style={{
            display: "flex", gap: 11, alignItems: "center", flexWrap: "nowrap", marginLeft: 28
          }}>
            {[
              [t.teamRating, clubInfo.avg_player_rating],
              [t.top21, clubInfo.avg_player_rating_top21],
              [t.shooting, clubInfo.avg_shooting],
              [t.passing, clubInfo.avg_passing],
              [t.tackling, clubInfo.avg_tackling],
              [t.gk, clubInfo.gk_rating],
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
        {clubInfo.top_influencers && clubInfo.top_influencers.length > 0 && (
          <div style={{ marginTop: 10, width: "100%" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#4f47ff", marginBottom: 6 }}>{t.topInfluencers}</div>
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
                    {inf.last_active_unix ? formatDate(inf.last_active_unix, lang) : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSquadTable() {
    if (squadLoading) return <div style={{ color: "#ffd700", fontWeight: 500, margin: 12 }}>{t.squadLoading}</div>;
    if (squadErr) return <div style={{ color: "#ff4e5e", margin: 12 }}>{squadErr}</div>;
    if (!squad || squad.length === 0) return null;

    const BASE_COLUMNS = [
      { key: "name" },
      { key: "positions" },
      { key: "rating" },
      { key: "rating_gk" },
      { key: "rating_tackling" },
      { key: "rating_passing" },
      { key: "rating_shooting" },
      { key: "age" },
      { key: "form" },
      { key: "matches" },
      { key: "goals" },
      { key: "assists" },
      { key: "value" },
      { key: "wages" },
      { key: "morale" },
      { key: "agent_name" },
      { key: "contract" },
      { key: "cartons" },
      { key: "country_id" },
    ];
    const COLUMNS = BASE_COLUMNS.map(c => ({ ...c, label: t.columns[c.key] }));
    const NUMERIC_COLS = new Set([
      "rating",
      "rating_gk",
      "rating_tackling",
      "rating_passing",
      "rating_shooting",
      "age",
      "form",
      "matches",
      "goals",
      "assists",
      "value",
      "wages",
      "morale",
      "contract",
      "cartons",
    ]);

    let squadToShow = squad.map(p => {
      let principal = p.positionsArr && p.positionsArr[0] || "-";
      let secondaires = (p.positionsArr || []).slice(1);
      const isGK = principal === "GK";
      return {
        ...p,
        name: playerMap?.[p.player_id]?.name || p.player_id,
        principal,
        secondaires,
        positions: p.positionsArr ? p.positionsArr.join(", ") : "-",
        age: p.dob ? (2025 - new Date(p.dob * 1000).getFullYear()) : "-",
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
        }}>{t.squadTitle}</div>
        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 600 }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#fff",
            fontSize: 16,
            minWidth: 1100,
            whiteSpace: "nowrap"
          }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
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
                      whiteSpace: "nowrap", textAlign: NUMERIC_COLS.has(col.key) ? "center" : "left", fontWeight: 800, fontSize: 16
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
                      if (col.key === "rating_gk")
                        return (
                          <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap", textAlign: "center", fontWeight: 900, color: isGK ? "#b891ff" : "#888" }}>
                            {isGK ? (p.rating_gk ?? "-") : "-"}
                          </td>
                        );
                      if (["rating_tackling", "rating_passing", "rating_shooting"].includes(col.key))
                        return (
                          <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap", textAlign: "center", fontWeight: 900 }}>
                            {!isGK ? (p[col.key] ?? "-") : "-"}
                          </td>
                        );
                      if (col.key === "morale") {
                        return (
                          <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap", textAlign: "center" }}>
                            {renderMorale(p.morale, t)}
                          </td>
                        );
                      }
                      if (col.key === "rating") {
                        return (
                          <td key={col.key} style={{
                            padding: "7px",
                            fontWeight: 900,
                            color: (p.rating >= 75 ? "#64ffae" : (p.rating < 65 ? "#ff7575" : "#fff")),
                            whiteSpace: "nowrap",
                            textAlign: "center"
                          }}>{p.rating ?? "-"}</td>
                        );
                      }
                      if (col.key === "value" || col.key === "wages") {
                        return (
                          <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap", textAlign: "center" }}>{formatSVC(p[col.key], lang)}</td>
                        );
                      }
                      return (
                        <td key={col.key} style={{ padding: "7px", whiteSpace: "nowrap", textAlign: NUMERIC_COLS.has(col.key) ? "center" : "left" }}>{p[col.key] ?? "-"}</td>
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
        <label style={{ fontWeight: 600, fontSize: 17 }}>{t.idLabel}</label>
        <input type="number" value={clubId} onChange={e => setClubId(e.target.value)}
          style={{
            width: "100%", margin: "12px 0 14px 0", padding: "11px 16px", borderRadius: 6,
            border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none"
          }}
          placeholder={t.idPlaceholder} min={1}
        />
        <button onClick={fetchClub} disabled={loading || !clubId}
          style={{
            background: "linear-gradient(90deg, #4f47ff, #0d8bff)", color: "#fff",
            border: "none", borderRadius: 6, padding: "10px 26px", fontWeight: 700, fontSize: 16,
            cursor: loading || !clubId ? "not-allowed" : "pointer", boxShadow: "0 1px 5px #0004"
          }}
        >{loading ? t.searching : t.showInfo}</button>
        {err && <div style={{ color: "#ff4e5e", marginTop: 13, fontWeight: 600 }}>{err}</div>}
      </div>
      {clubInfo && renderClubCard()}
      {clubInfo && renderSquadTable()}
    </div>
  );
}
