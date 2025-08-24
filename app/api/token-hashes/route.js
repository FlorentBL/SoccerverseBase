import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getKey = () =>
  process.env.POLYGONSCAN_API_KEY ||
  process.env.POLYGONSCAN_KEY ||
  process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
  "";

async function fetchTokenTxPage(addr, page, pageSize, sort, apiKey, withBlocks = false) {
  const url = new URL("https://api.polygonscan.com/api");
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "tokentx");
  url.searchParams.set("address", addr);
  url.searchParams.set("page", String(page));
  url.searchParams.set("offset", String(pageSize));
  url.searchParams.set("sort", sort);
  if (withBlocks) {
    // certains comptes clés exigent des bornes explicites
    url.searchParams.set("startblock", "0");
    url.searchParams.set("endblock", "99999999");
  }
  url.searchParams.set("apikey", apiKey);

  const r = await fetch(url, { cache: "no-store" });
  const status = r.status;
  let body;
  try { body = await r.json(); } catch { body = null; }
  return { status, url: url.toString(), body };
}

export async function GET(req) {
  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
  const pages = Math.max(1, Math.min(10, parseInt(url.searchParams.get("pages") || "3", 10)));
  const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "100", 10)));
  const sort = (url.searchParams.get("sort") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet))
    return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });

  const apiKey = getKey();
  if (!apiKey)
    return NextResponse.json({ ok: false, error: "POLYGONSCAN_API_KEY manquante" }, { status: 400 });

  const seen = new Set();
  const hashes = [];
  const debug = [];

  for (let p = 1; p <= pages; p++) {
    let res = await fetchTokenTxPage(wallet, p, pageSize, sort, apiKey, false);
    debug.push({
      page: p,
      status: res.status,
      apiStatus: res.body?.status,
      apiMessage: res.body?.message,
      fetched: Array.isArray(res.body?.result) ? res.body.result.length : null,
    });

    let arr = Array.isArray(res.body?.result) ? res.body.result : [];

    // si première page vide, on retente avec bornes explicites (certains plans l’exigent)
    if (arr.length === 0 && p === 1) {
      const retry = await fetchTokenTxPage(wallet, p, pageSize, sort, apiKey, true);
      debug[debug.length - 1].retryWithBlocks = {
        status: retry.status,
        apiStatus: retry.body?.status,
        apiMessage: retry.body?.message,
        fetched: Array.isArray(retry.body?.result) ? retry.body.result.length : null,
      };
      arr = Array.isArray(retry.body?.result) ? retry.body.result : [];
    }

    for (const x of arr) {
      const h = x.hash || x.transactionHash;
      if (h && !seen.has(h)) {
        seen.add(h);
        hashes.push(h);
      }
    }

    if (arr.length < pageSize) break; // dernière page
  }

  return NextResponse.json({
    ok: true,
    wallet,
    count: hashes.length,
    hashes,
    debug,
  });
}
