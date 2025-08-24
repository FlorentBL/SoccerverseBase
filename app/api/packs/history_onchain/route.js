// /app/api/packs/history_onchain/route.js
import { NextResponse } from "next/server";

// USDC (Polygon) – 6 décimales
const USDC_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174".toLowerCase();

// Contrats de vente (ajoute ceux que tu connais au besoin)
const SALE_ADDRESSES = new Set([
  "0x135aD32c7C8E1E0a698b8C4f8532Ff3d0BC4af0B9".toLowerCase(), // vu sur ton screenshot
  // ...rajoute d’autres adresses si nécessaire
]);

function asInt(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}
function okStr(x) {
  return (x || "").toString().trim();
}

/** Resolve wallet depuis le pseudo en interne via /api/resolve_wallet */
async function resolveWalletFromName(req, name) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto =
    (req.headers.get("x-forwarded-proto") || "").split(",")[0] || "https";
  const base = `${proto}://${host}`;

  const r = await fetch(`${base}/api/resolve_wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    cache: "no-store",
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return j?.wallet || null;
}

/** Lit les transferts ERC20 (USDC) du wallet via Polygonscan */
async function fetchUsdcTransfers({ wallet, startblock }) {
  const apiKey = process.env.POLYGONSCAN_API_KEY;
  if (!apiKey) {
    throw new Error("POLYGONSCAN_API_KEY manquant côté serveur");
  }
  const url =
    `https://api.polygonscan.com/api` +
    `?module=account` +
    `&action=tokentx` +
    `&contractaddress=${USDC_POLYGON}` +
    `&address=${wallet}` +
    `&startblock=${startblock}` +
    `&endblock=99999999` +
    `&sort=asc` +
    `&apikey=${apiKey}`;

  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json();
  // Polygonscan renvoie { status:"1", message:"OK", result:[...] } si OK
  if (j?.status !== "1" || !Array.isArray(j?.result)) {
    const msg = j?.message || "Polygonscan NOTOK";
    throw new Error(msg);
  }
  return j.result;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = okStr(body?.name);
    const explicitWallet = okStr(body?.wallet);
    const fromBlock = asInt(body?.fromBlock, 0);

    let wallet = explicitWallet;
    if (!wallet && name) {
      wallet = await resolveWalletFromName(req, name);
    }
    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "wallet manquant" },
        { status: 400 }
      );
    }
    const walletLower = wallet.toLowerCase();

    // 1) On lit les transferts USDC (ERC20) sortant/entrant
    const txs = await fetchUsdcTransfers({ wallet: walletLower, startblock: fromBlock });

    // 2) On ne garde que les sorties (achats) vers les contrats de vente connus
    const sales = txs
      .filter(
        (t) =>
          t?.from?.toLowerCase() === walletLower &&
          SALE_ADDRESSES.has((t?.to || "").toLowerCase())
      )
      .map((t) => {
        const amount = Number(t.value || "0") / 1e6; // USDC 6 déc.
        return {
          hash: t.hash,
          block: asInt(t.blockNumber),
          time: asInt(t.timeStamp), // unix
          from: t.from,
          to: t.to,
          amountUSDC: amount,
        };
      });

    // 3) Réponse compacte
    return NextResponse.json({
      ok: true,
      wallet,
      count: sales.length,
      txs: sales,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Erreur serveur" },
      { status: 502 }
    );
  }
}
