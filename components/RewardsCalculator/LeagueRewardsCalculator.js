"use client";
import React, { useState, useEffect, useMemo } from "react";
import { formatBigSVC } from "@/components/utils";

const COUNTRY_MAPPING_URL = "/country_mapping2.json";
const CLUB_MAPPING_URL = "/club_mapping.json";

const T = {
  fr: {
    title: "Calculateur de Récompense",
    countryLabel: "Pays :",
    countryPlaceholder: "Sélectionner un pays",
    divisionLabel: "Division :",
    divisionPlaceholder: "Sélectionner une division",
    seasonLabel: "Saison :",
    showTable: "Afficher récompenses",
    loading: "Chargement...",
    errorNetwork: "Erreur réseau ou parsing données.",
    noLeague: "Aucun championnat trouvé.",
    championshipLabel: "Championnat :",
    columns: { rank: "#", club: "Club", manager: "Manager", pts: "Pts", reward: "Gain" },
    prizePot: "Cagnotte :",
    noteDebt: "Veuillez noter que les paiements peuvent être inférieurs si le club est endetté",
    influencers: "Influenceurs",
    season: "Saison",
  },
  en: {
    title: "Rewards Calculator",
    countryLabel: "Country:",
    countryPlaceholder: "Select a country",
    divisionLabel: "Division:",
    divisionPlaceholder: "Select a division",
    seasonLabel: "Season:",
    showTable: "Show rewards",
    loading: "Loading...",
    errorNetwork: "Network or parsing error.",
    noLeague: "No league found.",
    championshipLabel: "League:",
    columns: { rank: "#", club: "Club", manager: "Manager", pts: "Pts", reward: "Reward" },
    prizePot: "Prize pot:",
    noteDebt: "Please note payments may be lower if the club is in debt",
    influencers: "Influencers",
    season: "Season",
  },
  it: {
    title: "Calcolatore Ricompense",
    countryLabel: "Paese:",
    countryPlaceholder: "Seleziona un paese",
    divisionLabel: "Divisione:",
    divisionPlaceholder: "Seleziona una divisione",
    seasonLabel: "Stagione:",
    showTable: "Mostra ricompense",
    loading: "Caricamento...",
    errorNetwork: "Errore di rete o parsing.",
    noLeague: "Nessun campionato trovato.",
    championshipLabel: "Campionato:",
    columns: { rank: "#", club: "Club", manager: "Manager", pts: "Pt", reward: "Premio" },
    prizePot: "Montepremi:",
    noteDebt: "Si noti che i pagamenti possono essere inferiori se il club è indebitato",
    influencers: "Influencer",
    season: "Stagione",
  },
};

