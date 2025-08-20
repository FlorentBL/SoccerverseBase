"use client";
import React, { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Analyse tactique + Conseillers (UX réorganisée)
 * Requiert :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_KEY
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";
if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_KEY. Configure-les dans Vercel → Project Settings → Environment Variables."
  );
}
const supabase = createClient(url, key);

// ───────────────────────────────────────────────────────────────────────────────
// i18n (fr par défaut)
const TEXTS = {
  fr: {
    // App
    title: "Analyse tactique",
    step1: "Étape 1 — Filtres",
    step2: "Étape 2 — Analyse",
    step3: "Étape 3 — Conseiller",
    // Filtres
    leagueIds: "Ligues (CSV ou *)",
    seasonId: "Saison",
    minN: "Seuil n",
    side: "Côté",
    any: "Tous",
    home: "Domicile",
    away: "Extérieur",
    view: "Vue",
    formations: "Formations",
    styles: "Styles de jeu",
    load: "Charger",
    fullTable: "Tableau complet",
    exportCsv: "Exporter CSV",
    // Analyse
    tabsOverview: "Aperçu",
    tabsMatrix: "Matrice",
    bestMatchupsForm: "Meilleurs matchups (formations, n≥seuil)",
    worstMatchupsForm: "Pires matchups (formations, n≥seuil)",
    bestMatchupsStyle: "Meilleurs matchups (styles, n≥seuil)",
    worstMatchupsStyle: "Pires matchups (styles, n≥seuil)",
    matrixForm: "Matrice formation vs formation",
    matrixStyle: "Matrice style vs style",
    legend: "Code couleur : rouge = faible %V, vert = fort %V ; intensité = échantillon",
    // Table headers
    formationFor: "Pour",
    formationAgainst: "Contre",
    count: "n",
    winrate: "%V",
    avgGf: "BMoy",
    avgGa: "EMoy",
    // Conseiller
    tabAdvisor: "Conseiller",
    advisorHint: "Le conseiller utilise la matrice filtrée ci-dessus (saison, ligues, côté, n).",
    advisorSingleTitle: "Conseiller (tactique OU style)",
    advisorMode: "Dimension",
    advisorOpp: "Adversaire (attendu)",
    advisorMine: "Ma config actuelle (optionnel)",
    advisorRun: "Recommander",
    advisorResults: "Top 3 recommandations",
    advisorGain: "Gain vs actuel",
    advisorPick: "Choisis au moins un adversaire",
    // Conseiller global
    comboTitle: "Conseiller global (tactique + style)",
    comboOppForm: "Tactique adverse (attendue)",
    comboOppStyle: "Style adverse (attendu)",
    comboMineForm: "Ma tactique actuelle (optionnel)",
    comboMineStyle: "Mon style actuel (optionnel)",
    comboRun: "Recommander tactique + style",
    comboFormHeader: "Top 3 tactiques vs sa tactique",
    comboStyleHeader: "Top 3 styles vs son style",
    comboSuggestHeader: "Suggestion combinée",
    comboNeedOpp: "Renseigne la tactique ET le style adverses.",
    comboScore: "Score combiné estimé",
    // Misc
    noData: "Aucune donnée",
  },
  en: {
    title: "Tactical analysis",
    step1: "Step 1 — Filters",
    step2: "Step 2 — Analysis",
    step3: "Step 3 — Advisor",
    leagueIds: "Leagues (CSV or *)",
    seasonId: "Season",
    minN: "Min n",
    side: "Side",
    any: "Any",
    home: "Home",
    away: "Away",
    view: "View",
    formations: "Formations",
    styles: "Play styles",
    load: "Load",
    fullTable: "Full table",
    exportCsv: "Export CSV",
    tabsOverview: "Overview",
    tabsMatrix: "Matrix",
    bestMatchupsForm: "Best matchups (formations, n≥min)",
    worstMatchupsForm: "Worst matchups (formations, n≥min)",
    bestMatchupsStyle: "Best matchups (styles, n≥min)",
    worstMatchupsStyle: "Worst matchups (styles, n≥min)",
    matrixForm: "Formation vs formation matrix",
    matrixStyle: "Style vs style matrix",
    legend: "Color: red = low Win%, green = high Win%; intensity = sample size",
    formationFor: "For",
    formationAgainst: "Against",
    count: "n",
    winrate: "Win%",
    avgGf: "GF avg",
    avgGa: "GA avg",
    tabAdvisor: "Advisor",
    advisorHint: "Advisor uses the filtered matrix above (season, leagues, side, n).",
    advisorSingleTitle: "Advisor (tactic OR style)",
    advisorMode: "Dimension",
    advisorOpp: "Opponent (expected)",
    advisorMine: "My current setup (optional)",
    advisorRun: "Recommend",
    advisorResults: "Top 3 recommendations",
    advisorGain: "Gain vs current",
    advisorPick: "Pick at least an opponent",
    comboTitle: "Global advisor (tactic + style)",
    comboOppForm: "Opponent tactic (expected)",
    comboOppStyle: "Opponent style (expected)",
    comboMineForm: "My current tactic (optional)",
    comboMineStyle: "My current style (optional)",
    comboRun: "Recommend tactic + style",
    comboFormHeader: "Top 3 tactics vs their tactic",
    comboStyleHeader: "Top 3 styles vs their style",
    comboSuggestHeader: "Combined suggestion",
    comboNeedOpp: "Provide both opponent tactic AND style.",
    comboScore: "Estimated combined score",
    noData: "No data",
  },
};

