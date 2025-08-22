// app/api/resolve_wallet/route.js
import { NextResponse } from "next/server";
import { readContract } from "../../../lib/polygon";
import {
  XAYA_ACCOUNTS_ABI,
  XAYA_ACCOUNTS_ADDRESS,
} from "../../../lib/abis/xayaAccounts";

async function loadLocalOverrides() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/user_wallets.json`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function POST(req) {
  try {
    const { name, username } = await req.json();
    const user = (name || username || "").trim();
    if (!user) {
      return NextResponse.json({ error: "Missing 'name' or 'username'" }, { status: 400 });
    }

    // 1) Fallback manuel (public/user_wallets.json)
    const overrides = await loadLocalOverrides();
    const ov = overrides[user];
    if (ov && typeof ov === "string" && ov.startsWith("0x") && ov.length === 42) {
      return NextResponse.json({ name: user, wallet: ov, source: "local" });
    }

    // 2) Contrat XayaAccounts → tokenIdForName → ownerOf
    const tokenId = await readContract(
      XAYA_ACCOUNTS_ADDRESS,
      XAYA_ACCOUNTS_ABI,
      "tokenIdForName",
      [user]
    );

    // Si le nom n'existe pas, ownerOf peut revert → on essaie/attrape
    let owner;
    try {
      owner = await readContract(
        XAYA_ACCOUNTS_ADDRESS,
        XAYA_ACCOUNTS_ABI,
        "ownerOf",
        [tokenId]
      );
    } catch (e) {
      return NextResponse.json(
        { name: user, wallet: null, source: "onchain", error: "Name not registered" },
        { status: 404 }
      );
    }

    return NextResponse.json({ name: user, wallet: owner, source: "onchain" });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
