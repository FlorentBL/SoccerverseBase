"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * Nouvelle logique:
 * 1) On extrait les achats de packs directement des transactions Soccerverse:
 *    - même timestamp => un achat
 *    - le club avec le plus de parts = principal (40 parts/pack), les autres = secondaires (10 parts/pack)
 * 2) On envoie la liste des timestamps à /api/packs/by-wallet?hintTs=...
 * 3) On associe le plus gros USDC sortant retourné par l'API à chaque achat (prix total),
 *    puis on calcule le prix / pack.
 */

const PACKS_PAGES = 1000;          // non utilisé côté API simplifiée mais on garde la const
const PACKS_PAGE_SIZE = 100;
const MIN_AMOUNT_USDC = 2;

const UNIT = 10000;
const toSVC = (n) => (Number(n) || 0) / UNIT;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
const SAFE_DIV = (num, den) => (den > 0 ? num / den : null);

const fmtSVC = (n) => (typeof n === "number" ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} SVC` : "—");
const fmtUSD = (n) => (typeof n === "number" ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—");
const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR") : "—");
const fmtDate = (ts) => (ts ? new Date(Number(ts) * 1000).toLocaleString("fr-FR") : "—");
const shortHash = (h) => (h ? `${h.slice(0, 6)}…${h.slice(-4)}` : "");
const tooltipDatesForClub = (buys = []) => buys.filter((r) => r?.dateTs).map((r) => fmtDate(r.dateTs)).join("\n");

const LABELS = {
  fr: {
    title: "ROI",
    usernamePlaceholder: "Nom d'utilisateur Soccerverse",
    analyze: "Analyser",
    loading: "Chargement...",
    walletDetected: "Wallet détecté :",
    walletNotFound: "introuvable",
    hideNoROI: "Masquer les clubs sans ROI",
    includeSvcAsCost: "Inclure les achats SVC dans le coût (packs + SVC)",
    roleFilter: "Rôle (packs) :",
    role: { all: "Tous", main: "Principal", secondary: "Secondaire", both: "Les deux", none: "Aucun achat" },
    clubsHeading: "Clubs",
    noClubs: "Aucune position club.",
    playersHeading: "Joueurs",
    noPlayers: "Aucune position joueur.",
    errorLoading: "Erreur lors du chargement.",
    columns: {
      club: "Club",
      role: "Rôle (packs)",
      qty: "Quantité",
      packsBought: "Packs achetés",
      lastBuy: "Dernier achat",
      svcSpent: "Achats via SVC",
      svcGains: "Gains SVC",
      costPacks: "Coût total (packs) ($)",
      costClub: "Coût packs (club) ($)",
      costTotal: "Coût total ($)",
      roiUsd: "ROI ($)",
      details: "Détails",
      sortByClub: "Trier par club",
      sortByQty: "Trier par quantité",
      sortByLastBuy: "Trier par dernier achat",
      sortByGainsSvc: "Trier par gains SVC",
      sortByCostPacks: "Trier par coût packs ($)",
      sortByCostClub: "Trier par coût packs (club) ($)",
      sortByCostTotal: "Trier par coût total ($)",
      sortByRoi: "Trier par ROI ($)",
    },
    drawer: {
      none: "Aucun achat de pack on-chain détecté pour ce club.",
      totalDetected: (n) => `${n} achat(s) détecté(s) au total dont des achats in-game (SVC) masqués ici.`,
      header: (n) => `${n} achat${n > 1 ? "s" : ""} de pack`,
      onChain: "(on-chain)",
      columns: { date: "Date", tx: "Tx", role: "Rôle", packs: "Packs", priceTotal: "Prix total ($)", priceUnit: "Prix / pack ($)" },
      masked: (n) => `${n} achat(s) in-game (SVC) masqué(s).`,
      close: "fermer",
      see: "voir",
    },
    playerColumns: {
      player: "Joueur",
      qty: "Quantité",
      base: "Base (mint, SVC)",
      payouts: "Payouts cumulés (SVC)",
      roi: "ROI (SVC)",
      naBaseMint: "n/a (base mint)",
    },
  },
  en: {
    title: "ROI",
    usernamePlaceholder: "Soccerverse username",
    analyze: "Analyze",
    loading: "Loading...",
    walletDetected: "Detected wallet:",
    walletNotFound: "not found",
    hideNoROI: "Hide clubs without ROI",
    includeSvcAsCost: "Include SVC purchases in cost (packs + SVC)",
    roleFilter: "Role (packs):",
    role: { all: "All", main: "Main", secondary: "Secondary", both: "Both", none: "No purchase" },
    clubsHeading: "Clubs",
    noClubs: "No club positions.",
    playersHeading: "Players",
    noPlayers: "No player positions.",
    errorLoading: "Error while loading.",
    columns: {
      club: "Club",
      role: "Role (packs)",
      qty: "Quantity",
      packsBought: "Packs bought",
      lastBuy: "Last buy",
      svcSpent: "SVC purchases",
      svcGains: "SVC earnings",
      costPacks: "Total cost (packs) ($)",
      costClub: "Pack cost (club) ($)",
      costTotal: "Total cost ($)",
      roiUsd: "ROI ($)",
      details: "Details",
      sortByClub: "Sort by club",
      sortByQty: "Sort by quantity",
      sortByLastBuy: "Sort by last buy",
      sortByGainsSvc: "Sort by SVC earnings",
      sortByCostPacks: "Sort by pack cost ($)",
      sortByCostClub: "Sort by club pack cost ($)",
      sortByCostTotal: "Sort by total cost ($)",
      sortByRoi: "Sort by ROI ($)",
    },
    drawer: {
      none: "No on-chain pack purchase detected for this club.",
      totalDetected: (n) => `${n} purchase(s) detected in total including hidden in-game (SVC) purchases.`,
      header: (n) => `${n} pack purchase${n > 1 ? "s" : ""}`,
      onChain: "(on-chain)",
      columns: { date: "Date", tx: "Tx", role: "Role", packs: "Packs", priceTotal: "Total price ($)", priceUnit: "Price / pack ($)" },
      masked: (n) => `${n} hidden in-game (SVC) purchase(s).`,
      close: "close",
      see: "view",
    },
    playerColumns: {
      player: "Player",
      qty: "Quantity",
      base: "Base (mint, SVC)",
      payouts: "Total payouts (SVC)",
      roi: "ROI (SVC)",
      naBaseMint: "n/a (mint base)",
    },
  },
  it: {
    title: "ROI",
    usernamePlaceholder: "Nome utente Soccerverse",
    analyze: "Analizza",
    loading: "Caricamento...",
    walletDetected: "Wallet rilevato:",
    walletNotFound: "non trovato",
    hideNoROI: "Nascondi club senza ROI",
    includeSvcAsCost: "Includi acquisti SVC nel costo (pacchetti + SVC)",
    roleFilter: "Ruolo (pacchetti):",
    role: { all: "Tutti", main: "Principale", secondary: "Secondario", both: "Entrambi", none: "Nessun acquisto" },
    clubsHeading: "Club",
    noClubs: "Nessuna posizione club.",
    playersHeading: "Giocatori",
    noPlayers: "Nessuna posizione giocatore.",
    errorLoading: "Errore durante il caricamento.",
    columns: {
      club: "Club",
      role: "Ruolo (pacchetti)",
      qty: "Quantità",
      packsBought: "Pacchetti acquistati",
      lastBuy: "Ultimo acquisto",
      svcSpent: "Acquisti SVC",
      svcGains: "Guadagni SVC",
      costPacks: "Costo totale (pacchetti) ($)",
      costClub: "Costo pacchetti (club) ($)",
      costTotal: "Costo totale ($)",
      roiUsd: "ROI ($)",
      details: "Dettagli",
      sortByClub: "Ordina per club",
      sortByQty: "Ordina per quantità",
      sortByLastBuy: "Ordina per ultimo acquisto",
      sortByGainsSvc: "Ordina per guadagni SVC",
      sortByCostPacks: "Ordina per costo pacchetti ($)",
      sortByCostClub: "Ordina per costo pacchetti (club) ($)",
      sortByCostTotal: "Ordina per costo totale ($)",
      sortByRoi: "Ordina per ROI ($)",
    },
    drawer: {
      none: "Nessun acquisto di pacchetto on-chain rilevato per questo club.",
      totalDetected: (n) => `${n} acquisto/i rilevato/i in totale, inclusi acquisti in-game (SVC) nascosti qui.`,
      header: (n) => `${n} acquisto${n > 1 ? "i" : ""} di pacchetto`,
      onChain: "(on-chain)",
      columns: { date: "Data", tx: "Tx", role: "Ruolo", packs: "Pacchetti", priceTotal: "Prezzo totale ($)", priceUnit: "Prezzo / pacchetto ($)" },
      masked: (n) => `${n} acquisto/i in-game (SVC) nascosto/i.`,
      close: "chiudi",
      see: "vedi",
    },
    playerColumns: {
      player: "Giocatore",
      qty: "Quantità",
      base: "Base (mint, SVC)",
      payouts: "Payout cumulati (SVC)",
      roi: "ROI (SVC)",
      naBaseMint: "n/d (base mint)",
    },
  },
  es: {
    title: "ROI",
    usernamePlaceholder: "Nombre de usuario Soccerverse",
    analyze: "Analizar",
    loading: "Cargando...",
    walletDetected: "Billetera detectada:",
    walletNotFound: "no encontrada",
    hideNoROI: "Ocultar clubes sin ROI",
    includeSvcAsCost: "Incluir compras SVC en el costo (packs + SVC)",
    roleFilter: "Rol (packs):",
    role: { all: "Todos", main: "Principal", secondary: "Secundario", both: "Ambos", none: "Sin compra" },
    clubsHeading: "Clubes",
    noClubs: "No hay posiciones de club.",
    playersHeading: "Jugadores",
    noPlayers: "No hay posiciones de jugador.",
    errorLoading: "Error al cargar.",
    columns: {
      club: "Club",
      role: "Rol (packs)",
      qty: "Cantidad",
      packsBought: "Packs comprados",
      lastBuy: "Última compra",
      svcSpent: "Compras con SVC",
      svcGains: "Ganancias SVC",
      costPacks: "Costo total (packs) ($)",
      costClub: "Costo packs (club) ($)",
      costTotal: "Costo total ($)",
      roiUsd: "ROI ($)",
      details: "Detalles",
      sortByClub: "Ordenar por club",
      sortByQty: "Ordenar por cantidad",
      sortByLastBuy: "Ordenar por última compra",
      sortByGainsSvc: "Ordenar por ganancias SVC",
      sortByCostPacks: "Ordenar por costo packs ($)",
      sortByCostClub: "Ordenar por costo packs (club) ($)",
      sortByCostTotal: "Ordenar por costo total ($)",
      sortByRoi: "Ordenar por ROI ($)",
    },
    drawer: {
      none: "No se detectó ninguna compra de pack on-chain para este club.",
      totalDetected: (n) => `${n} compra(s) detectada(s) en total incluyendo compras in-game (SVC) ocultas aquí.`,
      header: (n) => `${n} compra${n > 1 ? "s" : ""} de pack`,
      onChain: "(on-chain)",
      columns: { date: "Fecha", tx: "Tx", role: "Rol", packs: "Packs", priceTotal: "Precio total ($)", priceUnit: "Precio / pack ($)" },
      masked: (n) => `${n} compra(s) in-game (SVC) ocultada(s).`,
      close: "cerrar",
      see: "ver",
    },
    playerColumns: {
      player: "Jugador",
      qty: "Cantidad",
      base: "Base (mint, SVC)",
      payouts: "Pagos acumulados (SVC)",
      roi: "ROI (SVC)",
      naBaseMint: "n/a (base mint)",
    },
  },
  ko: {
    title: "ROI",
    usernamePlaceholder: "Soccerverse 사용자명",
    analyze: "분석",
    loading: "로딩 중...",
    walletDetected: "지갑 감지:",
    walletNotFound: "없음",
    hideNoROI: "ROI 없는 클럽 숨기기",
    includeSvcAsCost: "비용에 SVC 구매 포함 (팩 + SVC)",
    roleFilter: "역할 (팩):",
    role: { all: "전체", main: "주요", secondary: "보조", both: "둘 다", none: "구매 없음" },
    clubsHeading: "클럽",
    noClubs: "클럽 포지션 없음.",
    playersHeading: "선수",
    noPlayers: "선수 포지션 없음.",
    errorLoading: "로드 중 오류.",
    columns: {
      club: "클럽",
      role: "역할 (팩)",
      qty: "수량",
      packsBought: "구매한 팩",
      lastBuy: "마지막 구매",
      svcSpent: "SVC 구매",
      svcGains: "SVC 수익",
      costPacks: "총 비용 (팩) ($)",
      costClub: "팩 비용 (클럽) ($)",
      costTotal: "총 비용 ($)",
      roiUsd: "ROI ($)",
      details: "세부정보",
      sortByClub: "클럽별 정렬",
      sortByQty: "수량별 정렬",
      sortByLastBuy: "마지막 구매별 정렬",
      sortByGainsSvc: "SVC 수익별 정렬",
      sortByCostPacks: "팩 비용별 정렬 ($)",
      sortByCostClub: "클럽 팩 비용별 정렬 ($)",
      sortByCostTotal: "총 비용별 정렬 ($)",
      sortByRoi: "ROI별 정렬 ($)",
    },
    drawer: {
      none: "이 클럽에 대한 온체인 팩 구매가 감지되지 않았습니다.",
      totalDetected: (n) => `${n}건의 구매가 감지되었으며, 숨겨진 인게임(SVC) 구매가 있습니다.`,
      header: (n) => `${n}건의 팩 구매`,
      onChain: "(온체인)",
      columns: { date: "날짜", tx: "트랜잭션", role: "역할", packs: "팩", priceTotal: "총 가격 ($)", priceUnit: "팩당 가격 ($)" },
      masked: (n) => `${n}건의 인게임(SVC) 구매가 숨겨짐.`,
      close: "닫기",
      see: "보기",
    },
    playerColumns: {
      player: "선수",
      qty: "수량",
      base: "기초 (민트, SVC)",
      payouts: "누적 배당금 (SVC)",
      roi: "ROI (SVC)",
      naBaseMint: "해당 없음 (민트 기반)",
    },
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// Détection des achats de pack dans les transactions SV

const SHARES_PER_PACK_MAIN = 40;
const SHARES_PER_PACK_SEC  = 10;

function numberLike(...xs) {
  for (const x of xs) {
    const n = Number(x);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/**
 * Détecte les achats de packs dans les transactions Soccerverse,
 * même si le champ `type` n'est pas strictement "mint".
 * Règles :
 *  - doit concerner un CLUB (share.id)
 *  - delta/qty positif
 *  - ET (amount SVC == 0/absent) OU on trouve "mint" quelque part dans l'objet
 */
function extractPackPurchasesFromTransactions(transactions = []) {
  const byTs = new Map();

  for (const t of transactions) {
    const ts = numberLike(t?.date, t?.unix_time, t?.time, t?.timestamp, t?.ts);
    if (!ts) continue;

    const isClub = t?.share?.type === "club" && t?.share?.id != null;
    const clubId = isClub ? numberLike(t.share.id) :
      numberLike(t?.club_id, t?.clubId, t?.club?.id, t?.other_id);

    if (!clubId) continue;

    // delta de parts acheté
const shares = numberLike(
  t?.shares, t?.n, t?.qty, t?.quantity, t?.delta, t?.totalDelta, t?.num
);
    if (!(shares > 0)) continue;

    // achat pack = 0 SVC (sur chaîne) OU bien on voit "mint" quelque part
    const amtSvc = numberLike(t?.amount, t?.amount_svc, t?.svc, t?.price_svc);
const looksLikeMint =
   String(t?.type || "").toLowerCase() === "mint" ||
   /mint/i.test(JSON.stringify(t || {}));
 const isPackish = looksLikeMint || (amtSvc === 0);

    if (!isPackish) continue;

    const arr = byTs.get(ts) || [];
    arr.push({ clubId, shares });
    byTs.set(ts, arr);
  }

  const purchases = [];
  for (const [ts, rows] of byTs.entries()) {
    if (!rows.length) continue;

    // principal = club avec + de parts
    const main = rows.reduce((a, b) => (b.shares > (a?.shares ?? 0) ? b : a), null);
    const parts = [];

    if (main) {
      const packs = Math.floor(main.shares / SHARES_PER_PACK_MAIN);
      if (packs > 0) parts.push({ clubId: main.clubId, shares: main.shares, role: "main", packs });
    }
    for (const r of rows) {
      if (r.clubId === main?.clubId) continue;
      const packs = Math.floor(r.shares / SHARES_PER_PACK_SEC);
      if (packs > 0) parts.push({ clubId: r.clubId, shares: r.shares, role: "secondary", packs });
    }

    const totalPacks = parts.reduce((s, p) => s + p.packs, 0);
const mainPacks = parts.find(p => p.role === "main")?.packs ?? 0;
    const packCount = mainPacks > 0 ? mainPacks : Math.max(0, ...parts.map(p => p.packs));
    if (totalPacks > 0) purchases.push({ ts, parts, totalPacks, packCount });
  }

  purchases.sort((a, b) => b.ts - a.ts);
  return purchases;
}


// ───────────────────────────────────────────────────────────────────────────────
// Agrégation (inchangée hormis l’entrée “packs”)

function tradeKey(otherName, unix) { return `${otherName || ""}|${Number(unix) || 0}`; }

function indexTradesByTimeAndCounterparty(txs) {
  const idx = new Map();
  for (const t of txs || []) {
    if (t?.type !== "share trade") continue;
    const share = t?.share;
    if (!share?.type || !share?.id) continue;
    const k = tradeKey(t?.other_name, t?.date);
    if (!idx.has(k)) idx.set(k, { type: share.type, id: share.id });
  }
  return idx;
}

function estimateQtyBoughtViaSVC(transactions) {
  const qtyByClub = new Map();
  for (const t of transactions || []) {
    if (t?.type !== "share trade") continue;
    const s = t?.share;
    if (s?.type !== "club" || s?.id == null) continue;
    const q = numberLike(t?.qty, t?.quantity, t?.delta, t?.totalDelta);
    if (q > 0) qtyByClub.set(s.id, (qtyByClub.get(s.id) || 0) + q);
  }
  return qtyByClub;
}

function aggregateForever({
  balanceSheet,
  transactions,
  positions,
  clubMap,
  playerMap,

  packRawTotalUSDByClub,
  packUnitAvgUSDByClub,
  packLastDateByClub,
  packTotalPacksByClub,

  includeSvcAsCost,
  svcRateUSD,
}) {
  const tradeIdx = indexTradesByTimeAndCounterparty(transactions);

  const payoutsClub = new Map();
  const payoutsPlayer = new Map();
  const baseMintPlayer = new Map();
  const achatsSvcClub = new Map();

  const qtyAcheteeSvcClub = estimateQtyBoughtViaSVC(transactions);

  for (const it of balanceSheet || []) {
    const amtSVC = toSVC(it?.amount);

    if (it?.type?.startsWith("dividend")) {
      if (it?.other_type === "club" && it?.other_id != null) {
        payoutsClub.set(it.other_id, (payoutsClub.get(it.other_id) || 0) + amtSVC);
      } else if (it?.other_type === "player" && it?.other_id != null) {
        payoutsPlayer.set(it.other_id, (payoutsPlayer.get(it.other_id) || 0) + amtSVC);
      }
      continue;
    }

    if (it?.type === "mint" && it?.other_type === "player" && it?.other_id != null && amtSVC < 0) {
      baseMintPlayer.set(it.other_id, (baseMintPlayer.get(it.other_id) || 0) + Math.abs(amtSVC));
      continue;
    }

    if (it?.type === "share trade" && amtSVC < 0) {
      const k = `${it?.other_name || ""}|${Number(it?.unix_time) || 0}`;
      const share = tradeIdx.get(k);
      if (share?.type === "club" && share?.id != null) {
        achatsSvcClub.set(share.id, (achatsSvcClub.get(share.id) || 0) + Math.abs(amtSVC));
      }
    }
  }

  const clubs = [];
  const players = [];

  for (const b of positions?.clubs || []) {
    const id = b.id;
    const qty = Number(b.total || 0);
    const name = clubMap?.[id]?.name || clubMap?.[id]?.n || `${t.columns.club} #${id}`;

    const gainsSvc = round4(payoutsClub.get(id) || 0);
    const achatsSvc = round2(achatsSvcClub.get(id) || 0);

    const totalPacksUSD = round2(Number(packRawTotalUSDByClub?.get(id) || 0));
    const unitAvgUSD    = round2(Number(packUnitAvgUSDByClub?.get(id) || 0));
    const lastDateTs    = Number(packLastDateByClub?.get(id) || 0);
    const totalPacks    = Number(packTotalPacksByClub?.get(id) || 0);

    const gainsUSD = svcRateUSD != null ? round2(gainsSvc * svcRateUSD) : null;
    const coutSvcUSD = includeSvcAsCost && svcRateUSD != null ? round2(achatsSvc * svcRateUSD) : 0;
    const coutTotalUSD = round2(totalPacksUSD + coutSvcUSD);
    const roiUSD = SAFE_DIV(gainsUSD ?? 0, coutTotalUSD);

    clubs.push({
      id, name, qty,
      achatsSvc, gainsSvc, gainsUSD,
      packsAchetes: totalPacks,
      dernierAchatTs: lastDateTs,
      coutPacksUSD: totalPacksUSD,
      depensePacksAffineeUSD: unitAvgUSD,
      coutTotalUSD,
      link: `https://play.soccerverse.com/club/${id}`,
      roiUSD,
    });
  }

  for (const b of positions?.players || []) {
    const id = b.id;
    const qty = Number(b.total || 0);
    const p = playerMap?.[id];
    const name = p?.name || [p?.f, p?.s].filter(Boolean).join(" ") || `${t.playerColumns.player} #${id}`;
    const payouts = round4(payoutsPlayer.get(id) || 0);
    const baseSvc = round2(baseMintPlayer.get(id) || 0);
    const roi = baseSvc > 0 ? payouts / baseSvc : null;

    players.push({ id, name, qty, payouts, baseSvc, roi, link: `https://play.soccerverse.com/player/${id}` });
  }

  clubs.sort((a, b) => (b.gainsSvc - a.gainsSvc) || (b.qty - a.qty));
  players.sort((a, b) => (b.payouts - a.payouts) || (b.qty - a.qty));
  return { clubs, players };
}

