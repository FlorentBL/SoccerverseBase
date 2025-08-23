import { NextResponse } from "next/server";

// ⚠️ On prend la clé depuis l'env
const API_KEY = process.env.POLYGONSCAN_API_KEY;
const BASE_URL = "https://api.polygonscan.com/api";

export async function POST(req) {
  try {
    const { wallet, startBlock = 0 } = await req.json();

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "wallet manquant" }, { status: 400 });
    }

    // Requête Polygonscan : toutes les tx USDC du wallet
    const url = `${BASE_URL}?module=account&action=tokentx&address=${wallet}&contractaddress=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${API_KEY}`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || !data?.result) {
      return NextResponse.json({ ok: false, error: data?.message || "Erreur Polygonscan" }, { status: 500 });
    }

    // On extrait juste les paiements sortants (to = contrat shop ? ou tous)
    const txs = (data.result || []).filter(tx => tx.from?.toLowerCase() === wallet.toLowerCase());

    // Simplification pour debug
    const simplified = txs.map(tx => ({
      hash: tx.hash,
      block: tx.blockNumber,
      time: Number(tx.timeStamp) * 1000,
      from: tx.from,
      to: tx.to,
      amountUSDC: Number(tx.value) / 1e6,
    }));

    return NextResponse.json({ ok: true, wallet, count: simplified.length, txs: simplified });

  } catch (e) {
    console.error("history_onchain error", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
