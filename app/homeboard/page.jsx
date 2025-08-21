"use client";

/**
 * HomeBoard — Positions & Payouts (Lifetime)
 *
 * - Récupère les positions actuelles via /api/user_share_balances (JSON-RPC get_user_share_balances)
 * - Récupère tout l’historique des mouvements via /api/user_balance_sheet
 * - Calcule le total des "payouts" (dividendes, salaires, bonus, manager/agent) UNIQUEMENT
 *   pour les actifs encore détenus aujourd’hui (clubs & joueurs).
 * - Montants upstream en base-unit → conversion SVC = amount / 10000
 */

import React, { useMemo, useState } from "react";

const BASE_UNIT = 10000;
const toSVC = (x) => (typeof x === "number" ? x / BASE_UNIT : 0);

function fmtSVC(n) {
  if (typeof n !== "number" || !isFinite(n)) return "-";
  return `${n.toLocaleString("fr-FR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} SVC`;
}

function fmtQty(n) {
  if (typeof n !== "number" || !isFinite(n)) return "-";
  return n.toLocaleString("fr-FR");
}

function labelCategory(key) {
  const MAP = {
    "dividend (match day income)": "Gains · Revenus du match",
    "dividend (league prize)": "Gains · Prime championnat",
    "dividend (cup prize)": "Gains · Prime coupe",
    "dividend (players wage)": "Joueur · Salaire",
    "dividend (playing bonus)": "Joueur · Bonus (jeu)",
    "dividend (goal bonus)": "Joueur · Bonus (but)",
    "dividend (assist bonus)": "Joueur · Bonus (passe)",
    "dividend (clean sheet bonus)": "Joueur · Bonus (clean sheet)",
    "manager wage": "Manager",
    "agent wage": "Agent",
  };
  if (MAP[key]) return MAP[key];
  if (key?.startsWith("dividend (")) return "Dividende (autre)";
  return key || "Inconnu";
}

function isPayout(type) {
  if (!type) return false;
  if (type.startsWith("dividend (")) return true;
  return type === "manager wage" || type === "agent wage";
}

function renderRef(other_type, other_id) {
  if (!other_type || !other_id) return "-";
  if (other_type === "club") {
    const href = `https://play.soccerverse.com/club/${other_id}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-indigo-400 hover:underline"
      >
        Club #{other_id}
      </a>
    );
  }
  if (other_type === "player") {
    const href = `https://play.soccerverse.com/player/${other_id}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-indigo-400 hover:underline"
      >
        Joueur #{other_id}
      </a>
    );
  }
  return `${other_type} #${other_id}`;
}

