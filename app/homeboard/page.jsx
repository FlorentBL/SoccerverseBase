"use client";
/**
 * HomeBoard — Vue ROI (Investissements, Gains, ROI)
 *
 * Hypothèses & exigences projet :
 * - Tailwind CSS disponible (conforme au reste du projet).
 * - JSON statiques : /club_mapping.json, /player_mapping.json.
 * - Route existante : POST /api/transactions { name } -> { result: Transaction[] }
 * - (À brancher) Route payouts : POST /api/payouts { name } -> { result: Payout[] }
 *
 * Qualité :
 * - Code minimaliste & robuste (gestion erreurs, états, UX claire).
 * - Nommage explicite, commentaires sur calculs sensibles.
 * - Pas de dépendances inutiles.
 *
 * Calculs :
 * - totalInvestedSVC : somme des sorties SVC d’achats d’influence (transactions.type === "buy" ou équivalent).
 * - totalRealizedSVC : somme des SVC entrants des ventes + payouts SVC reçus.
 * - unrealizedSVC : (optionnel) valorisation des positions courantes (si API / prix dispo).
 * - ROI (réalisé) = (totalRealizedSVC - totalInvestedSVC) / max(totalInvestedSVC, 1)
 * - ROI (incl. latent) = (totalRealizedSVC + unrealizedSVC - totalInvestedSVC) / max(totalInvestedSVC, 1)
 *
 * Note : Les catégories de payouts suivent la spec "Game Economy – How it Works".
 */

import React, { useEffect, useMemo, useState } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Types de données attendus côté API (documentation inline)
//
// Transaction (ex. /api/transactions result[]):
// {
//   name: "BuyerUser",              // utilisateur qui a initié l'opération
//   type: "buy" | "sell" | "...",   // type transaction (influence marché)
//   share: {                        // asset concerné
//     type: "club" | "player" | "user",
//     id: number | string
//   },
//   num: number,                    // quantité d'influence
//   svc_amount?: number,            // SVC dépensés (buy) ou reçus (sell) -> ***à fournir côté API***
//   txid?: string,                  // identifiant transaction (si utile)
//   other_name?: "SellerUser",      // contrepartie
//   date: number                    // epoch seconds
// }
//
// Payout (ex. /api/payouts result[]):
// {
//   category: "club_matchday" | "club_league_prize" | "club_cup_prize"
//           | "player_wage" | "player_bonus" | "player_league_prize" | "player_cup_prize"
//           | "manager_fee" | "agent_fee",
//   amount_svc: number,             // SVC reçus
//   ref?: { type: "club"|"player", id: number }, // entité liée (optionnel)
//   date: number                    // epoch seconds
// }
//
// Si vos endpoints diffèrent, adaptez les mappeurs `normalizeTransaction` / `normalizePayout` en bas.
// ───────────────────────────────────────────────────────────────────────────────

const SUGGESTIONS = ["SoccerversePortugal", "paul90c", "NachoHeras", "Luucasmb"];

