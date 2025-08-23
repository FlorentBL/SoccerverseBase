import { NextResponse } from "next/server";
import { publicClient } from "@/lib/polygon";
import { encodeFunctionData, decodeAbiParameters } from "viem";

// Adresses des contrats de vente par tier (Polygon mainnet)
const PACK_TIERS = [
  "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003", // tier 1
  "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08", // tier 2
  "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f", // tier 3
  "0x167360A54746b82e38f700dF0ef812c269c4e565", // tier 4
  "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91", // tier 5
];

// Minimal ABI pour:
// - event PacksBought(address indexed buyer, string ref, uint256 indexed clubId, uint256 numPacks, uint256 unitUSDC)
// - function preview(uint256 clubId, uint256 numPacks)
const PACK_ABI = [
  {
    type: "event",
    name: "PacksBought",
    inputs: [
      { indexed: true,  name: "buyer",    type: "address" },
      { indexed: false, name: "ref",      type: "string"  },
      { indexed: true,  name: "clubId",   type: "uint256" },
      { indexed: false, name: "numPacks", type: "uint256" },
      { indexed: false, name: "unitUSDC", type: "uint256" }, // µUSDC
    ],
  },
  {
    type: "function",
    name: "preview",
    stateMutability: "view",
    inputs: [
      { name: "clubId", type: "uint256"  },
      { name: "numPacks", type: "uint256" },
    ],
  },
];

const CALLER = "0x000000000000000000000000000000000000dEaD";
const DEFAULT_FROM_BLOCK = 66056325n;

const toAddrLower = (a) => (a || "").toLowerCase();

async function resolveWalletServer(name, origin) {
  try {
    const url = `${origin}/api/resolve_wallet`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      cache: "no-store",
    });

    let j = null;
    try {
      j = await r.json();
    } catch {
      throw new Error(`resolve_wallet non-JSON (HTTP ${r.status})`);
    }
    if (!r.ok) throw new Error(j?.error || `resolve_wallet HTTP ${r.status}`);
    if (!j?.wallet) throw new Error("Wallet introuvable");
    return j.wallet;
  } catch (e) {
    console.error("resolveWalletServer ERROR:", e);
    throw e;
  }
}

function parsePreviewResultHex(hexData) {
  const [arr] = decodeAbiParameters([{ type: "uint256[]" }], hexData);
  return arr.map((x) => {
    const n = typeof x === "bigint" ? x : BigInt(String(x));
    return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n;
  });
}

function extractClubInfluencesFromPreview(resultNums) {
  const pairs = [];
  let i = 6;
  while (i + 1 < resultNums.length) {
    const clubId = Number(resultNums[i]);
    const inf = Number(resultNums[i + 1]);
    if (!clubId) break; // terminaison
    if (inf > 0) pairs.push({ clubId, inf });
    i += 2;
  }
  return pairs;
}

/**
 * Récupère les logs en chunkant la plage de blocs pour éviter
 * "Block range is too large" côté RPC.
 */
async function getBuyerLogsChunked(buyer, fromBlock = DEFAULT_FROM_BLOCK) {
  const end = await publicClient.getBlockNumber().catch(() => null);
  if (!end) throw new Error("Impossible de lire le block courant");

  const logsAll = [];
  let start = fromBlock;
  let chunkSize = 50_000n; // taille de fenêtre initiale (ajustable dynamiquement)

  while (start <= end) {
    let to = start + chunkSize - 1n;
    if (to > end) to = end;

    try {
      const logs = await publicClient.getLogs({
        address: PACK_TIERS,
        event: PACK_ABI[0], // PacksBought
        args: { buyer: buyer.toLowerCase() },
        fromBlock: start,
        toBlock: to,
      });
      logsAll.push(...logs);
      // si ça passe, on peut tenter d'augmenter un peu la fenêtre (max x2)
      if (chunkSize < 200_000n) chunkSize *= 2n;
      // avancer
      start = to + 1n;
    } catch (e) {
      const msg = String(e?.message || e);
      // Si la fenêtre est trop grande, on réduit
      if (
        msg.includes("Block range is too large") ||
        msg.includes("query timeout") ||
        msg.includes("429") ||
        msg.includes("rate limit")
      ) {
        // réduire la fenêtre
        chunkSize = chunkSize > 10_000n ? chunkSize / 2n : 10_000n;
        if (chunkSize <= 0n) throw e;
        // ne pas avancer 'start' -> on retente avec fenêtre réduite
        continue;
      }
      console.error("getBuyerLogsChunked ERROR chunk:", { start: String(start), to: String(to), e });
      throw e;
    }
  }

  return logsAll;
}

async function previewAtBlock(address, clubId, numPacks, blockNumber) {
  const data = encodeFunctionData({
    abi: PACK_ABI,
    functionName: "preview",
    args: [BigInt(clubId), BigInt(numPacks)],
  });
  try {
    const out = await publicClient.call({
      to: address,
      data,
      account: CALLER,
      blockNumber,
    });
    return parsePreviewResultHex(out.data);
  } catch (e) {
    console.error("previewAtBlock ERROR:", { address, clubId, numPacks, blockNumber, e });
    throw e;
  }
}

function addTo(map, key, val) {
  map.set(key, (map.get(key) || 0) + val);
}

async function handle(req, nameRaw, fromBlockRaw) {
  const name = (nameRaw || "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Paramètre 'name' manquant" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  try {
    const wallet = await resolveWalletServer(name, origin);
    const wLower = toAddrLower(wallet);

    const fromBlock = fromBlockRaw ? BigInt(fromBlockRaw) : DEFAULT_FROM_BLOCK;

    // 🔁 logs par fenêtres
    const logs = await getBuyerLogsChunked(wLower, fromBlock);

    // Allocation des coûts
    const spentUSDByClub = new Map();
    const audit = [];

    for (const log of logs) {
      const {
        address: saleAddress,
        blockNumber,
        transactionHash,
        args: { buyer, clubId, numPacks, unitUSDC },
      } = log;

      if (toAddrLower(buyer) !== wLower) continue;

      const nPacks = Number(numPacks);
      const unit = Number(unitUSDC); // µUSDC/pack
      const totalUSDC = (unit / 1e6) * nPacks;

      const previewNums = await previewAtBlock(saleAddress, Number(clubId), nPacks, blockNumber);
      const pairs = extractClubInfluencesFromPreview(previewNums);
      const totalInf = pairs.reduce((s, p) => s + p.inf, 0);

      if (totalUSDC > 0 && totalInf > 0) {
        const usdPerInf = totalUSDC / totalInf;
        for (const { clubId: cid, inf } of pairs) {
          addTo(spentUSDByClub, cid, usdPerInf * inf);
        }
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
    console.error("history_onchain.handle ERROR:", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || searchParams.get("username");
  const fromBlock = searchParams.get("fromBlock");
  return handle(req, name, fromBlock);
}

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    console.error("POST body JSON parse ERROR:", e);
    return NextResponse.json({ ok: false, error: "Body non JSON" }, { status: 400 });
  }
  const name = body?.name || body?.username;
  const fromBlock = body?.fromBlock;
  return handle(req, name, fromBlock);
}
