// app/api/gsp_share_balances/route.js
import { NextResponse } from "next/server";

/**
 * Proxy JSON-RPC vers gsppub.soccerverse.io
 * Body attendu: { name: string }
 * Retourne: { result: Array<{type:'club'|'player', id:number, balance:{available,reserved,total}}>}
 */
export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }

    const rpcBody = {
      jsonrpc: "2.0",
      method: "get_user_share_balances",
      params: { name },
      id: 1,
    };

    const res = await fetch("https://gsppub.soccerverse.io/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // important: pas de cache
      cache: "no-store",
      body: JSON.stringify(rpcBody),
    });

    if (!res.ok) {
      let details = null;
      try {
        const j = await res.json();
        details = j?.error ?? j;
      } catch {
        details = await res.text().catch(() => null);
      }
      return NextResponse.json(
        { error: `Upstream RPC error ${res.status}`, details },
        { status: 502 }
      );
    }

    const rpc = await res.json();
    if (rpc?.error) {
      return NextResponse.json({ error: rpc.error }, { status: 502 });
    }

    const data = Array.isArray(rpc?.result?.data) ? rpc.result.data : [];
    // normalise: flatten -> [{type,id,balance:{available,reserved,total}}]
    const flat = data.map((row) => {
      const share = row?.share ?? {};
      const type = "player" in share ? "player" : "club";
      const id = share.player ?? share.club ?? null;
      return {
        type,
        id,
        balance: {
          available: Number(row?.balance?.available ?? 0),
          reserved: Number(row?.balance?.reserved ?? 0),
          total: Number(row?.balance?.total ?? 0),
        },
      };
    });

    return NextResponse.json({ result: flat });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
