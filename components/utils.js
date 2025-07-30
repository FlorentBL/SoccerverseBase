// Champs d'affichage & mapping métier
export const FIELD_LABELS = {
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
export const FIELD_ORDER = [
  "cash_injection", "gate_receipts", "tv_revenue", "sponsor", "merchandise",
  "prize_money", "transfers_in", "other_income",
  "player_wages", "agent_wages", "managers_wage", "ground_maintenance",
  "transfers_out", "shareholder_payouts", "shareholder_prize_money", "other_outgoings"
];
export const COST_FIELDS = [
  "player_wages", "agent_wages", "managers_wage", "ground_maintenance",
  "transfers_out", "shareholder_payouts", "shareholder_prize_money", "other_outgoings"
];
export const NON_PROJECTED_FIELDS = [
  "cash_injection", "transfers_in", "transfers_out"
];

export function isMatchWeek(week) {
  return typeof week.player_wages === "number" && Math.abs(week.player_wages) > 0;
}

export function formatSVC(val, field) {
  if (typeof val !== "number") return "-";
  const absVal = Math.abs(val / 10000);
  const isCost = field && COST_FIELDS.includes(field);
  const sign = isCost && absVal > 0 ? "-" : "";
  return sign + absVal.toLocaleString("fr-FR", {
    maximumFractionDigits: absVal < 1000 ? 2 : 0,
    minimumFractionDigits: 0,
  }) + " $SVC";
}
export function formatBigSVC(val) {
  if (typeof val !== "number") return "-";
  return Math.round(val / 10000).toLocaleString("fr-FR") + " $SVC";
}
export function formatDate(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("fr-FR");
}

// Agrégation d'un tableau de semaines
export function aggregateBilan(weeks) {
  const sum = {};
  weeks.forEach(week => {
    Object.entries(week).forEach(([k, v]) => {
      if (typeof v === "number") sum[k] = (sum[k] ?? 0) + v;
    });
  });
  return sum;
}

// Projection : génère les “matchs projetés” (format identique à matchWeek)
export function generateProjectionDetail(matchWeeksS2, moyS2, nbJoursTotal) {
  // On projette chaque journée avec la moyenne S2 de chaque champ
  const nDom = Math.ceil(nbJoursTotal / 2);
  const nExt = nbJoursTotal - nDom;
  let idxDom = 0, idxExt = 0;
  const proj = [];
  for (let i = 0; i < nbJoursTotal; ++i) {
    const isHome = i % 2 === 0; // alternance domicile/extérieur
    const week = {};
    FIELD_ORDER.forEach(k => {
      if (NON_PROJECTED_FIELDS.includes(k)) {
        week[k] = 0; // rien à projeter en one-shot
      } else if (["gate_receipts", "sponsor", "merchandise"].includes(k)) {
        // que les matchs à domicile
        week[k] = isHome ? (moyS2[k] ?? 0) : 0;
      } else {
        // tous les matchs
        week[k] = moyS2[k] ?? 0;
      }
    });
    proj.push(week);
  }
  return proj;
}

// Simulation : applique la simulation sur le détail de projection
export function generateSimulatedDetail(projDetail, transfert, salaireHebdo) {
  // Deep copy pour ne pas modifier l’original
  const detail = JSON.parse(JSON.stringify(projDetail));
  for (let i = 0; i < detail.length; ++i) {
    detail[i].player_wages = (detail[i].player_wages ?? 0) - salaireHebdo;
    if (i === 0 && transfert > 0) detail[i].transfers_out = (detail[i].transfers_out ?? 0) + transfert;
  }
  return detail;
}

export function getWeekType(week) {
  if ((week.transfers_in || 0) > 0 || (week.transfers_out || 0) > 0) return "transfert";
  if ((week.cash_injection || 0) > 0) return "injection";
  if ((week.shareholder_payouts || 0) > 0 || (week.shareholder_prize_money || 0) > 0) return "dividende";
  if ((week.player_wages || 0) > 0) {
    return (week.gate_receipts || 0) > 0 ? "match_domicile" : "match_exterieur";
  }
  return "autre";
}
