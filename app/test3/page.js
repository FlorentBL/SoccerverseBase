"use client";
import React, { useState } from "react";

// Constantes métiers
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

function FinanceTable({ bilan, labelJour, isProj }) {
  return (
    <div className="bg-[#23263a] text-white rounded-xl shadow-lg p-5 mb-2 border border-gray-800">
      <table className="w-full text-base">
        <thead>
          <tr>
            <th className="py-1 pr-4 text-left text-gray-400 font-semibold">Flux</th>
            <th className="py-1 text-right text-gray-400 font-semibold">
              Montant {labelJour && `(${labelJour})`}
            </th>
          </tr>
        </thead>
        <tbody>
          {FIELD_ORDER.map(k =>
            <tr key={k} className="border-b border-[#2d3146] hover:bg-[#21262b] transition">
              <td className="py-1 pr-4 text-gray-200">{FIELD_LABELS[k] || k}</td>
              <td className={
                "py-1 text-right font-mono " +
                (COST_FIELDS.includes(k) && bilan[k] !== 0 ? "text-red-400 font-semibold" : "")
              }>
                {formatSVC(bilan[k] ?? 0)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Bilan synthèse bas
function RecapSynthese({ bilanProj, soldeFin, masseSalariale, totalRecettes, totalCharges, labelJour }) {
  return (
    <div className="bg-[#23263a] rounded-xl shadow-lg p-7 mb-6 border border-gray-800 text-lg flex flex-col gap-2 items-center">
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
  // Simulation
  const [transfertSim, setTransfertSim] = useState("");
  const [salaireSim, setSalaireSim] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults(null);
    setErr("");
    setLoading(true);
    setTransfertSim("");
    setSalaireSim("");
    try {
      // 1. Données club (solde)
      const clubRes = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      if (!clubRes.ok) throw new Error("Erreur solde club");
      const clubData = await clubRes.json();
      const solde = clubData.items?.[0]?.balance ?? 0;

      // 2. S1 & S2 détails
      const [s1, s2] = await Promise.all([1, 2].map(async season => {
        const res = await fetch(`https://services.soccerverse.com/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${season}`);
        if (!res.ok) throw new Error(`Erreur bilan S${season}`);
        return await res.json();
      }));

      // 3. Détection journées de match (où il y a un salaire joueur)
      const isMatchWeek = w => w.player_wages && Math.abs(w.player_wages) > 0;
      const matchWeeksS1 = s1.filter(isMatchWeek);
      const matchWeeksS2 = s2.filter(isMatchWeek);

      const nbJoursTotal = matchWeeksS1.length;
      const nbJoursS2 = matchWeeksS2.length;
      const nbJoursRestantes = nbJoursTotal - nbJoursS2;

      // 4. Moyennes projetées selon FREQ
      // Pour chaque champ, on compte le nombre d'occurence sur S2 (toutes sem. pour droits TV, seulement à domicile pour guichets/sponsors/produits dérivés)
      const freqField = {};
      FIELD_ORDER.forEach(k => { freqField[k] = 0; });

      matchWeeksS2.forEach(w => {
        freqField.player_wages += 1;
        if (w.gate_receipts && Math.abs(w.gate_receipts) > 0) freqField.gate_receipts += 1;
        if (w.sponsor && Math.abs(w.sponsor) > 0) freqField.sponsor += 1;
        if (w.merchandise && Math.abs(w.merchandise) > 0) freqField.merchandise += 1;
        if (w.tv_revenue && Math.abs(w.tv_revenue) > 0) freqField.tv_revenue += 1;
        // autres : tout le temps
      });

      // Pour chaque champ : on prend la somme observée sur S2 / nb occurence réelle constatée puis on multiplie par le nb de journées de S1
      function freqAvgTotal(s2, matchWeeksS2, nbJoursTotal, k) {
        if (NON_PROJECTED_FIELDS.includes(k)) {
          // One-shot : on laisse la valeur réelle observée
          return matchWeeksS2.reduce((acc, w) => acc + (w[k] ?? 0), 0);
        }
        // sinon moyenne par fréquence
        let n = freqField[k] || 1; // éviter div/0
        let sum = matchWeeksS2.reduce((acc, w) => acc + (w[k] ?? 0), 0);
        let moyenne = sum / n;
        // Pour les champs "par match à domicile"
        if (["gate_receipts", "sponsor", "merchandise"].includes(k)) {
          // 1 match sur 2 à domicile
          return moyenne * Math.ceil(nbJoursTotal / 2);
        }
        // Pour droits TV et salaires : chaque match
        if (["tv_revenue", "player_wages"].includes(k)) {
          return moyenne * nbJoursTotal;
        }
        // autres (charges récurrentes non visibles en S2) : projetés sur le nb total
        return moyenne * nbJoursTotal;
      }

      // 5. Bilan projeté S2
      const projS2 = {};
      FIELD_ORDER.forEach(k => {
        projS2[k] = freqAvgTotal(s2, matchWeeksS2, nbJoursTotal, k);
      });

      // 6. Synthèse
      const soldeFinS2 = solde + Object.entries(projS2).reduce((acc, [k, v]) => (
        COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v
      ), 0);

      const masseSalariale = Math.abs(projS2.player_wages ?? 0);

      // Somme recettes/charges totales (hors transferts & injections)
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
        totalCharges
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

  // === SIMULATION LOGIC ===
  let simBilan = null, simSoldeFin = null, simMasseSalariale = null, simRecettes = null, simCharges = null;
  if (results && transfertSim !== "" && salaireSim !== "") {
    // On clone le bilan projeté
    simBilan = { ...results.projS2 };
    const transfert = parseFloat(transfertSim.replace(",", ".")) || 0;
    const salaireHebdo = parseFloat(salaireSim.replace(",", ".")) || 0;
    const nbRest = results.nbJoursRestantes || 0;

    // Ajout du salaire projeté
    simBilan.player_wages = (simBilan.player_wages ?? 0) - (salaireHebdo * nbRest);
    // Retrait immédiat du transfert
    simBilan.transfers_out = (simBilan.transfers_out ?? 0) + transfert;

    // Synthèse corrigée
    simSoldeFin = results.solde + Object.entries(simBilan).reduce((acc, [k, v]) => (
      COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v
    ), 0);
    simMasseSalariale = Math.abs(simBilan.player_wages ?? 0);
    // Recettes/charges recalculées
    simRecettes = 0; simCharges = 0;
    FIELD_ORDER.forEach(k => {
      if (NON_PROJECTED_FIELDS.includes(k)) return;
      if (COST_FIELDS.includes(k)) simCharges += Math.abs(simBilan[k] ?? 0);
      else simRecettes += simBilan[k] ?? 0;
    });
  }

  // === UI ===
  return (
    <div className="min-h-screen bg-[#181B23] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
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
            {/* Saisons */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 1</h2>
            <FinanceTable bilan={results.bilanS1} labelJour={`total ${results.nbJoursTotal} journées`} />
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 2 (en cours)</h2>
            <FinanceTable bilan={results.bilanS2} labelJour={`total ${results.nbJoursS2} journées`} />
            {/* Projection */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-yellow-300 text-center">Projection Fin Saison 2</h2>
            <FinanceTable bilan={results.projS2} labelJour={`projection ${results.nbJoursTotal} journées`} isProj />
            {/* Synthèse */}
            <RecapSynthese
              bilanProj={results.projS2}
              soldeFin={results.soldeFinS2}
              masseSalariale={results.masseSalariale}
              totalRecettes={results.totalRecettes}
              totalCharges={results.totalCharges}
              labelJour={`sur ${results.nbJoursTotal} journées`}
            />
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
                    bilanProj={simBilan}
                    soldeFin={simSoldeFin}
                    masseSalariale={simMasseSalariale}
                    totalRecettes={simRecettes}
                    totalCharges={simCharges}
                    labelJour={`sur ${results.nbJoursTotal} journées`}
                  />
                  <FinanceTable bilan={simBilan} labelJour={`simulation ${results.nbJoursTotal} journées`} />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