// ───────────────────────────────────────────────────────────────────────────────
// UI

function RoiBar({ pct }) {
  const val = Number(pct) || 0;
  const width = Math.max(0, Math.min(100, val));
  const color = val < 0 ? "bg-red-500" : val >= 100 ? "bg-emerald-500" : "bg-indigo-500";
  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <div className="flex-1 h-2 rounded bg-gray-800 overflow-hidden" title={`${val.toFixed(2)}%`} role="progressbar" aria-valuenow={val} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${color} transition-[width] duration-300`} style={{ width: `${width}%` }} />
      </div>
      <span className="tabular-nums">{val.toFixed(1)}%</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Page

export default function RoiPage({ lang = "fr" }) {
  const t = LABELS[lang] || LABELS.fr;
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [hideNoROI, setHideNoROI] = useState(false);
  const [includeSvcAsCost, setIncludeSvcAsCost] = useState(true);

  const [roleFilter, setRoleFilter] = useState("all"); // all | main | secondary | both | none

  const [clubMap, setClubMap] = useState({});
  const [playerMap, setPlayerMap] = useState({});

  const [balanceSheet, setBalanceSheet] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [positions, setPositions] = useState({ clubs: [], players: [] });

  // Packs (lignes & agrégats)
  const [packBuysByClub, setPackBuysByClub] = useState(new Map());
  const [packRawTotalUSDByClub, setPackRawTotalUSDByClub] = useState(new Map());
  const [packUnitAvgUSDByClub, setPackUnitAvgUSDByClub] = useState(new Map());
  const [packLastDateByClub, setPackLastDateByClub] = useState(new Map());
  const [packTotalPacksByClub, setPackTotalPacksByClub] = useState(new Map());

  const [openClub, setOpenClub] = useState(null);
  const [svcRateUSD, setSvcRateUSD] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [wallet, setWallet] = useState(null);

  // mappings
  useEffect(() => {
    (async () => {
      try {
        const [clubRes, playerRes] = await Promise.all([ fetch("/club_mapping.json"), fetch("/player_mapping.json") ]);
        const [clubData, playerData] = await Promise.all([clubRes.json(), playerRes.json()]);
        setClubMap(clubData || {}); setPlayerMap(playerData || {});
      } catch {}
    })();
  }, []);

  // taux
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://services.soccerverse.com/api/market", { cache: "no-store" });
        const data = await res.json();
        if (data && typeof data.SVC2USDC === "number") setSvcRateUSD(data.SVC2USDC);
      } catch {}
    })();
  }, []);

  async function fetchUserBalanceSheet(name) {
    const res = await fetch("/api/user_balance_sheet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error || `Erreur balance_sheet (${res.status})`); }
    const j = await res.json(); return Array.isArray(j?.result) ? j.result : [];
  }

  async function fetchTransactions(name) {
    const res = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error || `Erreur transactions (${res.status})`); }
    const j = await res.json(); return Array.isArray(j?.result) ? j.result : [];
  }

  async function fetchPositions(name) {
    const res = await fetch("/api/user_positions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error || `Erreur positions (${res.status})`); }
    return res.json();
  }

  async function resolveWallet(name) {
    try {
      const rw = await fetch("/api/resolve_wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const rwJson = await rw.json();
      const w = rw.ok ? (rwJson.wallet || null) : null;
      setWallet(w); return w;
    } catch { setWallet(null); return null; }
  }

  // Associe les paiements USDC à nos achats détectés
async function fetchPackCostsForWallet(w, purchases) {
  // achats -> hints pour l’API
  const hints = purchases.map(p => ({ ts: Number(p.ts), totalPacks: Number(p.totalPacks) }))
                         .filter(h => Number.isFinite(h.ts) && h.totalPacks > 0);

  // reset si rien à matcher
  if (!hints.length) {
    setPackBuysByClub(new Map());
    setPackRawTotalUSDByClub(new Map());
    setPackUnitAvgUSDByClub(new Map());
    setPackLastDateByClub(new Map());
    setPackTotalPacksByClub(new Map());
    return;
  }

  const r = await fetch("/api/packs/by-wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // tu peux ajuster toleranceSec / marginSec si besoin
    body: JSON.stringify({ wallet: w, hints, toleranceSec: 1800, marginSec: 7200 }),
  });
  const j = await r.json();
  if (!r.ok || !j?.ok) throw new Error(j?.error || "packs fetch failed");

  // index par ts pour retrouver le paiement associé
 // index par ts en gardant le PLUS GROS montant USDC
  const payByTs = new Map();
  for (const m of j.matches || []) {
    const ts = Number(m.ts);
    const candidate = {
      txHash: m.txHash || null,
      priceUSDC: typeof m.priceUSDC === "number" ? m.priceUSDC : null,
    };

    const prev = payByTs.get(ts);
    // si plusieurs lignes (frais + achat) arrivent pour le même timestamp,
    // on conserve celle avec le plus gros priceUSDC
    if (!prev || ((candidate.priceUSDC ?? 0) > (prev.priceUSDC ?? 0))) {
      payByTs.set(ts, candidate);
    }
  }

  // construire les lignes par club
  const buysMap = new Map();

  for (const pu of purchases) {
    const pay = payByTs.get(Number(pu.ts)) || null;
    const price = pay?.priceUSDC ?? null;
    const txHash = pay?.txHash ?? null;
    const packCount = Number(pu.packCount || 0);
    const unit = packCount > 0 && price != null ? price / packCount : null;

    for (const part of pu.parts) {
      const arr = buysMap.get(part.clubId) || [];
      const allocatedPriceUSDC =
      price != null && packCount > 0 ? price * (part.packs / packCount) : null;
      arr.push({
        txHash,
        role: part.role,
        dateTs: pu.ts,
        packs: part.packs,
        priceUSDC: price,
        allocatedPriceUSDC,
        unitPriceUSDC: unit,
      });
      buysMap.set(part.clubId, arr);
    }
  }

  // Agrégats
  const totalUSD = new Map();
  const unitAvg  = new Map();
  const lastDate = new Map();
  const totalPks = new Map();

  for (const [cid, arr] of buysMap.entries()) {
    let sumPrice = 0, sumPacks = 0, last = 0;
    for (const r of arr) {
      sumPrice += Number(r.allocatedPriceUSDC || 0);
      sumPacks += Number(r.packs || 0);
      if ((r.dateTs || 0) > last) last = r.dateTs || 0;
    }
    totalUSD.set(cid, sumPrice);
    unitAvg.set(cid, sumPacks > 0 ? sumPrice / sumPacks : 0);
    lastDate.set(cid, last);
    totalPks.set(cid, sumPacks);
    arr.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
  }

  setPackBuysByClub(buysMap);
  setPackRawTotalUSDByClub(totalUSD);
  setPackUnitAvgUSDByClub(unitAvg);
  setPackLastDateByClub(lastDate);
  setPackTotalPacksByClub(totalPks);
}



  async function handleSearch(e) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setOpenClub(null);

    try {
      const [bs, txs, pos] = await Promise.all([ fetchUserBalanceSheet(name), fetchTransactions(name), fetchPositions(name) ]);
      setBalanceSheet(bs); setTransactions(txs); setPositions(pos);

      // 1) détecter les achats de packs via transactions SV
      const purchases = extractPackPurchasesFromTransactions(txs);

      // 2) résoudre wallet et récupérer le prix pour ces timestamps
      const w = await resolveWallet(name);
      if (w) await fetchPackCostsForWallet(w, purchases);
    } catch (err) {
      setError(err?.message || t.errorLoading);
      setBalanceSheet([]); setTransactions([]); setPositions({ clubs: [], players: [] });
      setPackRawTotalUSDByClub(new Map());
      setPackUnitAvgUSDByClub(new Map());
      setPackLastDateByClub(new Map());
      setPackTotalPacksByClub(new Map());
      setPackBuysByClub(new Map());
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }

  // rôle par club (main/secondary/both/none)
  const roleByClub = useMemo(() => {
    const m = new Map();
    for (const [cid, rows] of packBuysByClub.entries()) {
      const hasMain = rows.some((r) => r.role === "main");
      const hasSec  = rows.some((r) => r.role === "secondary");
      const role = hasMain && hasSec ? "both" : hasMain ? "main" : hasSec ? "secondary" : "none";
      m.set(cid, role);
    }
    return m;
  }, [packBuysByClub]);

  const aggregated = useMemo(
    () =>
      aggregateForever({
        balanceSheet,
        transactions,
        positions,
        clubMap,
        playerMap,
        packRawTotalUSDByClub,
        packUnitAvgUSDByClub,
        packLastDateByClub,
        packTotalPacksByClub,
        includeSvcAsCost,
        svcRateUSD,
      }),
    [
      balanceSheet,
      transactions,
      positions,
      clubMap,
      playerMap,
      packRawTotalUSDByClub,
      packUnitAvgUSDByClub,
      packLastDateByClub,
      packTotalPacksByClub,
      includeSvcAsCost,
      svcRateUSD,
    ]
  );

  const sortNullsLast = (va, vb, dir) => {
    const a = va ?? null; const b = vb ?? null;
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return dir === "asc" ? a - b : b - a;
  };

  const roleMatches = (clubId) => {
    const r = roleByClub.get(clubId) || "none";
    if (roleFilter === "all") return true;
    if (roleFilter === "none") return r === "none";
    if (roleFilter === "both") return r === "both";
    if (roleFilter === "main") return r === "main";
    if (roleFilter === "secondary") return r === "secondary";
    return true;
  };

  const clubs = useMemo(() => {
    let arr = aggregated.clubs.filter((c) => roleMatches(c.id));
    if (hideNoROI) arr = arr.filter((r) => r.roiUSD != null);

    if (sortKey) {
      const numericKeys = new Set(["qty","packsAchetes","dernierAchatTs","gainsSvc","coutPacksUSD","depensePacksAffineeUSD","coutTotalUSD","roiUSD"]);
      arr.sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        if (numericKeys.has(sortKey)) return sortNullsLast(va, vb, sortDir);
        return sortDir === "asc" ? String(va ?? "").localeCompare(String(vb ?? "")) : String(vb ?? "").localeCompare(String(va ?? ""));
      });
    }
    return arr;
  }, [aggregated.clubs, sortKey, sortDir, hideNoROI, roleFilter, roleByClub]);

  const { players } = aggregated;

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const Arrow = ({ active, dir }) => (
    <span className={`ml-1 text-xs ${active ? "opacity-100" : "opacity-30"}`}>{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
  );

const renderDrawer = (clubId) => {
  // 1) toutes les lignes détectées (SV)
  const all = packBuysByClub.get(clubId) || [];
  // 2) on-chain uniquement = lignes matchées avec USDC (vrais achats blockchain)
  const onchain = all.filter(r => r.txHash && typeof r.priceUSDC === "number");

  if (!onchain.length) {
    return (
      <div className="text-sm text-gray-400">
        {t.drawer.none}
        {all.length > 0 && (
          <div className="mt-1 text-[12px] text-gray-500">
            {t.drawer.totalDetected(all.length)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="mb-2 text-gray-300">
        {t.drawer.header(onchain.length)} <span className="opacity-70">{t.drawer.onChain}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="text-left py-2 px-3">{t.drawer.columns.date}</th>
              <th className="text-left py-2 px-3">{t.drawer.columns.tx}</th>
              <th className="text-left py-2 px-3">{t.drawer.columns.role}</th>
              <th className="text-right py-2 px-3">{t.drawer.columns.packs}</th>
              <th className="text-right py-2 px-3">{t.drawer.columns.priceTotal}</th>
              <th className="text-right py-2 px-3">{t.drawer.columns.priceUnit}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {onchain.map((r, i) => (
              <tr key={`${r.txHash}-${i}`} className="hover:bg-white/5">
                <td className="py-2 px-3">{fmtDate(r.dateTs)}</td>
                <td className="py-2 px-3">
                  <a
                    className="text-indigo-400 hover:underline"
                    href={`https://polygonscan.com/tx/${r.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortHash(r.txHash)}
                  </a>
                </td>
                <td className="py-2 px-3 capitalize">{t.role[r.role] || r.role}</td>
                <td className="py-2 px-3 text-right">{fmtInt(r.packs)}</td>
                <td className="py-2 px-3 text-right">{fmtUSD(r.priceUSDC)}</td>
                <td className="py-2 px-3 text-right">{fmtUSD(r.unitPriceUSDC)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optionnel : badge indiquant combien ont été masqués car in-game */}
      {onchain.length < all.length && (
        <div className="mt-2 text-[12px] text-gray-500">
          {t.drawer.masked(all.length - onchain.length)}
        </div>
      )}
    </div>
  );
};

  const RoleBadge = ({ id }) => {
    const r = roleByClub.get(id) || "none";
    const label =
      r === "both" ? t.role.both : r === "main" ? t.role.main : r === "secondary" ? t.role.secondary : "—";
    return <span className="text-gray-300">{label}</span>;
  };

  return (
    <div className="min-h-screen text-white py-8 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">{t.title}</h1>

        <form onSubmit={handleSearch} className="mb-4 flex flex-col sm:flex-row gap-2">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.usernamePlaceholder} className="flex-1 rounded-lg p-2 bg-gray-900 border border-gray-700 text-white" />
          <button type="submit" disabled={loading || !username.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">
            {loading ? t.loading : t.analyze}
          </button>
        </form>

        {searched && (
          <div className="mb-4 text-sm text-gray-300">
            {t.walletDetected}{" "}
            {wallet ? (
              <a className="text-indigo-400 hover:underline" href={`https://polygonscan.com/address/${wallet}`} target="_blank" rel="noreferrer">
                {wallet}
              </a>
            ) : (
              <span className="text-gray-500">{t.walletNotFound}</span>
            )}
          </div>
        )}

        {!!error && <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-3 text-red-300">{error}</div>}

        {searched && (
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-300">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4" checked={hideNoROI} onChange={(e) => setHideNoROI(e.target.checked)} />
              <span>{t.hideNoROI}</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4" checked={includeSvcAsCost} onChange={(e) => setIncludeSvcAsCost(e.target.checked)} />
              <span>{t.includeSvcAsCost}</span>
            </label>

            <div className="flex items-center gap-2">
              <span>{t.roleFilter}</span>
              {[
                ["all", t.role.all],
                ["main", t.role.main],
                ["secondary", t.role.secondary],
                ["both", t.role.both],
                ["none", t.role.none],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setRoleFilter(key)} className={`px-2 py-1 rounded border ${roleFilter === key ? "bg-indigo-600 border-indigo-500" : "bg-gray-800 border-gray-700"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clubs */}
        {searched && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">{t.clubsHeading}</h2>
            {clubs.length === 0 ? (
              <div className="text-gray-400">{t.noClubs}</div>
            ) : (
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("name")} title={t.columns.sortByClub}>
                        {t.columns.club} <Arrow active={sortKey === "name"} dir={sortDir} />
                      </th>
                      <th className="text-left py-2 px-3">{t.columns.role}</th>
                      <th className="text-right py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("qty")} title={t.columns.sortByQty}>
                        {t.columns.qty} <Arrow active={sortKey === "qty"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">{t.columns.packsBought}</th>
                      <th className="text-right py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("dernierAchatTs")} title={t.columns.sortByLastBuy}>
                        {t.columns.lastBuy} <Arrow active={sortKey === "dernierAchatTs"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">{t.columns.svcSpent}</th>
                      <th className="text-right py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("gainsSvc")} title={t.columns.sortByGainsSvc}>
                        {t.columns.svcGains} <Arrow active={sortKey === "gainsSvc"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("coutPacksUSD")} title={t.columns.sortByCostPacks}>
                        {t.columns.costPacks} <Arrow active={sortKey === "coutPacksUSD"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("depensePacksAffineeUSD")} title={t.columns.sortByCostClub}>
                        {t.columns.costClub} <Arrow active={sortKey === "depensePacksAffineeUSD"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("coutTotalUSD")} title={t.columns.sortByCostTotal}>
                        {t.columns.costTotal} <Arrow active={sortKey === "coutTotalUSD"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3 cursor-pointer select-none hover:underline" onClick={() => toggleSort("roiUSD")} title={t.columns.sortByRoi}>
                        {t.columns.roiUsd} <Arrow active={sortKey === "roiUSD"} dir={sortDir} />
                      </th>
                      <th className="text-right py-2 px-3">{t.columns.details}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {clubs.map((row) => {
                      const isOpen = openClub === row.id;
                      return (
                        <React.Fragment key={`c-${row.id}`}>
                          <tr className="hover:bg-white/5">
                            <td className="py-2 px-3">
                              <a href={row.link} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
                                {row.name}
                              </a>
                            </td>
                            <td className="py-2 px-3"><RoleBadge id={row.id} /></td>
                            <td className="py-2 px-3 text-right">{fmtInt(row.qty)}</td>
                            <td className="py-2 px-3 text-right">{fmtInt(row.packsAchetes)}</td>
                            <td className="py-2 px-3 text-right">
                              {(() => {
                                const buys = packBuysByClub.get(row.id) || [];
                                const lastTs = buys[0]?.dateTs || null;
                                const tip = tooltipDatesForClub(buys);
                                if (!lastTs) return <span className="text-gray-500">—</span>;
                                return (
                                  <span className="relative group cursor-help" title={tip} aria-label={tip.replace(/\n/g, ", ")}>
                                    {fmtDate(lastTs)}
                                    {buys.length > 1 && (
                                      <span className="ml-1 inline-flex items-center rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">+{buys.length - 1}</span>
                                    )}
                                    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 hidden -translate-x-1/2 whitespace-pre rounded border border-white/10 bg-black/90 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                                      {tip}
                                    </span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2 px-3 text-right">{fmtSVC(row.achatsSvc)}</td>
                            <td className="py-2 px-3 text-right">{fmtSVC(row.gainsSvc)}</td>
                            <td className="py-2 px-3 text-right">{row.coutPacksUSD || row.coutPacksUSD === 0 ? fmtUSD(row.coutPacksUSD) : <span className="text-gray-500">—</span>}</td>
                            <td className="py-2 px-3 text-right">{row.depensePacksAffineeUSD || row.depensePacksAffineeUSD === 0 ? fmtUSD(row.depensePacksAffineeUSD) : <span className="text-gray-500">—</span>}</td>
                            <td className="py-2 px-3 text-right">{row.coutTotalUSD || row.coutTotalUSD === 0 ? fmtUSD(row.coutTotalUSD) : <span className="text-gray-500">—</span>}</td>
                            <td className="py-2 px-3">{row.roiUSD != null ? <RoiBar pct={row.roiUSD * 100} /> : <span className="text-gray-500">n/a</span>}</td>
                            <td className="py-2 px-3 text-right">
                              <button className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs" onClick={() => setOpenClub(isOpen ? null : row.id)}>
                                {isOpen ? t.drawer.close : t.drawer.see}
                              </button>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-black/30">
                              <td className="py-3 px-3" colSpan={12}>{renderDrawer(row.id)}</td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Joueurs */}
        {searched && (
          <section className="mb-20">
            <h2 className="text-2xl font-semibold mb-3">{t.playersHeading}</h2>
            {players.length === 0 ? (
              <div className="text-gray-400">{t.noPlayers}</div>
            ) : (
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3">{t.playerColumns.player}</th>
                      <th className="text-right py-2 px-3">{t.playerColumns.qty}</th>
                      <th className="text-right py-2 px-3">{t.playerColumns.base}</th>
                      <th className="text-right py-2 px-3">{t.playerColumns.payouts}</th>
                      <th className="text-left py-2 px-3">{t.playerColumns.roi}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {players.map((row) => (
                      <tr key={`p-${row.id}`} className="hover:bg-white/5">
                        <td className="py-2 px-3">
                          <a href={row.link} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
                            {row.name}
                          </a>
                        </td>
                        <td className="py-2 px-3 text-right">{fmtInt(row.qty)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(row.baseSvc)}</td>
                        <td className="py-2 px-3 text-right">{fmtSVC(row.payouts)}</td>
                        <td className="py-2 px-3">{row.baseSvc > 0 ? <RoiBar pct={(row.payouts / row.baseSvc) * 100} /> : <span className="text-gray-500">{t.playerColumns.naBaseMint}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
