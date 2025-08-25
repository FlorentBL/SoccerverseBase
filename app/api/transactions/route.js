// app/api/transactions/route.js
import { NextResponse } from "next/server";

const RPC_URL = "https://gsppub.soccerverse.io/";

// util: copie un sous‑ensemble de clés si elles existent
function pick(obj, keys) {
  const o = {};
  for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) o[k] = obj[k];
  return o;
}

// normalise t.share -> { type, id } pour tous formats
function normalizeShare(raw) {
  if (!raw || typeof raw !== "object") return null;

  // anciens formats déjà { type, id }
  if (raw.type && raw.id != null) return { type: String(raw.type), id: Number(raw.id) };

  // nouveaux formats { club: id } | { player: id } | { user: id }
  if (raw.club != null)   return { type: "club",   id: Number(raw.club) };
  if (raw.player != null) return { type: "player", id: Number(raw.player) };
  if (raw.user != null)   return { type: "user",   id: Number(raw.user) };

  // certains dumps avaient { s: { club: id } }
  if (raw.s && typeof raw.s === "object") {
    if (raw.s.club != null)   return { type: "club",   id: Number(raw.s.club) };
    if (raw.s.player != null) return { type: "player", id: Number(raw.s.player) };
  }
  return null;
}

export async function POST(req) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Le paramètre 'name' est requis." }, { status: 400 });
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

    // Clés utiles pour l’extraction des packs (quantités, montants, timestamps, club)
    const KEYS_USEFUL = [
      // quantités / deltas
      "qty", "quantity", "delta", "totalDelta", "n", "shares",
      // montants SVC
      "amount", "amount_svc", "svc", "price_svc",
      // horodatage alternatif
      "unix_time", "timestamp", "time", "ts",
      // club id éventuel hors share
      "club_id", "clubId",
    ];

    let normalized = [];

    // Cas 1 : ancien format -> result = array
    if (Array.isArray(data?.result)) {
      normalized = data.result.map((t) => {
        const base = {
          name: t?.name ?? null,
          type: t?.type ?? null,
          num: t?.num ?? null,
          other_name: t?.other_name ?? t?.othername ?? null,
          date: t?.date ?? null, // souvent unix seconds
          share: normalizeShare(t?.share),
        };
        return { ...base, ...pick(t, KEYS_USEFUL) };
      });
    }
    // Cas 2 : nouveau format -> result = { data: [...] }
    else if (data?.result?.data && Array.isArray(data.result.data)) {
      normalized = data.result.data.map((t) => {
        const base = {
          name: t?.name ?? null,
          type: t?.type ?? null,
          num: t?.num ?? null,
          other_name: t?.othername ?? t?.other_name ?? null,
          date: t?.date ?? null,
          share: normalizeShare(t?.share),
        };
        return { ...base, ...pick(t, KEYS_USEFUL) };
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
