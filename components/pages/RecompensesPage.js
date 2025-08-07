"use client";
import React, { useState, useEffect, useRef } from "react";

const CLUB_MAPPING_URL = "/club_mapping.json";
const COUNTRY_MAPPING_URL = "/country_mapping2.json";

const LABELS = {
  fr: {
    title: "Récompenses de Ligue",
    seasonLabel: "Saison :",
    seasonPlaceholder: "Sélectionner une saison",
    countryLabel: "Pays :",
    countryPlaceholder: "Sélectionner un pays",
    divisionLabel: "Division :",
    divisionPlaceholder: "Sélectionner une division",
    loading: "Calcul...",
    error: "Erreur réseau ou données manquantes",
    columns: { rank: "#", club: "Club", reward: "Gain", influencers: "Influenceurs" },
  },
  en: {
    title: "League Rewards",
    seasonLabel: "Season:",
    seasonPlaceholder: "Select a season",
    countryLabel: "Country:",
    countryPlaceholder: "Select a country",
    divisionLabel: "Division:",
    divisionPlaceholder: "Select a division",
    loading: "Computing...",
    error: "Network error or missing data",
    columns: { rank: "#", club: "Club", reward: "Reward", influencers: "Influencers" },
  },
  it: {
    title: "Ricompense di Lega",
    seasonLabel: "Stagione:",
    seasonPlaceholder: "Seleziona una stagione",
    countryLabel: "Paese:",
    countryPlaceholder: "Seleziona un paese",
    divisionLabel: "Divisione:",
    divisionPlaceholder: "Seleziona una divisione",
    loading: "Calcolo...",
    error: "Errore di rete o dati mancanti",
    columns: { rank: "#", club: "Club", reward: "Premio", influencers: "Influencer" },
  },
};

function codeFromFlag(flag) {
  if (!flag) return null;
  const codePoints = Array.from(flag).map(ch => ch.codePointAt(0));
  if (codePoints.length === 2) {
    return String.fromCharCode(codePoints[0] - 0x1F1A5) +
      String.fromCharCode(codePoints[1] - 0x1F1A5);
  }
  return null;
}

