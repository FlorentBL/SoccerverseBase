// soccerverse_leagues.js
"use client";
import React, { useState } from "react";

// Mapping minimal pour la démo. Remplace/complète par le vrai mapping.
const COUNTRY_INFO = {
  "AGO": { country: "Angola", flag: "🇦🇴" },
  "ALB": { country: "Albanie", flag: "🇦🇱" },
  "AND": { country: "Andorre", flag: "🇦🇩" },
  "ARE": { country: "Émirats Arabes Unis", flag: "🇦🇪" },
  "ARG": { country: "Argentine", flag: "🇦🇷" },
  "ARM": { country: "Arménie", flag: "🇦🇲" },
  "AUS": { country: "Australie", flag: "🇦🇺" },
  "AUT": { country: "Autriche", flag: "🇦🇹" },
  "AZE": { country: "Azerbaïdjan", flag: "🇦🇿" },
  "BDI": { country: "Burundi", flag: "🇧🇮" },
  "BEL": { country: "Belgique", flag: "🇧🇪" },
  "BEN": { country: "Bénin", flag: "🇧🇯" },
  "BFA": { country: "Burkina Faso", flag: "🇧🇫" },
  "BGD": { country: "Bangladesh", flag: "🇧🇩" },
  "BGR": { country: "Bulgarie", flag: "🇧🇬" },
  "BHR": { country: "Bahreïn", flag: "🇧🇭" },
  "BIH": { country: "Bosnie-Herzégovine", flag: "🇧🇦" },
  "BLR": { country: "Biélorussie", flag: "🇧🇾" },
  "BOL": { country: "Bolivie", flag: "🇧🇴" },
  "BRA": { country: "Brésil", flag: "🇧🇷" },
  "BTN": { country: "Bhoutan", flag: "🇧🇹" },
  "BWA": { country: "Botswana", flag: "🇧🇼" },
  "CAN": { country: "Canada", flag: "🇨🇦" },
  "CHE": { country: "Suisse", flag: "🇨🇭" },
  "CHL": { country: "Chili", flag: "🇨🇱" },
  "CHN": { country: "Chine", flag: "🇨🇳" },
  "CIV": { country: "Côte d'Ivoire", flag: "🇨🇮" },
  "CMR": { country: "Cameroun", flag: "🇨🇲" },
  "COD": { country: "République Démocratique du Congo", flag: "🇨🇩" },
  "COG": { country: "République du Congo", flag: "🇨🇬" },
  "COL": { country: "Colombie", flag: "🇨🇴" },
  "CRI": { country: "Costa Rica", flag: "🇨🇷" },
  "CUB": { country: "Cuba", flag: "🇨🇺" },
  "CYP": { country: "Chypre", flag: "🇨🇾" },
  "CZE": { country: "République Tchèque", flag: "🇨🇿" },
  "DEU": { country: "Allemagne", flag: "🇩🇪" },
  "DNK": { country: "Danemark", flag: "🇩🇰" },
  "DOM": { country: "République Dominicaine", flag: "🇩🇴" },
  "DZA": { country: "Algérie", flag: "🇩🇿" },
  "ECU": { country: "Équateur", flag: "🇪🇨" },
  "EGY": { country: "Égypte", flag: "🇪🇬" },
  "ENG": { country: "Angleterre", flag: "🏴" },
  "ESP": { country: "Espagne", flag: "🇪🇸" },
  "EST": { country: "Estonie", flag: "🇪🇪" },
  "ETH": { country: "Éthiopie", flag: "🇪🇹" },
  "FIN": { country: "Finlande", flag: "🇫🇮" },
  "FJI": { country: "Fidji", flag: "🇫🇯" },
  "FRA": { country: "France", flag: "🇫🇷" },
  "FRO": { country: "Îles Féroé", flag: "🇫🇴" },
  "GAB": { country: "Gabon", flag: "🇬🇦" },
  "GEO": { country: "Géorgie", flag: "🇬🇪" },
  "GHA": { country: "Ghana", flag: "🇬🇭" },
  "GIB": { country: "Gibraltar", flag: "🇬🇮" },
  "GIN": { country: "Guinée", flag: "🇬🇳" },
  "GMB": { country: "Gambie", flag: "🇬🇲" },
  "GRC": { country: "Grèce", flag: "🇬🇷" },
  "GTM": { country: "Guatemala", flag: "🇬🇹" },
  "HKG": { country: "Hong Kong", flag: "🇭🇰" },
  "HND": { country: "Honduras", flag: "🇭🇳" },
  "HRV": { country: "Croatie", flag: "🇭🇷" },
  "HTI": { country: "Haïti", flag: "🇭🇹" },
  "HUN": { country: "Hongrie", flag: "🇭🇺" },
  "IDN": { country: "Indonésie", flag: "🇮🇩" },
  "IND": { country: "Inde", flag: "🇮🇳" },
  "IRL": { country: "Irlande", flag: "🇮🇪" },
  "IRN": { country: "Iran", flag: "🇮🇷" },
  "IRQ": { country: "Irak", flag: "🇮🇶" },
  "ISL": { country: "Islande", flag: "🇮🇸" },
  "ISR": { country: "Israël", flag: "🇮🇱" },
  "ITA": { country: "Italie", flag: "🇮🇹" },
  "JAM": { country: "Jamaïque", flag: "🇯🇲" },
  "JOR": { country: "Jordanie", flag: "🇯🇴" },
  "JPN": { country: "Japon", flag: "🇯🇵" },
  "KAZ": { country: "Kazakhstan", flag: "🇰🇿" },
  "KEN": { country: "Kenya", flag: "🇰🇪" },
  "KGZ": { country: "Kirghizistan", flag: "🇰🇬" },
  "KHM": { country: "Cambodge", flag: "🇰🇭" },
  "KOR": { country: "Corée du Sud", flag: "🇰🇷" },
  "KOS": { country: "Kosovo", flag: "🇽🇰" },
  "KWT": { country: "Koweït", flag: "🇰🇼" },
  "LAO": { country: "Laos", flag: "🇱🇦" },
  "LBN": { country: "Liban", flag: "🇱🇧" },
  "LBR": { country: "Libéria", flag: "🇱🇷" },
  "LBY": { country: "Libye", flag: "🇱🇾" },
  "LSO": { country: "Lesotho", flag: "🇱🇸" },
  "LTU": { country: "Lituanie", flag: "🇱🇹" },
  "LUX": { country: "Luxembourg", flag: "🇱🇺" },
  "LVA": { country: "Lettonie", flag: "🇱🇻" },
  "MAR": { country: "Maroc", flag: "🇲🇦" },
  "MDA": { country: "Moldavie", flag: "🇲🇩" },
  "MEX": { country: "Mexique", flag: "🇲🇽" },
  "MKD": { country: "Macédoine du Nord", flag: "🇲🇰" },
  "MLI": { country: "Mali", flag: "🇲🇱" },
  "MLT": { country: "Malte", flag: "🇲🇹" },
  "MMR": { country: "Myanmar", flag: "🇲🇲" },
  "MNE": { country: "Monténégro", flag: "🇲🇪" },
  "MNG": { country: "Mongolie", flag: "🇲🇳" },
  "MRT": { country: "Mauritanie", flag: "🇲🇷" },
  "MUS": { country: "Maurice", flag: "🇲🇺" },
  "MWI": { country: "Malawi", flag: "🇲🇼" },
  "MYS": { country: "Malaisie", flag: "🇲🇾" },
  "NAM": { country: "Namibie", flag: "🇳🇦" },
  "NGA": { country: "Nigéria", flag: "🇳🇬" },
  "NIC": { country: "Nicaragua", flag: "🇳🇮" },
  "NIR": { country: "Irlande du Nord", flag: "🇬🇧" },
  "NLD": { country: "Pays-Bas", flag: "🇳🇱" },
  "NOR": { country: "Norvège", flag: "🇳🇴" },
  "NPL": { country: "Népal", flag: "🇳🇵" },
  "NZL": { country: "Nouvelle-Zélande", flag: "🇳🇿" },
  "OMN": { country: "Oman", flag: "🏴" },
  "PAN": { country: "Panama", flag: "🇵🇦" },
  "PER": { country: "Pérou", flag: "🇵🇪" },
  "PHL": { country: "Philippines", flag: "🇵🇭" },
  "POL": { country: "Pologne", flag: "🇵🇱" },
  "PRT": { country: "Portugal", flag: "🇵🇹" },
  "PRY": { country: "Paraguay", flag: "🇵🇾" },
  "QAT": { country: "Qatar", flag: "🇶🇦" },
  "ROU": { country: "Roumanie", flag: "🇷🇴" },
  "RUS": { country: "Russie", flag: "🇷🇺" },
  "RWA": { country: "Rwanda", flag: "🇷🇼" },
  "SAU": { country: "Arabie Saoudite", flag: "🇸🇦" },
  "SCO": { country: "Écosse", flag: "🏴" },
  "SDN": { country: "Soudan", flag: "🇸🇩" },
  "SEN": { country: "Sénégal", flag: "🇸🇳" },
  "SGP": { country: "Singapour", flag: "🇸🇬" },
  "SLV": { country: "Salvador", flag: "🇸🇻" },
  "SMR": { country: "Saint-Marin", flag: "🇸🇲" },
  "SOM": { country: "Somalie", flag: "🇸🇴" },
  "SRB": { country: "Serbie", flag: "🇷🇸" },
  "SVK": { country: "Slovaquie", flag: "🇸🇰" },
  "SVN": { country: "Slovénie", flag: "🇸🇮" },
  "SWE": { country: "Suède", flag: "🇸🇪" },
  "SWZ": { country: "Eswatini", flag: "🇸🇿" },
  "SYR": { country: "Syrie", flag: "🇸🇾" },
  "TGO": { country: "Togo", flag: "🇹🇬" },
  "THA": { country: "Thaïlande", flag: "🇹🇭" },
  "TJK": { country: "Tadjikistan", flag: "🇹🇯" },
  "TKM": { country: "Turkménistan", flag: "🇹🇲" },
  "TTO": { country: "Trinité-et-Tobago", flag: "🇹🇹" },
  "TUN": { country: "Tunisie", flag: "🇹🇳" },
  "TUR": { country: "Turquie", flag: "🇹🇷" },
  "TZA": { country: "Tanzanie", flag: "🇹🇿" },
  "UGA": { country: "Ouganda", flag: "🇺🇬" },
  "UKR": { country: "Ukraine", flag: "🇺🇦" },
  "URY": { country: "Uruguay", flag: "🇺🇾" },
  "USA": { country: "États-Unis", flag: "🇺🇸" },
  "UZB": { country: "Ouzbékistan", flag: "🇺🇿" },
  "VEN": { country: "Venezuela", flag: "🇻🇪" },
  "VNM": { country: "Vietnam", flag: "🇻🇳" },
  "WAL": { country: "Pays de Galles", flag: "🏴" },
  "YEM": { country: "Yémen", flag: "🇾🇪" },
  "ZAF": { country: "Afrique du Sud", flag: "🇿🇦" },
  "ZMB": { country: "Zambie", flag: "🇿🇲" },
  "ZWE": { country: "Zimbabwe", flag: "🇿🇼" }
};


