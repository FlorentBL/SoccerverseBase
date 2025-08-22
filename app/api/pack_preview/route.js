// app/api/pack_preview/route.js
import { NextResponse } from "next/server";
import { client } from "@/lib/polygon";
import { SWAP_SALE_ADDR, SWAP_SALE_ABI } from "@/lib/contracts";

function ok(data, meta = {}) {
  return NextResponse.json({ ...data, ...meta }, { status: 200 });
}
function err(msg, status = 400, details) {
  return NextResponse.json({ error: msg, ...(details ? { details } : {}) }, { status });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clubId = Number(searchParams.get("clubId"));
  const numPacks = Number(searchParams.get("numPacks") || 1);
  if (!clubId || clubId <= 0) return err("Paramètre 'clubId' invalide");
  if (!numPacks || numPacks <= 0) return err("Paramètre 'numPacks' invalide");

  const tried = [];
  let lastError = null;

  for (const tier of [1, 2, 3, 4, 5]) {
    const address = SWAP_SALE_ADDR[tier];
    if (!address) continue;
    tried.push({ tier, address });
    try {
      const res = await client.readContract({
        address,
        abi: SWAP_SALE_ABI,
        functionName: "preview",
        args: [BigInt(clubId), BigInt(numPacks)],
      });

      // res: [primaryClubId, num, priceUSDC, discountedUSDC, clubIds[], influences[]]
      const [primaryId, num, priceUSDC, _discounted, clubIds, influences] = res;

      const clubs = clubIds.map(Number);
      const infs = influences.map(Number);
      const totalInfluences = infs.reduce((a, b) => a + b, 0);
      const priceUsd = Number(priceUSDC) / 1e6; // USDC a 6 décimales
      const unitUSDC = totalInfluences > 0 ? priceUsd / totalInfluences : 0;

      return ok({
        tier,
        contract: address,
        clubId: Number(primaryId ?? clubId),
        numPacks: Number(num ?? numPacks),
        priceUSDC: priceUsd,
        clubs,
        influences: infs,
        totalInfluences,
        unitUSDC,
      });
    } catch (e) {
      lastError = String(e?.shortMessage || e?.message || e);
      // on continue sur le tier suivant
    }
  }

  return err("Pack introuvable pour ce club", 404, { tried, lastError });
}
