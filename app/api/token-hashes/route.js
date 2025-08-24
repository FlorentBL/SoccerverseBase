import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Par défaut: USDC (native) + USDC.e (tu peux changer via ?contracts=...)
const DEFAULT_CONTRACTS = [
  "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // USDC (native)
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC.e (bridged)
].map((x) => x.toLowerCase());

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";
const CHAIN_ID = "137"; // Polygon PoS

function getApiKey(reqUrl) {
  const url = new URL(reqUrl);
  return (
    url.searchParams.get("apikey") ||
    process.env.ETHERSCAN_API_KEY ||
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    ""
  );
}

// — Etherscan v2: account.tokentx (1 page) —
async function fetchTokenTxPageV2({ address, page, offset, sort, contract, apikey }) {
  const url = new URL(ETHERSCAN_V2);
  url.searchParams.set("chainid", CHAIN_ID);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "tokentx");
  url.searchParams.set("address", address);
  if (contract) url.searchParams.set("contractaddress", contract);
  url.searchParams.set("page", String(page));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("sort", sort);
  url.searchParams.set("apikey", apikey);

  const r = await fetch(url, { cache: "no-store" });
  let body = null;
  try { body = await r.json(); } catch { /* ignore */ }

  // Cas normal
  if (body && body.status === "1" && Array.isArray(body.result)) {
    return { ok: true, items: body.result, url: url.toString() };
  }

  // Cas "No transactions found" => succès vide (ne pas bloquer l’agrégation)
  const msg = (body?.message || "").toLowerCase();
  if (msg.includes("no transactions found")) {
    return { ok: true, items: [], url: url.toString(), note: "empty" };
  }

  // Autres erreurs (rate limit, invalid key, etc.)
  const resultString = typeof body?.result === "string" ? body.result : null;
  return { ok: false, error: body?.message || "NOTOK", resultString, items: [], url: url.toString() };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });
    }

    const pages = Math.max(1, Math.min(10, parseInt(url.searchParams.get("pages") || "3", 10)));
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "100", 10)));
    const sort = (url.searchParams.get("sort") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const apikey = getApiKey(req.url);
    if (!apikey) {
      return NextResponse.json({ ok: false, error: "API key manquante (?apikey=... ou ETHERSCAN_API_KEY)" }, { status: 400 });
    }

    // Contrats: "contracts=all" | liste séparée par virgules | défaut = USDC+USDC.e
    const contractsParam = (url.searchParams.get("contracts") || "").trim();
    let contracts = DEFAULT_CONTRACTS;
    if (contractsParam) {
      if (contractsParam.toLowerCase() === "all") {
        contracts = [null]; // null => pas de filtre contrat
      } else {
        contracts = contractsParam
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => /^0x[0-9a-fA-F]{40}$/.test(s));
        if (contracts.length === 0) contracts = DEFAULT_CONTRACTS;
      }
    }

    const seen = new Set();
    const hashes = [];
    const debug = [];

    for (const contract of contracts) {
      for (let p = 1; p <= pages; p++) {
        const res = await fetchTokenTxPageV2({
          address: wallet,
          page: p,
          offset: pageSize,
          sort,
          contract,
          apikey,
        });

        debug.push({
          contract: contract || "ALL",
          page: p,
          ok: res.ok,
          error: res.ok ? undefined : res.error,
          resultString: res.ok ? undefined : res.resultString,
          url: res.url,
          fetched: res.items.length,
        });

        if (!res.ok) {
          // erreur “forte” → on renvoie l’info debug telle quelle
          return NextResponse.json({ ok: false, error: res.resultString || res.error, debug }, { status: 502 });
        }

        for (const it of res.items) {
          const h = (it.hash || it.transactionHash || "").toLowerCase();
          if (h && !seen.has(h)) {
            seen.add(h);
            hashes.push(h);
          }
        }

        if (res.items.length < pageSize) break; // fin pagination pour ce contrat
      }
    }

    return NextResponse.json({
      ok: true,
      wallet,
      count: hashes.length,
      hashes,
      debug,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