export default function RecompensesPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  const [season, setSeason] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [country, setCountry] = useState("");
  const [division, setDivision] = useState("");
  const [countryMap, setCountryMap] = useState({});
  const [clubMap, setClubMap] = useState({});
  const loadedCountryMap = useRef(false);
  const loadedClubMap = useRef(false);

  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchCountryMap();
    fetchClubMap();
  }, []);

  useEffect(() => {
    setCountryInput("");
    setCountry("");
    setDivision("");
  }, [season]);

  useEffect(() => {
    setDivision("");
  }, [country]);

  useEffect(() => {
    if (season && country && division) {
      fetchRewards();
    }
  }, [season, country, division]);

  const fetchClubMap = async () => {
    if (loadedClubMap.current) return;
    const resp = await fetch(CLUB_MAPPING_URL);
    const data = await resp.json();
    setClubMap(data);
    loadedClubMap.current = true;
  };

  const fetchCountryMap = async () => {
    if (loadedCountryMap.current) return;
    const resp = await fetch(COUNTRY_MAPPING_URL);
    const data = await resp.json();
    setCountryMap(data);
    loadedCountryMap.current = true;
  };

  const handleCountryChange = e => {
    const val = e.target.value;
    setCountryInput(val);
    const list = countryMap[season] || [];
    const c = list.find(c => getCountryLabel(c).toLowerCase() === val.toLowerCase());
    setCountry(c ? c.code : "");
  };

  const getCountryLabel = c => {
    const a2 = codeFromFlag(c.flag);
    if (a2) {
      try {
        const disp = new Intl.DisplayNames([lang], { type: "region" }).of(a2);
        if (disp) return disp;
      } catch { /* ignore */ }
    }
    return c.country;
  };

  const fetchRewards = async () => {
    setLoading(true);
    setErr("");
    setRewards([]);
    try {
      const leagueResp = await fetch(`https://services.soccerverse.com/api/leagues?league_id=${division}`);
      const leagueJson = await leagueResp.json();
      const league = leagueJson.items && leagueJson.items[0];
      if (!league) throw new Error("league not found");
      const prize = league.prize_money_pot;
      const teams = league.num_teams || league.total_clubs;
      const tableResp = await fetch(`https://services.soccerverse.com/api/league_tables?league_id=${division}&season=${season}`);
      const tableJson = await tableResp.json();
      const standings = Array.isArray(tableJson) ? tableJson : [];
      const sorted = standings.sort((a, b) => (a.rank || 0) - (b.rank || 0));
      const sum = (teams * (teams + 1)) / 2;
      const result = [];
      for (let i = 0; i < sorted.length; i++) {
        const club = sorted[i];
        const rank = club.rank || i + 1;
        const base = prize * 0.5 / teams;
        const linear = prize * 0.5 * (teams - rank + 1) / sum;
        const clubReward = base + linear;
        let influencers = [];
        try {
          const ownersResp = await fetch("https://gsppub.soccerverse.io/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: "sv",
              jsonrpc: "2.0",
              method: "get_share_owners",
              params: { share: { club: club.club_id } },
            }),
          });
          const ownersJson = await ownersResp.json();
          const owners = ownersJson.result?.data || [];
          influencers = owners.map(o => ({
            name: o.name,
            reward: clubReward * 0.1 * (o.num / 1_000_000),
          }));
        } catch { /* ignore */ }
        result.push({ rank, club_id: club.club_id, reward: clubReward, influencers });
      }
      setRewards(result);
    } catch (e) {
      setErr(t.error);
    } finally {
      setLoading(false);
    }
  };

  const countries = countryMap[season] || [];
  const selectedCountry = countries.find(c => c.code === country);

  return (
    <div style={{ minHeight: "100vh", color: "#f6f6f7", paddingTop: 60 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>{t.title}</h1>
      </div>
      <div style={{ background: "#23272e", padding: 24, borderRadius: 14, boxShadow: "0 2px 12px #0008", width: "100%", maxWidth: 520, margin: "0 auto 32px" }}>
        <label style={{ fontWeight: 600, fontSize: 17, marginBottom: 6, display: "block" }}>{t.seasonLabel}</label>
        <select value={season} onChange={e => setSeason(e.target.value)}
          style={{ width: "100%", marginBottom: 18, padding: "12px 16px", borderRadius: 6, border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none" }}>
          <option value="">{t.seasonPlaceholder}</option>
          {Object.keys(countryMap).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label style={{ fontWeight: 600, fontSize: 17, marginBottom: 6, display: "block" }}>{t.countryLabel}</label>
        <input list="countries" value={countryInput} onChange={handleCountryChange} placeholder={t.countryPlaceholder}
          style={{ width: "100%", marginBottom: 14, padding: "12px 16px", borderRadius: 6, border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none" }} disabled={!season} />
        <datalist id="countries">
          {countries.map(c => (
            <option key={c.code} value={getCountryLabel(c)} label={`${c.flag} ${getCountryLabel(c)}`} />
          ))}
        </datalist>

        <label style={{ fontWeight: 600, fontSize: 17, marginBottom: 6, display: "block" }}>{t.divisionLabel}</label>
        <select value={division} onChange={e => setDivision(e.target.value)}
          style={{ width: "100%", marginBottom: 4, padding: "12px 16px", borderRadius: 6, border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 17, outline: "none" }} disabled={!selectedCountry}>
          <option value="">{t.divisionPlaceholder}</option>
          {selectedCountry?.divisions.map(d => (
            <option key={d.leagueId} value={d.leagueId}>{d.label} (ID {d.leagueId})</option>
          ))}
        </select>
        {loading && <div style={{ color: "#ffd700", marginTop: 10 }}>{t.loading}</div>}
        {err && <div style={{ color: "#ff4e5e", marginTop: 10 }}>{err}</div>}
      </div>

      {rewards.length > 0 && (
        <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto", background: "#181d23", borderRadius: 16, padding: 18, boxShadow: "0 2px 8px #0003" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "#22252a" }}>
                <th style={{ padding: 8 }}>{t.columns.rank}</th>
                <th style={{ padding: 8 }}>{t.columns.club}</th>
                <th style={{ padding: 8 }}>{t.columns.reward}</th>
                <th style={{ padding: 8 }}>{t.columns.influencers}</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map(r => (
                <tr key={r.club_id} style={{ background: r.rank % 2 === 0 ? "#22252a" : "#181d23" }}>
                  <td style={{ padding: 8 }}>{r.rank}</td>
                  <td style={{ padding: 8 }}>{clubMap[r.club_id]?.name || r.club_id}</td>
                  <td style={{ padding: 8 }}>{r.reward.toFixed(2)} SVC</td>
                  <td style={{ padding: 8 }}>
                    {r.influencers.length === 0 ? "-" : r.influencers.map(i => `${i.name}: ${i.reward.toFixed(2)} SVC`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

