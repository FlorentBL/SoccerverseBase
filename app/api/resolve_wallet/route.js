// app/api/resolve_wallet/route.js
import { NextResponse } from "next/server";
import { client } from "@/lib/polygon";
import { XAYA_ACCOUNTS, XAYA_ABI } from "@/lib/contracts";

async function resolveOnChain(name) {
  // Essaie plusieurs variantes : "klo", "sv:klo", "g/sv:klo"
  const candidates = [name, `sv:${name}`, `g/sv:${name}`];

  for (const n of candidates) {
    try {
      const tokenId = await client.readContract({
        address: XAYA_ACCOUNTS,
        abi: XAYA_ABI,
        functionName: "tokenIdForName",
        args: [n],
      });
      // Si pas minté, ownerOf revert — on catch et on continue
      const owner = await client.readContract({
        address: XAYA_ACCOUNTS,
        abi: XAYA_ABI,
        functionName: "ownerOf",
        args: [tokenId],
      });
      return { username: name, formatted: n, wallet: owner };
    } catch {
      // continue
    }
  }
  return null;
}

async function resolveFromLocal(name) {
  try {
    const res = await fetch(new URL("/user_wallets.json", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"));
    const map = await res.json();
    const w = map?.[name];
    if (typeof w === "string" && w.startsWith("0x") && w.length === 42) {
      return { username: name, formatted: null, wallet: w, from: "local" };
    }
  } catch {}
  return null;
}

async function handle(name) {
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
  }
  const onchain = await resolveOnChain(name);
  if (onchain) return NextResponse.json(onchain);
  const local = await resolveFromLocal(name);
  if (local) return NextResponse.json(local);
  return NextResponse.json({ error: "Wallet introuvable pour cet utilisateur" }, { status: 404 });
}

export async function GET(req) {
  const name = new URL(req.url).searchParams.get("name");
  return handle(name?.trim());
}

export async function POST(req) {
  const { name } = await req.json().catch(() => ({}));
  return handle((name || "").trim());
}
