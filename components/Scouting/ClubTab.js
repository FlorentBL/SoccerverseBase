import React, { useState, useRef, useEffect } from "react";

/** ---------------- CONFIG / CONST ---------------- **/
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
  "LM", "RM", "CM",
  "AML", "AMR", "AMC",
  "FL", "FC", "FR"
];

const POSITION_COLORS = {
  GK: "#b891ff", CB: "#8ac8e9", LB: "#e3d267", RB: "#e3d267",
  DML: "#ffd700", DMR: "#ffd700", DMC: "#ffd700",
  CM: "#82e0aa", LM: "#ffd17e", RM: "#ffd17e",
  AM: "#b2bcf5", AML: "#b2bcf5", AMR: "#b2bcf5",
  FC: "#ffb347", FL: "#ffb347", FR: "#ffb347"
};

/** ---------- Small UI helpers (zero dependency) ---------- **/
const styles = {
  page: {
    maxWidth: 1500,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 14px 40px",
  },
  panel: {
    background: "linear-gradient(180deg, #1c1f2b 0%, #171923 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
    borderRadius: 16,
  },
  glass: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    borderRadius: 18,
  },
  button: {
    padding: "10px 16px",
    borderRadius: 12,
    fontWeight: 800,
    border: "1px solid #2b2f44",
    background: "linear-gradient(180deg, #3a39ff 0%, #2a29c9 100%)",
    color: "#fff",
    boxShadow: "0 6px 16px rgba(79,71,255,0.35)",
    transition: "transform .06s ease, box-shadow .2s ease, opacity .2s ease",
  },
  input: {
    width: "100%",
    appearance: "textfield",
    background: "#10131a",
    border: "1px solid #2b2f44",
    color: "#e9ecf5",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 700,
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 14,
    lineHeight: 1,
    background: "#1a1d2b",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 10,
    background: "#232644",
    color: "#ffd700",
    fontWeight: 800,
    fontSize: 15,
    border: "1px solid rgba(255,255,255,0.06)",
  },
};

function getPositionColor(label) {
  if (!label) return "#fff";
  return POSITION_COLORS[label] || "#fff";
}
function formatSVC(val, lang) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (
    <span style={{ color: "#00ffd0", fontWeight: 800 }}>
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
    <span
      aria-label={
        morale === 1 ? t.moraleGood : morale === 0 ? t.moraleNeutral : t.moraleBad
      }
      title={morale === 1 ? t.moraleGood : morale === 0 ? t.moraleNeutral : t.moraleBad}
      style={{
        display: "inline-block",
        width: 14, height: 14,
        borderRadius: "50%",
        background: color,
        border: "2px solid #23242e",
        verticalAlign: "middle",
      }}
    />
  );
}

