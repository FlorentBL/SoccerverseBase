import React, { useState, useEffect, useMemo } from "react";
import { formatBigSVC } from "@/components/utils";

const COUNTRY_MAPPING_URL = "/country_mapping.json";
const CLUB_MAPPING_URL = "/club_mapping.json";

const T = {
  fr: {
    title: "Calculateur de Récompense",
    countryLabel: "Pays :",
    countryPlaceholder: "Sélectionner un pays",
    divisionLabel: "Division :",
    divisionPlaceholder: "Sélectionner une division",
    showTable: "Afficher récompenses",
    loading: "Chargement...",
    errorNetwork: "Erreur réseau ou parsing données.",
    noLeague: "Aucun championnat trouvé.",
    championshipLabel: "Championnat :",
    columns: { rank: "#", club: "Club", manager: "Manager", pts: "Pts", reward: "Gain" },
    prizePot: "Cagnotte :",
  },
  en: {
    title: "Rewards Calculator",
    countryLabel: "Country:",
    countryPlaceholder: "Select a country",
    divisionLabel: "Division:",
    divisionPlaceholder: "Select a division",
    showTable: "Show rewards",
    loading: "Loading...",
    errorNetwork: "Network or parsing error.",
    noLeague: "No league found.",
    championshipLabel: "League:",
    columns: { rank: "#", club: "Club", manager: "Manager", pts: "Pts", reward: "Reward" },
    prizePot: "Prize pot:",
  },
  it: {
    title: "Calcolatore Ricompense",
    countryLabel: "Paese:",
    countryPlaceholder: "Seleziona un paese",
    divisionLabel: "Divisione:",
    divisionPlaceholder: "Seleziona una divisione",
    showTable: "Mostra ricompense",
    loading: "Caricamento...",
    errorNetwork: "Errore di rete o parsing.",
    noLeague: "Nessun campionato trovato.",
    championshipLabel: "Campionato:",
    columns: { rank: "#", club: "Club", manager: "Manager", pts: "Pt", reward: "Premio" },
    prizePot: "Montepremi:",
  },
};

export default function LeagueRewardsCalculator({ lang = "fr" }) {
  const t = T[lang] || T.fr;
  const [countryMap, setCountryMap] = useState([]);
  const [clubMap, setClubMap] = useState({});
  const [country, setCountry] = useState("");
  const [division, setDivision] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [standings, setStandings] = useState([]);
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(COUNTRY_MAPPING_URL).then(r => r.json()).then(setCountryMap);
    fetch(CLUB_MAPPING_URL).then(r => r.json()).then(setClubMap);
  }, []);

  useEffect(() => {
    const c = countryMap.find(c => c.code === country);
    setSelectedCountry(c || null);
  }, [country, countryMap]);

  async function fetchRewards() {
    if (!division) return;
    setLoading(true);
    setErr(null);
    try {
      const [leagueRes, tableRes] = await Promise.all([
        fetch(`https://services.soccerverse.com/api/leagues?league_id=${division}`),
        fetch(`https://services.soccerverse.com/api/league_tables?league_id=${division}`)
      ]);
      const leagueJson = await leagueRes.json();
      const tableJson = await tableRes.json();
      setLeagueInfo(leagueJson.items?.[0] || null);
      setStandings(Array.isArray(tableJson) ? tableJson : []);
    } catch (e) {
      console.error(e);
      setErr(t.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  const totalTeams = leagueInfo?.num_teams || standings.length;
  const prizePot = leagueInfo?.prize_money_pot || 0;
  const sum = totalTeams * (totalTeams + 1) / 2;
  const standingsWithRewards = useMemo(() => standings.map((club, idx) => ({
    ...club,
    reward: prizePot * (totalTeams - idx) / sum,
  })), [standings, prizePot, totalTeams, sum]);

  return (
    <div className="min-h-screen text-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center">{t.title}</h1>
      <div className="w-full max-w-xl bg-gray-900 rounded-lg p-6 space-y-4">
        <div>
          <label className="block mb-1 font-medium">{t.countryLabel}</label>
          <select value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-700">
            <option value="">{t.countryPlaceholder}</option>
            {countryMap.sort((a,b)=>a.country.localeCompare(b.country, lang)).map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.country}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">{t.divisionLabel}</label>
          <select value={division} onChange={e => setDivision(e.target.value)} disabled={!selectedCountry} className="w-full p-2 rounded bg-gray-800 border border-gray-700">
            <option value="">{t.divisionPlaceholder}</option>
            {selectedCountry?.divisions.map(d => (
              <option key={d.leagueId} value={d.leagueId}>{d.label} (ID {d.leagueId})</option>
            ))}
          </select>
        </div>
        <button onClick={fetchRewards} disabled={!division || loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded">
          {loading ? t.loading : t.showTable}
        </button>
        {err && <div className="text-red-500 font-medium">{err}</div>}
      </div>

      {standingsWithRewards.length > 0 && (
        <div className="w-full max-w-3xl bg-gray-900 rounded-lg p-6 mt-8">
          <div className="mb-4 text-center">
            {t.championshipLabel} {selectedCountry?.flag} {selectedCountry?.country} - {selectedCountry?.divisions.find(d=>d.leagueId==division)?.label}
            {leagueInfo && (
              <div className="text-sm text-gray-400">{t.prizePot} {formatBigSVC(prizePot, lang)}</div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">{t.columns.rank}</th>
                  <th className="px-2 py-1">{t.columns.club}</th>
                  <th className="px-2 py-1">{t.columns.manager}</th>
                  <th className="px-2 py-1">{t.columns.pts}</th>
                  <th className="px-2 py-1">{t.columns.reward}</th>
                </tr>
              </thead>
              <tbody>
                {standingsWithRewards.map((club, idx) => (
                  <tr key={club.club_id} className={idx % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}>
                    <td className="px-2 py-1 text-center">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <a href={`https://play.soccerverse.com/club/${club.club_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-400">
                        {clubMap[club.club_id]?.name || club.club_id}
                      </a>
                    </td>
                    <td className="px-2 py-1">{club.manager_name || "-"}</td>
                    <td className="px-2 py-1 text-center">{club.pts}</td>
                    <td className="px-2 py-1 text-right">{formatBigSVC(club.reward, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

