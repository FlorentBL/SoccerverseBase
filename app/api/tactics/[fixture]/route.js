// GET /api/tactics/:fixture
export async function GET(_req, { params }) {
  const { fixture } = params;
  if (!fixture) {
    return new Response(JSON.stringify({ error: "missing_fixture_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = `https://services.soccerverse.com/api/fixture_history/tactics/${encodeURIComponent(
    fixture
  )}`;

  try {
    const r = await fetch(upstream, {
      cache: "no-store",
      headers: { "User-Agent": "SVBase/1.0 (+proxy)" },
    });

    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "upstream_failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
