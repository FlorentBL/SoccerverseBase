import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, from_time, to_time } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    if (from_time && to_time && Number(to_time) < Number(from_time)) {
      return NextResponse.json({ error: "'to_time' must be >= 'from_time'" }, { status: 400 });
    }

    const base = "https://services.soccerverse.com/api/user_balance_sheet";
    const PER_PAGE = 100;      // valeurs acceptées: 5,10,20,50,100
    const MAX_PAGES = 400;     // large marge

    const all = [];
    const seen = new Set();
    let lastFirstSig = null;

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = new URL(base);
      url.searchParams.set("name", name);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(PER_PAGE));
      if (from_time) url.searchParams.set("from_time", String(from_time));
      if (to_time) url.searchParams.set("to_time", String(to_time));

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        let details = null;
        try { const j = await res.json(); details = j.detail ?? j.details ?? j.error ?? j; }
        catch { details = await res.text().catch(() => null); }
        return NextResponse.json(
          { error: `Upstream error ${res.status}`, details },
          { status: res.status === 422 ? 422 : 502 }
        );
      }

      const json = await res.json();
      const items = Array.isArray(json?.items) ? json.items : [];

      const first = items[0];
      const firstSig = first ? sig(first) : `empty-${page}`;
      if (lastFirstSig && firstSig === lastFirstSig) break;
      lastFirstSig = firstSig;

      for (const it of items) {
        const k = sig(it);
        if (seen.has(k)) continue;
        seen.add(k);
        all.push(it);
      }

      if (items.length < PER_PAGE) break;
    }

    return NextResponse.json({ result: all });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}

function sig(it) {
  return [
    it?.name ?? "",
    it?.type ?? "",
    it?.amount ?? "",
    it?.other_name ?? "",
    it?.other_type ?? "",
    it?.other_id ?? "",
    it?.unix_time ?? it?.time ?? "",
  ].join("|");
}