export default function LeagueRewardsCalculator({ lang = "fr" }) {
  const t = T[lang] || T.fr;
  const [countryMap, setCountryMap] = useState([]);
  const [clubMap, setClubMap] = useState({});
  const [country, setCountry] = useState("");
  const [divisionIdx, setDivisionIdx] = useState("");
  const [season, setSeason] = useState("2");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [standings, setStandings] = useState([]);
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [influencersMap, setInfluencersMap] = useState({});
  const [expandedClub, setExpandedClub] = useState(null);

  useEffect(() => {
    fetch(COUNTRY_MAPPING_URL).then(r => r.json()).then(setCountryMap);
    fetch(CLUB_MAPPING_URL).then(r => r.json()).then(setClubMap);
  }, []);

  useEffect(() => {
    const c = countryMap.find((c) => c.code === country);
    setSelectedCountry(c || null);
    setDivisionIdx("");
    setStandings([]);
    setLeagueInfo(null);
  }, [country, countryMap]);

  const divisions = useMemo(() => {
    if (!selectedCountry) return [];
    const d = selectedCountry.divisions;
    if (Array.isArray(d)) return d;
    return d[season] || [];
  }, [selectedCountry, season]);

  useEffect(() => {
    setDivisionIdx("");
    setStandings([]);
    setLeagueInfo(null);
  }, [season]);

  async function fetchRewards() {
    const div = divisions[Number(divisionIdx)];
    const leagueId = div?.leagueId;
    if (!leagueId) return;
    setLoading(true);
    setErr(null);
    try {
      const [leagueRes, tableRes] = await Promise.all([
        fetch(`https://services.soccerverse.com/api/leagues?league_id=${leagueId}&season_id=${season}`),
        fetch(`https://services.soccerverse.com/api/league_tables?league_id=${leagueId}&season_id=${season}`)
      ]);
      const leagueJson = await leagueRes.json();
      const tableJson = await tableRes.json();
      setLeagueInfo(leagueJson.items?.[0] || null);
      setStandings(Array.isArray(tableJson) ? tableJson : []);
      setExpandedClub(null);
    } catch (e) {
      console.error(e);
      setErr(t.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!standings.length) return;
    Promise.all(
      standings.map(async (club) => {
        try {
          const res = await fetch(
            `https://services.soccerverse.com/api/share_balances?sort_order=asc&club_id=${club.club_id}&countries=false&leagues=false`
          );
          const json = await res.json();
          return [club.club_id, json.items || []];
        } catch (e) {
          return [club.club_id, []];
        }
      })
    ).then((entries) => setInfluencersMap(Object.fromEntries(entries)));
  }, [standings]);

  const totalTeams = leagueInfo?.num_teams || standings.length;
  const prizePot = leagueInfo?.prize_money_pot || 0;
  const sum = (totalTeams * (totalTeams + 1)) / 2;
  const standingsWithRewards = useMemo(
    () =>
      standings.map((club, idx) => {
        const equalShare = prizePot * 0.5 / totalTeams;
        const linearShare = prizePot * 0.5 * (totalTeams - idx) / sum;
        const reward = equalShare + linearShare;
        const playerInfluencerReward = reward * 0.001;
        const influencerReward = club.balance >= 0 ? reward * 0.1 : 0;
        const clubReward = reward - influencerReward - playerInfluencerReward;
        return {
          ...club,
          reward,
          clubReward,
          influencerReward,
          playerInfluencerReward,
        };
      }),
    [standings, prizePot, totalTeams, sum]
  );

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
          <select
            value={divisionIdx}
            onChange={(e) => setDivisionIdx(e.target.value)}
            disabled={!selectedCountry}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          >
            <option value="">{t.divisionPlaceholder}</option>
            {divisions.map((d, idx) => (
              <option key={idx} value={idx}>
                {d.label} (ID {d.leagueId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">{t.seasonLabel}</label>
          <select value={season} onChange={e => setSeason(e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-700">
            {[2,1].map(s => (
              <option key={s} value={s}>{t.season} {s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchRewards}
          disabled={divisionIdx === "" || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded"
        >
          {loading ? t.loading : t.showTable}
        </button>
        {err && <div className="text-red-500 font-medium">{err}</div>}
      </div>

      {standingsWithRewards.length > 0 && (
        <div className="w-full max-w-3xl bg-gray-900 rounded-lg p-6 mt-8">
          <div className="mb-4 text-center">
            {t.championshipLabel} {selectedCountry?.flag} {selectedCountry?.country} - {divisions[Number(divisionIdx)]?.label} (ID {divisions[Number(divisionIdx)]?.leagueId}) ({t.season} {season})
            {leagueInfo && (
              <div className="text-sm text-gray-400">{t.prizePot} {formatBigSVC(prizePot, lang)}</div>
            )}
          </div>
          <div className="mb-4 text-xs text-yellow-400 text-center">{t.noteDebt}</div>
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
                {standingsWithRewards.map((club, idx) => {
                  const isExpanded = expandedClub === club.club_id;
                  const infList = influencersMap[club.club_id] || [];
                  return (
                    <React.Fragment key={club.club_id}>
                      <tr
                        className={idx % 2 === 0 ? "bg-gray-800 cursor-pointer" : "bg-gray-700 cursor-pointer"}
                        onClick={() =>
                          setExpandedClub(isExpanded ? null : club.club_id)
                        }
                     >
                        <td className="px-2 py-1 text-center">{idx + 1}</td>
                        <td className="px-2 py-1">
                          <a
                            href={`https://play.soccerverse.com/club/${club.club_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400"
                          >
                            {clubMap[club.club_id]?.name || club.club_id}
                          </a>
                        </td>
                        <td className="px-2 py-1">{club.manager_name || "-"}</td>
                        <td className="px-2 py-1 text-center">{club.pts}</td>
                        <td className="px-2 py-1 text-right">{formatBigSVC(club.clubReward, lang)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-800">
                          <td colSpan={5} className="px-4 py-2">
                            <div className="text-sm">
                              <div className="font-medium mb-1">{t.influencers}</div>
                              <ul className="list-disc pl-4 space-y-1">
                                {infList.map((inf) => {
                                  const sharePct = inf.num / 1000000;
                                  return (
                                    <li key={inf.name}>
                                      {inf.name} ({(sharePct * 100).toFixed(3)}%): {formatBigSVC(
                                        club.influencerReward * sharePct,
                                        lang
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