// Fonction pour transformer la réponse brute en format divisions
function buildCountryDivisions(data) {
  // { "AGO": [ { label, leagueId }, ... ] }
  const countryDivisions = {};
  data.forEach(league => {
    if (!countryDivisions[league.country_id]) countryDivisions[league.country_id] = [];
    countryDivisions[league.country_id].push({
      label: `D${league.level + 1}`,
      leagueId: league.league_id,
    });
  });
  // Génère le tableau final [{ country, code, flag, divisions }]
  return Object.entries(countryDivisions).map(([code, divisions]) => ({
    country: COUNTRY_INFO[code]?.country || code,
    code,
    flag: COUNTRY_INFO[code]?.flag || "",
    divisions: divisions.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

// Fonction qui fait un appel Soccerverse (pour une saison donnée)
async function fetchLeagues(season_id) {
  const res = await fetch("https://gsppub.soccerverse.io/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "get_leagues",
      params: { season_id },
      id: 1,
    }),
    next: { revalidate: 3600 }, // Cache Next.js (optionnel)
  });
  if (!res.ok) throw new Error("Network error");
  const json = await res.json();
  if (!json.result?.data) throw new Error("No data from API");
  return json.result.data;
}

// Composant React exemple (peut être adapté ou appelé dans un script pur Node.js)
export default function LeaguesMappingPage() {
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setErr(""); setLoading(true);
    try {
      // On récupère les deux saisons en // pour optimiser
      const [s1, s2] = await Promise.all([fetchLeagues(1), fetchLeagues(2)]);
      setResult({
        S1: buildCountryDivisions(s1),
        S2: buildCountryDivisions(s2),
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">Mapping Leagues Soccerverse (S1 & S2)</h2>
      <button onClick={fetchAll} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? "Chargement..." : "Lancer les appels API"}
      </button>
      {err && <div className="text-red-500 mt-2">{err}</div>}
      {result && (
        <pre className="mt-4 bg-gray-900 text-green-300 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
