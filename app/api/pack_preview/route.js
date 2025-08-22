import { NextResponse } from "next/server";
import { getPolygonClient } from "@/lib/polygon";
import { readFile } from "fs/promises";

const SALE_BY_TIER = {
  1: "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003",
  2: "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08",
  3: "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f",
  4: "0x167360A54746b82e38f700dF0ef812c269c4e565",
  5: "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91",
};

// ABI minimal: preview(uint256 clubId, uint256 numPacks)
// returns (uint256 primaryClubId, uint256 numPacks, uint256 priceUSDC, uint256[] clubIds, uint256[] amounts)
const SALE_ABI = [
  {
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
      { type: "uint256", name: "priceUSDC" },          // 6 décimales
      { type: "uint256[]", name: "clubIds" },
      { type: "uint256[]", name: "amounts" },          // influences par club
    ],
  },
];

async function loadClubTiersMap() {
  try {
    const buf = await readFile(process.cwd() + "/public/club_tiers.json", "utf8");
    const json = JSON.parse(buf || "{}");
    // attendu: { "114": 3, "69": 1, ... }
    return json || {};
  } catch {
    return {};
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = Number(searchParams.get("clubId") || "");
    const numPacks = Number(searchParams.get("numPacks") || "1");
    if (!Number.isFinite(clubId) || clubId <= 0)
      return NextResponse.json({ error: "Paramètre clubId invalide" }, { status: 400 });
    if (!Number.isFinite(numPacks) || numPacks <= 0)
      return NextResponse.json({ error: "Paramètre numPacks invalide" }, { status: 400 });

    const client = getPolygonClient();
    const tiersMap = await loadClubTiersMap();

    // si on a le tier localement → on n’essaie que celui-là
    const candidateTiers = tiersMap[String(clubId)]
      ? [Number(tiersMap[String(clubId)])]
      : [1, 2, 3, 4, 5];

    const tried = [];
    let lastError = null;

    for (const tier of candidateTiers) {
      const address = SALE_BY_TIER[tier];
      tried.push({ tier, address });
      try {
        const res = await client.readContract({
          address,
          abi: SALE_ABI,
          functionName: "preview",
          args: [BigInt(clubId), BigInt(numPacks)],
        });

        // res: [primaryClubId, num, priceUSDC, clubIds[], amounts[]]
        const priceUSDC = Number(res[2]) / 1_000_000; // 6 décimales
        const clubIds = res[3].map((x) => Number(x));
        const amounts = res[4].map((x) => Number(x));
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
        lastError = e;
        // on continue: “primary club is not part of this tier” sur les autres tiers
      }
    }

    return NextResponse.json(
      {
        error: "Pack introuvable pour ce club",
        details: {
          tried,
          lastError: String(lastError?.shortMessage || lastError?.message || lastError),
        },
      },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
