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

// Champs à NE PAS projeter (one shot)
const NON_PROJECTED_FIELDS = [
  "cash_injection", "transfers_in", "transfers_out"
];

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
  // Affiche TOUJOURS la valeur entière (pas de M/k)
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
              Montant {weeks && ("(" + (isProj ? "projection " : "total ") + weeks + " sem.)")}
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

function DetailWeeksTable({ weeks }) {
  return (
    <div className="bg-[#23263a] rounded-xl shadow p-5 text-xs border border-gray-800 mb-6">
      <h3 className="font-bold mb-3 text-gray-200">Détail par semaine</h3>
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

export default function ClubProjectionPage() {
  const [clubId, setClubId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showS1Detail, setShowS1Detail] = useState(false);
  const [showS2Detail, setShowS2Detail] = useState(false);

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
    setTransfertSim("");
    setSalaireSim("");
    try {
      // Solde actuel
      const clubRes = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      if (!clubRes.ok) throw new Error("Erreur solde club");
      const clubData = await clubRes.json();
      const solde = clubData.items?.[0]?.balance ?? 0;

      // Bilan S1 & S2
      const [s1, s2] = await Promise.all([1, 2].map(async season => {
        const res = await fetch(`https://services.soccerverse.com/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${season}`);
        if (!res.ok) throw new Error(`Erreur bilan S${season}`);
        return await res.json();
      }));

      const bilanS1 = aggregateBilan(s1);
      const bilanS2 = aggregateBilan(s2);

      // Nombre de semaines basé sur S1
      const weeksTotal = s1.length;
      const weeksPlayed = s2.length;
      const weeksRestantes = weeksTotal - weeksPlayed;

      // Moyenne hebdo S2
      const moyS2 = {};
      FIELD_ORDER.forEach(k => {
        moyS2[k] = weeksPlayed > 0 ? (bilanS2[k] ?? 0) / weeksPlayed : 0;
      });

      // Projection S2 : les champs NON_PROJECTED_FIELDS restent à leur valeur S2 réelle (pas projetée)
      const projS2 = {};
      FIELD_ORDER.forEach(k => {
        if (NON_PROJECTED_FIELDS.includes(k)) {
          projS2[k] = bilanS2[k] ?? 0;
        } else {
          projS2[k] = moyS2[k] * weeksTotal;
        }
      });

      // Calcul du solde projeté en fin de S2
      const soldeFinS2 = solde + Object.entries(projS2).reduce((acc, [k, v]) => {
        return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
      }, 0);

      // Capacité d'invest immédiate = solde actuel + flux restant à jouer sur la saison (hors transferts/injection)
      const fluxS2Restant = Object.entries(projS2).reduce((acc, [k, v]) => {
        return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
      }, 0) - Object.entries(bilanS2).reduce((acc, [k, v]) => {
        return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
      }, 0);

      const capaciteInvest = solde + fluxS2Restant;

      // Somme des charges fixes hors transferts
      const chargesHorsTransferts = [
        "player_wages", "agent_wages", "managers_wage",
        "ground_maintenance", "shareholder_payouts", "shareholder_prize_money", "other_outgoings"
      ];
      const chargeFixeProj = chargesHorsTransferts.reduce((acc, k) => acc + Math.abs(projS2[k] ?? 0), 0);

      setResults({
        solde, bilanS1, bilanS2, moyS2, projS2, soldeFinS2, capaciteInvest, chargeFixeProj,
        weeksPlayed, weeksTotal, weeksRestantes, s1, s2
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

  // Simulation
  let simSoldeFin = null, simCapacite = null, simChargeFixe = null, simChargeSalaire = null;
  if (results && transfertSim && salaireSim) {
    const nWeeksRestantes = results.weeksRestantes || 0;
    const transfert = Number(transfertSim) || 0;
    const salaireHebdo = Number(salaireSim) || 0;
    simChargeSalaire = salaireHebdo * nWeeksRestantes;

    simChargeFixe = results.chargeFixeProj + simChargeSalaire;
    simSoldeFin = results.soldeFinS2 - transfert - simChargeSalaire;
    simCapacite = results.capaciteInvest - transfert - simChargeSalaire;
  }

  return (
    <div className="min-h-screen bg-[#181B23] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-white tracking-tight">Projection Financière Club Soccerverse</h1>
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
            <div className="mb-8">
              <h2 className="text-xl font-bold text-center mb-2 text-gray-100">Solde Actuel</h2>
              <div className="flex justify-center mb-6">
                <div className="rounded-xl bg-[#23263a] py-3 px-7 flex items-center gap-4 shadow border border-gray-800">
                  <span className="text-lg text-gray-300">Solde</span>
                  <span className="text-2xl font-bold text-green-300">{formatBigSVC(results.solde)}</span>
                </div>
              </div>
            </div>
            {/* Saison 1 */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 1</h2>
            <FinanceTable bilan={results.bilanS1} weeks={results.weeksTotal} />
            <div className="mt-2 mb-4 flex justify-end">
              <button
                className="text-sm underline text-gray-300 hover:text-green-300"
                onClick={() => setShowS1Detail(s => !s)}
              >
                {showS1Detail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
              </button>
            </div>
            {showS1Detail && <DetailWeeksTable weeks={results.s1} />}
            {/* Saison 2 */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 2 (en cours)</h2>
            <FinanceTable bilan={results.bilanS2} weeks={results.weeksPlayed} />
            <div className="mt-2 mb-4 flex justify-end">
              <button
                className="text-sm underline text-gray-300 hover:text-green-300"
                onClick={() => setShowS2Detail(s => !s)}
              >
                {showS2Detail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
              </button>
            </div>
            {showS2Detail && <DetailWeeksTable weeks={results.s2} />}
            {/* Projection */}
            <h2 className="text-lg font-bold mt-8 mb-3 text-yellow-300 text-center">Projection Fin Saison 2</h2>
            <FinanceTable bilan={results.projS2} weeks={results.weeksTotal} isProj />
            <div className="my-10 bg-[#23263a] rounded-xl shadow-lg p-7 border border-gray-800">
              <h2 className="text-xl font-bold mb-3 text-center text-green-300">Capacité d'investissement & Charges</h2>
              <div className="flex flex-col gap-2 items-center text-lg">
                <div>
                  <span className="text-gray-200">Solde projeté fin S2 : </span>
                  <span className="font-bold text-green-300">{formatBigSVC(results.soldeFinS2)}</span>
                </div>
                <div>
                  <span className="text-gray-200">Capacité d'investissement immédiate : </span>
                  <span className="font-bold text-yellow-300">{formatBigSVC(results.capaciteInvest)}</span>
                </div>
                <div>
                  <span className="text-gray-200">Charges fixes projetées sur S2 : </span>
                  <span className="font-bold text-red-300">{formatBigSVC(results.chargeFixeProj)}</span>
                </div>
              </div>
            </div>
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
                  <label className="block text-xs font-semibold mb-1 text-gray-300">Salaire hebdo (SVC/semaine)</label>
                  <input
                    type="number"
                    value={salaireSim}
                    onChange={e => setSalaireSim(e.target.value)}
                    className="border border-gray-600 rounded p-2 w-32 bg-[#202330] text-white"
                    placeholder="ex: 7000"
                    min="0"
                  />
                </div>
              </div>
              {(simSoldeFin !== null && simCapacite !== null && simChargeFixe !== null) && (
                <div className="flex flex-col gap-2 items-center text-lg">
                  <div>
                    <span className="text-gray-200">Solde projeté fin S2 : </span>
                    <span className="font-bold text-green-300">{formatBigSVC(simSoldeFin)}</span>
                  </div>
                  <div>
                    <span className="text-gray-200">Capacité d'investissement restante : </span>
                    <span className="font-bold text-yellow-300">{formatBigSVC(simCapacite)}</span>
                  </div>
                  <div>
                    <span className="text-gray-200">Nouvelles charges fixes projetées sur S2 : </span>
                    <span className="font-bold text-red-300">{formatBigSVC(simChargeFixe)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    (La charge salariale supplémentaire est calculée sur {results.weeksRestantes} semaine(s) restante(s))
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
