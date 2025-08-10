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
    alertS1: "En Saison 1, les budgets de la Saison 2 sont utilisés.",
    alertDebt:
      "Les récompenses ne sont distribuées aux influenceurs que si le club n'est pas endetté.",
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
    alertS1: "Season 1 uses Season 2 budgets.",
    alertDebt:
      "Rewards are only distributed to influencers if the club is not in debt.",
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
    alertS1: "Nella Stagione 1 si utilizzano i budget della Stagione 2.",
    alertDebt:
      "Le ricompense vengono distribuite agli influencer solo se il club non ha debiti.",
  },
};

function codeFromFlag(flag) {
  if (!flag) return null;
  const codePoints = Array.from(flag).map(ch => ch.codePointAt(0));
  if (codePoints.length === 2) {
    return (
      String.fromCharCode(codePoints[0] - 0x1f1a5) +
      String.fromCharCode(codePoints[1] - 0x1f1a5)
    );
  }
  return null;
}

export default function RecompensesPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  const formatter = new Intl.NumberFormat(lang, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const [openClub, setOpenClub] = useState(null);

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
    const c = list.find(
      c => getCountryLabel(c).toLowerCase() === val.toLowerCase()
    );
    setCountry(c ? c.code : "");
  };

  const getCountryLabel = c => {
    const a2 = codeFromFlag(c.flag);
    if (a2) {
      try {
        const disp = new Intl.DisplayNames([lang], { type: "region" }).of(a2);
        if (disp) return disp;
      } catch {
        /* ignore */
      }
    }
    return c.country;
  };

  const fetchRewards = async () => {
    setLoading(true);
    setErr("");
    setRewards([]);
    try {
      const leagueSeason = season === "1" ? 2 : season;
      const leagueResp = await fetch(
        `https://services.soccerverse.com/api/leagues?league_id=${division}&season=${leagueSeason}`
      );
      const leagueJson = await leagueResp.json();
      const league = leagueJson.items && leagueJson.items[0];
      if (!league) throw new Error("league not found");
      const prize = league.prize_money_pot / 10000;
      const teams = league.num_teams || league.total_clubs;
      const tableResp = await fetch(
        `https://services.soccerverse.com/api/league_tables?league_id=${division}&season=${season}`
      );
      const tableJson = await tableResp.json();
      const standings = Array.isArray(tableJson) ? tableJson : [];
      const sorted = standings.sort((a, b) => (a.rank || 0) - (b.rank || 0));
      const sum = (teams * (teams + 1)) / 2;
      const result = [];
      for (let i = 0; i < sorted.length; i++) {
        const club = sorted[i];
        const rank = club.rank || i + 1;
        const base = (prize * 0.5) / teams;
        const linear = (prize * 0.5 * (teams - rank + 1)) / sum;
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
        } catch {
          /* ignore */
        }
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
    <div className="min-h-screen text-gray-100 pt-16">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">{t.title}</h1>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-lg mx-auto mb-8">
        <label className="block font-semibold mb-2">{t.seasonLabel}</label>
        <select
          value={season}
          onChange={e => setSeason(e.target.value)}
          className="w-full mb-4 p-3 rounded-md bg-gray-900 border border-gray-700 focus:outline-none"
        >
          <option value="">{t.seasonPlaceholder}</option>
          {Object.keys(countryMap).map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="block font-semibold mb-2">{t.countryLabel}</label>
        <input
          list="countries"
          value={countryInput}
          onChange={handleCountryChange}
          placeholder={t.countryPlaceholder}
          className="w-full mb-4 p-3 rounded-md bg-gray-900 border border-gray-700 focus:outline-none"
          disabled={!season}
        />
        <datalist id="countries">
          {countries.map(c => (
            <option
              key={c.code}
              value={getCountryLabel(c)}
              label={`${c.flag} ${getCountryLabel(c)}`}
            />
          ))}
        </datalist>

        <label className="block font-semibold mb-2">{t.divisionLabel}</label>
        <select
          value={division}
          onChange={e => setDivision(e.target.value)}
          className="w-full p-3 rounded-md bg-gray-900 border border-gray-700 focus:outline-none"
          disabled={!selectedCountry}
        >
          <option value="">{t.divisionPlaceholder}</option>
          {selectedCountry?.divisions.map(d => (
            <option key={d.leagueId} value={d.leagueId}>
              {d.label} (ID {d.leagueId})
            </option>
          ))}
        </select>
        {loading && <div className="text-yellow-400 mt-3">{t.loading}</div>}
        {err && <div className="text-red-500 mt-3">{err}</div>}
      </div>

      {season && (
        <div className="bg-yellow-900 text-yellow-200 p-4 rounded-md w-full max-w-lg mx-auto mb-8">
          {season === "1" && <p>{t.alertS1}</p>}
          <p>{t.alertDebt}</p>
        </div>
      )}

      {rewards.length > 0 && (
        <div className="w-full max-w-5xl mx-auto overflow-x-auto rounded-lg shadow ring-1 ring-gray-700">
          <table className="min-w-full text-sm text-left text-gray-300 divide-y divide-gray-700">
            <thead className="text-xs uppercase bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <tr>
                <th className="px-4 py-3 tracking-wider select-none">{t.columns.rank}</th>
                <th className="px-4 py-3 tracking-wider select-none">{t.columns.club}</th>
                <th className="px-4 py-3 tracking-wider select-none">{t.columns.reward}</th>
                <th className="px-4 py-3 text-center tracking-wider select-none">{t.columns.influencers}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {rewards.map((r, idx) => (
                <React.Fragment key={r.club_id}>
                  <tr
                    onClick={() =>
                      setOpenClub(openClub === r.club_id ? null : r.club_id)
                    }
                    className={`cursor-pointer hover:bg-gray-700 transition-colors ${
                      openClub === r.club_id
                        ? 'bg-gray-700'
                        : idx % 2 === 0
                        ? 'bg-gray-800'
                        : 'bg-gray-900'
                    }`}
                  >
                    <td className="px-4 py-3">{r.rank}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://play.soccerverse.com/club/${r.club_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {clubMap[r.club_id]?.name || r.club_id}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {formatter.format(r.reward)} SVC
                    </td>
                    <td className="px-4 py-3 text-center">
                      {openClub === r.club_id ? '▲' : '▼'}
                    </td>
                  </tr>
                  {openClub === r.club_id && (
                    <tr className="bg-gray-700">
                      <td colSpan={4} className="px-4 py-3">
                        {r.influencers.length === 0 ? (
                          '-'
                        ) : (
                          <ul className="space-y-1">
                            {r.influencers.map(i => (
                              <li key={i.name} className="flex justify-between">
                                <a
                                  href={`https://play.soccerverse.com/profile/${i.name}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 underline"
                                >
                                  {i.name}
                                </a>
                                <span>
                                  {formatter.format(i.reward)} SVC
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
