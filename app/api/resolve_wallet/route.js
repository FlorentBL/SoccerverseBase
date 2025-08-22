import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

// XayaAccounts (Polygon mainnet)
const XAYA_ACCOUNTS = "0x8C12253F71091b9582908C8a44F78870Ec6F304F";

// minimal ABI we need
const XAYA_ABI = [
  // tokenIdForName(string ns, string name)
  {
    type: "function",
    name: "tokenIdForName",
    stateMutability: "view",
    inputs: [{ type: "string", name: "ns" }, { type: "string", name: "name" }],
    outputs: [{ type: "uint256" }],
  },
  // ownerOf(uint256 tokenId)
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ type: "uint256", name: "tokenId" }],
    outputs: [{ type: "address" }],
  },
];

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

async function resolveName(usernameRaw) {
  const client = getClient();
  const username = String(usernameRaw || "").trim();
  if (!username) throw new Error("Missing username");

  // 👉 namespace must be "sv"
  const tokenId = await client.readContract({
    address: XAYA_ACCOUNTS,
    abi: XAYA_ABI,
    functionName: "tokenIdForName",
    args: ["sv", username], // <<<<<< CORRECT SIGNATURE
  });

  // if no registration, tokenId is still a valid uint256; we need to check owner
  const wallet = await client.readContract({
    address: XAYA_ACCOUNTS,
    abi: XAYA_ABI,
    functionName: "ownerOf",
    args: [tokenId],
  });

  return { username, tokenId: tokenId.toString(), wallet };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || searchParams.get("name");
    const result = await resolveName(username);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "resolve_wallet failed" }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await resolveName(body?.username ?? body?.name);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "resolve_wallet failed" }, { status: 400 });
  }
}
