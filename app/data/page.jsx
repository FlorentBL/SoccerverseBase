"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * DataBase – Soccerverse (Users / Clubs / Trades) + Enrichissement via Data Pack
 * - Onglets : Users / Clubs / Trades
 * - Drawer latéral (lazy‑fetch) au clic sur ligne
 * - Tri client par en‑tête, pagination, recherche, export CSV
 * - Enrichissement depuis https://downloads.soccerverse.com/svpack/default.json (pack “cosmétique”)
 *
 * ENV support (optionnel) :
 *  - NEXT_PUBLIC_SV_SERVICES_URL
 *  - NEXT_PUBLIC_SV_CLUBS_LIST, NEXT_PUBLIC_SV_TRADES_LIST
 *  - NEXT_PUBLIC_SV_USERS_DETAIL_BASE, NEXT_PUBLIC_SV_CLUBS_DETAIL_BASE, NEXT_PUBLIC_SV_TRADES_DETAIL_BASE
 *  - NEXT_PUBLIC_SV_PACK_URL (par défaut : downloads.soccerverse.com/svpack/default.json)
 */

// ───────────────────────────────────────────────────────────────────────────────
// Config endpoints
const API_BASE =
  process.env.NEXT_PUBLIC_SV_SERVICES_URL?.replace(/\/+$/, "") ||
  "https://services.soccerverse.com";

// LIST
const USERS_LIST = `${API_BASE}/api/users/detailed`;
const CLUBS_LIST =
  process.env.NEXT_PUBLIC_SV_CLUBS_LIST ||
  `${API_BASE}/api/clubs/detailed`; // adapte si besoin
const TRADES_LIST =
  process.env.NEXT_PUBLIC_SV_TRADES_LIST ||
  `${API_BASE}/api/trades/recent`; // adapte si besoin

// DETAIL (lazy)
const USERS_DETAIL_BASE =
  process.env.NEXT_PUBLIC_SV_USERS_DETAIL_BASE ||
  `${API_BASE}/api/users/profile?name=`;
const CLUBS_DETAIL_BASE =
  process.env.NEXT_PUBLIC_SV_CLUBS_DETAIL_BASE || `${API_BASE}/api/clubs/`;
const TRADES_DETAIL_BASE =
  process.env.NEXT_PUBLIC_SV_TRADES_DETAIL_BASE || `${API_BASE}/api/trades/`;

// Data Pack URL
const PACK_URL =
  process.env.NEXT_PUBLIC_SV_PACK_URL ||
  "https://downloads.soccerverse.com/svpack/default.json";

// ───────────────────────────────────────────────────────────────────────────────
// Utils
function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}
function formatInt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return Number(n).toLocaleString("fr-FR");
}
function formatSVC(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return `${Number(n).toLocaleString("fr-FR")} SVC`;
}
function formatISO(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("fr-FR");
}
function downloadCSV(filename, rows, headers) {
  const head = headers.map((h) => `"${h.label}"`).join(";");
  const body = rows
    .map((r) =>
      headers
        .map((h) => {
          const raw = resolveValue(r, h.key);
          const v =
            raw === null || raw === undefined
              ? ""
              : typeof raw === "string"
              ? raw.replace(/"/g, '""')
              : String(raw);
          return `"${v}"`;
        })
        .join(";")
    )
    .join("\n");
  const blob = new Blob([head + "\n" + body], {
    type: "text/csv;charset=utf-8;",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function resolveValue(obj, path) {
  if (!path) return undefined;
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}
function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// ───────────────────────────────────────────────────────────────────────────────
// Generic list API hook
function usePagedList({ endpoint, page, perPage, serverSortOrder }) {
  const [state, setState] = useState({ loading: false, error: "", data: null });
  const abortRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    if (serverSortOrder) params.set("sort_order", serverSortOrder); // si supporté
    const url = `${endpoint}?${params.toString()}`;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: "" }));
    fetch(url, { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const json = await res.json();
        setState({ loading: false, error: "", data: json });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ loading: false, error: err.message || "Erreur", data: null });
      });

    return () => controller.abort();
  }, [endpoint, page, perPage, serverSortOrder]);

  const pageInfo = state.data
    ? {
        page: state.data.page,
        per_page: state.data.per_page,
        total: state.data.total,
        total_pages: state.data.total_pages,
      }
    : null;

  const items =
    state.data?.items ??
    state.data?.data ??
    state.data?.rows ??
    [];

  return { loading: state.loading, error: state.error, items, pageInfo, raw: state.data };
}

