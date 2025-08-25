// app/api/mcp/sse/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const upstreamUrl = url.searchParams.get("url") || "https://mcp.soccerverse.io/sse";

  // Reconstruire l’URL upstream avec TOUS les paramètres supplémentaires (topics, etc.)
  const u = new URL(upstreamUrl);
  for (const [k, v] of url.searchParams.entries()) {
    if (k === "url") continue;
    u.searchParams.append(k, v);
  }

  const headers = {
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  // Auth optionnelle côté serveur (ne pas exposer côté client)
  const bearer = process.env.MCP_SSE_BEARER;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const upstream = await fetch(u.toString(), { method: "GET", headers });

  if (!upstream.ok || !upstream.body) {
    return new Response(`Upstream error: HTTP ${upstream.status}`, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
