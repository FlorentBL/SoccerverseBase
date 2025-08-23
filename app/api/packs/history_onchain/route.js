// app/api/packs/history_onchain/route.js
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
// - function preview(uint256 clubId, uint256 numPacks) returns (uint256[] ... encodé dynamiquement)
const PACK_ABI = [
  {
    type: "event",
    name: "PacksBought",
    inputs: [
      { indexed: true,  name: "buyer",    type: "address" },
      { indexed: false, name: "ref",      type: "string"  },
      { indexed: true,  name: "clubId",   type: "uint256" },
      { indexed: false, name: "numPacks", type: "uint256" },
      { indexed: false, name: "unitUSDC", type: "uint256" }, // µUSDC par pack
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

// Certains contrats lisent msg.sender même en view (on envoie une adresse neutre)
const CALLER = "0x000000000000000000000000000000000000dEaD";

// Bloc de départ des ventes (safe). Tu peux réduire si besoin.
const DEFAULT_FROM_BLOCK = 66056325n; // voir subgraph.yaml -> ClubMinter.startBlock ~ 66056325

function toAddrLower(a) {
  return (a || "").toLowerCase();
}

async function resolveWallet(name) {
  const r = await fetch("http://localhost/api/resolve_wallet", { // chemin relatif côté serveur
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    cache: "no-store",
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || "resolve_wallet KO");
  const w = j?.wallet;
  if (!w) throw new Error("Wallet introuvable");
  return w;
}

function parsePreviewResultHex(hexData) {
  // On ne connaît pas l’ABI exacte du tuple de retour,
  // mais on sait (confirmé plus tôt) que c’est un encodage ABI d’un tableau uint256[].
  const [arr] = decodeAbiParameters([{ type: "uint256[]" }], hexData);
  // On renvoie en Number si safe, sinon BigInt.
  return arr.map((x) => {
    const n = typeof x === "bigint" ? x : BigInt(String(x));
    return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n;
  });
}

// Structure preview déjà observée :
// [0]=numPacks, [1]=unitUSDC(µ), [2]=club_treasury, [3..5]=metadatas?, 
// [6]=mainClubId, [7]=inf(main), puis paires secondaires [clubId, inf]... puis [0] de terminaison.
// On récupère toutes les paires (clubId, inf) jusqu’au 0 final.
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

async function getBuyerLogs(buyer, fromBlock = DEFAULT_FROM_BLOCK) {
  const logs = await publicClient.getLogs({
    address: PACK_TIERS,
    event: PACK_ABI[0],             // PacksBought
    args: { buyer: buyer.toLowerCase() },
    fromBlock,
    toBlock: "latest",
  });
  return logs;
}

async function previewAtBlock(address, clubId, numPacks, blockNumber) {
  const data = encodeFunctionData({
    abi: PACK_ABI,
    functionName: "preview",
    args: [BigInt(clubId), BigInt(numPacks)],
  });
  const out = await publicClient.call({
    to: address,
    data,
    account: CALLER,
    blockNumber, // *** lecture à l’état historique ***
  });
  return parsePreviewResultHex(out.data);
}

function addTo(map, key, val) {
  map.set(key, (map.get(key) || 0) + val);
}

async function handle(nameRaw, fromBlockRaw) {
  const name = (nameRaw || "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "Paramètre 'name' manquant" }, { status: 400 });

  // 1) Résoudre le wallet
  const wallet = await resolveWallet(name);
  const wLower = toAddrLower(wallet);

  // 2) Lister tous les PacksBought de ce wallet
  const fromBlock = fromBlockRaw ? BigInt(fromBlockRaw) : DEFAULT_FROM_BLOCK;
  const logs = await getBuyerLogs(wLower, fromBlock);

  // 3) Pour chaque event, rejouer preview au bloc de l’achat et allouer le coût
  const spentUSDByClub = new Map();
  const audit = [];

  for (const log of logs) {
    // viem parse args
    const {
      address: saleAddress,
      blockNumber,
      transactionHash,
      args: { buyer, clubId, numPacks, unitUSDC },
    } = log;

    // Sanity
    if (toAddrLower(buyer) !== wLower) continue;

    const tierAddress = saleAddress; // le contrat émetteur est aussi celui à appeler pour preview
    const nPacks = Number(numPacks);
    const unit = Number(unitUSDC); // µUSDC/pack
    const totalUSDC = (unit / 1e6) * nPacks;

    // Lire la composition historique
    const previewNums = await previewAtBlock(tierAddress, Number(clubId), nPacks, blockNumber);
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
      totalUSDC: totalUSDC,
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
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || searchParams.get("username");
  const fromBlock = searchParams.get("fromBlock");
  try {
    return await handle(name, fromBlock);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = body?.name || body?.username;
  const fromBlock = body?.fromBlock;
  try {
    return await handle(name, fromBlock);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
