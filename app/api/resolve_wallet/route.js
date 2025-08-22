// app/api/pack_preview/route.js
import { NextResponse } from "next/server";
import { client } from "@/lib/polygon";
import { SWAPPING_PACK_SALE } from "@/lib/contracts";
import { parseAbi } from "viem";

// ABI minimale : preview(clubId, numPacks)
// renvoie (primaryClub, packs, priceUSDC, discountedUSDC, clubs[], amounts[])
const abi = parseAbi([
  "function preview(uint256 clubId, uint256 numPacks) view returns (uint256,uint256,uint256,uint256,uint256[],uint256[])",
]);

function computeUnitUSDC(previewTuple) {
  // indices basés sur l'ABI ci-dessus
  const priceUSDC = Number(previewTuple[2]); // en micro-USDC (1e6)
  const clubs = (previewTuple[4] || []).map(Number);
  const amounts = (previewTuple[5] || []).map(Number);

  const totalInfluences = amounts.reduce((a, b) => a + Number(b || 0), 0);
  if (!totalInfluences) return null;

  const priceUSD = priceUSDC / 1e6;
  return {
    priceUSD,
    clubs,
    amounts,
    unitUSDC: priceUSD / totalInfluences, // USD / influence
    totalInfluences,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = Number(searchParams.get("clubId"));
    const numPacks = Number(searchParams.get("numPacks") || 1);
    const tierHint = Number(searchParams.get("tier") || 0);

    if (!clubId || clubId < 1) {
      return NextResponse.json({ error: "Missing or invalid clubId" }, { status: 400 });
    }

    // Ordre d’essai : hint de tier (si fourni), puis 1→5
    const order = [1, 2, 3, 4, 5].filter((t) => t !== tierHint);
    if (tierHint >= 1 && tierHint <= 5) order.unshift(tierHint);

    let lastErr = null;

    for (const tier of order) {
      const addr = SWAPPING_PACK_SALE[tier];
      if (!addr) continue;

      try {
        const res = await client.readContract({
          address: addr,
          abi,
          functionName: "preview",
          args: [BigInt(clubId), BigInt(numPacks)],
        });

        const parsed = computeUnitUSDC(res);
        if (!parsed) continue;

        return NextResponse.json({
          tier,
          address: addr,
          priceUSD: parsed.priceUSD,
          unitUSDC: parsed.unitUSDC,
          totalInfluences: parsed.totalInfluences,
          clubs: parsed.clubs,
          influences: parsed.amounts,
        });
      } catch (e) {
        lastErr = e;
        // on essaie le tier suivant
      }
    }

    return NextResponse.json(
      { error: "Pack introuvable pour ce club" },
      { status: 404 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
