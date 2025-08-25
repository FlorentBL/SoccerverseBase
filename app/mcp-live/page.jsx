// app/mcp-live/page.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Configuration
// ───────────────────────────────────────────────────────────────────────────────
const SSE_URL = "/api/mcp/sse?url=https://mcp.soccerverse.io/sse"; // proxy local
const MAX_BUFFER = 2000; // nombre max d'événements en mémoire (FIFO)

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();

function safeParse(data) {
  try {
    return { ok: true, json: JSON.parse(data) };
  } catch {
    return { ok: false, raw: data };
  }
}

function detectType(payload) {
  if (!payload || typeof payload !== "object") return "unknown";
  if (payload.type) return String(payload.type);
  if (payload.event) return String(payload.event);
  if (payload.kind) return String(payload.kind);
  if (payload.matchId || payload.fixture_id) return "match";
  if (payload.txHash || payload.hash) return "tx";
  if (payload.pack || payload.packs) return "pack";
  if (payload.market || payload.trade || payload.order) return "market";
  return "unknown";
}

function downloadNdjson(filename, rows) {
  const ndjson = rows.map((r) => JSON.stringify(r)).join("\n");
  const blob = new Blob([ndjson], { type: "application/x-ndjson" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ───────────────────────────────────────────────────────────────────────────────
// Hook SSE avec reconnexion exponentielle
// ───────────────────────────────────────────────────────────────────────────────
function useSSE({ url, paused }) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | connecting | open | error
  const esRef = useRef(null);
  const retryRef = useRef({ attempt: 0, timer: null });

  useEffect(() => {
    if (paused) {
      // Si on met en pause, on ferme la connexion pour ne rien recevoir
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        retryRef.current.attempt = 0;
        setStatus("open");
      };

      es.onmessage = (event) => {
        const parsed = safeParse(event.data);
        const payload = parsed.ok ? parsed.json : { raw: parsed.raw };
        const type = detectType(payload);

        setEvents((prev) => {
          const next = [
            {
              ts: nowIso(),
              id: event.lastEventId || null,
              type,
              payload,
            },
            ...prev,
          ];
          // Cap mémoire: on garde seulement les N plus récents
          if (next.length > MAX_BUFFER) next.length = MAX_BUFFER;
          return next;
        });
      };

      es.onerror = () => {
        setStatus("error");
        es.close();
        esRef.current = null;
        // Backoff exponentiel bourné: 1s, 2s, 4s, ... max 30s
        const attempt = Math.min(retryRef.current.attempt + 1, 10);
        retryRef.current.attempt = attempt;
        const delay = Math.min(1000 * 2 ** (attempt - 1), 30000);
        clearTimeout(retryRef.current.timer);
        retryRef.current.timer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (esRef.current) esRef.current.close();
      esRef.current = null;
      clearTimeout(retryRef.current.timer);
    };
  }, [url, paused]);

  return { events, status, clear: () => setEvents([]) };
}

// ───────────────────────────────────────────────────────────────────────────────
// Composant principal
// ───────────────────────────────────────────────────────────────────────────────
export default function McpLivePage() {
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const listRef = useRef(null);

  const { events, status, clear } = useSSE({ url: SSE_URL, paused });

  // Dérive les types disponibles (pour filter dropdown)
  const knownTypes = useMemo(() => {
    const s = new Set(events.map((e) => e.type || "unknown"));
    return ["all", ...Array.from(s).sort()];
  }, [events]);

  // Filtrage en mémoire (minimaliste & rapide)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!q) return true;
      // Match plein-texte simple sur JSON stringifié (rapide et suffisant ici)
      try {
        const s = JSON.stringify(e.payload).toLowerCase();
        return s.includes(q);
      } catch {
        return false;
      }
    });
  }, [events, typeFilter, query]);

  // Auto-scroll (vers le haut, car on pousse en tête)
  useEffect(() => {
    if (!autoScroll || !listRef.current) return;
    // On maintient le scroll tout en haut (événements récents en premier)
    listRef.current.scrollTop = 0;
  }, [filtered, autoScroll]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">MCP Live (SSE)</h1>
          <p className="text-sm text-neutral-400">
            Flux: <code className="text-neutral-300">{SSE_URL}</code> — Statut:{" "}
            <span
              className={{
                idle: "text-neutral-400",
                connecting: "text-amber-400",
                open: "text-emerald-400",
                error: "text-red-400",
              }[status]}
            >
              {status}
            </span>{" "}
            — {events.length} events (cap {MAX_BUFFER})
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused((v) => !v)}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
            >
              {paused ? "▶️ Resume" : "⏸️ Pause"}
            </button>
            <button
              onClick={clear}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
            >
              🗑️ Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-400">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700"
            >
              {knownTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recherche texte (payload)…"
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
            <button
              onClick={() => downloadNdjson(`mcp_${new Date().toISOString()}.ndjson`, events.slice().reverse())}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
            >
              ⬇️ Export NDJSON
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className="h-[70vh] overflow-auto rounded-2xl border border-neutral-800 bg-neutral-900"
        >
          {filtered.length === 0 ? (
            <div className="p-6 text-neutral-400">Aucun événement (encore)…</div>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {filtered.map((e, idx) => (
                <li key={`${e.ts}-${idx}`} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs text-neutral-400">{e.ts}</div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-neutral-700 bg-neutral-800">
                      {e.type}
                    </span>
                  </div>
                  <details className="mt-2 group">
                    <summary className="cursor-pointer text-sm text-neutral-200 hover:text-white">
                      Voir le payload
                    </summary>
                    <pre className="mt-2 p-3 rounded-xl bg-neutral-950 overflow-auto text-xs">
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="mt-4 text-xs text-neutral-500">
          Conseil perf : garde le cap {MAX_BUFFER} sauf besoin spécifique, et filtre côté client.
          Pour persister, ajoute un worker qui poste en batch dans Supabase (JSONB + index GIN).
        </footer>
      </div>
    </div>
  );
}