// Mappings formations & styles
const FORMATION_MAP = {
  fr: { 0:"4-4-2",1:"4-3-3",2:"4-5-1",3:"3-4-3",4:"3-5-2",5:"3-3-4",6:"5-4-1",7:"5-3-2",8:"5-2-3",9:"4-4-2 (Losange)",10:"4-3-3 Ailiers",11:"4-5-1 Défensif",12:"4-2-3-1",13:"4-1-2-2-1",14:"4-4-1-1",15:"4-3-1-2",16:"3-4-1-2",17:"5-3-2 Libéro",18:"5-3-2 Défensif",19:"4-2-4",20:"4-2-2-2",21:"3-4-2-1",22:"4-1-3-2",23:"3-2-2-2-1" },
  en: { 0:"4-4-2",1:"4-3-3",2:"4-5-1",3:"3-4-3",4:"3-5-2",5:"3-3-4",6:"5-4-1",7:"5-3-2",8:"5-2-3",9:"4-4-2 (Diamond)",10:"4-3-3 Wingers",11:"4-5-1 Defensive",12:"4-2-3-1",13:"4-1-2-2-1",14:"4-4-1-1",15:"4-3-1-2",16:"3-4-1-2",17:"5-3-2 Libero",18:"5-3-2 Defensive",19:"4-2-4",20:"4-2-2-2",21:"3-4-2-1",22:"4-1-3-2",23:"3-2-2-2-1" },
};
const STYLE_MAP = {
  fr: { 0: "Normale (N)", 1: "Défensive (D)", 2: "Offensive (O)", 3: "Passes (P)", 4: "Contre-attaque (C)", 5: "Ballons longs (L)" },
  en: { 0: "Normal (N)", 1: "Defensive (D)", 2: "Offensive (O)", 3: "Passing (P)", 4: "Counter-attack (C)", 5: "Long balls (L)" },
};

// ───────────────────────────────────────────────────────────────────────────────
// Utils
const keyFn = (f) => (f ?? -1).toString();
const formatPct = (x) => (x * 100).toFixed(0) + "%";
const parseCsvIds = (s) => s.split(",").map((x) => x.trim()).filter(Boolean).map(Number).filter((n) => Number.isFinite(n));
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

function aggregateMatrix(rows) {
  const map = new Map();
  for (const r of rows) {
    const k = `${keyFn(r.formation_id)}|${keyFn(r.opp_formation_id)}`;
    const a = map.get(k) || { n: 0, w: 0, gf: 0, ga: 0 };
    a.n += 1;
    a.w += r.result === "W" ? 1 : 0;
    a.gf += r.goals_for;
    a.ga += r.goals_against;
    map.set(k, a);
  }
  return map;
}

