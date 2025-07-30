"use client";
import React, { useState } from "react";

const FIELD_LABELS = {
  cash_injection: "Injection de trésorerie",
  gate_receipts: "Recettes guichets",
  tv_revenue: "Droits TV",
  sponsor: "Sponsors",
  merchandise: "Produits dérivés",
  prize_money: "Gains compétitions",
  transfers_in: "Transferts (entrées)",
  other_income: "Autres revenus",
  player_wages: "Salaires joueurs",
  agent_wages: "Salaires agents",
  managers_wage: "Salaire entraîneur",
  ground_maintenance: "Entretien stade",
  transfers_out: "Transferts (sorties)",
  shareholder_payouts: "Dividendes",
  shareholder_prize_money: "Gains actionnaires",
  other_outgoings: "Autres dépenses"
};
const FIELD_ORDER = [
  "cash_injection", "gate_receipts", "tv_revenue", "sponsor", "merchandise",
  "prize_money", "transfers_in", "other_income",
  "player_wages", "agent_wages", "managers_wage", "ground_maintenance",
  "transfers_out", "shareholder_payouts", "shareholder_prize_money", "other_outgoings"
];
const COST_FIELDS = [
  "player_wages", "agent_wages", "managers_wage", "ground_maintenance",
  "transfers_out", "shareholder_payouts", "shareholder_prize_money", "other_outgoings"
];
const NON_PROJECTED_FIELDS = [
  "cash_injection", "transfers_in", "transfers_out"
];

function formatSVC(val) {
  if (typeof val !== "number") return "-";
  return Math.round(val / 10000).toLocaleString("fr-FR") + " $SVC";
}
function formatDate(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("fr-FR");
}

