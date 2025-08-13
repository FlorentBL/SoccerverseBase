"use client";
import React, { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Analyse tactique (Formations & Styles) depuis Supabase
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
    title: "Analyse tactique",
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
    matrixForm: "Matrice formation vs formation",
    matrixStyle: "Matrice style vs style",
    formationFor: "Pour",
    formationAgainst: "Contre",
    count: "n",
    winrate: "%V",
    avgGf: "BMoy",
    avgGa: "EMoy",
    bestMatchupsForm: "Meilleurs matchups (formations, n≥seuil)",
    worstMatchupsForm: "Pires matchups (formations, n≥seuil)",
    bestMatchupsStyle: "Meilleurs matchups (styles, n≥seuil)",
    worstMatchupsStyle: "Pires matchups (styles, n≥seuil)",
    noData: "Aucune donnée",
    fullTable: "Tableau complet",
    exportCsv: "Exporter CSV",
  },
  en: {
    title: "Tactical analysis",
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
    matrixForm: "Formation vs formation matrix",
    matrixStyle: "Style vs style matrix",
    formationFor: "For",
    formationAgainst: "Against",
    count: "n",
    winrate: "Win%",
    avgGf: "GF avg",
    avgGa: "GA avg",
    bestMatchupsForm: "Best matchups (formations, n≥min)",
    worstMatchupsForm: "Worst matchups (formations, n≥min)",
    bestMatchupsStyle: "Best matchups (styles, n≥min)",
    worstMatchupsStyle: "Worst matchups (styles, n≥min)",
    noData: "No data",
    fullTable: "Full table",
    exportCsv: "Export CSV",
  },
};

// Mappings formations & styles
const FORMATION_MAP = {
  fr: {
    0: "4-4-2",
    1: "4-3-3",
    2: "4-5-1",
    3: "3-4-3",
    4: "3-5-2",
    5: "3-3-4",
    6: "5-4-1",
    7: "5-3-2",
    8: "5-2-3",
    9: "4-4-2 (Losange)",
    10: "4-3-3 Ailiers",
    11: "4-5-1 Défensif",
    12: "4-2-3-1",
    13: "4-4-1-1",
    14: "4-3-1-2",
    15: "3-4-1-2",
    16: "5-3-2 Libéro",
    17: "5-3-2 Défensif",
    18: "4-2-4",
    19: "4-2-2-2",
    20: "3-4-2-1",
    21: "4-1-3-2",
    22: "3-2-2-2-1",
  },
  en: {
    0: "4-4-2",
    1: "4-3-3",
    2: "4-5-1",
    3: "3-4-3",
    4: "3-5-2",
    5: "3-3-4",
    6: "5-4-1",
    7: "5-3-2",
    8: "5-2-3",
    9: "4-4-2 (Diamond)",
    10: "4-3-3 Wingers",
    11: "4-5-1 Defensive",
    12: "4-2-3-1",
    13: "4-4-1-1",
    14: "4-3-1-2",
    15: "3-4-1-2",
    16: "5-3-2 Libero",
    17: "5-3-2 Defensive",
    18: "4-2-4",
    19: "4-2-2-2",
    20: "3-4-2-1",
    21: "4-1-3-2",
    22: "3-2-2-2-1",
  },
};
const STYLE_MAP = {
  fr: {
    0: "Normale (N)",
    1: "Défensive (D)",
    2: "Offensive (O)",
    3: "Passes (P)",
    4: "Contre-attaque (C)",
    5: "Ballons longs (L)",
  },
  en: {
    0: "Normal (N)",
    1: "Defensive (D)",
    2: "Offensive (O)",
    3: "Passing (P)",
    4: "Counter-attack (C)",
    5: "Long balls (L)",
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// Utils
const keyFn = (f) => (f ?? -1).toString();
const formatPct = (x) => (x * 100).toFixed(0) + "%";
const parseCsvIds = (s) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));

