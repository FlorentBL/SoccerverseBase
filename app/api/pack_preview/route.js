// app/api/pack_preview/route.js
import { NextResponse } from "next/server";
import { polygonClient } from "../../../lib/polygon";
import { PACK_SALE_BY_TIER } from "../../../lib/packContracts";
import { SWAPPING_PACK_SALE_ABI } from "../../../lib/abis";

const CACHE = new Map(); // `${clubId}:${numPacks}` -> result

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = Number(searchParams.get("clubId") || 0);
    const numPacks = Number(searchParams.get("numPacks") || 1);

    if (!Number.isFinite(clubId) || clubId <= 0 || !Number.isFinite(numPacks) || numPacks <= 0) {
      return NextResponse.json({ error: "clubId/numPacks invalid" }, { status: 400 });
    }

    const key = `${clubId}:${numPacks}`;
    if (CACHE.has(key)) return NextResponse.json(CACHE.get(key));

    let found = null;

    for (const [tierStr, address] of Object.entries(PACK_SALE_BY_TIER)) {
      const tier = Number(tierStr);
      try {
        const raw = await polygonClient.readContract({
          address,
          abi: SWAPPING_PACK_SALE_ABI,
          functionName: "preview",
          args: [BigInt(clubId), BigInt(numPacks)],
        });

        const arr = Array.isArray(raw) ? raw.map(Number) : Object.values(raw).map(Number);
        if (!arr.length) continue;

        // Formats observés:
        // [clubId, numPacks, priceUSDC6, totalPriceUSDC6, clubId1, qty1, clubId2, qty2, ...]
        const priceUSDC6 = Number(arr[2] || 0);
        if (priceUSDC6 <= 0) continue;

        // Paires club/qty à partir de l’index 4
        const pairs = [];
        for (let i = 4; i + 1 < arr.length; i += 2) {
          const id = Number(arr[i]);
          const qty = Number(arr[i + 1]);
          if (!id || !Number.isFinite(qty)) break;
          pairs.push({ id, qty });
        }
        const totalQty = pairs.reduce((s, p) => s + p.qty, 0);
        const unitUSDC = totalQty > 0 ? (priceUSDC6 / 1e6) / totalQty : 0;

        found = {
          clubId,
          tier,
          priceUSDC: priceUSDC6 / 1e6,
          pairs,
          totalInfluences: totalQty,
          unitUSDC,          // USD par influence (estimation pack)
          contract: address,
        };
        break;
      } catch {
        // essaie le tier suivant
      }
    }

    if (!found) {
      return NextResponse.json({ error: "Pack introuvable pour ce club" }, { status: 404 });
    }

    CACHE.set(key, found);
    return NextResponse.json(found);
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
