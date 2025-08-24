import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CONFIG
 * - POLYGON_RPC_URL doit pointer vers un RPC fiable (QuickNode, Alchemy, Infura, ou le public polygon-rpc.com)
 */
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

// Topics
const TOPIC_TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Helpers
const to0x = (x) => (x?.startsWith("0x") ? x : "0x" + x);
function padTopicAddress(addr) {
  const clean = addr.toLowerCase().replace(/^0x/, "");
  return "0x" + "0".repeat(24) + clean; // 12 bytes of 0 → left-padded to 32 bytes for topic
}
async function rpc(method, params) {
  const r = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`RPC HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}
async function getLatestBlockNumber() {
  const hex = await rpc("eth_blockNumber", []);
  return parseInt(hex, 16);
}

/**
 * Scan des logs Transfer (ERC20/721) où topics[1] = from = wallet
 * - address non spécifiée -> n’importe quel contrat (tous tokens)
 * - chunking adaptatif pour éviter "range too large" / timeouts
 */
const RANGE_ERR_RE = /(range|too (large|wide)|exceed|more than|timeout|query|result size|response size)/i;

async function fetchTransferTxHashesByRPC(wallet, { startblock, endblock, initialStep = 20000, minStep = 2000 } = {}) {
  const fromTopic = padTopicAddress(wallet);
  const seen = new Set();
  const byTx = new Map(); // txHash -> { blockNumber, txHash }

  let from = startblock;
  let step = Math.min(initialStep, Math.max(1, endblock - startblock + 1));

  while (from <= endblock) {
    let curStep = Math.min(step, endblock - from + 1);

    // Tentatives avec réduction de fenêtre si le RPC refuse
    // (boucle interne)
    while (true) {
      const to = from + curStep - 1;
      const filter = {
        fromBlock: to0x(from.toString(16)),
        toBlock: to0x(to.toString(16)),
        topics: [TOPIC_TRANSFER, fromTopic], // Transfer(from=wallet, to=any)
      };

      try {
        const logs = await rpc("eth_getLogs", [filter]);

        // Collecte des txHash
        for (const l of logs) {
          const tx = (l.transactionHash || "").toLowerCase();
          if (!tx || seen.has(tx)) continue;
          seen.add(tx);
          const bn = parseInt(l.blockNumber, 16);
          byTx.set(tx, { txHash: tx, blockNumber: bn });
        }

        // Avance la fenêtre
        from = to + 1;

        // Si ce chunk a ramené beaucoup de logs → réduire step futur
        if (logs.length > 5000 && step > minStep) {
          step = Math.max(minStep, Math.floor(step / 2));
        }
        break; // chunk OK -> sortir de la boucle "réduction"
      } catch (e) {
        const msg = String(e.message || e);
        if (RANGE_ERR_RE.test(msg) && curStep > minStep) {
          curStep = Math.max(minStep, Math.floor(curStep / 2));
          continue; // on retente avec une fenêtre plus petite
        }
        // autre erreur ou déjà à minStep
        throw e;
      }
    }
  }

  // Trie par blockNumber décroissant
  return Array.from(byTx.values())
    .sort((a, b) => b.blockNumber - a.blockNumber)
    .map((x) => x.txHash);
}

// Handler
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
    let startblock = parseInt(url.searchParams.get("startblock") || "0", 10);
    let endblock = parseInt(url.searchParams.get("endblock") || "0", 10);
    const initialStep = parseInt(url.searchParams.get("initialStep") || "20000", 10);
    const minStep = parseInt(url.searchParams.get("minStep") || "2000", 10);
    const limit = Math.max(1, Math.min(5000, parseInt(url.searchParams.get("limit") || "1000", 10)));

    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });
    }

    const latest = await getLatestBlockNumber();
    // Par défaut, on scanne ~2 000 000 de blocs en arrière (≈ ~2-3 semaines sur Polygon PoS, ajustable)
    if (!endblock) endblock = latest;
    if (!startblock) startblock = Math.max(0, endblock - 2_000_000);

    const hashes = await fetchTransferTxHashesByRPC(wallet, {
      startblock,
      endblock,
      initialStep,
      minStep,
    });

    const trimmed = hashes.slice(0, limit);

    return NextResponse.json({
      ok: true,
      wallet,
      range: { startblock, endblock },
      count: trimmed.length,
      hashes: trimmed,
      meta: { totalFound: hashes.length, initialStep, minStep, rpc: !!RPC_URL },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
