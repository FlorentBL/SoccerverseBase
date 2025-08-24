import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ───────────────────────────────────────────────────────────────────────────────
// ENV
const getKey = () =>
  process.env.POLYGONSCAN_API_KEY ||
  process.env.POLYGONSCAN_KEY ||
  process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
  "";

// ───────────────────────────────────────────────────────────────────────────────
// Polygonscan API: account.tokentx (1 page)
async function fetchTokenTxPage(addr, page, pageSize, sort, apiKey, withBlocks = false) {
  const url = new URL("https://api.polygonscan.com/api");
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "tokentx");
  url.searchParams.set("address", addr);
  url.searchParams.set("page", String(page));
  url.searchParams.set("offset", String(pageSize));
  url.searchParams.set("sort", sort);
  if (withBlocks) {
    url.searchParams.set("startblock", "0");
    url.searchParams.set("endblock", "99999999");
  }
  url.searchParams.set("apikey", apiKey);

  const r = await fetch(url, { cache: "no-store" });
  let body;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, url: url.toString(), body };
}

// ───────────────────────────────────────────────────────────────────────────────
// Fallback HTML scraper: /tokentxns?a=...&ps=100&p=...
async function scrapeTokenTxPage(addr, page, pageSize) {
  const url = new URL("https://polygonscan.com/tokentxns");
  url.searchParams.set("a", addr);
  url.searchParams.set("ps", String(pageSize));
  url.searchParams.set("p", String(page));
  const r = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      // Petit UA pour éviter les blocages les plus basiques
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.8,fr;q=0.6",
    },
  });
  const html = await r.text();
  // Extraction très robuste des liens /tx/0x...
  const re = /\/tx\/(0x[a-fA-F0-9]{64})/g;
  const hashes = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const h = m[1].toLowerCase();
    if (!seen.has(h)) {
      seen.add(h);
      hashes.push(h);
    }
  }
  return { url: url.toString(), count: hashes.length, hashes };
}

// ───────────────────────────────────────────────────────────────────────────────
// Handler
export async function GET(req) {
  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
  const pages = Math.max(1, Math.min(10, parseInt(url.searchParams.get("pages") || "3", 10)));
  const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "100", 10)));
  const sort = (url.searchParams.get("sort") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const prefer = (url.searchParams.get("prefer") || "api").toLowerCase(); // api|html

  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });
  }

  const apiKey = getKey();
  const debug = [];
  const seen = new Set();
  const hashes = [];

  // Choix: on tente d'abord l'API, puis fallback HTML si NOTOK ou vide
  const doApi = prefer !== "html" && !!apiKey;

  try {
    if (doApi) {
      for (let p = 1; p <= pages; p++) {
        let res = await fetchTokenTxPage(wallet, p, pageSize, sort, apiKey, false);
        const apiResultStr =
          typeof res.body?.result === "string" ? res.body.result : null;
        let arr = Array.isArray(res.body?.result) ? res.body.result : [];

        const pageDebug = {
          page: p,
          apiStatus: res.body?.status,
          apiMessage: res.body?.message,
          apiResult: apiResultStr, // ex: "Max rate limit reached" / "Invalid API Key"
          fetched: Array.isArray(res.body?.result) ? res.body.result.length : null,
        };

        // Si 1ère page vide/NOTOK → retente avec bornes explicites (certains comptes l’exigent)
        if ((res.body?.status !== "1" || arr.length === 0) && p === 1) {
          const retry = await fetchTokenTxPage(wallet, p, pageSize, sort, apiKey, true);
          const retryResultStr =
            typeof retry.body?.result === "string" ? retry.body.result : null;
          pageDebug.retryWithBlocks = {
            apiStatus: retry.body?.status,
            apiMessage: retry.body?.message,
            apiResult: retryResultStr,
            fetched: Array.isArray(retry.body?.result) ? retry.body.result.length : null,
          };
          if (Array.isArray(retry.body?.result)) arr = retry.body.result;
        }

        debug.push(pageDebug);

        for (const x of arr) {
          const h = (x.hash || x.transactionHash || "").toLowerCase();
          if (h && !seen.has(h)) {
            seen.add(h);
            hashes.push(h);
          }
        }

        if (arr.length < pageSize) break; // dernière page
      }
    }
  } catch (e) {
    debug.push({ apiError: String(e?.message || e) });
  }

  // Fallback HTML si rien trouvé via API (NOTOK, quota, invalid key, etc.) ou si prefer=html
  const usedFallback = hashes.length === 0;
  if (usedFallback || prefer === "html") {
    const htmlInfo = [];
    for (let p = 1; p <= pages; p++) {
      try {
        const { url: pageUrl, count, hashes: list } = await scrapeTokenTxPage(wallet, p, pageSize);
        htmlInfo.push({ page: p, pageUrl, count });
        for (const h of list) if (!seen.has(h)) { seen.add(h); hashes.push(h); }
        if (count < pageSize) break; // probablement la dernière page
      } catch (e) {
        htmlInfo.push({ page: p, error: String(e?.message || e) });
        break;
      }
    }
    debug.push({ htmlFallback: htmlInfo });
  }

  return NextResponse.json({
    ok: true,
    wallet,
    count: hashes.length,
    hashes,
    debug,
    usedFallback,
  });
}
