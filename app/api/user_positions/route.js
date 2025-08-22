// app/api/user_positions/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }

    const rpcRes = await fetch("https://gsppub.soccerverse.io/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "get_user_share_balances",
        params: { name },
        id: 1,
      }),
    });

    if (!rpcRes.ok) {
      const txt = await rpcRes.text().catch(() => "");
      return NextResponse.json({ error: `Upstream ${rpcRes.status}`, details: txt }, { status: 502 });
    }

    const rpc = await rpcRes.json();
    const data = rpc?.result?.data || [];

    const clubs = [];
    const players = [];
    for (const row of data) {
      const total = Number(row?.balance?.total || 0);
      const share = row?.share || {};
      if (share.club != null) clubs.push({ id: Number(share.club), total });
      else if (share.player != null) players.push({ id: Number(share.player), total });
    }

    return NextResponse.json({ clubs, players });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
