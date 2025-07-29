"use client";
import React, { useState } from "react";

// Libellés des champs financiers
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

function formatSVC(val) {
  if (typeof val !== "number") return "-";
  const corrected = val / 10000;
  return corrected.toLocaleString("fr-FR", {
    maximumFractionDigits: corrected < 1000 ? 2 : 0,
    minimumFractionDigits: 0,
  }) + " $SVC";
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("fr-FR");
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

export default function ClubFinancesPage() {
  const [clubId, setClubId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [data, setData] = useState([]);
  const [bilan, setBilan] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData([]);
    setBilan(null);
    setBalance(null);

    try {
      // Récupération de la balance club (via /clubs/detailed)
      const clubsRes = await fetch(`https://services.soccerverse.com/api/clubs/detailed?club_id=${clubId}`);
      if (!clubsRes.ok) throw new Error("Erreur API clubs: " + clubsRes.status);
      const clubsJson = await clubsRes.json();
      const foundClub = Array.isArray(clubsJson.items) ? clubsJson.items[0] : (clubsJson.items ?? [])[0];
      setBalance(foundClub && typeof foundClub.balance === "number" ? foundClub.balance : null);

      // Récupération bilan détaillé
      const url = `/api/club_balance_sheet/weeks?club_id=${clubId}&season_id=${seasonId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur API bilan: " + res.status);
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
    <div className="min-h-screen bg-[#181B23] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-white tracking-tight">Bilan Financier – Soccerverse</h1>
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
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Saison</label>
            <input
              type="number"
              value={seasonId}
              onChange={e => setSeasonId(e.target.value)}
              className="border border-gray-600 rounded p-2 w-20 bg-[#202330] text-white"
              placeholder="ex: 1"
              required
            />
          </div>
          <button type="submit" className="bg-green-500 text-black font-bold rounded px-5 py-2 shadow hover:bg-green-400 transition">
            Voir bilan
          </button>
        </form>
        {loading && <div className="text-white my-8 text-center">Chargement…</div>}
        {error && <div className="text-red-400 my-8 text-center">{error}</div>}

        {(balance !== null) &&
          <div className="flex justify-center mb-4">
            <div className="rounded-xl bg-[#23263a] py-3 px-7 flex items-center gap-4 shadow border border-gray-800">
              <span className="text-lg text-gray-300">Solde global</span>
              <span className="text-2xl font-bold text-green-300">{formatBigSVC(balance)}</span>
            </div>
          </div>
        }

        {bilan && (
          <div className="bg-[#23263a] text-white rounded-xl shadow-lg p-7 mb-8 border border-gray-800">
            <h2 className="text-xl font-bold mb-5 text-center text-gray-100">
              Bilan saison {seasonId} – Club {clubId}
            </h2>
            <table className="w-full text-base">
              <tbody>
                {FIELD_ORDER.map(k =>
                  <tr key={k} className="border-b border-[#2d3146] hover:bg-[#21262b] transition">
                    <td className="py-1 pr-4 text-gray-200">{FIELD_LABELS[k] || k}</td>
                    <td className="py-1 text-right font-mono">{formatSVC(bilan[k] ?? 0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-6 flex justify-end">
              <button
                className="text-sm underline text-gray-300 hover:text-green-300"
                onClick={() => setShowDetail(s => !s)}
              >
                {showDetail ? "Masquer le détail par manche" : "Afficher le détail par manche"}
              </button>
            </div>
          </div>
        )}

        {showDetail && data.length > 0 && (
          <div className="bg-[#23263a] rounded-xl shadow p-5 text-xs border border-gray-800 mb-8">
            <h3 className="font-bold mb-3 text-gray-200">Détail par semaine</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-[#363a57] text-xs">
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
                  {data.map((w, i) => (
                    <tr key={i} className={i % 2 ? "bg-[#222436]" : "bg-[#1b1e29]"}>
                      <td className="px-2 py-1 border-b border-[#363a57]">{w.game_week}</td>
                      <td className="px-2 py-1 border-b border-[#363a57]">{formatDate(w.date)}</td>
                      {FIELD_ORDER.map(k => (
                        <td key={k} className="px-2 py-1 border-b border-[#363a57] text-right font-mono">{formatSVC(w[k] ?? 0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