function downloadCsv(filename, rows) {
  const header = ["for", "against", "n", "win_pct", "gf_avg", "ga_avg"];
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([esc(r.nameF), esc(r.nameG), r.n, (r.wr * 100).toFixed(0) + "%", r.gf.toFixed(3), r.ga.toFixed(3)].join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Couleurs
const hueForWR = (wr) => Math.round(Math.max(0, Math.min(1, wr)) * 120); // 0=red,120=green
const cellBg = (wr, n, maxN) => {
  const intensity = maxN > 0 ? Math.sqrt(n / maxN) : 0.5;
  const alpha = 0.18 + 0.32 * intensity;
  return `hsla(${hueForWR(wr)}, 85%, 45%, ${alpha})`;
};
const barColor = (wr) => `hsl(${hueForWR(wr)}, 80%, 45%)`;

// ───────────────────────────────────────────────────────────────────────────────
export default function AnalysisPage({ lang = "fr" }) {
  const t = TEXTS[lang] || TEXTS.fr;

  // ── Filtres (Step 1)
  const [leagueCsv, setLeagueCsv] = useState("*");
  const [seasonId, setSeasonId] = useState("2");
  const [minN, setMinN] = useState(5);
  const [sideFilter, setSideFilter] = useState("any"); // any|home|away
  const [view, setView] = useState("style"); // formation|style

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Données
  const [matrixForm, setMatrixForm] = useState(new Map());
  const [matrixStyle, setMatrixStyle] = useState(new Map());
  const [formationsPresent, setFormationsPresent] = useState([]);
  const [stylesPresent, setStylesPresent] = useState([]);

  const formationName = (id) => (id == null || id === -1 ? "—" : FORMATION_MAP[lang]?.[id] ?? String(id));
  const styleName = (id) => (id == null || id === -1 ? "—" : STYLE_MAP[lang]?.[id] ?? String(id));

  // Vue courante (Step 2)
  const currentMatrix = view === "formation" ? matrixForm : matrixStyle;
  const currentDomain = view === "formation" ? formationsPresent : stylesPresent;
  const nameFn = view === "formation" ? formationName : styleName;

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const season = Number(seasonId);
      if (!Number.isFinite(season)) throw new Error("Season invalide");

      // 1) Fixtures filtrés
      const isAllLeagues = leagueCsv.trim() === "*";
      const leagueIds = isAllLeagues ? [] : parseCsvIds(leagueCsv);

      let matchesReq = supabase
        .from("sv_matches")
        .select("fixture_id, league_id, season_id, played")
        .eq("season_id", season)
        .eq("played", true)
        .limit(300000);

      if (!isAllLeagues && leagueIds.length > 0) {
        matchesReq = matchesReq.in("league_id", leagueIds);
      }

      const { data: matches, error: mErr } = await matchesReq;
      if (mErr) throw mErr;

      const fids = (matches || []).map((m) => m.fixture_id);
      if (fids.length === 0) {
        setMatrixForm(new Map());
        setMatrixStyle(new Map());
        setFormationsPresent([]);
        setStylesPresent([]);
        setLoading(false);
        return;
      }

      // 2) Sides batched
      const allSides = [];
      const CHUNK = 800;
      for (let i = 0; i < fids.length; i += CHUNK) {
        const part = fids.slice(i, i + CHUNK);
        const { data: sides, error: sErr } = await supabase
          .from("sv_match_sides")
          .select("fixture_id, side, goals_for, goals_against, formation_id, play_style")
          .in("fixture_id", part);
        if (sErr) throw sErr;
        allSides.push(...(sides || []));
      }

      // 3) Groupement par fixture
      const byFixture = new Map();
      for (const s of allSides) {
        const arr = byFixture.get(s.fixture_id) || [];
        arr.push(s);
        byFixture.set(s.fixture_id, arr);
      }

      // 4) Datasets
      const rowsForm = [];
      const rowsStyle = [];
      const seenForm = new Set();
      const seenSty = new Set();

      for (const [, sides] of byFixture) {
        if (!sides || sides.length !== 2) continue;
        const a = sides.find((x) => x.side === "home") || sides[0];
        const b = sides.find((x) => x.side === "away") || sides[1];

        const includeA = sideFilter === "any" || sideFilter === a.side;
        if (includeA && a.goals_for != null && a.goals_against != null) {
          if (isNum(a.formation_id) && isNum(b.formation_id)) {
            rowsForm.push({
              formation_id: a.formation_id,
              opp_formation_id: b.formation_id,
              goals_for: a.goals_for || 0,
              goals_against: a.goals_against || 0,
              result: a.goals_for > a.goals_against ? "W" : a.goals_for === a.goals_against ? "D" : "L",
            });
            seenForm.add(a.formation_id); seenForm.add(b.formation_id);
          }
          if (isNum(a.play_style) && isNum(b.play_style)) {
            rowsStyle.push({
              formation_id: a.play_style,
              opp_formation_id: b.play_style,
              goals_for: a.goals_for || 0,
              goals_against: a.goals_against || 0,
              result: a.goals_for > a.goals_against ? "W" : a.goals_for === a.goals_against ? "D" : "L",
            });
            seenSty.add(a.play_style); seenSty.add(b.play_style);
          }
        }

        const includeB = sideFilter === "any" || sideFilter === b.side;
        if (includeB && b.goals_for != null && b.goals_against != null) {
          if (isNum(b.formation_id) && isNum(a.formation_id)) {
            rowsForm.push({
              formation_id: b.formation_id,
              opp_formation_id: a.formation_id,
              goals_for: b.goals_for || 0,
              goals_against: b.goals_against || 0,
              result: b.goals_for > b.goals_against ? "W" : b.goals_for === b.goals_against ? "D" : "L",
            });
            seenForm.add(a.formation_id); seenForm.add(b.formation_id);
          }
          if (isNum(b.play_style) && isNum(a.play_style)) {
            rowsStyle.push({
              formation_id: b.play_style,
              opp_formation_id: a.play_style,
              goals_for: b.goals_for || 0,
              goals_against: b.goals_against || 0,
              result: b.goals_for > b.goals_against ? "W" : b.goals_for === b.goals_against ? "D" : "L",
            });
            seenSty.add(a.play_style); seenSty.add(b.play_style);
          }
        }
      }

      // 5) Agrégation
      setMatrixForm(aggregateMatrix(rowsForm));
      setMatrixStyle(aggregateMatrix(rowsStyle));
      setFormationsPresent(Array.from(seenForm).sort((x, y) => x - y));
      setStylesPresent(Array.from(seenSty).sort((x, y) => x - y));

      setLoading(false);
    } catch (e) {
      console.error(e);
      setError(e?.message || "load_failed");
      setLoading(false);
    }
  }

  // ── Analyse (Step 2)
  const [analysisTab, setAnalysisTab] = useState("overview"); // overview | matrix
  const [showTable, setShowTable] = useState(false);
  const [sortConfig, setSortConfig] = useState(null); // { styleId, asc }
  const [filterStyle, setFilterStyle] = useState(null);

  const handleSort = (id) => {
    if (view !== "style") return;
    setSortConfig((prev) =>
      prev && prev.styleId === id ? { styleId: id, asc: !prev.asc } : { styleId: id, asc: false }
    );
  };

  const displayRows = useMemo(() => {
    if (view !== "style" || !sortConfig) return currentDomain;
    const others = currentDomain.filter((id) => id !== sortConfig.styleId);
    return [sortConfig.styleId, ...others];
  }, [view, sortConfig, currentDomain]);

  const displayCols = useMemo(() => {
    if (view !== "style" || !sortConfig) return currentDomain;
    const others = currentDomain.filter((id) => id !== sortConfig.styleId);
    others.sort((a, b) => {
      const aData = currentMatrix.get(`${sortConfig.styleId}|${a}`);
      const bData = currentMatrix.get(`${sortConfig.styleId}|${b}`);
      const aWr = aData && aData.n >= minN ? aData.w / aData.n : -1;
      const bWr = bData && bData.n >= minN ? bData.w / bData.n : -1;
      return sortConfig.asc ? aWr - bWr : bWr - aWr;
    });
    return [...others, sortConfig.styleId];
  }, [view, sortConfig, currentDomain, currentMatrix, minN]);

  const maxNInfo = useMemo(() => {
    let maxN = 0;
    for (const a of (view === "formation" ? matrixForm : matrixStyle).values())
      if (a && a.n >= minN) maxN = Math.max(maxN, a.n);
    return { maxN };
  }, [matrixForm, matrixStyle, minN, view]);

  const ranked = useMemo(() => {
    const out = [];
    for (const [k, a] of currentMatrix.entries()) {
      const [fStr, gStr] = k.split("|");
      const f = Number(fStr), g = Number(gStr);
      if (!a || a.n === 0 || f < 0 || g < 0) continue;
      out.push({ f, g, n: a.n, wr: a.w / a.n, gf: a.gf / a.n, ga: a.ga / a.n });
    }
    const withMin = out.filter((r) => r.n >= minN);
    const best = [...withMin].sort((x, y) => y.wr - x.wr || y.n - x.n).slice(0, 10);
    const worst = [...withMin].sort((x, y) => x.wr - y.wr || y.n - y.n).slice(0, 10);
    return { best, worst };
  }, [currentMatrix, minN, view]);

  const allRows = useMemo(() => {
    const out = [];
    for (const [k, a] of currentMatrix.entries()) {
      const [fStr, gStr] = k.split("|");
      const f = Number(fStr), g = Number(gStr);
      if (!a || a.n === 0 || f < 0 || g < 0) continue;
      out.push({ f, g, nameF: nameFn(f), nameG: nameFn(g), n: a.n, wr: a.w / a.n, gf: a.gf / a.n, ga: a.ga / a.n });
    }
    let arr = out;
    if (view === "style" && filterStyle != null) {
      arr = arr.filter((r) => r.f === filterStyle);
    }
    return arr.sort((x, y) => y.n - x.n || y.wr - x.wr);
  }, [currentMatrix, view, filterStyle, nameFn]);

  const titleBest = view === "formation" ? t.bestMatchupsForm : t.bestMatchupsStyle;
  const titleWorst = view === "formation" ? t.worstMatchupsForm : t.worstMatchupsStyle;
  const titleMatrix = view === "formation" ? t.matrixForm : t.matrixStyle;

  // ── Conseillers (Step 3)
  const [advisorMode, setAdvisorMode] = useState("style"); // 'formation' | 'style'
  const [oppChoice, setOppChoice] = useState("");
  const [myChoice, setMyChoice] = useState("");
  const [advise, setAdvise] = useState([]);

  const matrixForAdvisor = advisorMode === "formation" ? matrixForm : matrixStyle;
  const domainForAdvisor = advisorMode === "formation" ? formationsPresent : stylesPresent;
  const nameForAdvisor = advisorMode === "formation" ? formationName : styleName;

  function getTopCounters(matrix, opponentId, thresholdN) {
    const out = [];
    for (const [k, a] of matrix.entries()) {
      const [fStr, gStr] = k.split("|");
      const f = Number(fStr), g = Number(gStr);
      if (g !== opponentId || !a || a.n < thresholdN || f < 0) continue;
      out.push({ f, g, n: a.n, wr: a.w / a.n, gf: a.gf / a.n, ga: a.ga / a.n });
    }
    out.sort((x, y) => y.wr - x.wr || y.n - x.n);
    return out.slice(0, 3);
  }

  function currentPairWR(matrix, mine, opp) {
    const a = matrix.get(`${mine}|${opp}`);
    if (!a || a.n < minN) return null;
    return { wr: a.w / a.n, n: a.n, gf: a.gf / a.n, ga: a.ga / a.n };
  }

  function runAdvisor() {
    const g = Number(oppChoice);
    if (!Number.isFinite(g)) {
      setAdvise([{ error: t.advisorPick }]);
      return;
    }
    const top = getTopCounters(matrixForAdvisor, g, minN);
    const mine = Number(myChoice);
    const base = Number.isFinite(mine) ? currentPairWR(matrixForAdvisor, mine, g) : null;
    const enriched = top.map((r) => ({
      ...r,
      deltaWr: base ? r.wr - base.wr : null,
      baseWr: base?.wr ?? null,
      baseN: base?.n ?? null,
    }));
    setAdvise(enriched);
  }

  // Global
  const [oppFormChoice, setOppFormChoice] = useState("");
  const [oppStyleChoice, setOppStyleChoice] = useState("");
  const [myFormChoice, setMyFormChoice] = useState("");
  const [myStyleChoice, setMyStyleChoice] = useState("");
  const [combo, setCombo] = useState(null);

  function runCombinedAdvisor() {
    const oppF = Number(oppFormChoice);
    const oppS = Number(oppStyleChoice);
    if (!Number.isFinite(oppF) || !Number.isFinite(oppS)) {
      setCombo({ error: t.comboNeedOpp });
      return;
    }

    const topForms = getTopCounters(matrixForm, oppF, minN);
    const topStyles = getTopCounters(matrixStyle, oppS, minN);

    const mineF = Number(myFormChoice);
    const mineS = Number(myStyleChoice);
    const baseForm = Number.isFinite(mineF) ? currentPairWR(matrixForm, mineF, oppF) : null;
    const baseStyle = Number.isFinite(mineS) ? currentPairWR(matrixStyle, mineS, oppS) : null;

    const topFormsEnriched = topForms.map((r) => ({
      ...r,
      deltaWr: baseForm ? r.wr - baseForm.wr : null,
      baseWr: baseForm?.wr ?? null,
      baseN: baseForm?.n ?? null,
    }));
    const topStylesEnriched = topStyles.map((r) => ({
      ...r,
      deltaWr: baseStyle ? r.wr - baseStyle.wr : null,
      baseWr: baseStyle?.wr ?? null,
      baseN: baseStyle?.n ?? null,
    }));

    let bestPair = null;
    for (const tf of topFormsEnriched) {
      for (const ts of topStylesEnriched) {
        const score = (tf.wr ?? 0) * (ts.wr ?? 0);
        if (!bestPair || score > bestPair.score) {
          bestPair = { f: tf.f, s: ts.f, wrF: tf.wr, wrS: ts.wr, score };
        }
      }
    }

    setCombo({ oppF, oppS, forms: topFormsEnriched, styles: topStylesEnriched, bestPair });
  }

  // ── UI
  return (
    <div className="min-h-screen px-4 py-8 bg-neutral-950 text-gray-100" style={{ colorScheme: "dark" }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
        </header>

        {/* STEP 1 — FILTRES */}
        <section className="border border-gray-800 rounded-2xl p-4">
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">{t.step1}</h2>
          <div className="grid grid-cols-2 md:grid-cols-8 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">{t.leagueIds}</label>
              <input
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={leagueCsv}
                onChange={(e) => setLeagueCsv(e.target.value)}
                placeholder="548,549 ou *"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t.seasonId}</label>
              <input
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t.minN}</label>
              <input
                type="number"
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={minN}
                onChange={(e) => setMinN(Math.max(1, Number(e.target.value)))}
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t.side}</label>
              <select
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={sideFilter}
                onChange={(e) => setSideFilter(e.target.value)}
              >
                <option value="any">{t.any}</option>
                <option value="home">{t.home}</option>
                <option value="away">{t.away}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t.view}</label>
              <select
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={view}
                onChange={(e) => setView(e.target.value)}
              >
                <option value="formation">{t.formations}</option>
                <option value="style">{t.styles}</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                onClick={loadData}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-white font-medium w-full md:w-auto"
                disabled={loading}
              >
                {loading ? "…" : t.load}
              </button>
              <button
                onClick={() => downloadCsv(view === "formation" ? "formations.csv" : "styles.csv", allRows)}
                className="px-3 py-2 rounded-lg border border-gray-700 hover:bg-white/5 transition text-sm"
                disabled={allRows.length === 0}
                title="Export du tableau courant"
              >
                {t.exportCsv}
              </button>
            </div>
          </div>
          {error && <div className="text-sm text-red-400 mt-3">{String(error)}</div>}
        </section>

        {/* STEP 2 — ANALYSE */}
        <section className="border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm uppercase tracking-wider text-gray-400">{t.step2}</h2>
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-800">
              <button
                className={`px-3 py-2 text-sm ${analysisTab === "overview" ? "bg-gray-800" : "bg-transparent hover:bg-gray-900"}`}
                onClick={() => setAnalysisTab("overview")}
              >
                {t.tabsOverview}
              </button>
              <button
                className={`px-3 py-2 text-sm ${analysisTab === "matrix" ? "bg-gray-800" : "bg-transparent hover:bg-gray-900"}`}
                onClick={() => setAnalysisTab("matrix")}
              >
                {t.tabsMatrix}
              </button>
            </div>
          </div>

          {analysisTab === "overview" ? (
            <>
              {/* Best / Worst */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-800 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">{titleBest}</h3>
                  <table className="w-full text-sm">
                    <thead className="text-gray-400">
                      <tr>
                        <th className="text-left py-1 pr-2">{t.formationFor}</th>
                        <th className="text-left py-1 pr-2">{t.formationAgainst}</th>
                        <th className="text-right py-1 pr-2">{t.count}</th>
                        <th className="text-right py-1 pr-2">{t.winrate}</th>
                        <th className="text-right py-1 pr-2">{t.avgGf}</th>
                        <th className="text-right py-1 pr-2">{t.avgGa}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {ranked.best.length === 0 && (
                        <tr><td colSpan={6} className="py-3 text-gray-500">{t.noData}</td></tr>
                      )}
                      {ranked.best.map((r, i) => (
                        <tr key={`b-${i}`} className="hover:bg-white/5" style={{ borderLeft: `4px solid ${barColor(r.wr)}` }}>
                          <td className="py-1 pr-2">{nameFn(r.f)}</td>
                          <td className="py-1 pr-2">{nameFn(r.g)}</td>
                          <td className="py-1 pr-2 text-right">{r.n}</td>
                          <td className="py-1 pr-2 text-right">{formatPct(r.wr)}</td>
                          <td className="py-1 pr-2 text-right">{r.gf.toFixed(2)}</td>
                          <td className="py-1 pr-2 text-right">{r.ga.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border border-gray-800 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">{titleWorst}</h3>
                  <table className="w-full text-sm">
                    <thead className="text-gray-400">
                      <tr>
                        <th className="text-left py-1 pr-2">{t.formationFor}</th>
                        <th className="text-left py-1 pr-2">{t.formationAgainst}</th>
                        <th className="text-right py-1 pr-2">{t.count}</th>
                        <th className="text-right py-1 pr-2">{t.winrate}</th>
                        <th className="text-right py-1 pr-2">{t.avgGf}</th>
                        <th className="text-right py-1 pr-2">{t.avgGa}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {ranked.worst.length === 0 && (
                        <tr><td colSpan={6} className="py-3 text-gray-500">{t.noData}</td></tr>
                      )}
                      {ranked.worst.map((r, i) => (
                        <tr key={`w-${i}`} className="hover:bg-white/5" style={{ borderLeft: `4px solid ${barColor(r.wr)}` }}>
                          <td className="py-1 pr-2">{nameFn(r.f)}</td>
                          <td className="py-1 pr-2">{nameFn(r.g)}</td>
                          <td className="py-1 pr-2 text-right">{r.n}</td>
                          <td className="py-1 pr-2 text-right">{formatPct(r.wr)}</td>
                          <td className="py-1 pr-2 text-right">{r.gf.toFixed(2)}</td>
                          <td className="py-1 pr-2 text-right">{r.ga.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tableau complet (toggle) */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={showTable} onChange={(e) => setShowTable(e.target.checked)} />
                    {t.fullTable}
                  </label>
                </div>

                {showTable && (
                  <div className="border border-gray-800 rounded-xl p-4 mt-3 overflow-x-auto">
                    {view === "style" && (
                      <div className="mb-3">
                        <label className="block text-xs text-gray-400 mb-1">Style</label>
                        <select
                          className="rounded-lg p-2 border border-gray-700 bg-gray-900"
                          value={filterStyle == null ? "" : filterStyle}
                          onChange={(e) => setFilterStyle(e.target.value === "" ? null : Number(e.target.value))}
                        >
                          <option value="">{t.any}</option>
                          {stylesPresent.map((id) => (
                            <option key={id} value={id}>{styleName(id)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {allRows.length === 0 ? (
                      <div className="text-sm text-gray-500">{t.noData}</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-gray-400">
                          <tr>
                            <th className="text-left py-1 pr-2">{t.formationFor}</th>
                            <th className="text-left py-1 pr-2">{t.formationAgainst}</th>
                            <th className="text-right py-1 pr-2">{t.count}</th>
                            <th className="text-right py-1 pr-2">{t.winrate}</th>
                            <th className="text-right py-1 pr-2">{t.avgGf}</th>
                            <th className="text-right py-1 pr-2">{t.avgGa}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {allRows.map((r, i) => (
                            <tr key={`all-${i}`} className="hover:bg-white/5" style={{ borderLeft: `4px solid ${barColor(r.wr)}` }}>
                              <td className="py-1 pr-2">{r.nameF}</td>
                              <td className="py-1 pr-2">{r.nameG}</td>
                              <td className="py-1 pr-2 text-right">{r.n}</td>
                              <td className="py-1 pr-2 text-right">{formatPct(r.wr)}</td>
                              <td className="py-1 pr-2 text-right">{r.gf.toFixed(2)}</td>
                              <td className="py-1 pr-2 text-right">{r.ga.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="border border-gray-800 rounded-xl p-4 overflow-x-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{titleMatrix}</h3>
                  <p className="text-xs text-gray-400">{t.legend}</p>
                </div>
              </div>
              {currentDomain.length === 0 ? (
                <div className="text-sm text-gray-500 mt-3">{t.noData}</div>
              ) : (
                <table className="text-xs mt-3">
                  <thead>
                    <tr>
                      <th className="p-2 bg-gray-900 sticky left-0 z-10">
                        {view === "formation" ? `${t.formationFor} ↓ / ${t.formationAgainst} →` : "Style ↓ / Style →"}
                      </th>
                      {displayCols.map((id) => (
                        <th key={`col-${id}`} className="p-2 text-nowrap">{nameFn(id)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((rowId) => (
                      <tr key={`row-${rowId}`}>
                        <th
                          className={`p-2 bg-gray-900 sticky left-0 z-10 text-left ${view === "style" ? "cursor-pointer hover:underline" : ""}`}
                          onClick={() => handleSort(rowId)}
                        >
                          {nameFn(rowId)}
                        </th>
                        {displayCols.map((colId) => {
                          const a = currentMatrix.get(`${rowId}|${colId}`);
                          if (!a || a.n < minN)
                            return <td key={`cell-${rowId}-${colId}`} className="p-2 text-center text-gray-600">—</td>;
                          const wr = a.w / a.n;
                          const gf = a.gf / a.n;
                          const ga = a.ga / a.n;
                          return (
                            <td
                              key={`cell-${rowId}-${colId}`}
                              className="p-2 text-center align-top rounded"
                              style={{ backgroundColor: cellBg(wr, a.n, maxNInfo.maxN) }}
                              title={`n=${a.n} • ${formatPct(wr)} • ${gf.toFixed(2)} / ${ga.toFixed(2)}`}
                            >
                              <div className="font-mono">{formatPct(wr)}</div>
                              <div className="text-[11px] text-gray-200/80">n={a.n}</div>
                              <div className="text-[11px]">{gf.toFixed(2)} / {ga.toFixed(2)}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>

        {/* STEP 3 — CONSEILLER */}
        <section className="border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm uppercase tracking-wider text-gray-400">{t.step3}</h2>
            <p className="text-xs text-gray-400">{t.advisorHint}</p>
          </div>

          {/* Conseiller mono-dimension */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t.advisorMode}</label>
              <select
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={advisorMode}
                onChange={(e) => { setAdvisorMode(e.target.value); setAdvise([]); }}
              >
                <option value="formation">{t.formations}</option>
                <option value="style">{t.styles}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{t.advisorOpp}</label>
              <select
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={oppChoice}
                onChange={(e) => setOppChoice(e.target.value)}
              >
                <option value="">{t.any}</option>
                {domainForAdvisor.map((id) => (
                  <option key={`opp-${id}`} value={id}>{nameForAdvisor(id)}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{t.advisorMine}</label>
              <select
                className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                value={myChoice}
                onChange={(e) => setMyChoice(e.target.value)}
              >
                <option value="">{t.any}</option>
                {domainForAdvisor.map((id) => (
                  <option key={`mine-${id}`} value={id}>{nameForAdvisor(id)}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5">
              <button
                onClick={runAdvisor}
                className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition text-white font-medium"
                disabled={domainForAdvisor.length === 0}
              >
                {t.advisorRun}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="font-semibold mb-2">{t.advisorResults}</h3>
            {advise.length === 0 ? (
              <div className="text-sm text-gray-500">{t.noData}</div>
            ) : advise[0]?.error ? (
              <div className="text-sm text-amber-400">{advise[0].error}</div>
            ) : (
              <ul className="space-y-2">
                {advise.map((r, idx) => (
                  <li key={`advice-${idx}`} className="p-3 rounded-lg border border-gray-800 bg-gray-900/40">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-medium">
                        {nameForAdvisor(r.f)} <span className="text-gray-400">vs</span> {nameForAdvisor(r.g)}
                      </div>
                      <div className="text-sm tabular-nums">
                        <span className="mr-3">{formatPct(r.wr)}</span>
                        <span className="mr-3 text-gray-400">n={r.n}</span>
                        <span className="text-gray-400">{r.gf.toFixed(2)} / {r.ga.toFixed(2)}</span>
                      </div>
                    </div>
                    {r.deltaWr != null && (
                      <div className="mt-2 text-xs text-gray-300">
                        {t.advisorGain}: <b>{(r.deltaWr * 100).toFixed(1)} pts</b>{" "}
                        <span className="text-gray-500">
                          (actuel {r.baseWr != null ? formatPct(r.baseWr) : "—"}
                          {r.baseN != null ? `, n=${r.baseN}` : ""})
                        </span>
                      </div>
                    )}
                    <div className="mt-2 h-2 w-full rounded bg-gray-800 overflow-hidden">
                      <div className="h-2" style={{ width: `${Math.max(2, Math.min(100, r.wr * 100))}%`, backgroundColor: barColor(r.wr) }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Conseiller global */}
          <div className="mt-8">
            <h3 className="font-semibold mb-2">{t.comboTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.comboOppForm}</label>
                <select
                  className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                  value={oppFormChoice}
                  onChange={(e) => setOppFormChoice(e.target.value)}
                >
                  <option value="">{t.any}</option>
                  {formationsPresent.map((id) => (
                    <option key={`oppf-${id}`} value={id}>{formationName(id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.comboOppStyle}</label>
                <select
                  className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                  value={oppStyleChoice}
                  onChange={(e) => setOppStyleChoice(e.target.value)}
                >
                  <option value="">{t.any}</option>
                  {stylesPresent.map((id) => (
                    <option key={`opps-${id}`} value={id}>{styleName(id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.comboMineForm}</label>
                <select
                  className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                  value={myFormChoice}
                  onChange={(e) => setMyFormChoice(e.target.value)}
                >
                  <option value="">{t.any}</option>
                  {formationsPresent.map((id) => (
                    <option key={`myf-${id}`} value={id}>{formationName(id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.comboMineStyle}</label>
                <select
                  className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900"
                  value={myStyleChoice}
                  onChange={(e) => setMyStyleChoice(e.target.value)}
                >
                  <option value="">{t.any}</option>
                  {stylesPresent.map((id) => (
                    <option key={`mys-${id}`} value={id}>{styleName(id)}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={runCombinedAdvisor}
                  className="mt-2 w-full px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 transition text-white font-medium"
                  disabled={formationsPresent.length === 0 || stylesPresent.length === 0}
                >
                  {t.comboRun}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tactiques */}
              <div className="border border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">{t.comboFormHeader}</h4>
                {!combo ? (
                  <div className="text-sm text-gray-500">{t.noData}</div>
                ) : combo.error ? (
                  <div className="text-sm text-amber-400">{combo.error}</div>
                ) : combo.forms?.length ? (
                  <ul className="space-y-2">
                    {combo.forms.map((r, idx) => (
                      <li key={`combo-form-${idx}`} className="p-3 rounded-lg bg-gray-900/40 border border-gray-800">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="font-medium">{formationName(r.f)}</div>
                          <div className="text-sm tabular-nums">
                            <span className="mr-3">{formatPct(r.wr)}</span>
                            <span className="mr-3 text-gray-400">n={r.n}</span>
                            <span className="text-gray-400">{r.gf.toFixed(2)} / {r.ga.toFixed(2)}</span>
                          </div>
                        </div>
                        {r.deltaWr != null && (
                          <div className="mt-2 text-xs text-gray-300">
                            {t.advisorGain}: <b>{(r.deltaWr * 100).toFixed(1)} pts</b>{" "}
                            <span className="text-gray-500">
                              (actuel {r.baseWr != null ? formatPct(r.baseWr) : "—"}
                              {r.baseN != null ? `, n=${r.baseN}` : ""})
                            </span>
                          </div>
                        )}
                        <div className="mt-2 h-2 w-full rounded bg-gray-800 overflow-hidden">
                          <div className="h-2" style={{ width: `${Math.max(2, Math.min(100, r.wr * 100))}%`, backgroundColor: barColor(r.wr) }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">{t.noData}</div>
                )}
              </div>

              {/* Styles */}
              <div className="border border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">{t.comboStyleHeader}</h4>
                {!combo ? (
                  <div className="text-sm text-gray-500">{t.noData}</div>
                ) : combo.error ? (
                  <div className="text-sm text-amber-400">{combo.error}</div>
                ) : combo.styles?.length ? (
                  <ul className="space-y-2">
                    {combo.styles.map((r, idx) => (
                      <li key={`combo-style-${idx}`} className="p-3 rounded-lg bg-gray-900/40 border border-gray-800">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="font-medium">{styleName(r.f)}</div>
                          <div className="text-sm tabular-nums">
                            <span className="mr-3">{formatPct(r.wr)}</span>
                            <span className="mr-3 text-gray-400">n={r.n}</span>
                            <span className="text-gray-400">{r.gf.toFixed(2)} / {r.ga.toFixed(2)}</span>
                          </div>
                        </div>
                        {r.deltaWr != null && (
                          <div className="mt-2 text-xs text-gray-300">
                            {t.advisorGain}: <b>{(r.deltaWr * 100).toFixed(1)} pts</b>{" "}
                            <span className="text-gray-500">
                              (actuel {r.baseWr != null ? formatPct(r.baseWr) : "—"}
                              {r.baseN != null ? `, n=${r.baseN}` : ""})
                            </span>
                          </div>
                        )}
                        <div className="mt-2 h-2 w-full rounded bg-gray-800 overflow-hidden">
                          <div className="h-2" style={{ width: `${Math.max(2, Math.min(100, r.wr * 100))}%`, backgroundColor: barColor(r.wr) }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">{t.noData}</div>
                )}
              </div>

              {/* Suggestion combinée */}
              <div className="border border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">{t.comboSuggestHeader}</h4>
                {!combo || combo.error ? (
                  <div className="text-sm text-gray-500">{!combo ? t.noData : combo.error}</div>
                ) : combo.bestPair ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div><span className="text-gray-400">Tactique :</span> <b>{formationName(combo.bestPair.f)}</b> <span className="text-gray-500">(WR ~ {formatPct(combo.bestPair.wrF)})</span></div>
                      <div><span className="text-gray-400">Style :</span> <b>{styleName(combo.bestPair.s)}</b> <span className="text-gray-500">(WR ~ {formatPct(combo.bestPair.wrS)})</span></div>
                    </div>
                    <div className="text-xs text-gray-300">
                      {t.comboScore}: <b>{formatPct((combo.bestPair.wrF || 0) * (combo.bestPair.wrS || 0))}</b>
                      <div className="text-gray-500 mt-1">Heuristique indépendante (WR tactique × WR style).</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">{t.noData}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
