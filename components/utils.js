// Champs d'affichage & mapping métier
export const FIELD_LABELS = {
  fr: {
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
  },
  en: {
    cash_injection: "Cash injection",
    gate_receipts: "Gate receipts",
    tv_revenue: "TV revenue",
    sponsor: "Sponsors",
    merchandise: "Merchandise",
    prize_money: "Prize money",
    transfers_in: "Transfers in",
    other_income: "Other income",
    player_wages: "Player wages",
    agent_wages: "Agent wages",
    managers_wage: "Manager wage",
    ground_maintenance: "Ground maintenance",
    transfers_out: "Transfers out",
    shareholder_payouts: "Shareholder payouts",
    shareholder_prize_money: "Shareholder prize money",
    other_outgoings: "Other outgoings"
  },
  it: {
    cash_injection: "Finanziamento",
    gate_receipts: "Incassi biglietti",
    tv_revenue: "Introiti TV",
    sponsor: "Sponsor",
    merchandise: "Merchandising",
    prize_money: "Premi competizioni",
    transfers_in: "Trasferimenti in entrata",
    other_income: "Altri ricavi",
    player_wages: "Stipendi giocatori",
    agent_wages: "Stipendi agenti",
    managers_wage: "Stipendio allenatore",
    ground_maintenance: "Manutenzione stadio",
    transfers_out: "Trasferimenti in uscita",
    shareholder_payouts: "Dividendi",
    shareholder_prize_money: "Premi azionisti",
    other_outgoings: "Altre uscite"
  }
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

const LOCALES = { fr: "fr-FR", en: "en-US", it: "it-IT", es: "es-ES" };

export function formatSVC(val, field, lang = "fr") {
  if (typeof val !== "number") return "-";
  const absVal = Math.abs(val / 10000);
  const isCost = field && COST_FIELDS.includes(field);
  const sign = isCost && absVal > 0 ? "-" : "";
  return (
    sign +
    absVal.toLocaleString(LOCALES[lang] || LOCALES.fr, {
      maximumFractionDigits: absVal < 1000 ? 2 : 0,
      minimumFractionDigits: 0,
    }) +
    " $SVC"
  );
}

export function formatBigSVC(val, lang = "fr") {
  if (typeof val !== "number") return "-";
  return (
    Math.round(val / 10000).toLocaleString(LOCALES[lang] || LOCALES.fr) +
    " $SVC"
  );
}

export function formatDate(timestamp, lang = "fr") {
  if (!timestamp) return "-";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString(LOCALES[lang] || LOCALES.fr);
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

// Projection : génère les semaines futures en séparant domicile et extérieur
export function generateProjectionDetail(matchWeeksS2, nbJoursRestants) {
  // 1. Extraire les matchs à domicile
  const matchDom = matchWeeksS2.filter(w => (w.gate_receipts ?? 0) > 0);

  // 2. Calculer les moyennes à domicile
  const moyDom = {};
  ["gate_receipts", "sponsor", "merchandise"].forEach(k => {
    moyDom[k] = matchDom.length > 0
      ? matchDom.reduce((acc, w) => acc + (w[k] ?? 0), 0) / matchDom.length
      : 0;
  });

  // 3. Calculer la moyenne tous matchs confondus (y compris droits TV)
  const moyAll = {};
  FIELD_ORDER.forEach(k => {
    const relevantWeeks = matchWeeksS2.filter(w => typeof w[k] === "number");
    moyAll[k] = relevantWeeks.length > 0
      ? relevantWeeks.reduce((acc, w) => acc + w[k], 0) / relevantWeeks.length
      : 0;
  });

  // Dernier salaire joueurs connu
  const lastPlayerWages = matchWeeksS2.length > 0
    ? matchWeeksS2[matchWeeksS2.length - 1].player_wages || 0
    : 0;

  // 4. Générer les projections alternant domicile / extérieur
  const proj = [];
  for (let i = 0; i < nbJoursRestants; ++i) {
    const isHome = (matchWeeksS2.length + i) % 2 === 0;
    const week = {};

    FIELD_ORDER.forEach(k => {
      if (NON_PROJECTED_FIELDS.includes(k)) {
        week[k] = 0;
      } else if (k === "player_wages") {
        week[k] = lastPlayerWages;
      } else if (["gate_receipts", "sponsor", "merchandise"].includes(k)) {
        week[k] = isHome ? moyDom[k] : 0;
      } else {
        week[k] = moyAll[k];
      }
    });

    proj.push(week);
  }

  return proj;
}


// Simulation : applique la simulation sur les projections à partir d'un index donné
export function generateSimulatedDetail(projDetail, startIndex, transfert, salaireHebdo) {
  const salaire = Number(salaireHebdo) || 0;
  const montantTransfert = Number(transfert) || 0;
  const detail = JSON.parse(JSON.stringify(projDetail));
  for (let i = startIndex; i < detail.length; ++i) {
    detail[i].player_wages = (detail[i].player_wages ?? 0) + salaire;
    if (i === startIndex && montantTransfert > 0) {
      detail[i].transfers_out = (detail[i].transfers_out ?? 0) + montantTransfert;
    }
  }
  return detail;
}


export function getWeekType(week) {
  if ((week.prize_money || 0) > 0) return "competition";
  if ((week.transfers_in || 0) > 0 || (week.transfers_out || 0) > 0) return "transfert";
  if ((week.cash_injection || 0) > 0) return "injection";
  if ((week.player_wages || 0) > 0) {
    return (week.gate_receipts || 0) > 0 ? "match_domicile" : "match_exterieur";
  }
  return "autre";
}