/** ---------------- COMPONENT ---------------- **/
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
    try {
      const resp = await fetch(PLAYER_MAPPING_URL);
      const data = await resp.json();
      setPlayerMap(data);
      loadedPlayerMap.current = true;
      return data;
    } catch {
      // silencieux: pas bloquant pour l’UI
      return {};
    }
  };
  const fetchLeagueMap = async () => {
    try {
      const resp = await fetch(LEAGUE_MAPPING_URL);
      const data = await resp.json();
      setLeagueMap(data);
    } catch {
      setLeagueMap({});
    }
  };

  // FETCH PRINCIPAL
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

  // EFFECTIF + POSITIONS + STATS
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
            } catch {
              return { ...p, positionsArr: [], matches: 0, goals: 0, assists: 0 };
            }
          })
        );
        setSquad(detailedSquad);
      } else {
        setSquadErr(t.squadError);
      }
    } catch {
      setSquadErr(t.squadErrorNetwork);
    } finally { setSquadLoading(false); }
  };

  function getLeagueLabel(id) {
    return leagueMap?.[id]?.name || id || "-";
  }

  /** --------- UI SECTIONS --------- **/
  function SearchCard() {
    return (
      <div style={{ ...styles.panel, width: "100%", maxWidth: 560, padding: 22, marginBottom: 26 }}>
        <label style={{ fontWeight: 700, fontSize: 16, color: "#cbd3ff" }}>{t.idLabel}</label>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            type="number"
            value={clubId}
            onChange={e => setClubId(e.target.value)}
            placeholder={t.idPlaceholder}
            min={1}
            style={styles.input}
            aria-label={t.idLabel}
          />
          <button
            onClick={fetchClub}
            disabled={loading || !clubId}
            style={{
              ...styles.button,
              opacity: loading || !clubId ? 0.6 : 1,
              cursor: loading || !clubId ? "not-allowed" : "pointer",
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(.98)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loading ? t.searching : t.showInfo}
          </button>
        </div>
        {err && <div style={{ color: "#ff6b7b", marginTop: 12, fontWeight: 700 }}>{err}</div>}
      </div>
    );
  }

  function ClubHeaderCard() {
    if (!clubInfo) return null;
    return (
      <div style={{
        ...styles.glass,
        width: "100%",
        maxWidth: 1200,
        padding: "24px 28px 16px",
        marginBottom: 22,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img
            src={clubInfo.profile_pic || "/default_profile.jpg"}
            alt="Club"
            style={{
              width: 72, height: 72, borderRadius: 18,
              border: "2px solid rgba(255,215,0,.6)", background: "#0c0f16",
              boxShadow: "0 8px 20px rgba(255,215,0,0.15)"
            }}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 900, fontSize: 28, color: "#f7f8ff", lineHeight: 1.05 }}>
              <a
                href={`https://play.soccerverse.com/club/${clubInfo.club_id}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#ffd700", textDecoration: "none", borderBottom: "2px solid #4f47ff", paddingBottom: 2 }}
              >
                {clubInfo.name}
              </a>
            </div>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, alignItems: "center"
            }}>
              <div style={styles.chip}>
                <span style={{ color: "#8ea3ff" }}>{t.manager}</span>
                <strong style={{ color: "#fff" }}>{clubInfo.manager_name}</strong>
              </div>
              <div style={styles.chip}>
                <span style={{ color: "#8ea3ff" }}>{t.division}</span>
                <a
                  href={`https://play.soccerverse.com/league/${clubInfo.league_id}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#ffd700", fontWeight: 900, textDecoration: "none" }}
                >
                  {getLeagueLabel(clubInfo.league_id)}
                </a>
              </div>
              <div style={styles.chip}>
                <span style={{ color: "#8ea3ff" }}>{t.fans}</span>
                <strong style={{ color: "#ffd700" }}>{clubInfo.fans_current}</strong>
              </div>
              <div style={styles.chip}>
                <span style={{ color: "#8ea3ff" }}>ID</span>
                <a
                  href={`https://play.soccerverse.com/club/${clubInfo.club_id}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#b0b8ff", fontWeight: 900, textDecoration: "none" }}
                >
                  #{clubInfo.club_id}
                </a>
              </div>
              <div style={styles.chip}>
                <span role="img" aria-label="country">🌍</span>
                <strong style={{ color: "#ffd700" }}>{clubInfo.country_id}</strong>
              </div>
            </div>
          </div>

          <div style={{ minWidth: 180, textAlign: "right" }}>
            <div style={{ color: "#9db1ff", fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: .8 }}>{t.balance}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#ffd700", marginTop: 2 }}>{formatSVC(clubInfo.balance, lang)}</div>
            <div style={{ color: "#9db1ff", fontWeight: 800, fontSize: 13, marginTop: 10 }}>{t.stadium}</div>
            <div style={{ color: "#e9ecf5", fontWeight: 900, fontSize: 16 }}>{clubInfo.stadium_size_current}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          {[
            [t.value, clubInfo.value],
            [t.avgWage, clubInfo.avg_wages],
            [t.league, getLeagueLabel(clubInfo.league_id)],
          ].map(([label, val], i) => (
            <div key={i} style={{ ...styles.pill }}>
              <span style={{ color: "#9db1ff", fontWeight: 700, marginRight: 6 }}>{label}</span>
              <span style={{ color: "#fff", fontWeight: 900 }}>
                {typeof val === "number" ? formatSVC(val, lang) : val}
              </span>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: 6 }}>
            {[
              [t.teamRating, clubInfo.avg_player_rating],
              [t.top21, clubInfo.avg_player_rating_top21],
              [t.shooting, clubInfo.avg_shooting],
              [t.passing, clubInfo.avg_passing],
              [t.tackling, clubInfo.avg_tackling],
              [t.gk, clubInfo.gk_rating],
            ].map(([label, val], i) => (
              <div key={i} style={{ ...styles.pill }}>
                <span style={{ opacity: .9 }}>{label}</span>
                <span style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginLeft: 6 }}>{val ?? "-"}</span>
              </div>
            ))}
          </div>
        </div>

        {clubInfo.top_influencers && clubInfo.top_influencers.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#cbd3ff", marginBottom: 8, letterSpacing: .4 }}>{t.topInfluencers}</div>
            <div style={{ display: "flex", flexDirection: "row", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
              {clubInfo.top_influencers.map((inf, i) => (
                <div key={i} style={{
                  ...styles.panel,
                  padding: "10px 16px",
                  minWidth: 140,
                  textAlign: "center",
                }}>
                  <img
                    src={inf.profile_pic || "/default_profile.jpg"}
                    alt={inf.name}
                    style={{
                      width: 44, height: 44, borderRadius: "50%",
                      objectFit: "cover", marginBottom: 6,
                      border: "2px solid #222"
                    }}
                  />
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{inf.name}</div>
                  <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 14 }}>{inf.num}</div>
                  <div style={{ fontSize: 11, color: "#9fb0c9", marginTop: 2 }}>
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

  function SquadTable() {
    if (squadLoading) {
      return (
        <div style={{ color: "#ffd700", fontWeight: 600, margin: 12 }}>
          {t.squadLoading}
        </div>
      );
    }
    if (squadErr) {
      return <div style={{ color: "#ff6b7b", margin: 12, fontWeight: 700 }}>{squadErr}</div>;
    }
    if (!squad || squad.length === 0) return null;

    const BASE_COLUMNS = [
      { key: "name" }, { key: "positions" }, { key: "rating" }, { key: "rating_gk" },
      { key: "rating_tackling" }, { key: "rating_passing" }, { key: "rating_shooting" },
      { key: "age" }, { key: "form" }, { key: "matches" }, { key: "goals" },
      { key: "assists" }, { key: "value" }, { key: "wages" }, { key: "morale" },
      { key: "agent_name" }, { key: "contract" }, { key: "cartons" }, { key: "country_id" },
    ];
    const COLUMNS = BASE_COLUMNS.map(c => ({ ...c, label: t.columns[c.key] }));
    const NUMERIC_COLS = new Set([
      "rating", "rating_gk", "rating_tackling", "rating_passing", "rating_shooting",
      "age", "form", "matches", "goals", "assists", "value", "wages",
      "morale", "contract", "cartons",
    ]);

    let squadToShow = squad.map(p => {
      const principal = (p.positionsArr && p.positionsArr[0]) || "-";
      const secondaires = (p.positionsArr || []).slice(1);
      return {
        ...p,
        name: playerMap?.[p.player_id]?.name || p.player_id,
        principal,
        secondaires,
        positions: p.positionsArr ? p.positionsArr.join(", ") : "-",
        age: p.dob ? (2025 - new Date(p.dob * 1000).getFullYear()) : "-",
        cartons: (p.yellow_cards || 0) + (p.red_cards ? " | " + p.red_cards : ""),
      };
    });
    squadToShow = sortSquad(squadToShow, sortKey, sortAsc);

    return (
      <div style={{
        ...styles.glass,
        width: "100%",
        maxWidth: 1450,
        padding: 12,
        marginBottom: 28,
      }}>
        <div style={{ fontWeight: 900, fontSize: 20, margin: "2px 6px 10px", color: "#f0f3ff" }}>
          {t.squadTitle}
        </div>
        <div style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: 620,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            color: "#e9ecf5",
            fontSize: 15.5,
            minWidth: 1120,
            whiteSpace: "nowrap",
          }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr style={{
                background: "linear-gradient(180deg, #121624 0%, #10131c 100%)",
              }}>
                {COLUMNS.map(col => {
                  const active = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => {
                        if (sortKey === col.key) setSortAsc(s => !s);
                        else { setSortKey(col.key); setSortAsc(false); }
                      }}
                      style={{
                        padding: "10px 10px",
                        userSelect: "none",
                        cursor: "pointer",
                        position: "sticky",
                        top: 0,
                        textAlign: NUMERIC_COLS.has(col.key) ? "center" : "left",
                        color: "#cbd3ff",
                        fontWeight: 900,
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        background: active ? "linear-gradient(180deg, #151a2b 0%, #141827 100%)" : undefined,
                      }}
                      aria-sort={active ? (sortAsc ? "ascending" : "descending") : "none"}
                    >
                      {col.label}
                      {active && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>
                          {sortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {squadToShow.map((p, idx) => {
                const isGK = p.principal === "GK";
                const rowBg = idx % 2 === 0 ? "rgba(21,24,36,.75)" : "rgba(18,21,31,.85)";
                return (
                  <tr
                    key={p.player_id}
                    style={{
                      background: rowBg,
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      transition: "background .15s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#232641"}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    {COLUMNS.map(col => {
                      if (col.key === "name") {
                        return (
                          <td key={col.key} style={{ padding: "10px", fontWeight: 800 }}>
                            <a
                              href={`https://play.soccerverse.com/player/${p.player_id}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{
                                color: "#8ea3ff", fontWeight: 800, textDecoration: "none",
                                borderBottom: "1px dashed rgba(142,163,255,.65)"
                              }}
                            >
                              {p.name}
                            </a>
                          </td>
                        );
                      }
                      if (col.key === "positions") {
                        return (
                          <td key={col.key} style={{ padding: "10px", fontWeight: 900 }}>
                            <span
                              style={{
                                ...styles.chip,
                                padding: "4px 10px",
                                borderRadius: 10,
                                color: getPositionColor(p.principal),
                                borderColor: "rgba(255,255,255,0.08)"
                              }}
                            >
                              {p.principal}
                            </span>
                            {p.secondaires && p.secondaires.length > 0 && (
                              <span style={{ color: "#9fb0c9", marginLeft: 8, fontWeight: 700, fontSize: "90%" }}>
                                ({p.secondaires.join(", ")})
                              </span>
                            )}
                          </td>
                        );
                      }
                      if (col.key === "rating_gk") {
                        return (
                          <td key={col.key} style={{ padding: "10px", textAlign: "center", fontWeight: 900, color: isGK ? "#b891ff" : "#6f768b" }}>
                            {isGK ? (p.rating_gk ?? "-") : "-"}
                          </td>
                        );
                      }
                      if (["rating_tackling", "rating_passing", "rating_shooting"].includes(col.key)) {
                        return (
                          <td key={col.key} style={{ padding: "10px", textAlign: "center", fontWeight: 900, color: !isGK ? "#e9ecf5" : "#6f768b" }}>
                            {!isGK ? (p[col.key] ?? "-") : "-"}
                          </td>
                        );
                      }
                      if (col.key === "morale") {
                        return (
                          <td key={col.key} style={{ padding: "10px", textAlign: "center" }}>
                            {renderMorale(p.morale, t)}
                          </td>
                        );
                      }
                      if (col.key === "rating") {
                        const color =
                          p.rating >= 75 ? "#64ffae" :
                          (p.rating < 65 ? "#ff7575" : "#e9ecf5");
                        return (
                          <td key={col.key} style={{ padding: "10px", textAlign: "center", fontWeight: 900, color }}>
                            {p.rating ?? "-"}
                          </td>
                        );
                      }
                      if (col.key === "value" || col.key === "wages") {
                        return (
                          <td key={col.key} style={{ padding: "10px", textAlign: "center", fontWeight: 800 }}>
                            {formatSVC(p[col.key], lang)}
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} style={{ padding: "10px", textAlign: NUMERIC_COLS.has(col.key) ? "center" : "left" }}>
                          {p[col.key] ?? "-"}
                        </td>
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

  /** --------- RENDER --------- **/
  return (
    <div style={styles.page}>
      <SearchCard />
      {clubInfo && <ClubHeaderCard />}
      {clubInfo && <SquadTable />}
    </div>
  );
}
