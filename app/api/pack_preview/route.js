// app/api/pack_preview/route.js
import { NextResponse } from "next/server";
import { getPolygonClient } from "@/lib/polygon";
import { SWAPPING_PACK_SALE_ABI } from "@/lib/abis";

// Adresses mainnet Polygon (tiers 1..5)
const PACK_SALE_BY_TIER = [
  { tier: 1, address: "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003" },
  { tier: 2, address: "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08" },
  { tier: 3, address: "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f" },
  { tier: 4, address: "0x167360A54746b82e38f700dF0ef812c269c4e565" },
  { tier: 5, address: "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91" },
];

const USDC_DECIMALS = 1_000_000n;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubIdRaw = searchParams.get("clubId");
    const numPacksRaw = searchParams.get("numPacks") ?? "1";
    if (!clubIdRaw) {
      return NextResponse.json(
        { error: "Paramètre 'clubId' manquant" },
        { status: 400 }
      );
    }

    const clubId = BigInt(clubIdRaw);
    const numPacks = BigInt(numPacksRaw);

    const client = getPolygonClient();

    // 1) Trouver le tier exact via clubs(clubId) -> bool
    let chosen = null;
    const tried = [];
    for (const t of PACK_SALE_BY_TIER) {
      tried.push({ tier: t.tier, address: t.address });
      try {
        const isInTier = await client.readContract({
          address: t.address,
          abi: SWAPPING_PACK_SALE_ABI,
          functionName: "clubs",
          args: [clubId],
        });
        if (isInTier) {
          chosen = t;
          break;
        }
      } catch {
        // ignore et on continue sur les autres tiers
      }
    }

    if (!chosen) {
      return NextResponse.json(
        {
          error: "Pack introuvable pour ce club (aucun tier ne contient ce club).",
          details: { tried },
        },
        { status: 404 }
      );
    }

    // 2) Appeler preview sur le bon contrat uniquement
    let res;
    try {
      res = await client.readContract({
        address: chosen.address,
        abi: SWAPPING_PACK_SALE_ABI,
        functionName: "preview",
        args: [clubId, numPacks],
      });
    } catch (err) {
      return NextResponse.json(
        {
          error: "Échec d'appel preview()",
          details: {
            tier: chosen.tier,
            address: chosen.address,
            message: err?.shortMessage || String(err),
          },
        },
        { status: 502 }
      );
    }

    // `res` devrait être :
    // [clubId, numPacks, unitUSDC, totalUSDC, clubs[], amounts[]]
    // Mais on tolère d’autres variantes (paires aplaties).
    const arr = Array.isArray(res) ? res : [];
    const unitUSDC = arr[2]; // bigint
    const totalUSDC = arr[3]; // bigint

    let packedClubs = [];
    let packedAmounts = [];

    if (Array.isArray(arr[4]) && Array.isArray(arr[5])) {
      // Variante “tableaux”
      packedClubs = arr[4].map((x) => Number(x));
      packedAmounts = arr[5].map((x) => Number(x));
    } else if (arr.length > 4) {
      // Variante “paires à plat” (comme l’affichage sur Etherscan UI)
      const flat = arr.slice(4).map((x) => Number(x));
      for (let i = 0; i + 1 < flat.length; i += 2) {
        packedClubs.push(flat[i]);
        packedAmounts.push(flat[i + 1]);
      }
    }

    // Total d’influences par pack
    const totalInfluencesPerPack =
      packedAmounts.reduce((s, v) => s + (Number(v) || 0), 0) || 0;

    // Prix du pack en USDC (float)
    const unitUSDCf = Number(unitUSDC) / Number(USDC_DECIMALS);
    const totalUSDCf = Number(totalUSDC) / Number(USDC_DECIMALS);

    // Prix “USD par influence” (estimation)
    const unitUSDPerInfluence =
      totalInfluencesPerPack > 0 ? unitUSDCf / totalInfluencesPerPack : 0;

    return NextResponse.json({
      tier: chosen.tier,
      address: chosen.address,
      clubId: Number(arr[0]),
      numPacks: Number(arr[1]),
      unitUSDC: unitUSDCf, // prix pack (USDC) pour 1 pack
      totalUSDC: totalUSDCf, // prix total pour numPacks
      packedClubs,
      packedAmounts,
      unitUSDPerInfluence,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
