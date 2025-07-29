"use client";
import React, { useState } from "react";

// Libellés pour chaque champ financier
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

// Ordre d’affichage (et inclusion) des champs financiers
const FIELD_ORDER = [
  "cash_injection", "gate_receipts", "tv_revenue", "sponsor", "merchandise",
  "prize_money", "transfers_in", "other_income",
  "player_wages", "agent_wages", "managers_wage", "ground_maintenance",
  "transfers_out", "shareholder_payouts", "shareholder_prize_money", "other_outgoings"
];

// Formatage montant en SVC, division par 10 000 pour coller à l’UI officielle
function formatSVC(val) {
  if (typeof val !== "number") return "-";
  const corrected = val / 10000;
  return corrected.toLocaleString("fr-FR", {
    maximumFractionDigits: corrected < 1000 ? 2 : 0,
    minimumFractionDigits: 0,
  }) + " $SVC";
}

export default function ClubFinancesPage() {
  const [clubId, setClubId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [data, setData] = useState([]);
  const [bilan, setBilan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData([]);
    setBilan(null);

    try {
      const url = `/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${seasonId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur API: " + res.status);
      const weeks = await res.json();
      setData(weeks);

      // Agrégation saisonnière
      const sum = {};
      weeks.forEach(week => {
        Object.entries(week).forEach(([k, v]) => {
          if (typeof v === "number") sum[k] = (sum[k] ?? 0) + v;
        });
      });
      setBilan(sum);
    } catch (err) {
      setError("Impossible de récupérer les données : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Test – Bilan financier d’un club Soccerverse</h1>
      <form className="flex gap-2 mb-6 items-end" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold mb-1">Club ID</label>
          <input
            type="number"
            value={clubId}
            onChange={e => setClubId(e.target.value)}
            className="border rounded p-2 w-32"
            placeholder="ex: 5902"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Saison</label>
          <input
            type="number"
            value={seasonId}
            onChange={e => setSeasonId(e.target.value)}
            className="border rounded p-2 w-20"
            placeholder="ex: 1"
            required
          />
        </div>
        <button type="submit" className="bg-black text-white rounded px-4 py-2">Voir bilan</button>
      </form>

      {loading && <div>Chargement…</div>}
      {error && <div className="text-red-500">{error}</div>}

      {bilan && (
        <div className="bg-gray-800 text-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Bilan saison {seasonId} – Club {clubId}</h2>
          <table className="w-full">
            <tbody>
              {FIELD_ORDER.map(k =>
                <tr key={k} className="border-b border-gray-700">
                  <td className="py-1 pr-4">{FIELD_LABELS[k] || k}</td>
                  <td className="py-1 text-right">{formatSVC(bilan[k] ?? 0)}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-6 flex justify-end">
            <button
              className="text-sm underline"
              onClick={() => setShowDetail(s => !s)}
            >
              {showDetail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
            </button>
          </div>
        </div>
      )}

      {showDetail && data.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 text-xs">
          <h3 className="font-bold mb-2">Détail par semaine</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr>
                  <th className="px-2 py-1 border-b text-left">Week</th>
                  {FIELD_ORDER.map(k => (
                    <th key={k} className="px-2 py-1 border-b">{FIELD_LABELS[k] || k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((w, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1 border-b">{w.game_week}</td>
                    {FIELD_ORDER.map(k => (
                      <td key={k} className="px-2 py-1 border-b text-right">{formatSVC(w[k] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
