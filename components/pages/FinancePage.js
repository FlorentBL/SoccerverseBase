"use client";
import React, { useState } from "react";
import {
  FIELD_ORDER, COST_FIELDS, NON_PROJECTED_FIELDS,
  isMatchWeek, aggregateBilan
} from "../utils";
import Saison1 from "../Saison1";
import Saison2 from "../Saison2";
import ProjectionFinS2 from "../ProjectionFinS2";
import SimulationFinS2 from "../SimulationFinS2";

const LABELS = {
  fr: {
    title: "Projection Financière Club Soccerverse",
    clubId: "ID Club",
    placeholder: "ex: 5902",
    launch: "Lancer l'analyse",
    loading: "Chargement…",
    errorClub: "Erreur solde club",
    errorSeason: s => `Erreur bilan S${s}`,
  },
  en: {
    title: "Soccerverse Club Financial Projection",
    clubId: "Club ID",
    placeholder: "e.g. 5902",
    launch: "Start analysis",
    loading: "Loading…",
    errorClub: "Club balance error",
    errorSeason: s => `Season ${s} balance error`,
  },
  it: {
    title: "Proiezione Finanziaria Club Soccerverse",
    clubId: "ID Club",
    placeholder: "es: 5902",
    launch: "Avvia analisi",
    loading: "Caricamento…",
    errorClub: "Errore saldo club",
    errorSeason: s => `Errore bilancio S${s}`,
  }
};

// Agrégation d'une liste de semaines en un bilan
function aggregate(weeks) {
  const sum = {};
  weeks.forEach(week => {
    Object.entries(week).forEach(([k, v]) => {
      if (typeof v === "number") sum[k] = (sum[k] ?? 0) + v;
    });
  });
  return sum;
}

