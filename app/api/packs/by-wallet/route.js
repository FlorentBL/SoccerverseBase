// app/api/packs/by-wallet/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ──────────────────────────────────────────────────────────────────────────
   USDC contracts (Polygon)
────────────────────────────────────────────────────────────────────────── */
const USDC_NATIVE_POLYGON  = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359".toLowerCase(); // Circle native
const USDC_BRIDGED_POLYGON = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174".toLowerCase(); // PoS bridged
const USDC_CONTRACTS = [USDC_NATIVE_POLYGON, USDC_BRIDGED_POLYGON];

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────────────────── */
function getApiKeyFromReqOrEnv(reqUrl) {
  if (!reqUrl) {
    return (
      process.env.POLYGONSCAN_API_KEY ||
      process.env.POLYGONSCAN_KEY ||
      process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
      ""
    );
  }
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

/**
 * Récupère les transferts USDC pour `wallet` sur Polygon
 * en paginant tant que les timestamps >= (minTs - marginSec).
 * On ramène uniquement ce qui implique le wallet (in/out),
 * et on note `dir: "out" | "in"`.
 */
async function fetchUsdcTransfersPaged({
  wallet,
  apikey,
  minTs,
  marginSec = 3600,
  pageSize = 100,
  maxPages = 2000,
}) {
  const base = "https://api.etherscan.io/v2/api";
  const addr = wallet.toLowerCase();
  const stopBefore = Math.max(0, Number(minTs || 0) - Math.max(0, marginSec));
  const out = [];

  for (const contract of USDC_CONTRACTS) {
    for (let page = 1; page <= maxPages; page++) {
      const u = new URL(base);
      u.searchParams.set("chainid", "137");
      u.searchParams.set("module", "account");
      u.searchParams.set("action", "tokentx");
      u.searchParams.set("address", wallet);
      u.searchParams.set("contractaddress", contract);
      u.searchParams.set("page", String(page));
      u.searchParams.set("offset", String(pageSize));
      u.searchParams.set("startblock", "0");
      u.searchParams.set("endblock", "99999999");
      u.searchParams.set("sort", "desc");
      if (apikey) u.searchParams.set("apikey", apikey);

      const r = await fetch(u, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      const rows = Array.isArray(j?.result) ? j.result : [];

      if (!rows.length) break;

      for (const t of rows) {
        const ts = Number(t.timeStamp || 0);
        const from = (t.from || "").toLowerCase();
        const to   = (t.to   || "").toLowerCase();
        const dir  = from === addr ? "out" : to === addr ? "in" : null;
        if (!dir) continue;

        out.push({
          hash: t.hash,
          timeStamp: ts,
          value: normalizeFromEtherscanTx(t),
          dir,
          contract: (t.contractAddress || "").toLowerCase(),
        });
      }

      // si la page ramène déjà des datas toutes < stopBefore => on peut sortir
      const lastTs = Number(rows[rows.length - 1]?.timeStamp || 0);
      if (lastTs < stopBefore) break;
    }
  }

  // tri anti-dupes par hash (garde timestamp le + récent)
// Regroupement par (txHash + dir) en conservant la valeur USDC la plus élevée
const byHashDir = new Map();
for (const t of out) {
  const key = `${t.hash}|${t.dir}`;
  const prev = byHashDir.get(key);
  if (!prev || Number(t.value ?? 0) > Number(prev.value ?? 0)) {
    byHashDir.set(key, t);
  }
}

// On renvoie trié par timestamp croissant (utile pour le matching)
return Array.from(byHashDir.values()).sort((a, b) => a.timeStamp - b.timeStamp);
 // asc pour matching
}

/**
 * Matching greedy:
 * - trie les hints par ts asc, puis par totalPacks desc (si même ts)
 * - pour chaque hint, cherche la sortie USDC la plus proche non-utilisée
 *   dans la fenêtre ± toleranceSec ; on privilégie la plus proche
 */
function matchPaymentsToHints({ hints, transfers, toleranceSec = 1800 }) {
  const outs = transfers.filter(t => t.dir === "out");
  const used = new Set();
  const byTs = [];

  const sortedHints = [...hints].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return (b.totalPacks || 0) - (a.totalPacks || 0);
  });

  for (const h of sortedHints) {
    let best = null;
    let bestDiff = Infinity;
    let bestIdx = -1;

    // recherche locale (outs triés asc)
    for (let i = 0; i < outs.length; i++) {
      if (used.has(i)) continue;
      const t = outs[i];
      const d = Math.abs(t.timeStamp - h.ts);
      if (d <= toleranceSec && d < bestDiff) {
        best = t; bestDiff = d; bestIdx = i;
        if (bestDiff === 0) break; // parfait
      }
      // petite optimisation : si t.ts - h.ts > tolerance, on peut break
      if (t.timeStamp - h.ts > toleranceSec) break;
    }

    if (best) {
      used.add(bestIdx);
      byTs.push({
        ts: h.ts,
        txHash: best.hash,
        priceUSDC: best.value,
        matchedDiffSec: bestDiff,
      });
    } else {
      byTs.push({
        ts: h.ts,
        txHash: null,
        priceUSDC: null,
        matchedDiffSec: null,
      });
    }
  }

  return byTs;
}

/* ──────────────────────────────────────────────────────────────────────────
   POST  /api/packs/by-wallet
   body: { wallet, hints:[{ts,totalPacks}], toleranceSec?, marginSec? }
────────────────────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    const { wallet, hints, toleranceSec = 1800, marginSec = 7200 } = await req.json();
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet || "")) {
      return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });
    }
    if (!Array.isArray(hints) || !hints.length) {
      return NextResponse.json({ ok: true, wallet, matches: [] });
    }

    const apikey = getApiKeyFromReqOrEnv();
    if (!apikey) {
      return NextResponse.json(
        { ok: false, error: "API key manquante (Etherscan v2). Ajoute POLYGONSCAN_API_KEY." },
        { status: 400 }
      );
    }

    const minTs = Math.min(...hints.map(h => Number(h.ts)));
    const transfers = await fetchUsdcTransfersPaged({
      wallet, apikey, minTs, marginSec,
    });

    const matches = matchPaymentsToHints({
      hints: hints.map(h => ({ ts: Number(h.ts), totalPacks: Number(h.totalPacks || 0) })),
      transfers,
      toleranceSec: Number(toleranceSec) || 0,
    });

    return NextResponse.json({
      ok: true,
      wallet,
      matches,
      meta: {
        fetchedTransfers: transfers.length,
        toleranceSec: Number(toleranceSec),
        marginSec: Number(marginSec),
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
