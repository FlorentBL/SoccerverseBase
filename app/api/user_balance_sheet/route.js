// app/api/user_balance_sheet/route.js
import { NextResponse } from "next/server";

/**
 * Proxy vers services.soccerverse.com/api/user_balance_sheet
 * Body attendu: { name: string, from_time?: number, to_time?: number }
 * - Pagine avec per_page ∈ {5,10,20,50,100} (on force 100)
 * - S'arrête dès qu'un batch < per_page est reçu
 * - Retourne { result: Item[] } pour le client
 */
export async function POST(req) {
  try {
    const { name, from_time, to_time } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }

    // borne sur la période pour éviter des ranges énormes accidentels
    if (from_time && to_time && Number(to_time) < Number(from_time)) {
      return NextResponse.json({ error: "'to_time' must be >= 'from_time'" }, { status: 400 });
    }

    const base = "https://services.soccerverse.com/api/user_balance_sheet";
    const PER_PAGE = 100; // ✅ valeur acceptée par l'API
    const MAX_PAGES = 100; // garde-fou

    let page = 1;
    const all = [];

    while (page <= MAX_PAGES) {
      const url = new URL(base);
      url.searchParams.set("name", name);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(PER_PAGE));
      if (from_time) url.searchParams.set("from_time", String(from_time));
      if (to_time) url.searchParams.set("to_time", String(to_time));

      const res = await fetch(url.toString(), {
        // pas de cache: on veut un snapshot exact pour le ROI
        cache: "no-store",
      });

      if (!res.ok) {
        // essaye de rapatrier les détails exacts renvoyés par l'API
        let details = null;
        try {
          const j = await res.json();
          details = j.detail ?? j.details ?? j.error ?? j;
        } catch {
          details = await res.text().catch(() => null);
        }
        return NextResponse.json(
          { error: `Upstream error ${res.status}`, details },
          { status: res.status === 422 ? 422 : 502 }
        );
      }

      const json = await res.json();
      const items = Array.isArray(json?.items) ? json.items : [];
      all.push(...items);

      if (items.length < PER_PAGE) break; // fin pagination
      page += 1;
    }

    return NextResponse.json({ result: all });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
