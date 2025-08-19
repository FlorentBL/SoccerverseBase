// app/api/transactions/route.js
import { NextResponse } from "next/server";

const RPC_URL = "https://gsppub.soccerverse.io/";

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

    const upstream = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rpcBody),
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Soccerverse a répondu ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();

    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 502 });
    }

    // --- Normalisation ---
    let normalized = [];
    // Cas 1 : ancien format (result = array)
    if (Array.isArray(data?.result)) {
      normalized = data.result.map((t) => ({
        name: t?.name ?? null,
        type: t?.type ?? null,
        num: t?.num ?? null,
        other_name: t?.other_name ?? t?.othername ?? null,
        date: t?.date ?? null,
        share: t?.share
          ? t.share
          : null,
      }));
    }
    // Cas 2 : nouveau format (result = { data: [...] })
    else if (data?.result?.data && Array.isArray(data.result.data)) {
      normalized = data.result.data.map((t) => {
        // share: { club: id } ou { player: id } → { type, id }
        let share = null;
        if (t?.share?.club != null) {
          share = { type: "club", id: t.share.club };
        } else if (t?.share?.player != null) {
          share = { type: "player", id: t.share.player };
        } else if (t?.share?.user != null) {
          share = { type: "user", id: t.share.user };
        }

        return {
          name: t?.name ?? null,
          type: t?.type ?? null,
          num: t?.num ?? null,
          other_name: t?.othername ?? t?.other_name ?? null,
          date: t?.date ?? null,
          share,
        };
      });
    }

    return NextResponse.json({ result: normalized }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
