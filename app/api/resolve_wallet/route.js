import { NextResponse } from "next/server";
import { readContract } from "@/lib/polygon";
import { XAYA_ACCOUNTS } from "@/lib/contracts";
import { XAYA_ACCOUNTS_ABI } from "@/lib/abis";

export async function POST(req) {
  try {
    const { name } = await req.json().catch(() => ({}));
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    const tokenId = await readContract(
      XAYA_ACCOUNTS,
      XAYA_ACCOUNTS_ABI,
      "tokenIdForName",
      [name]
    ).catch(() => 0n);

    if (!tokenId || tokenId === 0n) {
      return NextResponse.json({ wallet: null });
    }

    const owner = await readContract(
      XAYA_ACCOUNTS,
      XAYA_ACCOUNTS_ABI,
      "ownerOf",
      [tokenId]
    ).catch(() => null);

    return NextResponse.json({ wallet: owner });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
