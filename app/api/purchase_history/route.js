import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  decodeAbiParameters,
  padHex,
  getAddress,
} from "viem";
import { polygon } from "viem/chains";

// ───────────────────────────────────────────────────────────────────────────────
// Constants

// USDC (Polygon mainnet)
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
// Topic0 de l'event ERC20 Transfer(address,address,uint256)
const TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Contrats SwappingPackSale par tier (mainnet)
const SALE_CONTRACTS = [
  "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003", // tier 1
  "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08", // tier 2
  "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f", // tier 3
  "0x167360A54746b82e38f700dF0ef812c269c4e565", // tier 4
  "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91", // tier 5
];

// XayaAccounts (username -> wallet)
const XAYA_ACCOUNTS = "0x8C12253F71091b9582908C8a44F78870Ec6F304F";
const XAYA_ABI = [
  { type: "function", name: "tokenIdForName", stateMutability: "view",
    inputs: [{ name: "name", type: "string" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "ownerOf", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
];

// ───────────────────────────────────────────────────────────────────────────────

function getClient() {
  const rpc = process.env.POLYGON_RPC_URL;
  if (!rpc) throw new Error("POLYGON_RPC_URL manquant");
  return createPublicClient({ chain: polygon, transport: http(rpc) });
}

async function resolveWalletFromName(client, name) {
  try {
    const tokenId = await client.readContract({
      address: XAYA_ACCOUNTS,
      abi: XAYA_ABI,
      functionName: "tokenIdForName",
      args: [name],
    });
    const owner = await client.readContract({
      address: XAYA_ACCOUNTS,
      abi: XAYA_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    });
    return getAddress(owner);
  } catch (e) {
    throw new Error(
      `Impossible de résoudre le wallet pour "${name}" (XayaAccounts).`
    );
  }
}

// Essaie de décoder 2 uint256 (clubId, numPacks) depuis l'input data, sans connaître le nom de la fonction.
function tryDecodeClubAndPacks(txInputHex) {
  try {
    if (!txInputHex || txInputHex.length < 10) return { clubId: null, numPacks: null };
    // on saute le sélecteur (4 bytes → 8 hex chars après "0x")
    const paramsHex = "0x" + txInputHex.slice(10);
    const [clubId, numPacks] = decodeAbiParameters(
      [{ type: "uint256" }, { type: "uint256" }],
      paramsHex
    );
    return {
      clubId: Number(clubId),
      numPacks: Number(numPacks),
    };
  } catch {
    return { clubId: null, numPacks: null };
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let wallet = searchParams.get("wallet");
    const name = searchParams.get("name");

    const client = getClient();
    if (!wallet) {
      if (!name)
        return NextResponse.json(
          { error: "Fournis ?wallet=0x... ou ?name=username" },
          { status: 400 }
        );
      wallet = await resolveWalletFromName(client, name);
    }
    wallet = getAddress(wallet);

    const latest = await client.getBlockNumber();
    const DEFAULT_LOOKBACK = 500_000n;

    const fromBlock = searchParams.get("fromBlock")
      ? BigInt(searchParams.get("fromBlock"))
      : (latest > DEFAULT_LOOKBACK ? latest - DEFAULT_LOOKBACK : 0n);
    const toBlock = searchParams.get("toBlock")
      ? BigInt(searchParams.get("toBlock"))
      : latest;

    // topics:
    // 0: Transfer topic
    // 1: from = wallet (indexed)
    // 2: to   = any of SALE_CONTRACTS (indexed, on Polygon les addresses sont indexées dans Transfer)
    const toTopics = SALE_CONTRACTS.map((a) => padHex(getAddress(a), { size: 32 }));
    const logs = await client.getLogs({
      address: getAddress(USDC),
      fromBlock,
      toBlock,
      topics: [TRANSFER_TOPIC0, padHex(wallet, { size: 32 }), toTopics],
    });

    const purchases = [];
    const byClub = new Map();
    let totalUSDC = 0;

    for (const lg of logs) {
      // montant USDC (6 décimales) : data est uint256 en hex
      const amountUSDC = Number(BigInt(lg.data)) / 1_000_000; // float en USDC
      totalUSDC += amountUSDC;

      // Récupère la tx pour essayer d'en déduire clubId / numPacks
      const tx = await client.getTransaction({ hash: lg.transactionHash });
      const { clubId, numPacks } = tryDecodeClubAndPacks(tx.input || "0x");

      purchases.push({
        hash: lg.transactionHash,
        blockNumber: Number(lg.blockNumber),
        to: getAddress(tx.to),
        clubId,
        numPacks,
        usdc: amountUSDC,
      });

      if (clubId != null) {
        const v = byClub.get(clubId) || { packs: 0, usdc: 0 };
        v.packs += numPacks || 0;
        v.usdc += amountUSDC;
        byClub.set(clubId, v);
      }
    }

    const aggregatedByClub = [...byClub.entries()]
      .map(([clubId, v]) => ({ clubId, packs: v.packs, usdc: v.usdc }))
      .sort((a, b) => b.usdc - a.usdc);

    return NextResponse.json({
      wallet,
      fromBlock: Number(fromBlock),
      toBlock: Number(toBlock),
      totalPurchases: purchases.length,
      totalUSDC: Number(totalUSDC.toFixed(2)),
      byClub: aggregatedByClub,
      purchases,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
