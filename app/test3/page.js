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
  "player_wages",
  "agent_wages",
  "managers_wage",
  "ground_maintenance",
  "transfers_out",
  "shareholder_payouts",
  "shareholder_prize_money",
  "other_outgoings"
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
  const corrected = val / 10000;
  if (corrected > 1_000_000)
    return (corrected / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " M $SVC";
  if (corrected > 10_000)
    return (corrected / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " k $SVC";
  return corrected.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " $SVC";
}

export default function ClubProjectionPage() {
  const [clubId, setClubId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Appel API et analyse
  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults(null);
    setErr("");
    setLoading(true);
    try {
      // Fetch solde actuel
      const clubRes = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      if (!clubRes.ok) throw new Error("Erreur solde club");
      const clubData = await clubRes.json();
      const solde = clubData.items?.[0]?.balance ?? 0;

      // Fetch bilans S1 & S2
      const [s1, s2] = await Promise.all([1, 2].map(async season => {
        const res = await fetch(`https://services.soccerverse.com/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${season}`);
        if (!res.ok) throw new Error(`Erreur bilan S${season}`);
        return await res.json();
      }));

      // Analyse S1
      const bilanS1 = aggregateBilan(s1);
      // Analyse S2
      const bilanS2 = aggregateBilan(s2);

      // Projection S2 : moyenne * semaines prévues (on suppose même nombre de journées que déjà jouées, à ajuster si besoin)
      const weeksPlayed = s2.length;
      const weeksTotal = weeksPlayed * 2; // À AJUSTER si tu veux mettre un nombre précis de semaines S2

      const moyS2 = {};
      FIELD_ORDER.forEach(k => {
        moyS2[k] = weeksPlayed > 0 ? (bilanS2[k] ?? 0) / weeksPlayed : 0;
      });
      const projS2 = {};
      FIELD_ORDER.forEach(k => {
        projS2[k] = moyS2[k] * weeksTotal;
      });

      // Solde projeté fin S2
      const soldeFinS2 = solde + Object.entries(projS2).reduce((acc, [k, v]) => {
        // Revenu = +, coût = -
        return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
      }, 0);

      // Capacité investissement : solde projeté + flux net S2 restants
      const fluxS2Restant = Object.entries(projS2).reduce((acc, [k, v]) => {
        return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
      }, 0) - Object.entries(bilanS2).reduce((acc, [k, v]) => {
        return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
      }, 0);

      const capaciteInvest = solde + fluxS2Restant;

      // Capacité salariale : estimation en fonction du solde projeté restant après dépenses fixes hors transferts
      const chargesHorsTransferts = ["player_wages", "agent_wages", "managers_wage", "ground_maintenance", "shareholder_payouts", "shareholder_prize_money", "other_outgoings"];
      const chargeFixeProj = chargesHorsTransferts.reduce((acc, k) => acc + Math.abs(projS2[k] ?? 0), 0);

      setResults({
        solde, bilanS1, bilanS2, moyS2, projS2, soldeFinS2, capaciteInvest, chargeFixeProj, weeksPlayed, weeksTotal
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Agrège les semaines en saison
  function aggregateBilan(weeks) {
    const sum = {};
    weeks.forEach(week => {
      Object.entries(week).forEach(([k, v]) => {
        if (typeof v === "number") sum[k] = (sum[k] ?? 0) + v;
      });
    });
    return sum;
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
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 1</h2>
            <FinanceTable bilan={results.bilanS1} />
            <h2 className="text-lg font-bold mt-8 mb-3 text-gray-200 text-center">Bilan Saison 2 (en cours)</h2>
            <FinanceTable bilan={results.bilanS2} weeks={results.weeksPlayed} />
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
          </>
        )}
      </div>
    </div>
  );
}

// Composant tableau synthèse finances
function FinanceTable({ bilan, weeks, isProj }) {
  return (
    <div className="bg-[#23263a] text-white rounded-xl shadow-lg p-5 mb-8 border border-gray-800">
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