export default function HomeBoard() {
  // Entrées & états
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // Données
  const [transactions, setTransactions] = useState([]); // normalisées
  const [payouts, setPayouts] = useState([]);           // normalisées
  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  // ───────────────────────────────────────────────────────────────────────────
  // Bootstrap des mappings
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const [c, p] = await Promise.all([fetch("/club_mapping.json"), fetch("/player_mapping.json")]);
        const [cv, pv] = await Promise.all([c.json(), p.json()]);
        setClubMap(cv || {});
        setPlayerMap(pv || {});
      } catch {
        // silencieux : la page reste utilisable sans mapping (affichera les id bruts)
      }
    };
    loadMaps();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Helpers d’affichage
  const fmtDate = (ts) => {
    if (!ts && ts !== 0) return "-";
    const d = new Date(Number(ts) * 1000);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("fr-FR");
  };
  const fmtSVC = (n) =>
    typeof n === "number"
      ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} SVC`
      : "-";

  const getClubName = (id) => clubMap?.[id]?.name || clubMap?.[id]?.n || String(id);
  const getPlayerName = (id) => {
    const p = playerMap?.[id];
    if (!p) return String(id);
    return p.name || [p.f, p.s].filter(Boolean).join(" ");
  };
  const shareLabel = (s) => {
    if (!s || !s.id) return "-";
    if (s.type === "club") return `Club · ${getClubName(s.id)}`;
    if (s.type === "player") return `Joueur · ${getPlayerName(s.id)}`;
    if (s.type === "user") return `Utilisateur · ${s.id}`;
    return String(s.id);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Chargement des données utilisateur (transactions + payouts)
  const handleSubmit = async (e, nameArg) => {
    e?.preventDefault();
    const name = (nameArg ?? username).trim();
    if (!name) return;

    setUsername(name);
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const [txRes, pyRes] = await Promise.allSettled([
        fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }),
        // ⚠️ À brancher côté backend — voir "Guide d’intégration API" en bas de page
        fetch("/api/payouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }),
      ]);

      // Transactions
      if (txRes.status === "fulfilled" && txRes.value.ok) {
        const j = await txRes.value.json();
        const arr = Array.isArray(j?.result) ? j.result : [];
        setTransactions(arr.map(normalizeTransaction));
      } else {
        const msg =
          txRes.status === "rejected"
            ? String(txRes.reason || "Erreur réseau (transactions)")
            : `Erreur transactions (${txRes.value.status})`;
        // On n’arrête pas tout : on affiche l’erreur mais la page reste interactive
        console.error(msg);
        setError((prev) => prev || msg);
        setTransactions([]);
      }

      // Payouts
      if (pyRes.status === "fulfilled") {
        if (pyRes.value.ok) {
          const j = await pyRes.value.json();
          const arr = Array.isArray(j?.result) ? j.result : [];
          setPayouts(arr.map(normalizePayout));
        } else {
          // Route absente ou non branchée : ce n’est pas bloquant
          console.warn("Payouts endpoint non disponible: status", pyRes.value.status);
          setPayouts([]);
        }
      } else {
        console.warn("Payouts fetch error:", pyRes.reason);
        setPayouts([]);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Erreur lors du chargement.");
      setTransactions([]);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Agrégations & KPI
  const {
    totalInvestedSVC,
    totalRealizedFromTradesSVC,
    totalPayoutsSVC,
    roiRealized,
    categoriesBreakdown,
    missingMoneyFields,
  } = useMemo(() => computeKPIs(transactions, payouts), [transactions, payouts]);

  // (Optionnel) Valorisation latente si vous avez des prix de marché courants
  // const unrealizedSVC = ...
  // const roiWithUnrealized = ...

  // Tableaux détaillés
  const buyTx = useMemo(() => transactions.filter((t) => t.type === "buy"), [transactions]);
  const sellTx = useMemo(() => transactions.filter((t) => t.type === "sell"), [transactions]);

  // ───────────────────────────────────────────────────────────────────────────
  // UI
  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">HomeBoard — ROI</h1>

        {/* Barre de recherche */}
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur Soccerverse"
            className="rounded-lg p-2 bg-gray-900 border border-gray-700 text-white"
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Analyser"}
          </button>
        </form>

        {/* Suggestions */}
        <div className="mb-6">
          <p className="mb-2 text-sm text-gray-300">Suggestions :</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => handleSubmit(e, s)}
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Erreurs */}
        {!!error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-300">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        {searched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <KpiCard title="Investi (achats influence)" value={fmtSVC(totalInvestedSVC)} />
            <KpiCard title="Gains réalisés (ventes + payouts)" value={fmtSVC(totalRealizedFromTradesSVC + totalPayoutsSVC)} />
            <KpiCard
              title="ROI réalisé"
              value={
                isFinite(roiRealized)
                  ? `${(roiRealized * 100).toFixed(2)} %`
                  : "-"
              }
              accent={roiRealized >= 0 ? "pos" : "neg"}
            />
          </div>
        )}

        {/* Alerte si montants SVC manquent dans les transactions */}
        {searched && missingMoneyFields && (
          <div className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950/30 p-4 text-yellow-300">
            Certaines transactions ne fournissent pas <b>svc_amount</b>. Le calcul du ROI réalisé peut être partiel.
            <br />
            Consultez le <b>Guide d’intégration API</b> au bas de la page pour exposer ces montants côté backend.
          </div>
        )}

        {/* Breakdown par catégorie de payouts */}
        {searched && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Répartition des gains (payouts)</h2>
            {payouts.length === 0 ? (
              <div className="text-gray-400">Aucun payout disponible (route /api/payouts non branchée ou aucun gain).</div>
            ) : (
              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3">Catégorie</th>
                      <th className="text-right py-2 px-3">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {Object.entries(categoriesBreakdown).map(([cat, amt]) => (
                      <tr key={cat} className="hover:bg-white/5">
                        <td className="py-2 px-3">{labelCategory(cat)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(amt)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-900/40 font-semibold">
                      <td className="py-2 px-3">Total Payouts</td>
                      <td className="py-2 px-3 text-right">{fmtSVC(totalPayoutsSVC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Détails Achats */}
        {searched && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Achats d’influence</h2>
            {buyTx.length === 0 ? (
              <div className="text-gray-400">Aucun achat trouvé.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Asset</th>
                        <th className="text-right py-2 px-3">Quantité</th>
                        <th className="text-right py-2 px-3">Montant (SVC)</th>
                        <th className="text-left py-2 px-3">Contrepartie</th>
                        <th className="text-left py-2 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {buyTx.map((t, i) => (
                        <tr key={`${t.txid || "buy"}-${i}`} className="hover:bg-white/5">
                          <td className="py-2 px-3">{shareLabel(t.share)}</td>
                          <td className="py-2 px-3 text-right">{t.num ?? "-"}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(t.svc_amount)}</td>
                          <td className="py-2 px-3">{t.other_name || "-"}</td>
                          <td className="py-2 px-3">{fmtDate(t.date)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-900/40 font-semibold">
                        <td className="py-2 px-3">Total investi</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(totalInvestedSVC)}</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Détails Ventes */}
        {searched && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-3">Ventes d’influence</h2>
            {sellTx.length === 0 ? (
              <div className="text-gray-400">Aucune vente trouvée.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="text-left py-2 px-3">Asset</th>
                        <th className="text-right py-2 px-3">Quantité</th>
                        <th className="text-right py-2 px-3">Montant (SVC)</th>
                        <th className="text-left py-2 px-3">Contrepartie</th>
                        <th className="text-left py-2 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {sellTx.map((t, i) => (
                        <tr key={`${t.txid || "sell"}-${i}`} className="hover:bg-white/5">
                          <td className="py-2 px-3">{shareLabel(t.share)}</td>
                          <td className="py-2 px-3 text-right">{t.num ?? "-"}</td>
                          <td className="py-2 px-3 text-right">{fmtSVC(t.svc_amount)}</td>
                          <td className="py-2 px-3">{t.other_name || "-"}</td>
                          <td className="py-2 px-3">{fmtDate(t.date)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-900/40 font-semibold">
                        <td className="py-2 px-3">Total encaissé (ventes)</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(totalRealizedFromTradesSVC)}</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Guide d’intégration API (auto-documenté dans la page) */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-3">Guide d’intégration API (HomeBoard)</h2>
          <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-4 text-sm leading-relaxed text-gray-200">
            <p className="mb-2">
              Pour des KPI exacts, exposez côté backend les montants SVC dans les transactions et branchez la route des payouts.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <b>/api/transactions</b> (existant) — idéalement chaque item contient <code>svc_amount</code> :
                <pre className="mt-2 p-3 bg-black/40 rounded text-gray-100 overflow-auto">
{`POST /api/transactions
{ "name": "UserName" }
=> { "result": [
  {
    "name": "UserName",
    "type": "buy" | "sell",
    "share": { "type": "club"|"player"|"user", "id": 5902 },
    "num": 1000,
    "svc_amount": 12345.67,     // SVC dépensés (buy) / reçus (sell)
    "other_name": "Counterparty",
    "date": 1737481200
  }
] }`}
                </pre>
              </li>
              <li>
                <b>/api/payouts</b> (à créer) — agrégé ou détaillé, min. par ligne :
                <pre className="mt-2 p-3 bg-black/40 rounded text-gray-100 overflow-auto">
{`POST /api/payouts
{ "name": "UserName" }
=> { "result": [
  { "category": "club_matchday",      "amount_svc": 12.34, "ref": {"type":"club","id":5902}, "date": 1737481200 },
  { "category": "player_wage",        "amount_svc":  2.20, "ref": {"type":"player","id":123}, "date": 1737481200 },
  { "category": "player_bonus",       "amount_svc":  0.55, "ref": {"type":"player","id":123}, "date": 1737481200 },
  { "category": "club_league_prize",  "amount_svc": 99.99, "ref": {"type":"club","id":5902}, "date": 1739000000 },
  { "category": "manager_fee",        "amount_svc":  0.40, "date": 1737481200 }
] }`}
                </pre>
                <p className="mt-2 text-gray-300">
                  Les catégories peuvent suivre la spec&nbsp;: <i>club_matchday</i>, <i>club_league_prize</i>, <i>club_cup_prize</i>,
                  <i> player_wage</i>, <i>player_bonus</i>, <i>player_league_prize</i>, <i>player_cup_prize</i>, <i>manager_fee</i>, <i>agent_fee</i>.
                </p>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Petits composants

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

// ───────────────────────────────────────────────────────────────────────────────
// Mappage catégorie -> label lisible

function labelCategory(key) {
  const MAP = {
    club_matchday: "Club · Matchday (1%)",
    club_league_prize: "Club · Prime championnat (10%)",
    club_cup_prize: "Club · Prime coupe (10%)",
    player_wage: "Joueur · Salaire (0,2%)",
    player_bonus: "Joueur · Bonus (titulaire/but/passe/CS)",
    player_league_prize: "Joueur · Prime championnat (0,1%)",
    player_cup_prize: "Joueur · Prime coupe (0,1%)",
    manager_fee: "Manager (TV ~0,0004%)",
    agent_fee: "Agent (0,002%)",
  };
  return MAP[key] || key;
}

// ───────────────────────────────────────────────────────────────────────────────
// Normalisation des payloads API pour isoler la logique de calcul

function normalizeTransaction(raw) {
  // Adaptez ici si votre backend diffère
  return {
    name: raw?.name ?? "",
    type: raw?.type ?? "", // "buy" | "sell" | ...
    share: raw?.share ?? null,
    num: typeof raw?.num === "number" ? raw.num : null,
    svc_amount: typeof raw?.svc_amount === "number" ? raw.svc_amount : null,
    other_name: raw?.other_name ?? "",
    date: typeof raw?.date === "number" ? raw.date : null,
    txid: raw?.txid ?? undefined,
  };
}

function normalizePayout(raw) {
  return {
    category: raw?.category ?? "unknown",
    amount_svc: typeof raw?.amount_svc === "number" ? raw.amount_svc : 0,
    ref: raw?.ref ?? null,
    date: typeof raw?.date === "number" ? raw.date : null,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Calculs KPI — tolérant aux données partielles.

function computeKPIs(transactions, payouts) {
  let invested = 0; // SVC sortants pour achats
  let realizedFromTrades = 0; // SVC entrants via ventes
  let missingMoneyFields = false;

  for (const t of transactions) {
    if (t.type === "buy") {
      if (typeof t.svc_amount === "number") invested += Math.max(0, t.svc_amount);
      else missingMoneyFields = true;
    } else if (t.type === "sell") {
      if (typeof t.svc_amount === "number") realizedFromTrades += Math.max(0, t.svc_amount);
      else missingMoneyFields = true;
    }
  }

  const categoriesBreakdown = {};
  let totalPayouts = 0;
  for (const p of payouts) {
    const key = p.category || "unknown";
    categoriesBreakdown[key] = (categoriesBreakdown[key] ?? 0) + (p.amount_svc || 0);
    totalPayouts += p.amount_svc || 0;
  }

  const denom = Math.max(invested, 1); // éviter division par zéro
  const roiRealized = (realizedFromTrades + totalPayouts - invested) / denom;

  return {
    totalInvestedSVC: round2(invested),
    totalRealizedFromTradesSVC: round2(realizedFromTrades),
    totalPayoutsSVC: round2(totalPayouts),
    roiRealized: Number.isFinite(roiRealized) ? roiRealized : 0,
    categoriesBreakdown,
    missingMoneyFields,
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