// Tableaux de détail par journée
function DetailWeeksTable({ weeks, type }) {
  return (
    <div className="bg-[#23263a] rounded-xl shadow p-5 text-xs border border-gray-800 mb-6">
      <h3 className="font-bold mb-3 text-gray-200">
        {type === "proj" ? "Projection par journée" : type === "simu" ? "Simulation par journée" : "Détail par match"}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-[#363a57] text-xs text-gray-100">
          <thead className="bg-[#202330]">
            <tr>
              <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">#</th>
              {weeks[0]?.date && (
                <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">Date</th>
              )}
              {FIELD_ORDER.map(k => (
                <th key={k} className="px-2 py-1 border-b border-[#363a57] font-semibold text-gray-300">{FIELD_LABELS[k] || k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i} className={i % 2 ? "bg-[#222436]" : "bg-[#1b1e29]"}>
                <td className="px-2 py-1 border-b border-[#363a57]">{i + 1}</td>
                {w.date && (
                  <td className="px-2 py-1 border-b border-[#363a57]">{formatDate(w.date)}</td>
                )}
                {FIELD_ORDER.map(k => (
                  <td
                    key={k}
                    className={
                      "px-2 py-1 border-b border-[#363a57] text-right font-mono " +
                      (COST_FIELDS.includes(k) && w[k] !== 0 ? "text-red-400" : "")
                    }
                  >
                    {formatSVC(w[k] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Synthèse rapide
function RecapSynthese({ soldeFin, masseSalariale, totalRecettes, totalCharges, labelJour }) {
  return (
    <div className="bg-[#23263a] rounded-xl shadow-lg p-7 mb-2 border border-gray-800 text-lg flex flex-col gap-2 items-center">
      <div>
        <span className="text-gray-200 font-bold">Solde prévisionnel fin S2 : </span>
        <span className="font-bold text-green-400">{formatSVC(soldeFin)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">Masse salariale joueurs prévue S2 : </span>
        <span className="font-bold text-blue-300">{formatSVC(masseSalariale)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">Total recettes S2 : </span>
        <span className="font-bold text-green-200">{formatSVC(totalRecettes)}</span>
      </div>
      <div>
        <span className="text-gray-200 font-bold">Total charges S2 : </span>
        <span className="font-bold text-red-200">{formatSVC(totalCharges)}</span>
      </div>
      <div className="text-xs text-gray-400 mt-2">{labelJour && `(${labelJour})`}</div>
    </div>
  );
}

export default function ClubProjectionPage() {
  const [clubId, setClubId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [transfertSim, setTransfertSim] = useState("");
  const [salaireSim, setSalaireSim] = useState("");

  // --- Requête & calculs principaux
  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults(null);
    setErr(""); setLoading(true);
    setTransfertSim(""); setSalaireSim("");
    try {
      // 1. Solde actuel
      const clubRes = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      if (!clubRes.ok) throw new Error("Erreur solde club");
      const clubData = await clubRes.json();
      const solde = clubData.items?.[0]?.balance ?? 0;
      // 2. Détail S1/S2
      const [s1, s2] = await Promise.all([1, 2].map(async season => {
        const res = await fetch(`https://services.soccerverse.com/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${season}`);
        if (!res.ok) throw new Error(`Erreur bilan S${season}`);
        return await res.json();
      }));

      // 3. Matchs réels (avec player_wages != 0)
      const isMatchWeek = w => w.player_wages && Math.abs(w.player_wages) > 0;
      const matchWeeksS1 = s1.filter(isMatchWeek);
      const matchWeeksS2 = s2.filter(isMatchWeek);
      const nbJoursTotal = matchWeeksS1.length;
      const nbJoursS2 = matchWeeksS2.length;
      const nbJoursRestantes = nbJoursTotal - nbJoursS2;

      // 4. Moyennes projetées
      const freqField = {}; FIELD_ORDER.forEach(k => { freqField[k] = 0; });
      matchWeeksS2.forEach(w => {
        freqField.player_wages += 1;
        if (w.gate_receipts && Math.abs(w.gate_receipts) > 0) freqField.gate_receipts += 1;
        if (w.sponsor && Math.abs(w.sponsor) > 0) freqField.sponsor += 1;
        if (w.merchandise && Math.abs(w.merchandise) > 0) freqField.merchandise += 1;
        if (w.tv_revenue && Math.abs(w.tv_revenue) > 0) freqField.tv_revenue += 1;
      });
      function freqAvgTotal(matchWeeks, nbJours, k) {
        if (NON_PROJECTED_FIELDS.includes(k)) return matchWeeks.reduce((acc, w) => acc + (w[k] ?? 0), 0);
        let n = freqField[k] || 1;
        let sum = matchWeeks.reduce((acc, w) => acc + (w[k] ?? 0), 0);
        let moyenne = sum / n;
        if (["gate_receipts", "sponsor", "merchandise"].includes(k)) return moyenne * Math.ceil(nbJours / 2);
        if (["tv_revenue", "player_wages"].includes(k)) return moyenne * nbJours;
        return moyenne * nbJours;
      }
      // 5. Proj S2 (total + par journée projetée)
      const projS2 = {}; FIELD_ORDER.forEach(k => { projS2[k] = freqAvgTotal(matchWeeksS2, nbJoursTotal, k); });
      // Tableau virtuel détaillé par journée projetée
      const virtWeeksProj = Array.from({ length: nbJoursTotal }, (_, i) => {
        let row = { id: i + 1 };
        FIELD_ORDER.forEach(k => {
          let n = freqField[k] || 1;
          let sum = matchWeeksS2.reduce((acc, w) => acc + (w[k] ?? 0), 0);
          let moyenne = sum / n;
          if (NON_PROJECTED_FIELDS.includes(k)) row[k] = 0; // Ne pas dupliquer
          else if (["gate_receipts", "sponsor", "merchandise"].includes(k)) row[k] = i % 2 === 0 ? Math.round(moyenne) : 0;
          else row[k] = Math.round(moyenne);
        });
        return row;
      });

      // 6. Synthèse
      const soldeFinS2 = solde + Object.entries(projS2).reduce((acc, [k, v]) => (
        COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v
      ), 0);
      const masseSalariale = Math.abs(projS2.player_wages ?? 0);
      let totalRecettes = 0, totalCharges = 0;
      FIELD_ORDER.forEach(k => {
        if (NON_PROJECTED_FIELDS.includes(k)) return;
        if (COST_FIELDS.includes(k)) totalCharges += Math.abs(projS2[k] ?? 0);
        else totalRecettes += projS2[k] ?? 0;
      });

      setResults({
        solde,
        matchWeeksS1,
        matchWeeksS2,
        nbJoursTotal,
        nbJoursS2,
        nbJoursRestantes,
        bilanS1: aggregateBilan(matchWeeksS1),
        bilanS2: aggregateBilan(matchWeeksS2),
        projS2,
        soldeFinS2,
        masseSalariale,
        totalRecettes,
        totalCharges,
        virtWeeksProj
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  function aggregateBilan(weeks) {
    const sum = {};
    weeks.forEach(week => {
      Object.entries(week).forEach(([k, v]) => {
        if (typeof v === "number") sum[k] = (sum[k] ?? 0) + v;
      });
    });
    return sum;
  }

  // === SIMULATION (virtuel) ===
  let simBilan = null, simSoldeFin = null, simMasseSalariale = null, simRecettes = null, simCharges = null, virtWeeksSimu = null;
  if (results && transfertSim !== "" && salaireSim !== "") {
    simBilan = { ...results.projS2 };
    const transfert = parseFloat(transfertSim.replace(",", ".")) || 0;
    const salaireHebdo = parseFloat(salaireSim.replace(",", ".")) || 0;
    const nbRest = results.nbJoursRestantes || 0;
    simBilan.player_wages = (simBilan.player_wages ?? 0) - (salaireHebdo * nbRest);
    simBilan.transfers_out = (simBilan.transfers_out ?? 0) + transfert;
    simSoldeFin = results.solde + Object.entries(simBilan).reduce((acc, [k, v]) => (
      COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v
    ), 0);
    simMasseSalariale = Math.abs(simBilan.player_wages ?? 0);
    simRecettes = 0; simCharges = 0;
    FIELD_ORDER.forEach(k => {
      if (NON_PROJECTED_FIELDS.includes(k)) return;
      if (COST_FIELDS.includes(k)) simCharges += Math.abs(simBilan[k] ?? 0);
      else simRecettes += simBilan[k] ?? 0;
    });
    // Générer détail virtuel simulé (par journée)
    virtWeeksSimu = results.virtWeeksProj.map((w, i) => {
      let row = { ...w };
      if (!NON_PROJECTED_FIELDS.includes("player_wages"))
        row.player_wages = w.player_wages - (salaireHebdo || 0);
      if (!NON_PROJECTED_FIELDS.includes("transfers_out") && i === 0 && transfert)
        row.transfers_out = (w.transfers_out || 0) + transfert;
      return row;
    });
  }

  return (
    <div className="min-h-screen bg-[#181B23] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-white tracking-tight">Projection Financière Club Soccerverse</h1>
        {/* --- Input --- */}
        <form className="flex gap-2 mb-8 items-end flex-wrap justify-center" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Club ID</label>
            <input
              type="number"
              value={clubId}
              onChange={e => setClubId(e.target.value)}
              className="border border-gray-600 rounded p-2 w-32 bg-[#202330] text-white"
              placeholder="ex: 5902"
              required
            />
          </div>
          <button type="submit" className="bg-green-500 text-black font-bold rounded px-5 py-2 shadow hover:bg-green-400 transition">
            Lancer l'analyse
          </button>
        </form>
        {loading && <div className="text-white my-8 text-center">Chargement…</div>}
        {err && <div className="text-red-400 my-8 text-center">{err}</div>}
        {results && (
          <>
            {/* Saison 1 */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 1</h2>
            <RecapSynthese
              soldeFin={null}
              masseSalariale={Math.abs(results.bilanS1.player_wages ?? 0)}
              totalRecettes={FIELD_ORDER.filter(k => !NON_PROJECTED_FIELDS.includes(k) && !COST_FIELDS.includes(k)).reduce((acc, k) => acc + (results.bilanS1[k] ?? 0), 0)}
              totalCharges={FIELD_ORDER.filter(k => !NON_PROJECTED_FIELDS.includes(k) && COST_FIELDS.includes(k)).reduce((acc, k) => acc + Math.abs(results.bilanS1[k] ?? 0), 0)}
              labelJour={`total ${results.nbJoursTotal} journées`}
            />
            <DetailWeeksTable weeks={results.matchWeeksS1} />
            {/* Saison 2 */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 2 (en cours)</h2>
            <RecapSynthese
              soldeFin={null}
              masseSalariale={Math.abs(results.bilanS2.player_wages ?? 0)}
              totalRecettes={FIELD_ORDER.filter(k => !NON_PROJECTED_FIELDS.includes(k) && !COST_FIELDS.includes(k)).reduce((acc, k) => acc + (results.bilanS2[k] ?? 0), 0)}
              totalCharges={FIELD_ORDER.filter(k => !NON_PROJECTED_FIELDS.includes(k) && COST_FIELDS.includes(k)).reduce((acc, k) => acc + Math.abs(results.bilanS2[k] ?? 0), 0)}
              labelJour={`total ${results.nbJoursS2} journées`}
            />
            <DetailWeeksTable weeks={results.matchWeeksS2} />
            {/* Projection */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-yellow-300 text-center">Projection Fin Saison 2</h2>
            <RecapSynthese
              soldeFin={results.soldeFinS2}
              masseSalariale={results.masseSalariale}
              totalRecettes={results.totalRecettes}
              totalCharges={results.totalCharges}
              labelJour={`projection ${results.nbJoursTotal} journées`}
            />
            <DetailWeeksTable weeks={results.virtWeeksProj} type="proj" />
            {/* --- Simulateur --- */}
            <div className="my-10 bg-[#23263a] rounded-xl shadow-lg p-7 border border-gray-800">
              <h2 className="text-xl font-bold mb-3 text-center text-yellow-300">Simulation de recrutement</h2>
              <div className="flex flex-wrap gap-4 mb-5 items-end justify-center">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Montant du transfert</label>
                  <input
                    type="number"
                    value={transfertSim}
                    onChange={e => setTransfertSim(e.target.value)}
                    className="border border-gray-600 rounded p-2 w-32 bg-[#202330] text-white"
                    placeholder="ex: 2000000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Salaire hebdo (SVC/match)</label>
                  <input
                    type="number"
                    value={salaireSim}
                    onChange={e => setSalaireSim(e.target.value)}
                    className="border border-gray-600 rounded p-2 w-32 bg-[#202330] text-white"
                    placeholder="ex: 10000"
                    min="0"
                  />
                </div>
              </div>
              {(simBilan && simSoldeFin !== null) && (
                <>
                  <RecapSynthese
                    soldeFin={simSoldeFin}
                    masseSalariale={simMasseSalariale}
                    totalRecettes={simRecettes}
                    totalCharges={simCharges}
                    labelJour={`sur ${results.nbJoursTotal} journées`}
                  />
                  <DetailWeeksTable weeks={virtWeeksSimu} type="simu" />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
