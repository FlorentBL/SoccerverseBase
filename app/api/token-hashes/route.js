// app/api/token-hashes/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CONFIG
 * Fourni un RPC fiable (Alchemy/Infura/QuickNode). Le public polygon-rpc.com marche,
 * mais s'il throttle fort, réduis la fenêtre via les params ?window= et ?minWindow=.
 */
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

// USDC natif + USDC.e sur Polygon
const USDC_CONTRACTS = [
  "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // USDC (native)
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC.e (bridged)
].map((a) => a.toLowerCase());

// Transfer(address,address,uint256)
const TOPIC_TRANSFER =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const RANGE_ERR_RE = /(range|too (large|wide)|exceed|more than|timeout|query|result size|response size)/i;

const to0x = (x) => (x?.startsWith("0x") ? x : "0x" + x);
function padTopicAddress(addr) {
  const clean = addr.toLowerCase().replace(/^0x/, "");
  return "0x" + "0".repeat(24) + clean; // 12 bytes de padding à gauche → 32 bytes
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
 * Scan par **contrat USDC** + from=wallet, en fenêtres adaptatives
 */
async function fetchTxHashesForContract(contract, wallet, {
  startblock,
  endblock,
  window = 50000,     // fenêtre initiale en nb de blocks
  minWindow = 2000,   // fenêtre minimale si le RPC se plaint
  maxWindows = 200,   // nb max de fenêtres à explorer
  maxWanted = 300,    // combien de hashes on veut (3 pages x 100)
} = {}) {
  const fromTopic = padTopicAddress(wallet);
  const seen = new Map(); // txHash -> blockNumber
  let end = endblock;
  let iterations = 0;

  while (end >= startblock && iterations < maxWindows && seen.size < maxWanted) {
    iterations++;
    let curWindow = Math.min(window, end - startblock + 1);
    let tried = 0;

    // boucle de tentative avec réduction si le RPC refuse
    // (ex: "query returned more than...", "range too large", etc.)
    while (true) {
      tried++;
      const from = Math.max(startblock, end - curWindow + 1);
      const filter = {
        address: contract,
        fromBlock: to0x(from.toString(16)),
        toBlock: to0x(end.toString(16)),
        topics: [TOPIC_TRANSFER, fromTopic], // Transfer(from=wallet, to=any)
      };

      try {
        const logs = await rpc("eth_getLogs", [filter]);
        // collecte
        for (const l of logs) {
          const tx = (l.transactionHash || "").toLowerCase();
          if (!tx) continue;
          const bn = parseInt(l.blockNumber, 16) || 0;
          const prev = seen.get(tx);
          if (!prev || bn > prev) seen.set(tx, bn);
        }

        // si ça a ramené énormément de logs → réduire la prochaine fenêtre
        if (logs.length > 5000 && window > minWindow) {
          window = Math.max(minWindow, Math.floor(window / 2));
        }

        // on recule la tête de lecture
        end = from - 1;
        break; // chunk OK
      } catch (e) {
        const msg = String(e.message || e);
        if (RANGE_ERR_RE.test(msg) && curWindow > minWindow) {
          curWindow = Math.max(minWindow, Math.floor(curWindow / 2));
          continue; // retente plus petit
        }
        if (curWindow > minWindow) {
          curWindow = Math.max(minWindow, Math.floor(curWindow / 2));
          continue;
        }
        // on ne bloque jamais : si même à minWindow ça râle, on saute ce bloc et on continue à avancer
        end = end - curWindow;
        break;
      }
    }
  }

  // trie décroissant par blockNumber
  return Array.from(seen.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tx]) => tx);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").toLowerCase();

    // bornes : par défaut on prend un lookback qui couvre ton CSV (≈ 74800000 → 75600000)
    const latest = await getLatestBlockNumber();
    const endblock = parseInt(url.searchParams.get("endblock") || String(latest), 10);
    const startblock = parseInt(url.searchParams.get("startblock") || String(Math.max(0, endblock - 900_000)), 10);

    const window = parseInt(url.searchParams.get("window") || "50000", 10);
    const minWindow = parseInt(url.searchParams.get("minWindow") || "2000", 10);
    const maxWanted = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("maxWanted") || "300", 10)));

    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });
    }

    // on scanne les 2 contrats USDC puis on fusionne/déduplique
    const all = new Map(); // txHash -> block
    for (const c of USDC_CONTRACTS) {
      const list = await fetchTxHashesForContract(c, wallet, {
        startblock, endblock, window, minWindow, maxWanted,
      });
      // pour récupérer le blockNumber, on peut faire un petit head receipt (facultatif)
      for (const h of list) all.set(h, (all.get(h) || 0)); // on fusionne
    }

    // pour l’ordre par blockNumber, on récupère rapidement les receipts (limité aux N premiers)
    const hashes = Array.from(all.keys());
    const headN = Math.min(hashes.length, 300);
    const receipts = await Promise.all(
      hashes.slice(0, headN).map(async (h) => {
        try {
          const r = await rpc("eth_getTransactionReceipt", [h]);
          const bn = r?.blockNumber ? parseInt(r.blockNumber, 16) : 0;
          return { h, bn };
        } catch {
          return { h, bn: 0 };
        }
      })
    );
    const blockMap = new Map(receipts.map(({ h, bn }) => [h, bn]));
    const ordered = hashes.sort((a, b) => (blockMap.get(b) || 0) - (blockMap.get(a) || 0));

    return NextResponse.json({
      ok: true,
      wallet,
      range: { startblock, endblock },
      count: ordered.length,
      hashes: ordered,
      debug: { window, minWindow, latest },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