function aggregateMatrix(rows) {
  // rows: { formation_id, opp_formation_id, goals_for, goals_against, result: 'W'|'D'|'L' }[]
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
    lines.push(
      [
        esc(r.nameF),
        esc(r.nameG),
        r.n,
        (r.wr * 100).toFixed(0) + "%",
        r.gf.toFixed(3),
        r.ga.toFixed(3),
      ].join(",")
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ───────────────────────────────────────────────────────────────────────────────
export default function AnalysisPage({ lang = "fr" }) {
  const t = TEXTS[lang] || TEXTS.fr;

  // Filtres
  const [leagueCsv, setLeagueCsv] = useState("*"); // ex: "548,549" ou "*"
  const [seasonId, setSeasonId] = useState("2");
  const [minN, setMinN] = useState(5);
  const [sideFilter, setSideFilter] = useState("any"); // any|home|away
  const [view, setView] = useState("formation"); // formation|style
  const [showTable, setShowTable] = useState(false);

  // État
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Matrices & domaines
  const [matrixForm, setMatrixForm] = useState(new Map());
  const [matrixStyle, setMatrixStyle] = useState(new Map());
  const [formationsPresent, setFormationsPresent] = useState([]);
  const [stylesPresent, setStylesPresent] = useState([]);

  const formationName = (id) =>
    id == null || id === -1 ? "—" : FORMATION_MAP[lang]?.[id] ?? String(id);
  const styleName = (id) =>
    id == null || id === -1 ? "—" : STYLE_MAP[lang]?.[id] ?? String(id);

  const currentMatrix = view === "formation" ? matrixForm : matrixStyle;
  const currentDomain = view === "formation" ? formationsPresent : stylesPresent;
  const nameFn = view === "formation" ? formationName : styleName;

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const season = Number(seasonId);
      if (!Number.isFinite(season)) throw new Error("Season invalide");

      // 1) Matches joués pour la saison + (ligues CSV) ou toutes ligues si '*'
      const isAllLeagues = leagueCsv.trim() === "*";
      const leagueIds = isAllLeagues ? [] : parseCsvIds(leagueCsv);

      let matchesReq = supabase
        .from("sv_matches")
        .select("fixture_id, league_id, season_id, played")
        .eq("season_id", season)
        .eq("played", true)
        .limit(300000); // garde de sécurité

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

      // 2) Charger les sides (batch .in)
      const allSides = [];
      const CHUNK = 800;
      for (let i = 0; i < fids.length; i += CHUNK) {
        const part = fids.slice(i, i + CHUNK);
        const { data: sides, error: sErr } = await supabase
          .from("sv_match_sides")
          .select(
            "fixture_id, side, club_id, opponent_club_id, goals_for, goals_against, formation_id, play_style"
          )
          .in("fixture_id", part);
        if (sErr) throw sErr;
        allSides.push(...(sides || []));
      }

      // 3) Regrouper par fixture, conserver les deux côtés
      const byFixture = new Map();
      for (const s of allSides) {
        const arr = byFixture.get(s.fixture_id) || [];
        arr.push(s);
        byFixture.set(s.fixture_id, arr);
      }

      // 4) Construire datasets formations & styles
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
          rowsForm.push({
            formation_id: a.formation_id,
            opp_formation_id: b.formation_id,
            goals_for: a.goals_for || 0,
            goals_against: a.goals_against || 0,
            result:
              a.goals_for > a.goals_against
                ? "W"
                : a.goals_for === a.goals_against
                ? "D"
                : "L",
          });
          rowsStyle.push({
            formation_id: a.play_style,
            opp_formation_id: b.play_style,
            goals_for: a.goals_for || 0,
            goals_against: a.goals_against || 0,
            result:
              a.goals_for > a.goals_against
                ? "W"
                : a.goals_for === a.goals_against
                ? "D"
                : "L",
          });
          if (typeof a.formation_id === "number") seenForm.add(a.formation_id);
          if (typeof b.formation_id === "number") seenForm.add(b.formation_id);
          if (typeof a.play_style === "number") seenSty.add(a.play_style);
          if (typeof b.play_style === "number") seenSty.add(b.play_style);
        }

        const includeB = sideFilter === "any" || sideFilter === b.side;
        if (includeB && b.goals_for != null && b.goals_against != null) {
          rowsForm.push({
            formation_id: b.formation_id,
            opp_formation_id: a.formation_id,
            goals_for: b.goals_for || 0,
            goals_against: b.goals_against || 0,
            result:
              b.goals_for > b.goals_against
                ? "W"
                : b.goals_for === b.goals_against
                ? "D"
                : "L",
          });
          rowsStyle.push({
            formation_id: b.play_style,
            opp_formation_id: a.play_style,
            goals_for: b.goals_for || 0,
            goals_against: b.goals_against || 0,
            result:
              b.goals_for > b.goals_against
                ? "W"
                : b.goals_for === b.goals_against
                ? "D"
                : "L",
          });
          if (typeof a.formation_id === "number") seenForm.add(a.formation_id);
          if (typeof b.formation_id === "number") seenForm.add(b.formation_id);
          if (typeof a.play_style === "number") seenSty.add(a.play_style);
          if (typeof b.play_style === "number") seenSty.add(b.play_style);
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

  // Classements Top/Flop depuis la matrice courante
  const ranked = useMemo(() => {
    const out = [];
    for (const [k, a] of currentMatrix.entries()) {
      const [fStr, gStr] = k.split("|");
      const f = Number(fStr);
      const g = Number(gStr);
      if (!a || a.n === 0) continue;
      out.push({
        f,
        g,
        n: a.n,
        wr: a.w / a.n,
        gf: a.gf / a.n,
        ga: a.ga / a.n,
      });
    }
    const withMin = out.filter((r) => r.n >= minN);
    const best = [...withMin]
      .sort((x, y) => y.wr - x.wr || y.n - x.n)
      .slice(0, 12);
    const worst = [...withMin]
      .sort((x, y) => x.wr - y.wr || y.n - x.n)
      .slice(0, 12);
    return { best, worst };
  }, [currentMatrix, minN, view]);

  // Tableau complet (toutes combinaisons)
  const allRows = useMemo(() => {
    const out = [];
    for (const [k, a] of currentMatrix.entries()) {
      const [fStr, gStr] = k.split("|");
      const f = Number(fStr),
        g = Number(gStr);
      if (!a || a.n === 0) continue;
      out.push({
        f,
        g,
        nameF: nameFn(f),
        nameG: nameFn(g),
        n: a.n,
        wr: a.w / a.n,
        gf: a.gf / a.n,
        ga: a.ga / a.n,
      });
    }
    return out.sort((x, y) => y.n - x.n || y.wr - x.wr);
  }, [currentMatrix, view]);

  const titleBest =
    view === "formation" ? t.bestMatchupsForm : t.bestMatchupsStyle;
  const titleWorst =
    view === "formation" ? t.worstMatchupsForm : t.worstMatchupsStyle;
  const titleMatrix = view === "formation" ? t.matrixForm : t.matrixStyle;

  return (
    <div
  className="min-h-screen px-4 py-10 bg-neutral-950 text-gray-100"
  style={{ colorScheme: "dark" }}
>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t.title}</h1>

        {/* Filtres */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-3 items-end mb-6">
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-400 mb-1">
              {t.leagueIds}
            </label>
            <input
              className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-400"
              value={leagueCsv}
              onChange={(e) => setLeagueCsv(e.target.value)}
              placeholder="548,549 ou *"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {t.seasonId}
            </label>
            <input
              className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-400"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              placeholder="2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t.minN}</label>
            <input
              type="number"
              className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-400"
              value={minN}
              onChange={(e) => setMinN(Math.max(1, Number(e.target.value)))}
              min={1}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t.side}</label>
            <select
              className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-400"
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
              className="w-full rounded-lg p-2 border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-400"
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
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-white font-medium"
              disabled={loading}
            >
              {loading ? "…" : t.load}
            </button>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showTable}
                onChange={(e) => setShowTable(e.target.checked)}
              />
              {t.fullTable}
            </label>
            <button
              onClick={() =>
                downloadCsv(
                  view === "formation" ? "formations.csv" : "styles.csv",
                  allRows
                )
              }
              className="px-3 py-2 rounded-lg border border-gray-700 hover:bg-white/5 transition text-sm"
              disabled={allRows.length === 0}
              title="Export du tableau courant (vue/filtre actuels)"
            >
              {t.exportCsv}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 mb-4">{String(error)}</div>
        )}

        {/* Best / Worst */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-800 rounded-xl p-4">
            <h2 className="font-semibold mb-3">{titleBest}</h2>
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
                  <tr>
                    <td colSpan={6} className="py-3 text-gray-500">
                      {t.noData}
                    </td>
                  </tr>
                )}
                {ranked.best.map((r, i) => (
                  <tr key={`b-${i}`} className="hover:bg-white/5">
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
            <h2 className="font-semibold mb-3">{titleWorst}</h2>
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
                  <tr>
                    <td colSpan={6} className="py-3 text-gray-500">
                      {t.noData}
                    </td>
                  </tr>
                )}
                {ranked.worst.map((r, i) => (
                  <tr key={`w-${i}`} className="hover:bg-white/5">
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

        {/* Matrice compacte */}
        <div className="border border-gray-800 rounded-xl p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3">{titleMatrix}</h2>
          {currentDomain.length === 0 ? (
            <div className="text-sm text-gray-500">{t.noData}</div>
          ) : (
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-2 bg-gray-900 sticky left-0 z-10">
                    {view === "formation"
                      ? `${t.formationFor} ↓ / ${t.formationAgainst} →`
                      : "Style ↓ / Style →"}
                  </th>
                  {currentDomain.map((id) => (
                    <th key={`col-${id}`} className="p-2 text-nowrap">
                      {nameFn(id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentDomain.map((rowId) => (
                  <tr key={`row-${rowId}`}>
                    <th className="p-2 bg-gray-900 sticky left-0 z-10 text-left">
                      {nameFn(rowId)}
                    </th>
                    {currentDomain.map((colId) => {
                      const a = currentMatrix.get(`${rowId}|${colId}`);
                      if (!a || a.n < minN)
                        return (
                          <td
                            key={`cell-${rowId}-${colId}`}
                            className="p-2 text-center text-gray-600"
                          >
                            —
                          </td>
                        );
                      const wr = a.w / a.n;
                      const gf = a.gf / a.n;
                      const ga = a.ga / a.n;
                      return (
                        <td
                          key={`cell-${rowId}-${colId}`}
                          className="p-2 text-center align-top"
                        >
                          <div className="font-mono">{formatPct(wr)}</div>
                          <div className="text-[11px] text-gray-400">
                            n={a.n}
                          </div>
                          <div className="text-[11px]">
                            {gf.toFixed(2)} / {ga.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tableau complet */}
        {showTable && (
          <div className="border border-gray-800 rounded-xl p-4 mt-8 overflow-x-auto">
            <h2 className="font-semibold mb-3">
              {view === "formation"
                ? "Toutes les combinaisons (formations)"
                : "Toutes les combinaisons (styles)"}
            </h2>
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
                    <tr key={`all-${i}`} className="hover:bg-white/5">
                      <td className="py-1 pr-2">{r.nameF}</td>
                      <td className="py-1 pr-2">{r.nameG}</td>
                      <td className="py-1 pr-2 text-right">{r.n}</td>
                      <td className="py-1 pr-2 text-right">
                        {formatPct(r.wr)}
                      </td>
                      <td className="py-1 pr-2 text-right">
                        {r.gf.toFixed(2)}
                      </td>
                      <td className="py-1 pr-2 text-right">
                        {r.ga.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
