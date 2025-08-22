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

// ABI minimal (uniquement pour encoder l'appel)
const PACK_ABI = [
  {
    type: "function",
    name: "preview",
    stateMutability: "view",
    inputs: [
      { name: "clubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
    ],
    // on n'utilise pas 'outputs' ici, on décode nous-mêmes
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

/**
 * Décode un retour ABI de type `uint256[]` (data hex).
 * Format: offset(32) = 0x20, length(32), puis N * 32‑byte words.
 */
function decodeUint256ArrayFromHex(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("0x")) {
    throw new Error("Hex invalide");
  }
  const data = hex.slice(2); // sans 0x
  const word = 64; // 32 bytes = 64 hex chars

  if (data.length < word * 2) {
    throw new Error("Réponse trop courte");
  }

  const offset = BigInt("0x" + data.slice(0, word));         // 0..63
  if (offset !== 32n) {
    // Par prudence : certains encodeurs peuvent structurer différemment
    // mais dans notre cas, on s'attend à 0x20.
    // On autorise quand même, en recalculant l'index de la longueur.
  }
  const lenPos = Number(offset) * 2; // hex index
  if (lenPos + word > data.length) throw new Error("Index longueur hors limites");

  const length = Number(BigInt("0x" + data.slice(lenPos, lenPos + word)));

  const arrStart = lenPos + word;
  const arrEnd = arrStart + length * word;
  if (arrEnd > data.length) throw new Error("Buffer insuffisant pour le tableau");

  const out = new Array(length);
  for (let i = 0; i < length; i++) {
    const start = arrStart + i * word;
    const end = start + word;
    const v = BigInt("0x" + data.slice(start, end));
    out[i] = v;
  }
  return out;
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

  // Encodage de l'appel
  const data = encodeFunctionData({
    abi: PACK_ABI,
    functionName: "preview",
    args: [clubId, numPacks],
  });

  // Mode debug → renvoyer l'output brut
  if (debug) {
    try {
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

  // Mode normal → appel bas‑niveau + décodage manuel `uint256[]`
  try {
    const out = await publicClient.call({ to: address, data, account: CALLER });
    const resultBigints = decodeUint256ArrayFromHex(out.data);
    const resultNums = resultBigints.map((x) => Number(x)); // pratique pour l'UI

    return NextResponse.json({
      ok: true,
      tier,
      address,
      clubId: String(clubId),
      numPacks: String(numPacks),
      resultBigints, // uint256[] en bigint
      resultNums,    // version number[]
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
