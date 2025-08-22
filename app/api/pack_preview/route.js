// app/api/pack_preview/route.js
import { NextResponse } from "next/server";
import { publicClient } from "@/lib/polygon";

// SwappingPackSale — production tiers
const TIERS = [
  { tier: 1, address: "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003" },
  { tier: 2, address: "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08" },
  { tier: 3, address: "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f" },
  { tier: 4, address: "0x167360A54746b82e38f700dF0ef812c269c4e565" },
  { tier: 5, address: "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91" },
];

// Minimal ABI: preview(clubId, numPacks)
// Returns (primaryClubId, numPacks, priceUSDC6, uint256[] clubQuantitiesFlat)
const ABI = [
  {
    type: "function",
    name: "preview",
    stateMutability: "view",
    inputs: [
      { name: "clubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
    ],
    outputs: [
      { name: "primaryClubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
      { name: "priceUSDC6", type: "uint256" },
      { name: "clubQuantitiesFlat", type: "uint256[]" },
    ],
  },
];

function toNum(x) {
  return typeof x === "bigint" ? Number(x) : Number(x || 0);
}

function parsePreviewTuple(r) {
  const primaryClubId = toNum(r[0]);
  const numPacks = toNum(r[1]);
  const priceUSDC6 = toNum(r[2]);
  const flat = (r[3] || []).map(toNum);

  // flat = [clubId, qty, clubId, qty, ...]
  let totalInfluence = 0;
  const entries = [];
  for (let i = 0; i < flat.length; i += 2) {
    const cid = flat[i];
    const qty = flat[i + 1] ?? 0;
    totalInfluence += qty;
    entries.push([cid, qty]);
  }

  const unitUSDC = totalInfluence > 0 ? priceUSDC6 / totalInfluence : 0;

  return {
    primaryClubId,
    numPacks,
    priceUSDC6,
    entries, // [[clubId, qty], ...]
    totalInfluence,
    unitUSDC, // USD (6-decimal) per influence
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clubIdStr = searchParams.get("clubId");
  const packsStr = searchParams.get("numPacks") || "1";

  if (!clubIdStr) {
    return NextResponse.json(
      { error: "Paramètre 'clubId' manquant" },
      { status: 400 }
    );
  }

  // Make sure args are BigInt for ABI encoding
  const clubId = BigInt(Number(clubIdStr));
  const numPacks = BigInt(Number(packsStr));

  try {
    // Try all tiers in one shot; pick the first success
    const calls = TIERS.map(({ address }) => ({
      address,
      abi: ABI,
      functionName: "preview",
      args: [clubId, numPacks],
    }));

    const results = await publicClient.multicall({
      allowFailure: true,
      contracts: calls,
    });

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === "success") {
        const parsed = parsePreviewTuple(res.result);
        return NextResponse.json({
          tier: TIERS[i].tier,
          address: TIERS[i].address,
          ...parsed,
        });
      }
    }

    // Nothing succeeded → surface the last failure message and what we tried
    const last = results[results.length - 1];
    return NextResponse.json(
      {
        error: "Pack introuvable pour ce club",
        details: {
          tried: TIERS,
          lastError:
            last?.error?.shortMessage ||
            last?.error?.message ||
            "Tous les appels ont échoué",
        },
      },
      { status: 404 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: "Erreur lors de la lecture du contrat",
        details: e?.shortMessage || e?.message || String(e),
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const url = new URL(req.url);
  const qp = new URLSearchParams(body?.query || "");
  // also support JSON body
  if (body?.clubId) qp.set("clubId", String(body.clubId));
  if (body?.numPacks) qp.set("numPacks", String(body.numPacks));
  return GET(new Request(url.origin + url.pathname + "?" + qp.toString()));
}
