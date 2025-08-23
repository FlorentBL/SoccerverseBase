import { NextResponse } from "next/server";
import { publicClient } from "@/lib/polygon";
import { encodeFunctionData, decodeAbiParameters } from "viem";

// ── Contracts (Polygon mainnet)
const PACK_TIERS = [
  "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003",
  "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08",
  "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f",
  "0x167360A54746b82e38f700dF0ef812c269c4e565",
  "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91",
];

// ── ABI (event + preview)
const PACK_ABI = [
  {
    type: "event",
    name: "PacksBought",
    inputs: [
      { indexed: true, name: "buyer", type: "address" },
      { indexed: false, name: "ref", type: "string" },
      { indexed: true, name: "clubId", type: "uint256" },
      { indexed: false, name: "numPacks", type: "uint256" },
      { indexed: false, name: "unitUSDC", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "preview",
    stateMutability: "view",
    inputs: [
      { name: "clubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
    ],
  },
];

const CALLER = "0x000000000000000000000000000000000000dEaD";
const DEFAULT_FROM_BLOCK = 66056325n; // démarrage subgraph/vente

const toLower = (a) => (a || "").toLowerCase();

async function resolveWalletServer(name, origin) {
  const r = await fetch(`${origin}/api/resolve_wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    cache: "no-store",
  });
  let j;
  try {
    j = await r.json();
  } catch {
    throw new Error(`resolve_wallet: réponse non JSON (HTTP ${r.status})`);
  }
  if (!r.ok) throw new Error(j?.error || `resolve_wallet HTTP ${r.status}`);
  if (!j?.wallet) throw new Error("Wallet introuvable");
  return j.wallet;
}

function parsePreviewNums(hex) {
  const [arr] = decodeAbiParameters([{ type: "uint256[]" }], hex);
  return arr.map((x) => {
    const n = typeof x === "bigint" ? x : BigInt(String(x));
    return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n;
  });
}

function extractPairs(resultNums) {
  const out = [];
  let i = 6; // après [packs, price, ..., mainClubId, mainInf]
  while (i + 1 < resultNums.length) {
    const cid = Number(resultNums[i]);
    const inf = Number(resultNums[i + 1]);
    if (!cid) break;
    if (inf > 0) out.push({ clubId: cid, inf });
    i += 2;
  }
  return out;
}

function add(map, key, val) {
  map.set(key, (map.get(key) || 0) + val);
}

// ── util promise timeout
function withTimeout(promise, ms, label = "operation") {
  let id;
  const t = new Promise((_, rej) =>
    (id = setTimeout(() => rej(new Error(`${label} timeout after ${ms}ms`)), ms))
  );
  return Promise.race([promise.finally(() => clearTimeout(id)), t]);
}

async function previewAtBlock(address, clubId, numPacks, blockNumber) {
  const data = encodeFunctionData({
    abi: PACK_ABI,
    functionName: "preview",
    args: [BigInt(clubId), BigInt(numPacks)],
  });
  const out = await publicClient.call({ to: address, data, account: CALLER, blockNumber });
  return parsePreviewNums(out.data);
}

// ── getLogs chunked w/ backoff + hard cap
async function getBuyerLogsChunked(buyer, fromBlock, maxSecs) {
  const end = await publicClient.getBlockNumber();
  const logsAll = [];
  let start = fromBlock;
  let chunk = 50_000n;
  const started = Date.now();

  while (start <= end) {
    if ((Date.now() - started) / 1000 > maxSecs) {
      throw new Error(`getLogs timeout (> ${maxSecs}s)`);
    }

    let to = start + chunk - 1n;
    if (to > end) to = end;

    try {
      const logs = await publicClient.getLogs({
        address: PACK_TIERS,
        event: PACK_ABI[0],
        args: { buyer },
        fromBlock: start,
        toBlock: to,
      });
      logsAll.push(...logs);
      if (chunk < 200_000n) chunk *= 2n;
      start = to + 1n;
    } catch (e) {
      const msg = String(e?.message || e);
      // backoff sur erreurs de plage/charge
      if (
        msg.includes("Block range is too large") ||
        msg.includes("timeout") ||
        msg.includes("rate limit") ||
        msg.includes("429")
      ) {
        chunk = chunk > 10_000n ? chunk / 2n : 10_000n;
        continue;
      }
      throw e;
    }
  }
  return logsAll;
}

async function handle(req, nameRaw, fromBlockRaw, maxSecsRaw) {
  const name = (nameRaw || "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "Paramètre 'name' manquant" }, { status: 400 });

  const origin = new URL(req.url).origin;
  const fromBlock = fromBlockRaw ? BigInt(fromBlockRaw) : DEFAULT_FROM_BLOCK;
  const maxSecs = Number(maxSecsRaw || 60); // ⏱️ hard timeout côté serveur

  try {
    const wallet = await withTimeout(
      resolveWalletServer(name, origin),
      Math.min(maxSecs * 1000, 15000),
      "resolve_wallet"
    );
    const buyer = toLower(wallet);

    const logs = await withTimeout(
      getBuyerLogsChunked(buyer, fromBlock, maxSecs),
      maxSecs * 1000,
      "getLogs"
    );

    const spentUSDByClub = new Map();
    const audit = [];

    for (const log of logs) {
      const {
        address: sale,
        blockNumber,
        transactionHash,
        args: { buyer: b, clubId, numPacks, unitUSDC },
      } = log;

      if (toLower(b) !== buyer) continue;

      const nPacks = Number(numPacks);
      const unit = Number(unitUSDC); // µUSDC/pack
      const totalUSDC = (unit / 1e6) * nPacks;

      // preview au bloc de l'achat (coût réparti sur toutes les influences)
      const nums = await withTimeout(
        previewAtBlock(sale, Number(clubId), nPacks, blockNumber),
        Math.min(10_000, maxSecs * 500), // 10s max pour un preview
        "preview"
      );
      const pairs = extractPairs(nums);
      const totalInf = pairs.reduce((s, p) => s + p.inf, 0);

      if (totalUSDC > 0 && totalInf > 0) {
        const usdPerInf = totalUSDC / totalInf;
        for (const { clubId: cid, inf } of pairs) add(spentUSDByClub, cid, usdPerInf * inf);
      }

      audit.push({
        tx: transactionHash,
        blockNumber: Number(blockNumber),
        clubId: Number(clubId),
        numPacks: nPacks,
        unitUSDC: unit / 1e6,
        totalUSDC,
        totalInf,
        components: pairs,
      });
    }

    return NextResponse.json({
      ok: true,
      wallet,
      count: logs.length,
      spentPackUSDByClub: [...spentUSDByClub.entries()].map(([clubId, usd]) => ({ clubId, usd })),
      mints: audit,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 504 } // Gateway Timeout style
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || searchParams.get("username");
  const fromBlock = searchParams.get("fromBlock");
  const maxSecs = searchParams.get("maxSecs");
  return handle(req, name, fromBlock, maxSecs);
}

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body non JSON" }, { status: 400 });
  }
  const name = body?.name || body?.username;
  const fromBlock = body?.fromBlock;
  const maxSecs = body?.maxSecs;
  return handle(req, name, fromBlock, maxSecs);
}
