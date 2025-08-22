import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

const SALE_BY_TIER = {
  1: "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003",
  2: "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08",
  3: "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f",
  4: "0x167360A54746b82e38f700dF0ef812c269c4e565",
  5: "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91",
};

// preview(uint256,uint256) → (primary, num, priceUSDC, clubIds[], amounts[])
const SALE_ABI = [{
  type: "function",
  name: "preview",
  stateMutability: "view",
  inputs: [
    { type: "uint256", name: "clubId" },
    { type: "uint256", name: "numPacks" },
  ],
  outputs: [
    { type: "uint256", name: "primaryClubId" },
    { type: "uint256", name: "numPacks" },
    { type: "uint256", name: "priceUSDC" },     // 6 decimals
    { type: "uint256[]", name: "clubIds" },
    { type: "uint256[]", name: "amounts" },
  ],
}];

function getClient() {
  const urls = [
    process.env.POLYGON_RPC_URL,
    "https://polygon-bor.publicnode.com",
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
  ].filter(Boolean);
  let lastErr;
  for (const url of urls) {
    try {
      return createPublicClient({ chain: polygon, transport: http(url, { retryCount: 2, timeout: 12000 }) });
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("No Polygon RPC available.");
}

async function loadTiers() {
  try {
    const s = await readFile(process.cwd() + "/public/club_tiers.json", "utf8");
    return JSON.parse(s || "{}");
  } catch { return {}; }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = Number(searchParams.get("clubId") || "");
    const numPacks = Number(searchParams.get("numPacks") || "1");
    if (!Number.isFinite(clubId) || clubId <= 0) {
      return NextResponse.json({ error: "Paramètre clubId invalide" }, { status: 400 });
    }
    if (!Number.isFinite(numPacks) || numPacks <= 0) {
      return NextResponse.json({ error: "Paramètre numPacks invalide" }, { status: 400 });
    }

    const tiersMap = await loadTiers();
    const candidates = tiersMap[String(clubId)] ? [Number(tiersMap[String(clubId)])] : [1,2,3,4,5];

    const client = getClient();
    const tried = [];
    let lastErr = null;

    for (const tier of candidates) {
      const address = SALE_BY_TIER[tier];
      tried.push({ tier, address });
      try {
        const r = await client.readContract({
          address,
          abi: SALE_ABI,
          functionName: "preview",
          args: [BigInt(clubId), BigInt(numPacks)], // order: clubId, numPacks
        });

        const priceUSDC = Number(r[2]) / 1_000_000;
        const clubIds = r[3].map(Number);
        const amounts = r[4].map(Number);
        const totalInfluence = amounts.reduce((a, b) => a + b, 0);
        const unitUSDC = totalInfluence > 0 ? priceUSDC / totalInfluence : 0;

        return NextResponse.json({
          ok: true,
          tier,
          address,
          input: { clubId, numPacks },
          priceUSDC,
          totalInfluence,
          unitUSDC,
          distribution: clubIds.map((cid, i) => ({ clubId: cid, influence: amounts[i] || 0 })),
        });
      } catch (e) {
        lastErr = e;
        // try next tier
      }
    }

    return NextResponse.json(
      { error: "Pack introuvable pour ce club", details: { tried, lastError: String(lastErr?.shortMessage || lastErr?.message || lastErr) } },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
