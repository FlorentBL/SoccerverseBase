// app/api/mcp/sse/route.js
export const runtime = "nodejs";          // streaming stable
export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url") || "https://mcp.soccerverse.io/sse";

  // NOTE: on laisse l'upstream gérer le retry/keep-alive
  const upstream = await fetch(target, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(`Upstream error: HTTP ${upstream.status}`, { status: 502 });
  }

  // On relaye tel quel le flux (pas de buffering)
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // CORS permissif (uniquement si tu en as besoin en dev multi-origine)
      "Access-Control-Allow-Origin": "*",
    },
  });
}
