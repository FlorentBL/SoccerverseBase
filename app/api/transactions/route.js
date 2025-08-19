import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le paramètre 'name' est requis." },
        { status: 400 }
      );
    }

    const rpcBody = {
      jsonrpc: "2.0",
      method: "get_user_share_transactions",
      params: { name: name.trim() },
      id: 1,
    };

    const upstream = await fetch("https://gsppub.soccerverse.io/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rpcBody),
      // Pas besoin d'options CORS ici : on est côté serveur
    });

    // Si l’upstream est HTTP 200 mais renvoie un JSON-RPC error, on le gère après le .json()
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Soccerverse a répondu ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();

    if (data?.error) {
      // Erreur JSON-RPC renvoyée par Soccerverse
      return NextResponse.json(
        { error: data.error },
        { status: 502 }
      );
    }

    const result = Array.isArray(data?.result) ? data.result : [];
    return NextResponse.json({ result }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
