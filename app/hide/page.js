"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Page d'analyse tactique en ligne
 * - Récupère depuis Supabase (tables: sv_matches, sv_match_sides)
 * - Construit une matrice Formation vs Formation (win rate, GF/GA, n)
 * - Affiche aussi un tableau récap et des filtres (ligue, saison, seuil n, domicile/extérieur)
 * - Inclut les mappings formation_id -> nom lisible + play_style -> libellé
 *
 * Prérequis côté front :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_KEY
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// === Libellés i18n courts ===
const TEXTS: Record<string, any> = {
  fr: {
    title: "Analyse tactique (formations)",
    leagueId: "League ID",
    seasonId: "Season ID",
    minN: "Seuil n",
    side: "Côté",
    any: "Tous",
    home: "Domicile",
    away: "Extérieur",
    load: "Charger",
    matrix: "Matrice formation vs formation",
    results: "Résultats agrégés",
    formationFor: "Formation",
    formationAgainst: "Adverse",
    count: "n",
    winrate: "%V",
    avgGf: "BMoy",
    avgGa: "EMoy",
    gd: "+/-",
    bestMatchups: "Meilleurs matchups (triés par %V, n≥seuil)",
    worstMatchups: "Pires matchups (triés par %V, n≥seuil)",
    noData: "Aucune donnée",
  },
  en: {
    title: "Tactical analysis (formations)",
    leagueId: "League ID",
    seasonId: "Season ID",
    minN: "Min n",
    side: "Side",
    any: "Any",
    home: "Home",
    away: "Away",
    load: "Load",
    matrix: "Formation vs formation matrix",
    results: "Aggregated results",
    formationFor: "Formation",
    formationAgainst: "Against",
    count: "n",
    winrate: "Win%",
    avgGf: "GF avg",
    avgGa: "GA avg",
    gd: "+/-",
    bestMatchups: "Best matchups (by Win%, n≥min)",
    worstMatchups: "Worst matchups (by Win%, n≥min)",
    noData: "No data",
  },
};

