// /app/api/packs/preview/route.js
import { NextResponse } from "next/server";
import { publicClient } from "@/lib/polygon";
import { getClubTier } from "@/lib/clubTiers.js";
import { encodeFunctionData } from "viem";

// Tier → address (Polygon mainnet)
const PACK_TIERS = new Map([
  [1, "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003"],
  [2, "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08"],
  [3, "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f"],
  [4, "0x167360A54746b82e38f700dF0ef812c269c4e565"],
  [5, "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91"],
]);

// ✅ La sortie est un tableau d'uint256 (et pas "tuple" générique)
const PACK_ABI = [
  {
    type: "function",
    name: "preview",
    stateMutability: "view",
    inputs: [
      { name: "clubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
    ],
    outputs: [{ type: "uint256[]" }],
  },
];

// Certains contrats lisent msg.sender même en "view"
const CALLER = "0x000000000000000000000000000000000000dEaD";

function toBigIntSafe(v) {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string" && v.trim() !== "") return BigInt(v.trim());
  throw new Error("Argument numérique invalide");
}

async function handle(clubIdRaw, numPacksRaw, debug) {
  const clubId = toBigIntSafe(clubIdRaw);
  const numPacks = toBigIntSafe(numPacksRaw ?? 1);

  const tier = getClubTier(clubId);
  if (!tier) {
    return NextResponse.json(
      { ok: false, error: "Tier inconnu pour ce club", clubId: String(clubId) },
      { status: 404 }
    );
  }

  const address = PACK_TIERS.get(tier);
  if (!address) {
    return NextResponse.json(
      { ok: false, error: "Contrat introuvable pour ce tier", tier },
      { status: 404 }
    );
  }

  // Diagnostics réseau/contrat
  const chainId = await publicClient.getChainId();
  const bytecode = await publicClient.getBytecode({ address });
  const diag = {
    chainId,
    hasBytecode: !!bytecode,
    bytecodeLen: bytecode ? bytecode.length : 0,
  };
  if (chainId !== 137 || !bytecode) {
    return NextResponse.json(
      { ok: false, error: "Bad network or no bytecode", tier, address, ...diag },
      { status: 400 }
    );
  }

  // Mode debug → eth_call bas-niveau (pour voir le revert data si ça échoue)
  if (debug) {
    try {
      const data = encodeFunctionData({
        abi: PACK_ABI,
        functionName: "preview",
        args: [clubId, numPacks],
      });
      const out = await publicClient.call({ to: address, data, account: CALLER });
      return NextResponse.json({
        ok: true,
        tier,
        address,
        clubId: String(clubId),
        numPacks: String(numPacks),
        lowLevelCall: out, // { data, ... }
        ...diag,
      });
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          error: e?.shortMessage || e?.message || String(e),
          revertData: e?.data || null,
          tier,
          address,
          clubId: String(clubId),
          numPacks: String(numPacks),
          ...diag,
        },
        { status: 400 }
      );
    }
  }

  // Mode normal : readContract (avec account pour msg.sender) + décodage en uint256[]
  try {
    const result = await publicClient.readContract({
      address,
      abi: PACK_ABI,
      functionName: "preview",
      args: [clubId, numPacks],
      account: CALLER,
    });

    // `result` est un tableau de bigint. On renvoie aussi une version number[] pour l’UX.
    const resultNums = Array.isArray(result) ? result.map(x => Number(x)) : null;

    return NextResponse.json({
      ok: true,
      tier,
      address,
      clubId: String(clubId),
      numPacks: String(numPacks),
      result,       // bigint[]
      resultNums,   // number[] (facile à lire dans Hoppscotch)
      ...diag,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.shortMessage || e?.message || String(e),
        tier,
        address,
        clubId: String(clubId),
        numPacks: String(numPacks),
        ...diag,
      },
      { status: 400 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");
  const numPacks = searchParams.get("numPacks");
  const debug = searchParams.get("debug") === "1";
  return handle(clubId, numPacks, debug);
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const clubId = body?.clubId ?? body?.club_id ?? body?.club;
  const numPacks = body?.numPacks ?? body?.num_packs ?? 1;
  const debug = body?.debug === 1 || body?.debug === true || body?.debug === "1";
  return handle(clubId, numPacks, debug);
}
