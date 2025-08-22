// app/api/resolve_wallet/route.js
import { NextResponse } from "next/server";
import { publicClient } from "@/lib/polygon";

const XAYA_ACCOUNTS = "0x8C12253F71091b9582908C8a44F78870Ec6F304F";

const ABI = [
  {
    type: "function",
    name: "tokenIdForName",
    stateMutability: "pure",
    inputs: [
      { name: "ns", type: "string" },
      { name: "name", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    // handy for debugging
    type: "function",
    name: "tokenIdToName",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { type: "string" }, // ns
      { type: "string" }, // name
    ],
  },
];

async function resolveUsername(name) {
  if (!name) throw new Error("Paramètre 'name' manquant");

  // Try Polygon namespace first; optionally fall back to others.
  const namespaces = ["p", "sv"];
  let lastError;

  for (const ns of namespaces) {
    try {
      const tokenId = await publicClient.readContract({
        address: XAYA_ACCOUNTS,
        abi: ABI,
        functionName: "tokenIdForName",
        args: [ns, name],
      });

      const wallet = await publicClient.readContract({
        address: XAYA_ACCOUNTS,
        abi: ABI,
        functionName: "ownerOf",
        args: [tokenId],
      });

      return { wallet, tokenId: tokenId.toString(), ns };
    } catch (e) {
      lastError = e;
      // try next ns
    }
  }

  const msg =
    lastError?.shortMessage ||
    lastError?.message ||
    "Impossible de résoudre ce pseudo";
  throw new Error(msg);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || searchParams.get("username") || "";
  try {
    const data = await resolveUsername(name.trim());
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 404 });
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = (body?.name || body?.username || "").trim();
  try {
    const data = await resolveUsername(name);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 404 });
  }
}
