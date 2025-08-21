import { NextResponse } from "next/server";

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

    const upstream = await fetch("https://gsppub.soccerverse.io/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(rpcBody),
    });

    const json = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error ${upstream.status}`, details: json || null },
        { status: 502 }
      );
    }

    return NextResponse.json(json ?? { result: { data: [] } });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
