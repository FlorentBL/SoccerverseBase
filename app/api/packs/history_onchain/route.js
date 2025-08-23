// /app/api/packs/history_onchain/route.js
import { NextResponse } from "next/server";

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
// USDC (Polygon)
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

// (optionnel) adresses "shop" connues à filtrer ; laisse vide pour tout voir
const SHOP_ADDRS = new Set([
  "0x135aD32c686A0B0d7036c7A3D7b8F7D60Bc4af0B".toLowerCase(),
]);

async function resolveWalletByName(origin, name) {
  try {
    const r = await fetch(`${origin}/api/resolve_wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      // pas de cache
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.wallet || null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const origin = new URL(req.url).origin;
    const { name, username, wallet: walletRaw, startBlock, fromBlock, maxSecs } =
      await req.json().catch(() => ({}));

    // 1) on résout le wallet si nécessaire
    let wallet = (walletRaw || "").trim();
    const user = (name || username || "").trim();
    if (!wallet && user) {
      wallet = await resolveWalletByName(origin, user);
    }
    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "wallet manquant" },
        { status: 400 }
      );
    }

    // borne de départ (par défaut 0)
    const start = Number(fromBlock ?? startBlock ?? 0) || 0;

    if (!POLYGONSCAN_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "POLYGONSCAN_API_KEY manquant côté serveur" },
        { status: 500 }
      );
    }

    // 2) appel Polygonscan : transferts ERC20 USDC du wallet
    const url = new URL("https://api.polygonscan.com/api");
    url.searchParams.set("module", "account");
    url.searchParams.set("action", "tokentx");
    url.searchParams.set("address", wallet);
    url.searchParams.set("contractaddress", USDC);
    url.searchParams.set("startblock", String(start));
    url.searchParams.set("endblock", "99999999");
    url.searchParams.set("sort", "asc");
    url.searchParams.set("apikey", POLYGONSCAN_API_KEY);

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || data?.status === "0") {
      return NextResponse.json(
        { ok: false, error: data?.message || "Erreur Polygonscan" },
        { status: 502 }
      );
    }

    const all = Array.isArray(data?.result) ? data.result : [];

    // 3) on ne garde que les sorties (le wallet paie), éventuellement vers les shops
    const out = all.filter((tx) => {
      const fromOk = (tx.from || "").toLowerCase() === wallet.toLowerCase();
      if (!fromOk) return false;
      if (SHOP_ADDRS.size === 0) return true; // garder tout
      return SHOP_ADDRS.has((tx.to || "").toLowerCase());
    });

    const txs = out.map((tx) => ({
      hash: tx.hash,
      block: Number(tx.blockNumber),
      time: Number(tx.timeStamp) * 1000,
      from: tx.from,
      to: tx.to,
      amountUSDC: Number(tx.value) / 1e6, // 6 décimales
    }));

    return NextResponse.json({
      ok: true,
      wallet,
      count: txs.length,
      txs,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