export default function FinancePage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  const [clubId, setClubId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [transfertSim, setTransfertSim] = useState("");
  const [salaireSim, setSalaireSim] = useState("");
  const [simData, setSimData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults(null);
    setErr("");
    setLoading(true);
    setTransfertSim("");
    setSalaireSim("");
    setSimData(null);

    try {
      // Récup solde
      const clubRes = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      if (!clubRes.ok) throw new Error(t.errorClub);
      const clubData = await clubRes.json();
      const solde = clubData.items?.[0]?.balance ?? 0;

      // Récup détails semaines S1 et S2
      const [s1, s2] = await Promise.all([1, 2].map(async season => {
        const res = await fetch(`https://services.soccerverse.com/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${season}`);
        if (!res.ok) throw new Error(t.errorSeason(season));
        return await res.json();
      }));

      // Filtre "manches de match"
      const matchWeeksS1 = s1.filter(isMatchWeek);
      const matchWeeksS2 = s2.filter(isMatchWeek);
      const nbJoursTotal = matchWeeksS1.length;
      const nbJoursS2 = matchWeeksS2.length;
      const nbJoursRestantes = nbJoursTotal - nbJoursS2;

      // Bilans par saison
      const bilanS1 = aggregate(s1);
      const bilanS2 = aggregate(s2);

      // Moyenne par champ sur S2
      const sumMatchWeeksS2 = {};
      s2.forEach(week => {
        Object.entries(week).forEach(([k, v]) => {
          if (typeof v === "number") sumMatchWeeksS2[k] = (sumMatchWeeksS2[k] ?? 0) + v;
        });
      });
      const moyS2 = {};
      FIELD_ORDER.forEach(k => {
        moyS2[k] = s2.length > 0 ? (sumMatchWeeksS2[k] ?? 0) / s2.length : 0;
      });

      // Dernier salaire joueurs connu (journée passée) ou 0
      const lastPlayerWages = matchWeeksS2.length > 0
        ? matchWeeksS2[matchWeeksS2.length - 1].player_wages || 0
        : 0;

      // ---- PROJECTION PAR JOUR ----
      // On garde les vraies semaines passées, puis on duplique une base pour les journées futures
      let projDetail = [...matchWeeksS2.map(week => ({ ...week }))];
      for (let i = 0; i < nbJoursRestantes; i++) {
        const base = {};
        FIELD_ORDER.forEach(k => {
          if (k === "player_wages") {
            base[k] = lastPlayerWages; // On garde le dernier salaire connu
          } else if (NON_PROJECTED_FIELDS.includes(k)) {
            base[k] = 0;
          } else if (["gate_receipts", "sponsor", "merchandise"].includes(k)) {
            // Pour ces champs, tu peux garder ta logique (exemple : un match sur deux pour domicile/extérieur)
            base[k] = (nbJoursS2 + i) % 2 === 0 ? moyS2[k] : 0;
          } else {
            base[k] = moyS2[k];
          }
        });
        base.game_week = nbJoursS2 + i + 1;
        base.date = null;
        projDetail.push(base);
      }

      // Projection totale (somme de chaque champ)
      const projS2 = aggregate(projDetail);

      // Recap synthèse projection
      let totalRecettes = 0, totalCharges = 0;
      FIELD_ORDER.forEach(k => {
        if (NON_PROJECTED_FIELDS.includes(k)) return;
        if (COST_FIELDS.includes(k)) totalCharges += Math.abs(projS2[k] ?? 0);
        else totalRecettes += projS2[k] ?? 0;
      });
      const soldeFinS2 = Number.isFinite(solde)
        ? solde + Object.entries(projS2).reduce((acc, [k, v]) => (
            COST_FIELDS.includes(k) ? acc - Math.abs(v || 0) : acc + (v || 0)
          ), 0)
        : 0;
      const masseSalariale = Math.abs(projS2.player_wages ?? 0);

      setResults({
        solde,
        bilanS1,
        matchWeeksS1,
        nbJoursTotal,
        bilanS2,
        matchWeeksS2,
        nbJoursS2,
        nbJoursRestantes,
        projS2,
        projDetail,
        soldeFinS2,
        masseSalariale,
        totalRecettes,
        totalCharges,
        s1,
        s2,
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // === SIMULATION LOGIC ===
  function runSimulation() {
    if (!results) return;
    const simDetail = JSON.parse(JSON.stringify(results.projDetail));
    const transfert = (parseFloat(transfertSim.replace(",", ".")) || 0) * 10000;
    const salaireHebdo = (parseFloat(salaireSim.replace(",", ".")) || 0) * 10000;
    let simRecettes = 0, simCharges = 0;

    // Ajoute le salaire simulé sur les journées restantes uniquement !
    for (let i = results.nbJoursS2; i < simDetail.length; ++i) {
      simDetail[i].player_wages = (simDetail[i].player_wages ?? 0) + salaireHebdo;
    }

    // Ajoute le transfert sur la première journée restante
    if (transfert > 0 && results.nbJoursS2 < simDetail.length) {
      simDetail[results.nbJoursS2].transfers_out = (simDetail[results.nbJoursS2].transfers_out ?? 0) + transfert;
    }

    // Récap total simulé
    const simBilan = aggregate(simDetail);
    const simSoldeFin = results.solde + Object.entries(simBilan).reduce((acc, [k, v]) => (
      COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v
    ), 0);
    const simMasseSalariale = Math.abs(simBilan.player_wages ?? 0);
    FIELD_ORDER.forEach(k => {
      if (NON_PROJECTED_FIELDS.includes(k)) return;
      if (COST_FIELDS.includes(k)) simCharges += Math.abs(simBilan[k] ?? 0);
      else simRecettes += simBilan[k] ?? 0;
    });

    setSimData({
      bilan: simBilan,
      soldeFinS2: simSoldeFin,
      masseSalariale: simMasseSalariale,
      totalRecettes: simRecettes,
      totalCharges: simCharges,
      detail: simDetail,
    });
  }

  // Appelle la simulation en live
  React.useEffect(() => {
    if (
      results &&
      transfertSim !== "" &&
      salaireSim !== "" &&
      !isNaN(Number(transfertSim)) &&
      !isNaN(Number(salaireSim))
    ) {
      runSimulation();
    } else {
      setSimData(null);
    }
    // eslint-disable-next-line
  }, [results, transfertSim, salaireSim]);

  // ==== UI ====
  return (
    <div className="min-h-screen bg-[#181B23] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-white tracking-tight">{t.title}</h1>
        {/* --- Input --- */}
        <form className="flex gap-2 mb-8 items-end flex-wrap justify-center" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">{t.clubId}</label>
            <input
              type="number"
              value={clubId}
              onChange={e => setClubId(e.target.value)}
              className="border border-gray-600 rounded p-2 w-32 bg-[#202330] text-white"
              placeholder={t.placeholder}
              required
            />
          </div>
          <button type="submit" className="bg-green-500 text-black font-bold rounded px-5 py-2 shadow hover:bg-green-400 transition">
            {t.launch}
          </button>
        </form>
        {loading && <div className="text-white my-8 text-center">{t.loading}</div>}
        {err && <div className="text-red-400 my-8 text-center">{err}</div>}
        {results && (
          <>
            {/* Saison 1 */}
            <Saison1 bilan={results.bilanS1} weeks={results.nbJoursTotal} details={results.s1} lang={lang} />
            {/* Saison 2 */}
            <Saison2 bilan={results.bilanS2} weeks={results.nbJoursS2} details={results.s2} lang={lang} />
            {/* Projection Fin S2 */}
            <ProjectionFinS2
              bilan={results.projS2}
              nbJoursTotal={results.nbJoursTotal}
              detailProj={results.projDetail}
              recap={{
                soldeFin: results.soldeFinS2,
                masseSalariale: results.masseSalariale,
                totalRecettes: results.totalRecettes,
                totalCharges: results.totalCharges
              }}
              lang={lang}
            />

            {/* Simulation */}
            <SimulationFinS2
              results={results}
              simData={simData}
              setSimData={setSimData}
              transfertSim={transfertSim}
              salaireSim={salaireSim}
              setTransfertSim={setTransfertSim}
              setSalaireSim={setSalaireSim}
              lang={lang}
            />
          </>
        )}
      </div>
    </div>
  );
}
