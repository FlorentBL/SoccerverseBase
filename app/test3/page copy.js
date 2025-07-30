"use client";
import React, { useState } from "react";

// === Constantes métiers ===
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

function isMatchWeek(week) {
  return typeof week.player_wages === "number" && Math.abs(week.player_wages) > 0;
}
function countMatchWeeks(weeks) {
  return weeks.filter(isMatchWeek).length;
}
function formatSVC(val, field) {
  if (typeof val !== "number") return "-";
  const absVal = Math.abs(val / 10000);
  const isCost = COST_FIELDS.includes(field);
  const sign = isCost && absVal > 0 ? "-" : "";
  return sign + absVal.toLocaleString("fr-FR", {
    maximumFractionDigits: absVal < 1000 ? 2 : 0,
    minimumFractionDigits: 0,
  }) + " $SVC";
}
function formatBigSVC(val) {
  if (typeof val !== "number") return "-";
  return Math.round(val / 10000).toLocaleString("fr-FR") + " $SVC";
}
function formatDate(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("fr-FR");
}

function FinanceTable({ bilan, weeks, isProj }) {
  return (
    <div className="bg-[#23263a] text-white rounded-xl shadow-lg p-5 mb-2 border border-gray-800">
      <table className="w-full text-base">
        <thead>
          <tr>
            <th className="py-1 pr-4 text-left text-gray-400 font-semibold">Flux</th>
            <th className="py-1 text-right text-gray-400 font-semibold">
              Montant {weeks && ("(" + (isProj ? "projection " : "total ") + weeks + " journées)")}
            </th>
          </tr>
        </thead>
        <tbody>
          {FIELD_ORDER.map(k =>
            <tr key={k} className="border-b border-[#2d3146] hover:bg-[#21262b] transition">
              <td className="py-1 pr-4 text-gray-200">{FIELD_LABELS[k] || k}</td>
              <td
                className={
                  "py-1 text-right font-mono " +
                  (COST_FIELDS.includes(k) && bilan[k] !== 0 ? "text-red-400 font-semibold" : "")
                }
              >
                {formatSVC(bilan[k] ?? 0, k)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DetailWeeksTable({ weeks, title }) {
  return (
    <div className="bg-[#23263a] rounded-xl shadow p-5 text-xs border border-gray-800 mb-6">
      <h3 className="font-bold mb-3 text-gray-200">{title || "Détail par manche"}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-[#363a57] text-xs text-gray-100">
          <thead className="bg-[#202330]">
            <tr>
              <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">Week</th>
              <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">Date</th>
              {FIELD_ORDER.map(k => (
                <th key={k} className="px-2 py-1 border-b border-[#363a57] font-semibold text-gray-300">{FIELD_LABELS[k] || k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i} className={i % 2 ? "bg-[#222436]" : "bg-[#1b1e29]"}>
                <td className="px-2 py-1 border-b border-[#363a57]">{w.game_week}</td>
                <td className="px-2 py-1 border-b border-[#363a57]">{formatDate(w.date)}</td>
                {FIELD_ORDER.map(k => (
                  <td
                    key={k}
                    className={
                      "px-2 py-1 border-b border-[#363a57] text-right font-mono " +
                      (COST_FIELDS.includes(k) && w[k] !== 0 ? "text-red-400" : "")
                    }
                  >
                    {formatSVC(w[k] ?? 0, k)}
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

// Nouveau : Détail projeté J par J
function ProjectedWeeksTable({ weeks, title }) {
  return (
    <div className="bg-[#23263a] rounded-xl shadow p-5 text-xs border border-gray-800 mb-6">
      <h3 className="font-bold mb-3 text-gray-200">{title || "Détail par manche projeté"}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-[#363a57] text-xs text-gray-100">
          <thead className="bg-[#202330]">
            <tr>
              <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">Week</th>
              <th className="px-2 py-1 border-b border-[#363a57] text-left font-semibold text-gray-300">Date (estimée)</th>
              {FIELD_ORDER.map(k => (
                <th key={k} className="px-2 py-1 border-b border-[#363a57] font-semibold text-gray-300">{FIELD_LABELS[k] || k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i} className={i % 2 ? "bg-[#222436]" : "bg-[#1b1e29]"}>
                <td className="px-2 py-1 border-b border-[#363a57]">{w.game_week || i + 1}</td>
                <td className="px-2 py-1 border-b border-[#363a57]">{w.date ? formatDate(w.date) : "-"}</td>
                {FIELD_ORDER.map(k => (
                  <td
                    key={k}
                    className={
                      "px-2 py-1 border-b border-[#363a57] text-right font-mono " +
                      (COST_FIELDS.includes(k) && w[k] !== 0 ? "text-red-400" : "")
                    }
                  >
                    {formatSVC(w[k] ?? 0, k)}
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

export default function ClubProjectionPage() {
  const [clubId, setClubId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showS1Detail, setShowS1Detail] = useState(false);
  const [showS2Detail, setShowS2Detail] = useState(false);
  const [showProjDetail, setShowProjDetail] = useState(false);
  const [showSimDetail, setShowSimDetail] = useState(false);

  // Simulation
  const [transfertSim, setTransfertSim] = useState("");
  const [salaireSim, setSalaireSim] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults(null);
    setErr("");
    setLoading(true);
    setShowS1Detail(false);
    setShowS2Detail(false);
    setShowProjDetail(false);
    setShowSimDetail(false);
    setTransfertSim("");
    setSalaireSim("");
    try {
      // 1. Solde club
      const clubRes = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      if (!clubRes.ok) throw new Error("Erreur solde club");
      const clubData = await clubRes.json();
      const solde = clubData.items?.[0]?.balance ?? 0;

      // 2. Bilans S1 & S2
      const [s1, s2] = await Promise.all([1, 2].map(async season => {
        const res = await fetch(`https://services.soccerverse.com/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${season}`);
        if (!res.ok) throw new Error(`Erreur bilan S${season}`);
        return await res.json();
      }));

      // 3. Détection journées de match (paie salaire joueur)
      const isMatch = w => typeof w.player_wages === "number" && Math.abs(w.player_wages) > 0;
      const matchWeeksS1 = s1.filter(isMatch);
      const matchWeeksS2 = s2.filter(isMatch);

      const nbMatchsTotal = matchWeeksS1.length;
      const nbMatchsS2 = matchWeeksS2.length;
      const nbMatchsRestants = nbMatchsTotal - nbMatchsS2;

      // 4. Moyenne par champ sur S2 (par journées de match)
      const sumMatchWeeksS2 = {};
      matchWeeksS2.forEach(week => {
        Object.entries(week).forEach(([k, v]) => {
          if (typeof v === "number") sumMatchWeeksS2[k] = (sumMatchWeeksS2[k] ?? 0) + v;
        });
      });
      const moyS2 = {};
      FIELD_ORDER.forEach(k => {
        moyS2[k] = nbMatchsS2 > 0 ? (sumMatchWeeksS2[k] ?? 0) / nbMatchsS2 : 0;
      });

      // 5. Projection S2 par match projeté (tableau complet J par J)
const projectedWeeks = [];
for (let i = 0; i < nbMatchsTotal; i++) {
  const projLine = {};
  FIELD_ORDER.forEach(k => {
    if (NON_PROJECTED_FIELDS.includes(k)) {
      projLine[k] = 0;
    } else {
      // Projection : valeur moyenne par journée
      if (["gate_receipts", "sponsor", "merchandise"].includes(k)) {
        projLine[k] = i % 2 === 0 ? moyS2[k] : 0;
      } else {
        projLine[k] = moyS2[k];
      }
    }
  });
  // Patch robustesse : toujours les méta-données de semaine
  projLine.game_week = i + 1;
  projLine.date = null;
  projectedWeeks.push(projLine);
}

      // 6. Synthèse projetée (sur nbMatchsTotal)
      const projS2 = {};
      FIELD_ORDER.forEach(k => {
        projS2[k] = projectedWeeks.reduce((acc, w) => acc + (w[k] ?? 0), 0);
      });
      const soldeFinS2 = solde + Object.entries(projS2).reduce((acc, [k, v]) => {
        return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
      }, 0);
      // Recettes/charges/masse salariale
      let totalRecettes = 0, totalCharges = 0;
      FIELD_ORDER.forEach(k => {
        if (NON_PROJECTED_FIELDS.includes(k)) return;
        if (COST_FIELDS.includes(k)) totalCharges += Math.abs(projS2[k] ?? 0);
        else totalRecettes += projS2[k] ?? 0;
      });
      const masseSalariale = Math.abs(projS2.player_wages ?? 0);

      setResults({
        solde,
        matchWeeksS1, matchWeeksS2, nbMatchsTotal, nbMatchsS2, nbMatchsRestants,
        bilanS1: aggregateBilan(matchWeeksS1),
        bilanS2: aggregateBilan(matchWeeksS2),
        projS2,
        projectedWeeks,
        soldeFinS2,
        masseSalariale,
        totalRecettes,
        totalCharges,
        s1, s2
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

  // === SIMULATION (projection modifiée) ===
  let simSynth = null, simWeeks = null;
  if (results && transfertSim && salaireSim) {
    const transfert = parseFloat(transfertSim.replace(",", ".")) || 0;
    const salaire = parseFloat(salaireSim.replace(",", ".")) || 0;
    // Copie de la projection par match
    simWeeks = results.projectedWeeks.map((line, idx) => ({ ...line }));
    // Ajout du transfert sur la 1ère journée restante (après S2 en cours)
    if (results.nbMatchsS2 < simWeeks.length) {
      simWeeks[results.nbMatchsS2]["transfers_out"] = (simWeeks[results.nbMatchsS2]["transfers_out"] ?? 0) + transfert;
    }
    // Ajout du salaire sur chaque journée restante
    for (let i = results.nbMatchsS2; i < simWeeks.length; i++) {
      simWeeks[i]["player_wages"] = (simWeeks[i]["player_wages"] ?? 0) - salaire;
    }
    // Synthèse (somme)
    const simBilan = {};
    FIELD_ORDER.forEach(k => {
      simBilan[k] = simWeeks.reduce((acc, w) => acc + (w[k] ?? 0), 0);
    });
    const soldeFinS2 = results.solde + Object.entries(simBilan).reduce((acc, [k, v]) => {
      return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
    }, 0);
    let totalRecettes = 0, totalCharges = 0;
    FIELD_ORDER.forEach(k => {
      if (NON_PROJECTED_FIELDS.includes(k)) return;
      if (COST_FIELDS.includes(k)) totalCharges += Math.abs(simBilan[k] ?? 0);
      else totalRecettes += simBilan[k] ?? 0;
    });
    const masseSalariale = Math.abs(simBilan.player_wages ?? 0);
    simSynth = {
      simBilan, soldeFinS2, masseSalariale, totalRecettes, totalCharges
    };
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
            {/* Saison 1 */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 1</h2>
            <FinanceTable bilan={results.bilanS1} weeks={results.nbMatchsTotal} />
            <div className="mt-2 mb-4 flex justify-end">
              <button
                className="text-sm underline text-gray-300 hover:text-green-300"
                onClick={() => setShowS1Detail(s => !s)}
              >
                {showS1Detail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
              </button>
            </div>
            {showS1Detail && <DetailWeeksTable weeks={results.matchWeeksS1} title="Détail par manche S1" />}

            {/* Saison 2 */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 2 (en cours)</h2>
            <FinanceTable bilan={results.bilanS2} weeks={results.nbMatchsS2} />
            <div className="mt-2 mb-4 flex justify-end">
              <button
                className="text-sm underline text-gray-300 hover:text-green-300"
                onClick={() => setShowS2Detail(s => !s)}
              >
                {showS2Detail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
              </button>
            </div>
            {showS2Detail && <DetailWeeksTable weeks={results.matchWeeksS2} title="Détail par manche S2" />}

            {/* Projection */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-yellow-300 text-center">Projection Fin Saison 2</h2>
            <FinanceTable bilan={results.projS2} weeks={results.nbMatchsTotal} isProj />
            <div className="mt-2 mb-4 flex justify-end">
              <button
                className="text-sm underline text-gray-300 hover:text-green-300"
                onClick={() => setShowProjDetail(s => !s)}
              >
                {showProjDetail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
              </button>
            </div>
            {showProjDetail && <ProjectedWeeksTable weeks={results.projectedWeeks} title="Détail par manche projeté" />}

            {/* Simulation */}
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
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Salaire hebdo (SVC/journée)</label>
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
              {simSynth && (
                <>
                  <FinanceTable bilan={simSynth.simBilan} weeks={results.nbMatchsTotal} isProj />
                  <div className="mt-2 mb-4 flex justify-end">
                    <button
                      className="text-sm underline text-gray-300 hover:text-green-300"
                      onClick={() => setShowSimDetail(s => !s)}
                    >
                      {showSimDetail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
                    </button>
                  </div>
                  {showSimDetail && (
                    <ProjectedWeeksTable
                      weeks={simWeeks}
                      title="Détail par manche projeté (simulation)"
                    />
                  )}
                  <div className="flex flex-col gap-2 items-center text-lg mt-6">
                    <div>
                      <span className="text-gray-200">Solde projeté fin S2 : </span>
                      <span className="font-bold text-green-300">{formatBigSVC(simSynth.soldeFinS2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-200">Masse salariale joueurs prévue S2 : </span>
                      <span className="font-bold text-blue-300">{formatBigSVC(simSynth.masseSalariale)}</span>
                    </div>
                    <div>
                      <span className="text-gray-200">Total recettes S2 : </span>
                      <span className="font-bold text-green-200">{formatBigSVC(simSynth.totalRecettes)}</span>
                    </div>
                    <div>
                      <span className="text-gray-200">Total charges S2 : </span>
                      <span className="font-bold text-red-200">{formatBigSVC(simSynth.totalCharges)}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      (Transfert affecté à la première journée restante, salaire ajouté sur {results.nbMatchsRestants} journées de match restantes)
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
