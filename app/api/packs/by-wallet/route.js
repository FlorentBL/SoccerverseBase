// app/api/packs/by-wallet/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ──────────────────────────────────────────────────────────────────────────
   CONFIG
────────────────────────────────────────────────────────────────────────── */
const USDC_NATIVE_POLYGON  = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359".toLowerCase(); // Circle native
const USDC_BRIDGED_POLYGON = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174".toLowerCase(); // PoS bridged
const USDC_CONTRACTS = new Set([USDC_NATIVE_POLYGON, USDC_BRIDGED_POLYGON]);

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────────────────── */
function getApiKeyFromReqOrEnv(reqUrl) {
  const u = new URL(reqUrl);
  const q = u.searchParams.get("apikey") || u.searchParams.get("apiKey");
  return (
    q ||
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    ""
  );
}

function normalizeFromEtherscanTx(it) {
  const dec = Number(it.tokenDecimal || 6) || 6;
  return Number(it.value) / Math.pow(10, dec);
}

async function etherscanGetBlockByTime(ts, apikey) {
  const u = new URL("https://api.etherscan.io/v2/api");
  u.searchParams.set("chainid", "137");
  u.searchParams.set("module", "block");
  u.searchParams.set("action", "getblocknobytime");
  u.searchParams.set("timestamp", String(ts));
  u.searchParams.set("closest", "before");
  if (apikey) u.searchParams.set("apikey", apikey);
  const r = await fetch(u, { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  const n = Number(j?.result?.blockNumber ?? j?.result);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pour chaque timestamp fourni, on récupère les transferts USDC (tokentx)
 * dans une petite fenêtre de blocks et on prend le plus gros sortant comme prix.
 * Retourne: Array<{ timeStamp, txHash, priceUSDC, feesUSDC }>
 */
async function fetchUsdcPaymentsAroundTimes({
  wallet,
  apikey,
  hintTimestamps = [],
  blockWindow = 1500,
  usdcContracts = Array.from(USDC_CONTRACTS),
}) {
  const base = "https://api.etherscan.io/v2/api";
  const addr = wallet.toLowerCase();
  const out = [];

  // map ts -> block
  const blockByTs = new Map();
  for (const ts of hintTimestamps) {
    const b = await etherscanGetBlockByTime(ts, apikey);
    if (Number.isFinite(b)) blockByTs.set(ts, b);
  }

  for (const ts of hintTimestamps) {
    const b = blockByTs.get(ts);
    if (!Number.isFinite(b)) {
      out.push({ timeStamp: ts, txHash: null, priceUSDC: null, feesUSDC: 0 });
      continue;
    }

    let transfers = [];
    for (const contract of usdcContracts) {
      const u = new URL(base);
      u.searchParams.set("chainid", "137");
      u.searchParams.set("module", "account");
      u.searchParams.set("action", "tokentx");
      u.searchParams.set("address", wallet);
      u.searchParams.set("contractaddress", contract);
      u.searchParams.set("startblock", String(Math.max(0, b - blockWindow)));
      u.searchParams.set("endblock", String(b + blockWindow));
      u.searchParams.set("sort", "desc");
      if (apikey) u.searchParams.set("apikey", apikey);

      const r = await fetch(u, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      const rows = Array.isArray(j?.result) ? j.result : [];
      transfers.push(...rows);
    }

    const outs = transfers
      .filter(t => (t.from || "").toLowerCase() === addr)
      .map(t => ({ hash: t.hash, value: normalizeFromEtherscanTx(t), timeStamp: Number(t.timeStamp || 0) }))
      .sort((a, b) => Math.abs(ts - a.timeStamp) - Math.abs(ts - b.timeStamp));

    if (!outs.length) {
      out.push({ timeStamp: ts, txHash: null, priceUSDC: null, feesUSDC: 0 });
      continue;
    }

    const max = outs.reduce((a, b) => (b.value > a.value ? b : a), outs[0]);
    const price = max.value;
    const fees  = outs.filter(x => x !== max).reduce((s, x) => s + x.value, 0);

    out.push({ timeStamp: ts, txHash: max.hash, priceUSDC: price, feesUSDC: fees });
  }

  return out;
}

/* ──────────────────────────────────────────────────────────────────────────
   Handler
────────────────────────────────────────────────────────────────────────── */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
    const apikey = getApiKeyFromReqOrEnv(req.url);

    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });
    }
    if (!apikey) {
      return NextResponse.json(
        { ok: false, error: "API key manquante (Etherscan v2). Ajoute ?apikey=... ou POLYGONSCAN_API_KEY." },
        { status: 400 }
      );
    }

    // timestamps hints: ?hintTs=ts1,ts2,ts3
    const rawHints = (url.searchParams.get("hintTs") || "")
      .split(",")
      .map(s => Number(s.trim()))
      .filter(n => Number.isFinite(n) && n > 0);
    const hintTimestamps = Array.from(new Set(rawHints));

    const blockWindow = Math.max(100, Number(url.searchParams.get("blockWindow") || 1500));

    if (!hintTimestamps.length) {
      return NextResponse.json({
        ok: true,
        wallet,
        payments: [],
        note: "Aucun timestamp fourni (hintTs).",
      });
    }

    const payments = await fetchUsdcPaymentsAroundTimes({
      wallet,
      apikey,
      hintTimestamps,
      blockWindow,
    });

    return NextResponse.json({
      ok: true,
      wallet,
      payments,
      meta: { blockWindow },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