// === Mappings formations & styles ===
const FORMATION_MAP: Record<string, Record<number, string>> = {
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

const STYLE_MAP: Record<string, Record<number, string>> = {
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

// === Types ===
interface SideRow {
  fixture_id: number;
  side: "home" | "away";
  club_id: number;
  opponent_club_id: number;
  goals_for: number | null;
  goals_against: number | null;
  formation_id: number | null; // de tactics history
  play_style: number | null;
}
interface MatchRow {
  fixture_id: number;
  league_id: number | null;
  season_id: number | null;
  played: boolean;
}

// === Utils ===
const key = (f: number | null | undefined) => (f ?? -1).toString();

function aggregateMatrix(rows: Array<{
  formation_id: number | null;
  opp_formation_id: number | null;
  goals_for: number;
  goals_against: number;
  result: "W" | "D" | "L";
}>){
  type Agg = { n: number; w: number; gf: number; ga: number };
  const map = new Map<string, Agg>();
  for (const r of rows) {
    const k = `${key(r.formation_id)}|${key(r.opp_formation_id)}`;
    const a = map.get(k) || { n: 0, w: 0, gf: 0, ga: 0 };
    a.n += 1;
    a.w += r.result === "W" ? 1 : 0;
    a.gf += r.goals_for;
    a.ga += r.goals_against;
    map.set(k, a);
  }
  return map; // key = "for|against"
}

function formatPct(x: number) {
  return (x * 100).toFixed(0) + "%";
}

// === Composant principal ===
export default function TacticalMatrixPage({ lang = "fr" }: { lang?: "fr" | "en" }) {
  const t = TEXTS[lang] || TEXTS.fr;

  const [leagueId, setLeagueId] = useState<string>("549");
  const [seasonId, setSeasonId] = useState<string>("2");
  const [minN, setMinN] = useState<number>(5);
  const [sideFilter, setSideFilter] = useState<"any" | "home" | "away">("any");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matrix, setMatrix] = useState<Map<string, any>>(new Map());
  const [formationsPresent, setFormationsPresent] = useState<number[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Charger les matches joués pour league/season
      const { data: matches, error: mErr } = await supabase
        .from("sv_matches")
        .select("fixture_id, league_id, season_id, played")
        .eq("league_id", Number(leagueId))
        .eq("season_id", Number(seasonId))
        .eq("played", true)
        .limit(200000);
      if (mErr) throw mErr;

      const fids = (matches as MatchRow[]).map((m) => m.fixture_id);
      if (fids.length === 0) {
        setMatrix(new Map());
        setFormationsPresent([]);
        setLoading(false);
        return;
      }

      // 2) Récupérer tous les sides correspondants
      //    On ne peut pas faire un join PostgREST facilement sans FK explicite, on charge et on regroupe côté client
      const batches: number[][] = [];
      for (let i = 0; i < fids.length; i += 1000) batches.push(fids.slice(i, i + 1000));

      const allSides: SideRow[] = [];
      for (const part of batches) {
        const { data: sides, error: sErr } = await supabase
          .from("sv_match_sides")
          .select("fixture_id, side, club_id, opponent_club_id, goals_for, goals_against, formation_id, play_style")
          .in("fixture_id", part)
          .limit(2000);
        if (sErr) throw sErr;
        allSides.push(...(sides as any[]));
      }

      // 3) (Optionnel) Filtre domicile/extérieur
      const filtered = sideFilter === "any" ? allSides : allSides.filter((r) => r.side === sideFilter);

      // 4) Construire des paires (side vs opposite) par fixture
      const byFixture = new Map<number, SideRow[]>();
      for (const s of filtered) {
        const arr = byFixture.get(s.fixture_id) || [];
        arr.push(s);
        byFixture.set(s.fixture_id, arr);
      }

      const rows: Array<{ formation_id: number | null; opp_formation_id: number | null; goals_for: number; goals_against: number; result: "W" | "D" | "L"; }> = [];
      const seenFormations = new Set<number>();

      for (const [, sides] of byFixture) {
        if (sides.length !== 2) continue; // sécurité
        const a = sides[0];
        const b = sides[1];
        // a contre b
        if (a.goals_for != null && a.goals_against != null) {
          const resultA: "W" | "D" | "L" = a.goals_for > a.goals_against ? "W" : a.goals_for === a.goals_against ? "D" : "L";
          rows.push({
            formation_id: a.formation_id,
            opp_formation_id: b.formation_id,
            goals_for: a.goals_for || 0,
            goals_against: a.goals_against || 0,
            result: resultA,
          });
          if (typeof a.formation_id === "number") seenFormations.add(a.formation_id);
          if (typeof b.formation_id === "number") seenFormations.add(b.formation_id);
        }
        // b contre a
        if (b.goals_for != null && b.goals_against != null) {
          const resultB: "W" | "D" | "L" = b.goals_for > b.goals_against ? "W" : b.goals_for === b.goals_against ? "D" : "L";
          rows.push({
            formation_id: b.formation_id,
            opp_formation_id: a.formation_id,
            goals_for: b.goals_for || 0,
            goals_against: b.goals_against || 0,
            result: resultB,
          });
        }
      }

      // 5) Agrégation
      const agg = aggregateMatrix(rows);
      setMatrix(agg as any);
      setFormationsPresent(Array.from(seenFormations).sort((x, y) => x - y));
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "load_failed");
      setLoading(false);
    }
  };

  // Jeux de lignes pour meilleurs/pires matchups
  const ranked = useMemo(() => {
    type Row = { f: number; g: number; n: number; wr: number; gf: number; ga: number };
    const out: Row[] = [];
    for (const [k, a] of matrix.entries()) {
      const [fStr, gStr] = k.split("|");
      const f = Number(fStr);
      const g = Number(gStr);
      if (a.n === 0) continue;
      out.push({ f, g, n: a.n, wr: a.w / a.n, gf: a.gf / a.n, ga: a.ga / a.n });
    }
    const withMin = out.filter((r) => r.n >= minN);
    const best = [...withMin].sort((x, y) => y.wr - x.wr || y.n - x.n).slice(0, 10);
    const worst = [...withMin].sort((x, y) => x.wr - y.wr || y.n - x.n).slice(0, 10);
    return { best, worst };
  }, [matrix, minN]);

  const formationName = (id?: number | null) => {
    if (id == null) return "—";
    return FORMATION_MAP[lang]?.[id] ?? String(id);
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t.title}</h1>

        {/* Filtres */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end mb-6">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t.leagueId}</label>
            <input
              className="w-full border border-gray-700 rounded-lg p-2 bg-transparent"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              placeholder="549"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t.seasonId}</label>
            <input
              className="w-full border border-gray-700 rounded-lg p-2 bg-transparent"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              placeholder="2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t.minN}</label>
            <input
              type="number"
              className="w-full border border-gray-700 rounded-lg p-2 bg-transparent"
              value={minN}
              onChange={(e) => setMinN(Math.max(1, Number(e.target.value)))}
              min={1}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t.side}</label>
            <select
              className="w-full border border-gray-700 rounded-lg p-2 bg-transparent"
              value={sideFilter}
              onChange={(e) => setSideFilter(e.target.value as any)}
            >
              <option value="any">{t.any}</option>
              <option value="home">{t.home}</option>
              <option value="away">{t.away}</option>
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
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 mb-4">{String(error)}</div>
        )}

        {/* Best / Worst matchups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-800 rounded-xl p-4">
            <h2 className="font-semibold mb-3">{t.bestMatchups}</h2>
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
                  <tr><td colSpan={6} className="py-3 text-gray-500">{TEXTS[lang].noData}</td></tr>
                )}
                {ranked.best.map((r, i) => (
                  <tr key={`b-${i}`} className="hover:bg-white/5">
                    <td className="py-1 pr-2">{formationName(r.f)}</td>
                    <td className="py-1 pr-2">{formationName(r.g)}</td>
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
            <h2 className="font-semibold mb-3">{t.worstMatchups}</h2>
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
                  <tr><td colSpan={6} className="py-3 text-gray-500">{TEXTS[lang].noData}</td></tr>
                )}
                {ranked.worst.map((r, i) => (
                  <tr key={`w-${i}`} className="hover:bg-white/5">
                    <td className="py-1 pr-2">{formationName(r.f)}</td>
                    <td className="py-1 pr-2">{formationName(r.g)}</td>
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
          <h2 className="font-semibold mb-3">{t.matrix}</h2>
          {formationsPresent.length === 0 ? (
            <div className="text-sm text-gray-500">{t.noData}</div>
          ) : (
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-2 bg-gray-900 sticky left-0 z-10">{t.formationFor} ↓ / {t.formationAgainst} →</th>
                  {formationsPresent.map((fid) => (
                    <th key={`col-${fid}`} className="p-2 text-nowrap">{formationName(fid)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formationsPresent.map((fidRow) => (
                  <tr key={`row-${fidRow}`}>
                    <th className="p-2 bg-gray-900 sticky left-0 z-10 text-left">{formationName(fidRow)}</th>
                    {formationsPresent.map((fidCol) => {
                      const a = matrix.get(`${fidRow}|${fidCol}`);
                      if (!a || a.n < minN) return <td key={`cell-${fidRow}-${fidCol}`} className="p-2 text-center text-gray-600">—</td>;
                      const wr = a.w / a.n;
                      const gf = a.gf / a.n;
                      const ga = a.ga / a.n;
                      return (
                        <td key={`cell-${fidRow}-${fidCol}`} className="p-2 text-center align-top">
                          <div className="font-mono">{formatPct(wr)}</div>
                          <div className="text-[11px] text-gray-400">n={a.n}</div>
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
      </div>
    </div>
  );
}
