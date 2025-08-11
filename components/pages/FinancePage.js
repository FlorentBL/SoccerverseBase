"use client";
import React, { useState } from "react";
import {
  FIELD_ORDER, COST_FIELDS, NON_PROJECTED_FIELDS,
  isMatchWeek, aggregateBilan,
  generateProjectionDetail, generateSimulatedDetail,
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
      const bilanS1 = aggregateBilan(s1);
      const bilanS2 = aggregateBilan(s2);

      // ---- PROJECTION PAR JOUR ----
      // On garde toutes les semaines déjà jouées (transferts inclus)
      // puis on génère les semaines restantes
      const projRest = generateProjectionDetail(matchWeeksS2, nbJoursRestantes);
      const projDetail = [...s2.map(week => ({ ...week })), ...projRest];

      // Projection totale (somme de chaque champ)
      const projS2 = aggregateBilan(projDetail);

      // Recap synthèse projection
      let totalRecettes = 0, totalCharges = 0;
      FIELD_ORDER.forEach(k => {
        if (NON_PROJECTED_FIELDS.includes(k)) return;
        if (COST_FIELDS.includes(k)) totalCharges += Math.abs(projS2[k] ?? 0);
        else totalRecettes += projS2[k] ?? 0;
      });

      // Bilan des semaines restantes uniquement pour le solde final
      const projFuture = aggregateBilan(projDetail.slice(s2.length));
      const soldeFinS2 = Number.isFinite(solde)
        ? solde + Object.entries(projFuture).reduce((acc, [k, v]) => (
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
    const transfert = (parseFloat(transfertSim.replace(",", ".")) || 0) * 10000;
    const salaireHebdo = (parseFloat(salaireSim.replace(",", ".")) || 0) * 10000;
    let simRecettes = 0, simCharges = 0;

    const simDetail = generateSimulatedDetail(
      results.projDetail,
      results.s2.length,
      transfert,
      salaireHebdo
    );

    // Récap total simulé
    const simBilan = aggregateBilan(simDetail);
    const simFuture = aggregateBilan(simDetail.slice(results.s2.length));
    const simSoldeFin = results.solde + Object.entries(simFuture).reduce((acc, [k, v]) => (
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
    <div className="min-h-screen py-8 px-4 flex flex-col items-center">
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
              className="input-field w-32"
              placeholder={t.placeholder}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
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