// ───────────────────────────────────────────────────────────────────────────────
// Data Pack loader + indexation
function useDataPack(url = PACK_URL) {
  const [state, setState] = useState({
    loading: false,
    error: "",
    pack: null,
    clubsById: null,     // { [clubId]: { id, name, country, division, logoUrl, ... } }
    leaguesById: null,   // { [leagueId]: { id, name, country, division, logoUrl, ... } }
    playersById: null,   // { [playerId]: { id, name, position, age, nationality, photoUrl, ... } }
  });

  useEffect(() => {
    let aborted = false;
    async function run() {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const pack = await res.json();

        // Le pack peut avoir différentes formes. Gestion défensive :
        const clubsArr =
          pack?.Clubs || pack?.clubs || pack?.club || [];
        const leaguesArr =
          pack?.Leagues || pack?.leagues || [];
        const playersArr =
          pack?.Players || pack?.players || [];

        // Détecte champs usuels
        function pickStr(o, keys, fallback = undefined) {
          for (const k of keys) if (o?.[k] != null) return String(o[k]);
          return fallback;
        }
        function pickNum(o, keys, fallback = undefined) {
          for (const k of keys)
            if (o?.[k] != null && !Number.isNaN(Number(o[k])))
              return Number(o[k]);
          return fallback;
        }

        // Base image URL éventuelle
        const baseImg =
          pack?.BaseImageURL ||
          pack?.baseImageUrl ||
          pack?.base_image_url ||
          "";

        // Clubs
        const clubsById = {};
        for (const c of clubsArr) {
          const id = pickNum(c, ["id", "club_id", "clubId"]);
          if (id == null) continue;
          const name = pickStr(c, ["name", "club_name", "displayName"], `Club ${id}`);
          const country = pickStr(c, ["country", "nation"]);
          const division = pickStr(c, ["division", "div"]);
          const leagueId = pickNum(c, ["league_id", "leagueId"]);
          const logoId = pickStr(c, ["logo", "logo_id", "logoId"]);
          const logoUrl = logoId
            ? `${(c.logoBaseUrl || baseImg || "").replace(/\/+$/, "")}/${String(logoId)}.png`
            : c.logoUrl || c.logo || null;

          clubsById[id] = { id, name, country, division, leagueId, logoUrl, _raw: c };
        }

        // Leagues
        const leaguesById = {};
        for (const l of leaguesArr) {
          const id = pickNum(l, ["id", "league_id", "leagueId"]);
          if (id == null) continue;
          const name = pickStr(l, ["name", "league_name", "displayName"], `League ${id}`);
          const country = pickStr(l, ["country", "nation"]);
          const division = pickStr(l, ["division", "div"]);
          const logoId = pickStr(l, ["logo", "logo_id", "logoId"]);
          const logoUrl = logoId
            ? `${(l.logoBaseUrl || baseImg || "").replace(/\/+$/, "")}/${String(logoId)}.png`
            : l.logoUrl || l.logo || null;
          leaguesById[id] = { id, name, country, division, logoUrl, _raw: l };
        }

        // Players (utile pour enrichir certains trades)
        const playersById = {};
        for (const p of playersArr) {
          const id = pickNum(p, ["id", "player_id", "playerId"]);
          if (id == null) continue;
          const name = pickStr(p, ["name", "player_name", "displayName"], `Player ${id}`);
          const position = pickStr(p, ["position", "pos"]);
          const age = pickNum(p, ["age"]);
          const nationality = pickStr(p, ["nationality", "country", "nation"]);
          const photoId = pickStr(p, ["photo", "photo_id", "photoId", "imageId"]);
          const photoUrl = photoId
            ? `${(p.photoBaseUrl || baseImg || "").replace(/\/+$/, "")}/${String(photoId)}.jpg`
            : p.photoUrl || p.photo || null;
          playersById[id] = { id, name, position, age, nationality, photoUrl, _raw: p };
        }

        if (!aborted) {
          setState({
            loading: false,
            error: "",
            pack,
            clubsById,
            leaguesById,
            playersById,
          });
        }
      } catch (e) {
        if (!aborted) {
          setState({
            loading: false,
            error: e?.message || "Erreur chargement Data Pack",
            pack: null,
            clubsById: null,
            leaguesById: null,
            playersById: null,
          });
        }
      }
    }
    run();
    return () => {
      aborted = true;
    };
  }, [url]);

  return state;
}

