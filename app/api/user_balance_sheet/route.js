// app/api/user_balance_sheet/route.js
import { NextResponse } from "next/server";

/**
 * Proxy de /api/user_balance_sheet Soccerverse pour éviter CORS côté client
 * POST body attendu: { name: string, from_time?: number, to_time?: number }
 *
 * On pagine tant que des items reviennent (per_page fixe) avec garde-fou (maxPages).
 * NB: L’API renvoie total=null → on s’arrête dès qu’un batch < per_page est reçu.
 */

export async function POST(req) {
  try {
    const { name, from_time, to_time } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }

    const base = "https://services.soccerverse.com/api/user_balance_sheet";
    const per_page = 500;   // gros batch pour limiter les allers-retours
    const maxPages = 20;    // garde-fou

    let page = 1;
    const all = [];

    while (page <= maxPages) {
      const url = new URL(base);
      url.searchParams.set("name", name);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(per_page));
      if (from_time) url.searchParams.set("from_time", String(from_time));
      if (to_time) url.searchParams.set("to_time", String(to_time));

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `Upstream error ${res.status}`, details: text?.slice(0, 500) },
          { status: 502 }
        );
      }
      const json = await res.json();
      const items = Array.isArray(json?.items) ? json.items : [];
      all.push(...items);

      if (items.length < per_page) break; // fin pagination
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