export default function HomeBoard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [positions, setPositions] = useState([]); // [{type:"club"|"player", id:number, qty:{total,available,reserved}}]
  const [sheet, setSheet] = useState([]); // raw items (balance sheet)

  async function handleSubmit(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setPositions([]);
    setSheet([]);

    try {
      // 1) positions actuelles
      const pRes = await fetch("/api/user_share_balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!pRes.ok) {
        const j = await pRes.json().catch(() => ({}));
        throw new Error(j?.error || j?.message || `Erreur positions (${pRes.status})`);
      }
      const pJson = await pRes.json();
      const pos = Array.isArray(pJson?.result?.data) ? pJson.result.data : [];
      const normPos = [];
      for (const it of pos) {
        const share = it?.share || {};
        const bal = it?.balance || {};
        if (share.club) {
          normPos.push({
            type: "club",
            id: Number(share.club),
            qty: {
              total: Number(bal.total ?? 0),
              available: Number(bal.available ?? 0),
              reserved: Number(bal.reserved ?? 0),
            },
          });
        } else if (share.player) {
          normPos.push({
            type: "player",
            id: Number(share.player),
            qty: {
              total: Number(bal.total ?? 0),
              available: Number(bal.available ?? 0),
              reserved: Number(bal.reserved ?? 0),
            },
          });
        }
      }
      setPositions(normPos);

      // 2) historique complet (défile toutes les pages côté route)
      const sRes = await fetch("/api/user_balance_sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!sRes.ok) {
        const j = await sRes.json().catch(() => ({}));
        throw new Error(j?.error || j?.message || `Erreur historique (${sRes.status})`);
      }
      const sJson = await sRes.json();
      const items = Array.isArray(sJson?.result) ? sJson.result : [];
      setSheet(items);
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }

  // Sets utilitaires
  const posSet = useMemo(() => {
    const s = new Set();
    for (const p of positions) s.add(`${p.type}:${p.id}`);
    return s;
  }, [positions]);

  // Payouts lifetime filtrés sur positions actuelles
  const { totalPayoutsSVC, breakdownRows } = useMemo(() => {
    if (!sheet.length || !posSet.size) {
      return { totalPayoutsSVC: 0, breakdownRows: [] };
    }

    const byKey = new Map(); // key asset → montant cumulé
    let total = 0;

    for (const r of sheet) {
      const { type, other_type, other_id } = r || {};
      if (!isPayout(type)) continue;
      if (!other_type || !other_id) continue;

      const key = `${other_type}:${other_id}`;
      if (!posSet.has(key)) continue; // on ne garde que si on détient l’actif aujourd’hui

      const v = toSVC(r.amount);
      total += v;
      byKey.set(key, (byKey.get(key) || 0) + v);
    }

    // rows pour table
    const rows = [...byKey.entries()]
      .map(([key, amt]) => {
        const [t, idStr] = key.split(":");
        return { key, other_type: t, other_id: Number(idStr), amount_svc: Math.round(amt * 1e4) / 1e4 };
      })
      .sort((a, b) => b.amount_svc - a.amount_svc);

    return {
      totalPayoutsSVC: Math.round(total * 1e4) / 1e4,
      breakdownRows: rows,
    };
  }, [sheet, posSet]);

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          HomeBoard — Payouts “lifetime” sur positions actuelles
        </h1>

        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur Soccerverse"
            className="flex-1 rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Analyser"}
          </button>
        </form>

        {!!error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-300">
            {error}
          </div>
        )}

        {searched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <KpiCard title="Positions suivies" value={positions.length} />
            <KpiCard title="Payouts cumulés (lifetime)" value={fmtSVC(totalPayoutsSVC)} accent="pos" />
            <KpiCard title="Dernier bloc (source)" value="gsppub + balance_sheet" />
          </div>
        )}

        {/* Positions actuelles */}
        {searched && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Positions actuelles</h2>
            {positions.length === 0 ? (
              <div className="text-gray-400">Aucune position.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Actif</th>
                        <th className="text-right py-2 px-3">Total</th>
                        <th className="text-right py-2 px-3">Disponible</th>
                        <th className="text-right py-2 px-3">Réservé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {positions.map((p) => (
                        <tr key={`${p.type}:${p.id}`} className="hover:bg-white/5">
                          <td className="py-2 px-3">{renderRef(p.type, p.id)}</td>
                          <td className="py-2 px-3 text-right">{fmtQty(p.qty.total)}</td>
                          <td className="py-2 px-3 text-right">{fmtQty(p.qty.available)}</td>
                          <td className="py-2 px-3 text-right">{fmtQty(p.qty.reserved)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Payouts lifetime ventilés par actif détenu */}
        {searched && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-3">Payouts cumulés (uniquement sur actifs détenus)</h2>
            {breakdownRows.length === 0 ? (
              <div className="text-gray-400">Aucun payout lié aux positions actuelles.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Actif</th>
                        <th className="text-right py-2 px-3">Montant cumulé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {breakdownRows.map((r) => (
                        <tr key={r.key} className="hover:bg-white/5">
                          <td className="py-2 px-3">{renderRef(r.other_type, r.other_id)}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(r.amount_svc)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-900/40 font-semibold">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(totalPayoutsSVC)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, accent }) {
  const ring =
    accent === "pos" ? "ring-emerald-500/30" : accent === "neg" ? "ring-red-500/30" : "ring-gray-500/20";
  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-900/40 p-4 ring-1 ${ring}`}>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