// Enrich helpers
function clubLabel(clubsById, leaguesById, clubId) {
  if (!clubId || !clubsById) return null;
  const c = clubsById[clubId];
  if (!c) return null;
  const leagueName = c.leagueId && leaguesById?.[c.leagueId]?.name;
  return {
    name: c.name,
    logoUrl: c.logoUrl || null,
    sub: [c.country, c.division, leagueName].filter(Boolean).join(" · "),
  };
}
function leagueLabel(leaguesById, leagueId) {
  if (!leagueId || !leaguesById) return null;
  const l = leaguesById[leagueId];
  if (!l) return null;
  return {
    name: l.name,
    logoUrl: l.logoUrl || null,
    sub: [l.country, l.division].filter(Boolean).join(" · "),
  };
}
function guessTradeAssetLabel(asset, { clubsById, playersById, leaguesById }) {
  // Essai simple : si l’actif est un ID numérique d’un club/league/player, affiche son nom.
  if (asset == null) return null;
  const s = String(asset);
  const n = Number(s);
  if (!Number.isNaN(n)) {
    if (clubsById?.[n]) return { type: "club", name: clubsById[n].name, img: clubsById[n].logoUrl };
    if (playersById?.[n]) return { type: "player", name: playersById[n].name, img: playersById[n].photoUrl };
    if (leaguesById?.[n]) return { type: "league", name: leaguesById[n].name, img: leaguesById[n].logoUrl };
  }
  // Si l’actif ressemble à "club:123" / "player:456"
  const m = s.match(/^(club|player|league)[:/](\d+)$/i);
  if (m) {
    const type = m[1].toLowerCase();
    const id = Number(m[2]);
    if (type === "club" && clubsById?.[id]) return { type, name: clubsById[id].name, img: clubsById[id].logoUrl };
    if (type === "player" && playersById?.[id]) return { type, name: playersById[id].name, img: playersById[id].photoUrl };
    if (type === "league" && leaguesById?.[id]) return { type, name: leaguesById[id].name, img: leaguesById[id].logoUrl };
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Drawer générique
function Drawer({ open, onClose, title, loading, error, data, renderSummary }) {
  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "fixed top-0 right-0 h-full w-full sm:w-[520px] bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md bg-gray-800 border border-gray-700 hover:border-gray-600"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto h-[calc(100%-56px)]">
          {renderSummary}
          <div className="text-sm text-gray-400">Détails (lazy‑fetch)</div>
          {loading ? (
            <div className="text-gray-300">Chargement…</div>
          ) : error ? (
            <div className="text-rose-400">Erreur: {error}</div>
          ) : data ? (
            <pre className="text-xs bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <div className="text-gray-500 text-sm">
              Aucune donnée supplémentaire (endpoint non défini ou vide).
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function SkeletonRow({ cols = 10 }) {
  return (
    <tr className="animate-pulse border-b border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 w-24 bg-gray-700 rounded" />
        </td>
      ))}
    </tr>
  );
}
function EmptyRow({ colSpan, label = "Aucun résultat." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-6 text-center text-gray-400">
        {label}
      </td>
    </tr>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Onglet: Users
function UsersTab({ packIndex }) {
  const { clubsById, leaguesById } = packIndex || {};
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [serverSortOrder, setServerSortOrder] = useState("asc");
  const { loading, error, items, pageInfo, raw } = usePagedList({
    endpoint: USERS_LIST,
    page,
    perPage,
    serverSortOrder,
  });

  // Filtres client
  const [search, setSearch] = useState("");
  const [hasClubOnly, setHasClubOnly] = useState(false);
  const [minBalance, setMinBalance] = useState("");
  const debouncedSearch = useDebounced(search, 300);

  const baseHeaders = [
    { key: "name", label: "Nom" },
    { key: "club_id", label: "Club" }, // enrichi (nom/logo) si possible
    { key: "balance", label: "Solde" },
    { key: "manager_voted", label: "Mgr Voté" },
    { key: "last_active", label: "Dernière activité" },
    { key: "buy_volume_1_day", label: "Buy 1j" },
    { key: "sell_volume_1_day", label: "Sell 1j" },
    { key: "buy_volume_7_day", label: "Buy 7j" },
    { key: "sell_volume_7_day", label: "Sell 7j" },
    { key: "buy_total_volume", label: "Buy total" },
    { key: "sell_total_volume", label: "Sell total" },
    { key: "total_volume", label: "Volume total" },
    { key: "total_volume_30_day", label: "Volume 30j" },
    { key: "biggest_trade", label: "Plus gros trade" },
  ];

  // Tri client
  const [clientSort, setClientSort] = useState({ key: "balance", dir: "desc" });
  function onSort(k) {
    setClientSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" }));
  }

  const enriched = useMemo(() => {
    return (items || []).map((u) => {
      const club = u.club_id ? clubLabel(clubsById, leaguesById, u.club_id) : null;
      return { ...u, _clubView: club };
    });
  }, [items, clubsById, leaguesById]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    let out = enriched;
    if (hasClubOnly) out = out.filter((u) => u.club_id !== null);
    const mb = Number(minBalance || 0);
    if (mb > 0) out = out.filter((u) => (u.balance || 0) >= mb);
    const s = debouncedSearch.trim().toLowerCase();
    if (s) {
      out = out.filter((u) =>
        [
          u.name,
          u.club_id,
          u._clubView?.name,
          u._clubView?.sub,
          u.manager_voted,
          u.balance,
          u.total_volume,
          u.last_active,
        ]
          .map((x) => (x == null ? "" : String(x)))
          .join(" ")
          .toLowerCase()
          .includes(s)
      );
    }
    return out;
  }, [enriched, hasClubOnly, minBalance, debouncedSearch]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = clientSort;
    const sign = dir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      // Spé tri club par nom enrichi
      if (key === "club_id") {
        const va = a._clubView?.name || "";
        const vb = b._clubView?.name || "";
        return va.localeCompare(vb) * sign;
      }
      const va = resolveValue(a, key);
      const vb = resolveValue(b, key);
      if (key === "last_active") {
        const da = va ? new Date(va).getTime() : 0;
        const db = vb ? new Date(vb).getTime() : 0;
        return (da - db) * sign;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
      return String(va ?? "").localeCompare(String(vb ?? "")) * sign;
    });
    return arr;
  }, [filtered, clientSort]);

  // Drawer lazy‑fetch
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ loading: false, error: "", data: null });

  useEffect(() => {
    if (!open || !selected) return;
    const name = selected?.name;
    if (!name || !USERS_DETAIL_BASE) {
      setDetail({ loading: false, error: "", data: null });
      return;
    }
    const url = `${USERS_DETAIL_BASE}${encodeURIComponent(name)}`;
    let aborted = false;
    setDetail({ loading: true, error: "", data: null });
    fetch(url, { headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!aborted) setDetail({ loading: false, error: "", data: json });
      })
      .catch((e) => !aborted && setDetail({ loading: false, error: e.message || "Erreur", data: null }));
    return () => {
      aborted = true;
    };
  }, [open, selected]);

  function exportCSV() {
    downloadCSV(`users_p${page}_pp${perPage}.csv`, sorted, baseHeaders);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Recherche</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Nom, club, solde…"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Min. Solde (SVC)</label>
          <input
            value={minBalance}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              setMinBalance(v);
              setPage(1);
            }}
            inputMode="numeric"
            placeholder="ex. 1000000"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              className="accent-sky-500"
              checked={hasClubOnly}
              onChange={(e) => {
                setHasClubOnly(e.target.checked);
                setPage(1);
              }}
            />
            Uniquement avec club
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Page / PageSize</label>
          <div className="flex gap-2">
            <input
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value || 1)))}
              inputMode="numeric"
              className="w-24 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
            />
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
            >
              {[20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tri serveur</label>
          <select
            value={serverSortOrder}
            onChange={(e) => setServerSortOrder(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {pageInfo ? (
            <>
              Page <span className="text-gray-200">{pageInfo.page}</span> /{" "}
              <span className="text-gray-200">{pageInfo.total_pages}</span>
              {" · "}Affichés{" "}
              <span className="text-gray-200">
                {formatInt((page - 1) * perPage + 1)}–{formatInt((page - 1) * perPage + sorted.length)}
              </span>{" "}
              sur <span className="text-gray-200">{formatInt(pageInfo.total)}</span>
            </>
          ) : (
            "—"
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm"
          >
            Export CSV (page)
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pageInfo || page <= 1}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm disabled:opacity-50"
          >
            ← Précédent
          </button>
          <button
            onClick={() => pageInfo && setPage((p) => Math.min(pageInfo.total_pages, p + 1))}
            disabled={!pageInfo || pageInfo.page >= pageInfo.total_pages}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm disabled:opacity-50"
          >
            Suivant →
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-auto rounded-2xl border border-gray-800">
        <table className="min-w-[1150px] w-full text-sm">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr className="text-left">
              {baseHeaders.map((h) => {
                const isActive = h.key === clientSort.key;
                const arrow = isActive ? (clientSort.dir === "asc" ? "↑" : "↓") : "↕";
                return (
                  <th
                    key={h.key}
                    onClick={() => onSort(h.key)}
                    className="px-3 py-3 font-medium text-gray-300 whitespace-nowrap cursor-pointer select-none"
                    title="Tri client"
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label} <span className="text-gray-500">{arrow}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={baseHeaders.length} className="p-6 text-rose-400">Erreur : {error}</td></tr>
            ) : loading && !(raw?.items?.length) ? (
              <>
                <SkeletonRow cols={baseHeaders.length} />
                <SkeletonRow cols={baseHeaders.length} />
                <SkeletonRow cols={baseHeaders.length} />
              </>
            ) : sorted.length === 0 ? (
              <EmptyRow colSpan={baseHeaders.length} label="Aucun résultat avec ces filtres." />
            ) : (
              sorted.map((u, idx) => (
                <tr
                  key={`${u.name}-${idx}`}
                  className="border-b border-gray-800 hover:bg-gray-800/40 cursor-pointer"
                  onClick={() => {
                    // enrich résumé drawer
                    setSelected(u);
                    setOpen(true);
                  }}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={u.profile_pic}
                        alt=""
                        className="w-6 h-6 rounded object-cover"
                        loading="lazy"
                      />
                      <span className="truncate" title={u.name}>{u.name ?? "-"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {u._clubView ? (
                      <div className="flex items-center gap-2">
                        {u._clubView.logoUrl ? (
                          <img
                            src={u._clubView.logoUrl}
                            alt=""
                            className="w-5 h-5 rounded object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <div className="truncate">
                          <div className="text-gray-200">{u._clubView.name}</div>
                          <div className="text-xs text-gray-500">{u._clubView.sub}</div>
                        </div>
                      </div>
                    ) : (
                      u.club_id ?? "-"
                    )}
                  </td>
                  <td className="px-3 py-2">{formatSVC(u.balance)}</td>
                  <td className="px-3 py-2">{u.manager_voted ?? "-"}</td>
                  <td className="px-3 py-2">{formatISO(u.last_active)}</td>
                  <td className="px-3 py-2">{formatSVC(u.buy_volume_1_day)}</td>
                  <td className="px-3 py-2">{formatSVC(u.sell_volume_1_day)}</td>
                  <td className="px-3 py-2">{formatSVC(u.buy_volume_7_day)}</td>
                  <td className="px-3 py-2">{formatSVC(u.sell_volume_7_day)}</td>
                  <td className="px-3 py-2">{formatSVC(u.buy_total_volume)}</td>
                  <td className="px-3 py-2">{formatSVC(u.sell_total_volume)}</td>
                  <td className="px-3 py-2">{formatSVC(u.total_volume)}</td>
                  <td className="px-3 py-2">{formatSVC(u.total_volume_30_day)}</td>
                  <td className="px-3 py-2">{formatSVC(u.biggest_trade)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={selected?.name || "Profil utilisateur"}
        loading={detail.loading}
        error={detail.error}
        data={detail.data}
        renderSummary={
          selected ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Nom</span><div className="text-gray-200">{selected.name}</div></div>
              <div><span className="text-gray-400">Solde</span><div className="text-gray-200">{formatSVC(selected.balance)}</div></div>
              <div><span className="text-gray-400">Dernière activité</span><div className="text-gray-200">{formatISO(selected.last_active)}</div></div>
              {selected._clubView ? (
                <div className="col-span-2">
                  <span className="text-gray-400">Club</span>
                  <div className="flex items-center gap-2 mt-1">
                    {selected._clubView.logoUrl ? (
                      <img src={selected._clubView.logoUrl} alt="" className="h-6 w-6 rounded" />
                    ) : null}
                    <div>
                      <div className="text-gray-200">{selected._clubView.name}</div>
                      <div className="text-xs text-gray-500">{selected._clubView.sub}</div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="col-span-2"><span className="text-gray-400">Profil</span><div className="mt-2"><img src={selected.profile_pic} alt="" className="h-16 w-16 rounded" /></div></div>
            </div>
          ) : null
        }
      />
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Onglet: Clubs
function ClubsTab({ packIndex }) {
  const { clubsById, leaguesById } = packIndex || {};
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [serverSortOrder, setServerSortOrder] = useState("asc");
  const { loading, error, items, pageInfo, raw } = usePagedList({
    endpoint: CLUBS_LIST,
    page,
    perPage,
    serverSortOrder,
  });

  // Colonnes (affiche nom/logo via pack si possible)
  const headers = [
    { key: "id", label: "Club" }, // remplacé par bloc “logo + nom + sous-ligne”
    { key: "league", label: "League" }, // enrichi
    { key: "manager", label: "Manager" },
    { key: "value", label: "Valeur" },
    { key: "balance", label: "Solde" },
    { key: "fans", label: "Fans" },
    { key: "last_active", label: "Dernière activité" },
  ];

  // Normalisation + enrichissement
  const normalized = useMemo(() => {
    return (items || []).map((c) => {
      const id = c.id ?? c.club_id ?? c.clubId ?? null;
      const manager = c.manager ?? c.manager_name ?? c.owner ?? "-";
      const value = c.value ?? c.club_value ?? null;
      const balance = c.balance ?? c.bank_balance ?? null;
      const fans = c.fans ?? c.supporters ?? null;
      const last_active = c.last_active ?? c.updated_at ?? c.last_seen ?? null;
      const leagueId = c.league_id ?? c.leagueId ?? c.league ?? null;

      // pack enrich
      const cPack = id && clubsById ? clubsById[id] : null;
      const lPack = leagueId && leaguesById ? leaguesById[leagueId] : null;

      return {
        id,
        manager,
        value,
        balance,
        fans,
        last_active,
        leagueId,
        _clubView: cPack
          ? { name: cPack.name, logoUrl: cPack.logoUrl, sub: [cPack.country, cPack.division].filter(Boolean).join(" · ") }
          : { name: c.name ?? c.club_name ?? `Club ${id}`, logoUrl: null, sub: [c.country, c.division].filter(Boolean).join(" · ") },
        _leagueView: lPack
          ? { name: lPack.name, logoUrl: lPack.logoUrl, sub: [lPack.country, lPack.division].filter(Boolean).join(" · ") }
          : { name: c.league_name ?? String(leagueId ?? "-"), logoUrl: null, sub: "" },
        _raw: c,
      };
    });
  }, [items, clubsById, leaguesById]);

  // Filtres / tri client
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [clientSort, setClientSort] = useState({ key: "value", dir: "desc" });

  const filtered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return normalized;
    return normalized.filter((c) =>
      [
        c.id,
        c._clubView?.name,
        c._clubView?.sub,
        c._leagueView?.name,
        c._leagueView?.sub,
        c.manager,
        c.value,
        c.balance,
      ]
        .map((x) => (x == null ? "" : String(x)))
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [normalized, debouncedSearch]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = clientSort;
    const sign = dir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (key === "id") {
        const va = a._clubView?.name || "";
        const vb = b._clubView?.name || "";
        return va.localeCompare(vb) * sign;
      }
      if (key === "league") {
        const va = a._leagueView?.name || "";
        const vb = b._leagueView?.name || "";
        return va.localeCompare(vb) * sign;
      }
      const va = resolveValue(a, key);
      const vb = resolveValue(b, key);
      if (key === "last_active") {
        const da = va ? new Date(va).getTime() : 0;
        const db = vb ? new Date(vb).getTime() : 0;
        return (da - db) * sign;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
      return String(va ?? "").localeCompare(String(vb ?? "")) * sign;
    });
    return arr;
  }, [filtered, clientSort]);

  // Drawer
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ loading: false, error: "", data: null });

  useEffect(() => {
    if (!open || !selected?.id || !CLUBS_DETAIL_BASE) {
      setDetail({ loading: false, error: "", data: selected?._raw ?? null });
      return;
    }
    const url = `${CLUBS_DETAIL_BASE}${encodeURIComponent(selected.id)}`;
    let aborted = false;
    setDetail({ loading: true, error: "", data: null });
    fetch(url, { headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!aborted) setDetail({ loading: false, error: "", data: json });
      })
      .catch((e) => !aborted && setDetail({ loading: false, error: e.message || "Erreur", data: null }));
    return () => {
      aborted = true;
    };
  }, [open, selected]);

  function exportCSV() {
    downloadCSV(`clubs_p${page}_pp${perPage}.csv`, sorted, [
      { key: "id", label: "Club ID" },
      { key: "_clubView.name", label: "Nom" },
      { key: "_clubView.sub", label: "Infos" },
      { key: "_leagueView.name", label: "League" },
      { key: "manager", label: "Manager" },
      { key: "value", label: "Valeur" },
      { key: "balance", label: "Solde" },
      { key: "fans", label: "Fans" },
      { key: "last_active", label: "Dernière activité" },
    ]);
  }
  function onSort(k) {
    setClientSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" }));
  }

  return (
    <>
      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Recherche</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Club, league, manager…"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Page / PageSize</label>
          <div className="flex gap-2">
            <input
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value || 1)))}
              inputMode="numeric"
              className="w-24 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
            />
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
            >
              {[20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tri serveur</label>
          <select
            value={serverSortOrder}
            onChange={(e) => setServerSortOrder(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {pageInfo ? (
            <>
              Page <span className="text-gray-200">{pageInfo.page}</span> /{" "}
              <span className="text-gray-200">{pageInfo.total_pages}</span> ·{" "}
              <span className="text-gray-200">
                {formatInt((page - 1) * perPage + 1)}–{formatInt((page - 1) * perPage + sorted.length)}
              </span>{" "}
              sur <span className="text-gray-200">{formatInt(pageInfo.total)}</span>
            </>
          ) : (
            "—"
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm"
          >
            Export CSV (page)
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pageInfo || page <= 1}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm disabled:opacity-50"
          >
            ← Précédent
          </button>
          <button
            onClick={() => pageInfo && setPage((p) => Math.min(pageInfo.total_pages, p + 1))}
            disabled={!pageInfo || pageInfo.page >= pageInfo.total_pages}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm disabled:opacity-50"
          >
            Suivant →
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-auto rounded-2xl border border-gray-800">
        <table className="min-w-[1150px] w-full text-sm">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr className="text-left">
              {headers.map((h) => {
                const isActive = h.key === clientSort.key;
                const arrow = isActive ? (clientSort.dir === "asc" ? "↑" : "↓") : "↕";
                return (
                  <th
                    key={h.key}
                    onClick={() => onSort(h.key)}
                    className="px-3 py-3 font-medium text-gray-300 whitespace-nowrap cursor-pointer select-none"
                    title="Tri client"
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label} <span className="text-gray-500">{arrow}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={headers.length} className="p-6 text-rose-400">Erreur : {error}</td></tr>
            ) : loading && !(raw?.items?.length) ? (
              <>
                <SkeletonRow cols={headers.length} />
                <SkeletonRow cols={headers.length} />
                <SkeletonRow cols={headers.length} />
              </>
            ) : sorted.length === 0 ? (
              <EmptyRow colSpan={headers.length} label="Aucun club." />
            ) : (
              sorted.map((c, idx) => (
                <tr
                  key={`${c.id ?? idx}`}
                  className="border-b border-gray-800 hover:bg-gray-800/40 cursor-pointer"
                  onClick={() => {
                    setSelected(c);
                    setOpen(true);
                  }}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {c._clubView?.logoUrl ? (
                        <img src={c._clubView.logoUrl} alt="" className="w-5 h-5 rounded object-cover" loading="lazy" />
                      ) : null}
                      <div className="truncate">
                        <div className="text-gray-200">{c._clubView?.name ?? c.id}</div>
                        <div className="text-xs text-gray-500">{c._clubView?.sub}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {c._leagueView?.logoUrl ? (
                        <img src={c._leagueView.logoUrl} alt="" className="w-5 h-5 rounded object-cover" loading="lazy" />
                      ) : null}
                      <div className="truncate">
                        <div className="text-gray-200">{c._leagueView?.name}</div>
                        <div className="text-xs text-gray-500">{c._leagueView?.sub}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{c.manager ?? "-"}</td>
                  <td className="px-3 py-2">{formatSVC(c.value)}</td>
                  <td className="px-3 py-2">{formatSVC(c.balance)}</td>
                  <td className="px-3 py-2">{formatInt(c.fans)}</td>
                  <td className="px-3 py-2">{formatISO(c.last_active)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={selected?._clubView?.name || `Club ${selected?.id ?? ""}`}
        loading={detail.loading}
        error={detail.error}
        data={detail.data}
        renderSummary={
          selected ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <span className="text-gray-400">Club</span>
                <div className="flex items-center gap-2 mt-1">
                  {selected._clubView?.logoUrl ? (
                    <img src={selected._clubView.logoUrl} alt="" className="h-6 w-6 rounded" />
                  ) : null}
                  <div>
                    <div className="text-gray-200">{selected._clubView?.name ?? selected.id}</div>
                    <div className="text-xs text-gray-500">{selected._clubView?.sub}</div>
                  </div>
                </div>
              </div>
              <div><span className="text-gray-400">Manager</span><div className="text-gray-200">{selected.manager ?? "-"}</div></div>
              <div><span className="text-gray-400">League</span><div className="text-gray-200">{selected._leagueView?.name ?? selected.leagueId ?? "-"}</div></div>
              <div><span className="text-gray-400">Valeur</span><div className="text-gray-200">{formatSVC(selected.value)}</div></div>
              <div><span className="text-gray-400">Solde</span><div className="text-gray-200">{formatSVC(selected.balance)}</div></div>
              <div className="col-span-2"><span className="text-gray-400">Fans</span><div className="text-gray-200">{formatInt(selected.fans)}</div></div>
            </div>
          ) : null
        }
      />
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Onglet: Trades
function TradesTab({ packIndex }) {
  const { clubsById, leaguesById, playersById } = packIndex || {};
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [serverSortOrder, setServerSortOrder] = useState("desc");
  const { loading, error, items, pageInfo, raw } = usePagedList({
    endpoint: TRADES_LIST,
    page,
    perPage,
    serverSortOrder,
  });

  const normalized = useMemo(() => {
    return (items || []).map((t) => {
      const id = t.id ?? t.trade_id ?? t.tx_id ?? null;
      const date = t.date ?? t.created_at ?? t.timestamp ?? t.time ?? null;
      const buyer = t.buyer ?? t.buyer_name ?? t.to ?? "-";
      const seller = t.seller ?? t.seller_name ?? t.from ?? "-";
      const amount = t.amount ?? t.value ?? t.price ?? null;
      const asset = t.asset ?? t.type ?? t.item ?? "-";
      // Enrichit l’actif si possible
      const assetView = guessTradeAssetLabel(asset, { clubsById, leaguesById, playersById });

      return { id, date, buyer, seller, amount, asset, _assetView: assetView, _raw: t };
    });
  }, [items, clubsById, leaguesById, playersById]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [clientSort, setClientSort] = useState({ key: "date", dir: "desc" });

  const filtered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return normalized;
    return normalized.filter((t) =>
      [t.id, t.buyer, t.seller, t.asset, t._assetView?.name, t.amount, t.date]
        .map((x) => (x == null ? "" : String(x)))
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [normalized, debouncedSearch]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = clientSort;
    const sign = dir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (key === "asset") {
        const va = a._assetView?.name || String(a.asset ?? "");
        const vb = b._assetView?.name || String(b.asset ?? "");
        return va.localeCompare(vb) * sign;
      }
      const va = resolveValue(a, key);
      const vb = resolveValue(b, key);
      if (key === "date") {
        const da = va ? new Date(va).getTime() : 0;
        const db = vb ? new Date(vb).getTime() : 0;
        return (da - db) * sign;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
      return String(va ?? "").localeCompare(String(vb ?? "")) * sign;
    });
    return arr;
  }, [filtered, clientSort]);

  const headers = [
    { key: "id", label: "Trade ID" },
    { key: "date", label: "Date" },
    { key: "buyer", label: "Acheteur" },
    { key: "seller", label: "Vendeur" },
    { key: "asset", label: "Actif" },
    { key: "amount", label: "Montant" },
  ];

  // Drawer
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ loading: false, error: "", data: null });

  useEffect(() => {
    if (!open || !selected?.id || !TRADES_DETAIL_BASE) {
      setDetail({ loading: false, error: "", data: selected?._raw ?? null });
      return;
    }
    const url = `${TRADES_DETAIL_BASE}${encodeURIComponent(selected.id)}`;
    let aborted = false;
    setDetail({ loading: true, error: "", data: null });
    fetch(url, { headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!aborted) setDetail({ loading: false, error: "", data: json });
      })
      .catch((e) => !aborted && setDetail({ loading: false, error: e.message || "Erreur", data: null }));
    return () => {
      aborted = true;
    };
  }, [open, selected]);

  function exportCSV() {
    downloadCSV(`trades_p${page}_pp${perPage}.csv`, sorted, headers);
  }
  function onSort(k) {
    setClientSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" }));
  }

  return (
    <>
      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Recherche</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ID, buyer, seller, actif…"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Page / PageSize</label>
          <div className="flex gap-2">
            <input
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value || 1)))}
              inputMode="numeric"
              className="w-24 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
            />
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
            >
              {[20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tri serveur</label>
          <select
            value={serverSortOrder}
            onChange={(e) => setServerSortOrder(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {pageInfo ? (
            <>
              Page <span className="text-gray-200">{pageInfo.page}</span> /{" "}
              <span className="text-gray-200">{pageInfo.total_pages}</span> ·{" "}
              <span className="text-gray-200">
                {formatInt((page - 1) * perPage + 1)}–{formatInt((page - 1) * perPage + sorted.length)}
              </span>{" "}
              sur <span className="text-gray-200">{formatInt(pageInfo.total)}</span>
            </>
          ) : (
            "—"
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm"
          >
            Export CSV (page)
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pageInfo || page <= 1}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm disabled:opacity-50"
          >
            ← Précédent
          </button>
          <button
            onClick={() => pageInfo && setPage((p) => Math.min(pageInfo.total_pages, p + 1))}
            disabled={!pageInfo || pageInfo.page >= pageInfo.total_pages}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-sm disabled:opacity-50"
          >
            Suivant →
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-auto rounded-2xl border border-gray-800">
        <table className="min-w-[1050px] w-full text-sm">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr className="text-left">
              {[
                { key: "id", label: "Trade ID" },
                { key: "date", label: "Date" },
                { key: "buyer", label: "Acheteur" },
                { key: "seller", label: "Vendeur" },
                { key: "asset", label: "Actif" },
                { key: "amount", label: "Montant" },
              ].map((h) => {
                const isActive = h.key === clientSort.key;
                const arrow = isActive ? (clientSort.dir === "asc" ? "↑" : "↓") : "↕";
                return (
                  <th
                    key={h.key}
                    onClick={() => onSort(h.key)}
                    className="px-3 py-3 font-medium text-gray-300 whitespace-nowrap cursor-pointer select-none"
                    title="Tri client"
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label} <span className="text-gray-500">{arrow}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={6} className="p-6 text-rose-400">Erreur : {error}</td></tr>
            ) : loading && !(raw?.items?.length) ? (
              <>
                <SkeletonRow cols={6} />
                <SkeletonRow cols={6} />
                <SkeletonRow cols={6} />
              </>
            ) : sorted.length === 0 ? (
              <EmptyRow colSpan={6} label="Aucun trade." />
            ) : (
              sorted.map((t, idx) => (
                <tr
                  key={`${t.id ?? idx}`}
                  className="border-b border-gray-800 hover:bg-gray-800/40 cursor-pointer"
                  onClick={() => {
                    setSelected(t);
                    setOpen(true);
                  }}
                >
                  <td className="px-3 py-2">{t.id ?? "-"}</td>
                  <td className="px-3 py-2">{formatISO(t.date)}</td>
                  <td className="px-3 py-2">{t.buyer}</td>
                  <td className="px-3 py-2">{t.seller}</td>
                  <td className="px-3 py-2">
                    {t._assetView ? (
                      <div className="flex items-center gap-2">
                        {t._assetView.img ? (
                          <img src={t._assetView.img} alt="" className="w-5 h-5 rounded object-cover" loading="lazy" />
                        ) : null}
                        <div className="truncate">
                          <div className="text-gray-200">{t._assetView.name}</div>
                          <div className="text-xs text-gray-500">{String(t.asset)}</div>
                        </div>
                      </div>
                    ) : (
                      String(t.asset)
                    )}
                  </td>
                  <td className="px-3 py-2">{formatSVC(t.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={`Trade ${selected?.id ?? ""}`}
        loading={detail.loading}
        error={detail.error}
        data={detail.data}
        renderSummary={
          selected ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Date</span><div className="text-gray-200">{formatISO(selected.date)}</div></div>
              <div><span className="text-gray-400">Montant</span><div className="text-gray-200">{formatSVC(selected.amount)}</div></div>
              <div><span className="text-gray-400">Acheteur</span><div className="text-gray-200">{selected.buyer}</div></div>
              <div><span className="text-gray-400">Vendeur</span><div className="text-gray-200">{selected.seller}</div></div>
              <div className="col-span-2">
                <span className="text-gray-400">Actif</span>
                <div className="flex items-center gap-2 mt-1">
                  {selected._assetView?.img ? (
                    <img src={selected._assetView.img} alt="" className="h-6 w-6 rounded" />
                  ) : null}
                  <div>
                    <div className="text-gray-200">{selected._assetView?.name ?? String(selected.asset)}</div>
                    {selected._assetView ? (
                      <div className="text-xs text-gray-500">{String(selected.asset)}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null
        }
      />
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Page principale
export default function DataBasePage() {
  const [tab, setTab] = useState("users"); // users | clubs | trades

  // Charge pack (une seule fois)
  const packState = useDataPack(PACK_URL);
  const packIndex = useMemo(
    () =>
      packState.error || !packState.pack
        ? null
        : {
            clubsById: packState.clubsById,
            leaguesById: packState.leaguesById,
            playersById: packState.playersById,
          },
    [packState]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-semibold">DataBase · Soccerverse</h1>
        <p className="text-gray-400 mt-1">
          Exploration DATA avec panneau détaillé. Sources API + enrichissement{" "}
          <a
            className="underline hover:text-white"
            href={PACK_URL}
            target="_blank"
            rel="noreferrer"
          >
            Data Pack
          </a>
          .
        </p>

        {/* État du pack */}
        <div className="mt-3 text-xs">
          {packState.loading ? (
            <span className="text-gray-400">Chargement du Data Pack…</span>
          ) : packState.error ? (
            <span className="text-amber-400">
              Data Pack indisponible ({packState.error}). L’affichage se fait sans enrichissement.
            </span>
          ) : (
            <span className="text-gray-400">
              Pack chargé · Clubs: <span className="text-gray-200">{formatInt(Object.keys(packState.clubsById || {}).length)}</span> ·
              Leagues: <span className="text-gray-200">{formatInt(Object.keys(packState.leaguesById || {}).length)}</span> ·
              Players: <span className="text-gray-200">{formatInt(Object.keys(packState.playersById || {}).length)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="inline-flex rounded-xl border border-gray-800 bg-gray-800/50 p-1">
          {[
            { k: "users", label: "Users" },
            { k: "clubs", label: "Clubs" },
            { k: "trades", label: "Trades" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm",
                tab === t.k ? "bg-gray-900 border border-gray-700" : "text-gray-300 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "users" && <UsersTab packIndex={packIndex} />}
          {tab === "clubs" && <ClubsTab packIndex={packIndex} />}
          {tab === "trades" && <TradesTab packIndex={packIndex} />}
        </div>
      </div>
    </div>
  );
}
