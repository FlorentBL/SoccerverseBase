// app/api/packs/by-wallet/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ──────────────────────────────────────────────────────────────────────────
   CONFIG
────────────────────────────────────────────────────────────────────────── */
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

// USDC "native" sur Polygon (Circle) — 6 décimales
// (On ajoute le bridged en option côté query si besoin)
const USDC_NATIVE_POLYGON = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359".toLowerCase();

// Règles d’un pack
const SHARES_PER_PACK_MAIN = 40;
const SHARES_PER_PACK_SEC = 10;
const INFLUENCE_MAIN_PER_PACK = 40;
const INFLUENCE_SEC_PER_PACK = 10;

/* ──────────────────────────────────────────────────────────────────────────
   Helpers bas niveau
────────────────────────────────────────────────────────────────────────── */
async function rpc(method, params) {
  const r = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`RPC HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}

function hexToBytes(hex) {
  const clean = hex?.startsWith("0x") ? hex.slice(2) : hex || "";
  if (clean.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function bytesToUtf8OrNull(bytes) {
  try {
    const txt = new TextDecoder().decode(bytes);
    return /[{}\[\]":,a-z0-9\s._-]/i.test(txt) ? txt.replace(/\u0000/g, "") : null;
  } catch { return null; }
}
function tryParseJsonLoose(str) {
  if (!str) return null;
  try { return JSON.parse(str); }
  catch {
    const m = str.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}
function hexToBigInt(h) { try { return h ? BigInt(h) : 0n; } catch { return 0n; } }
function hexToAddress(h) { return "0x" + (h?.slice(26) || "").toLowerCase(); }

/* ──────────────────────────────────────────────────────────────────────────
   Topics / décodage ERC
────────────────────────────────────────────────────────────────────────── */
const TOPIC_TRANSFER_ERC20_721 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TOPIC_TRANSFER_SINGLE_1155 =
  "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";

function decodeTransferERC20_721(log) {
  if ((log.topics?.[0] || "").toLowerCase() !== TOPIC_TRANSFER_ERC20_721) return null;
  const from = hexToAddress(log.topics[1]);
  const to = hexToAddress(log.topics[2]);
  const amountOrId = hexToBigInt(log.data).toString();
  return {
    standard: "ERC20/721",
    contract: (log.address || "").toLowerCase(),
    from, to, amountOrId,
    logIndex: parseInt(log.logIndex, 16),
  };
}
function decodeTransferSingle1155(log) {
  if ((log.topics?.[0] || "").toLowerCase() !== TOPIC_TRANSFER_SINGLE_1155) return null;
  const data = hexToBytes(log.data);
  if (data.length < 64) return null;
  const idHex = "0x" + Buffer.from(data.slice(0, 32)).toString("hex");
  const valueHex = "0x" + Buffer.from(data.slice(32, 64)).toString("hex");
  return {
    standard: "ERC1155_SINGLE",
    contract: (log.address || "").toLowerCase(),
    operator: hexToAddress(log.topics[1]),
    from: hexToAddress(log.topics[2]),
    to: hexToAddress(log.topics[3]),
    id: BigInt(idHex).toString(),
    value: BigInt(valueHex).toString(),
    logIndex: parseInt(log.logIndex, 16),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Extraction heuristique des JSON dans logs / input
────────────────────────────────────────────────────────────────────────── */
function extractAbiLikeStringsFromLogData(logDataHex) {
  const bytes = hexToBytes(logDataHex);
  const res = [];
  const WORD = 32;
  if (bytes.length < WORD) return res;

  for (let base = 0; base + WORD <= bytes.length; base += WORD) {
    const offHex = Buffer.from(bytes.slice(base, base + WORD)).toString("hex");
    let off; try { off = Number(BigInt("0x" + offHex)); } catch { continue; }
    if (!Number.isFinite(off) || off < WORD || off > bytes.length - WORD) continue;

    const lenPos = off;
    if (lenPos + WORD > bytes.length) continue;
    const lenHex = Buffer.from(bytes.slice(lenPos, lenPos + WORD)).toString("hex");
    let len; try { len = Number(BigInt("0x" + lenHex)); } catch { continue; }
    if (!Number.isFinite(len) || len <= 0 || len > 100_000) continue;

    const dataStart = lenPos + WORD;
    const dataEnd = dataStart + len;
    if (dataEnd > bytes.length) continue;

    const candidate = bytes.slice(dataStart, dataEnd);
    const txt = bytesToUtf8OrNull(candidate);
    if (!txt) continue;

    const json = tryParseJsonLoose(txt);
    res.push({ txt, json, offsetWordIndex: base / WORD, offset: off, length: len });
  }
  return res;
}
function extractJsonFromInput(inputHex) {
  const raw = bytesToUtf8OrNull(hexToBytes(inputHex));
  const json = tryParseJsonLoose(raw || "");
  return json ? [{ source: "tx.input", raw, json }] : [];
}

/* ──────────────────────────────────────────────────────────────────────────
   Pack summary + enrichissement (prix/pack dynamique)
────────────────────────────────────────────────────────────────────────── */
function normalizeUSDC(valueStr) {
  try { return Number(BigInt(valueStr)) / 1e6; } catch { return 0; }
}

function buildPackSummary({ jsonCandidates, transfers, buyerWallet }) {
  const shares = [];
  const clubSmc = [];
  for (const c of jsonCandidates) {
    const j = c.json;
    if (j?.cmd?.mint?.shares) {
      const s = j.cmd.mint.shares;
      const clubId = s?.s?.club ?? s?.club ?? null;
      const n = s?.n ?? null;
      const r = s?.r ?? j?.r ?? null;
      if (clubId && n) shares.push({ clubId, n, r, fromLog: c.source, contract: c.contract });
    }
    if (j?.cmd?.mint?.clubsmc) {
      const m = j.cmd.mint.clubsmc;
      if (m?.c && m?.n) clubSmc.push({ clubId: m.c, n: m.n, fromLog: c.source, contract: c.contract });
    }
  }
  if (!shares.length) return null;

  const main = shares.reduce((a, b) => (b.n > (a?.n ?? 0) ? b : a), null);
  const secondaries = shares.filter((s) => s !== main);
  const smcForMain = clubSmc.find((x) => x.clubId === main?.clubId) || null;

  // Prix total = plus gros transfert USDC sortant de la tx
  let priceUSDC = null, feeUSDC = 0;
  if (buyerWallet) {
    const w = buyerWallet.toLowerCase();
    const usdcTransfers = transfers.filter(
      (t) => t.standard === "ERC20/721"
        && (t.contract || "") === USDC_NATIVE_POLYGON
        && (t.from || "").toLowerCase() === w
    );
    if (usdcTransfers.length) {
      const amounts = usdcTransfers.map((t) => normalizeUSDC(t.amountOrId)).sort((a, b) => b - a);
      priceUSDC = amounts[0] ?? null;
      feeUSDC = amounts.slice(1).reduce((s, x) => s + x, 0);
    }
  }

  return {
    buyer: buyerWallet || null,
    priceUSDC,
    extraFeesUSDC: feeUSDC || 0,
    shares: {
      mainClub: main ? { clubId: main.clubId, amount: main.n, handle: main.r || null } : null,
      secondaryClubs: secondaries.map((s) => ({ clubId: s.clubId, amount: s.n })),
      totalShares: shares.reduce((s, x) => s + (x.n || 0), 0),
    },
    clubsmc: smcForMain,
    isConsistent: Boolean(main && smcForMain && smcForMain.clubId === main.clubId),
  };
}

function enrichPackWithInfluenceAndUnitPrice(pack) {
  if (!pack?.shares?.mainClub) return pack;

  const mainShares = Number(pack.shares.mainClub.amount || 0);
  const packs = Math.floor(mainShares / SHARES_PER_PACK_MAIN);
  const mainModulo = mainShares % SHARES_PER_PACK_MAIN;

  const pricePerPack = packs > 0 && typeof pack.priceUSDC === "number" ? pack.priceUSDC / packs : null;
  const mainInfluence = packs * INFLUENCE_MAIN_PER_PACK;

  const secondaries = (pack.shares.secondaryClubs || []).map((s) => {
    const secShares = Number(s.amount || 0);
    const packsSec = Math.floor(secShares / SHARES_PER_PACK_SEC);
    const secModulo = secShares % SHARES_PER_PACK_SEC;
    const secInfluence = packsSec * INFLUENCE_SEC_PER_PACK;
    return { ...s, packsFromShares: packsSec, sharesModulo: secModulo, influence: secInfluence };
  });

  const totalSecondaryInfluence = secondaries.reduce((acc, x) => acc + (x.influence || 0), 0);
  const totalInfluence = mainInfluence + totalSecondaryInfluence;

  return {
    ...pack,
    packs,
    unitPriceUSDC: pricePerPack,
    validation: {
      mainSharesModulo: mainModulo,
      secondariesHaveModuloZero: secondaries.every((x) => x.sharesModulo === 0),
    },
    influence: { main: mainInfluence, secondary: totalSecondaryInfluence, total: totalInfluence },
    shares: { ...pack.shares, secondaryClubs: secondaries },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Etherscan v2 — pagination pour récupérer les tx hashes USDC sortantes
   Docs: https://docs.etherscan.io/etherscan-v2/api-endpoints/accounts
   NB: la clé Etherscan fonctionne cross-chain (chainid=137 pour Polygon)
────────────────────────────────────────────────────────────────────────── */
function getApiKeyFromReqOrEnv(reqUrl) {
  const u = new URL(reqUrl);
  const q = u.searchParams.get("apikey") || u.searchParams.get("apiKey");
  return (
    q ||
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    ""
  );
}

async function fetchTokenTxHashesEtherscan({
  wallet,
  contracts,
  pageSize = 100,
  pages = 3,
  apikey,
}) {
  const base = "https://api.etherscan.io/v2/api";
  const out = new Set();
  const debug = [];
  const addr = wallet.toLowerCase();

  for (const contract of contracts) {
    for (let p = 1; p <= pages; p++) {
      const url = new URL(base);
      url.searchParams.set("chainid", "137");
      url.searchParams.set("module", "account");
      url.searchParams.set("action", "tokentx");
      url.searchParams.set("address", wallet);
      url.searchParams.set("contractaddress", contract);
      url.searchParams.set("page", String(p));
      url.searchParams.set("offset", String(pageSize));
      url.searchParams.set("startblock", "0");
      url.searchParams.set("endblock", "99999999");
      url.searchParams.set("sort", "desc");
      if (apikey) url.searchParams.set("apikey", apikey);

      const r = await fetch(url, { cache: "no-store" });
      const ok = r.ok;
      let j = null;
      try { j = await r.json(); } catch {}

      const res = Array.isArray(j?.result) ? j.result : [];
      let fetched = 0;
      for (const it of res) {
        if ((it.from || "").toLowerCase() !== addr) continue; // sortant seulement
        if (it.hash) { out.add(it.hash); fetched++; }
      }

      debug.push({
        contract, page: p, ok,
        url: url.toString(),
        fetched: res.length,
        keptOutgoing: fetched,
        status: j?.status, message: j?.message,
      });

      // S'il reste moins que pageSize, page suivante sera vide — on peut sortir
      if (res.length < pageSize) break;
    }
  }

  return { hashes: Array.from(out), debug };
}

/* ──────────────────────────────────────────────────────────────────────────
   Analyse d’une transaction (logs + json embedded)
────────────────────────────────────────────────────────────────────────── */
async function analyzeTx(txHash, buyerWallet) {
  const [receipt, tx] = await Promise.all([
    rpc("eth_getTransactionReceipt", [txHash]),
    rpc("eth_getTransactionByHash", [txHash]),
  ]);

  const transfers = [];
  for (const log of receipt?.logs || []) {
    const t20 = decodeTransferERC20_721(log); if (t20) { transfers.push(t20); continue; }
    const t1155 = decodeTransferSingle1155(log); if (t1155) { transfers.push(t1155); continue; }
  }

  const jsonCandidates = [];
  for (const [i, log] of (receipt?.logs || []).entries()) {
    if (!log?.data || log.data === "0x") continue;
    const found = extractAbiLikeStringsFromLogData(log.data);
    for (const f of found) {
      jsonCandidates.push({
        source: `log[${i}].data`,
        contract: (log.address || "").toLowerCase(),
        logIndex: parseInt(log.logIndex, 16),
        text: f.txt,
        json: f.json || null,
      });
    }
  }

  const inputJsons = tx?.input ? extractJsonFromInput(tx.input) : [];
  const interesting = [...jsonCandidates, ...inputJsons].filter(
    (e) => e.json && (e.json.mv || (e.json.cmd && typeof e.json.cmd === "object") || (e.json.mint && typeof e.json.mint === "object"))
  );

  const packSummaryRaw = buildPackSummary({ jsonCandidates: interesting, transfers, buyerWallet });
  const packSummary = packSummaryRaw ? enrichPackWithInfluenceAndUnitPrice(packSummaryRaw) : null;

  return {
    txHash,
    blockNumber: receipt?.blockNumber ? parseInt(receipt.blockNumber, 16) : null,
    status: receipt?.status === "0x1" ? "success" : "failed",
    packSummary,
  };
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break;
      try { results[idx] = await fn(items[idx], idx); }
      catch (e) { results[idx] = { error: e.message || String(e) }; }
    }
  });
  await Promise.all(workers);
  return results;
}

/* ──────────────────────────────────────────────────────────────────────────
   Handler
────────────────────────────────────────────────────────────────────────── */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
    const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") || "80", 10)));
    const pages = Math.max(1, Math.min(25, parseInt(url.searchParams.get("pages") || "3", 10)));
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "100", 10)));

    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ ok: false, error: "wallet invalide" }, { status: 400 });
    }

    const apikey = getApiKeyFromReqOrEnv(req.url);
    if (!apikey) {
      return NextResponse.json({ ok: false, error: "API key manquante (Etherscan v2). Ajoute ?apikey=... ou POLYGONSCAN_API_KEY." }, { status: 400 });
    }

    // Liste des contrats à scanner — par défaut USDC native.
    const contractsParam = (url.searchParams.get("contracts") || "").toLowerCase();
    const contracts = new Set([USDC_NATIVE_POLYGON]);
    if (contractsParam) {
      for (const c of contractsParam.split(",").map(s => s.trim()).filter(Boolean)) contracts.add(c);
    }

    // 1) Découverte des candidates via Etherscan v2 avec pagination
    const { hashes, debug: tokenDebug } = await fetchTokenTxHashesEtherscan({
      wallet,
      contracts: Array.from(contracts),
      pageSize,
      pages,
      apikey,
    });

    const candidates = hashes.slice(0, limit).map(h => ({ txHash: h }));

    // 2) Analyse pack tx par tx (concurrence 4)
    const analyzed = await mapWithConcurrency(candidates, 4, async (c) => {
      const r = await analyzeTx(c.txHash, wallet);
      return { ...c, ...r };
    });

    // 3) Packs détectés
    const items = analyzed
      .filter((x) => x.packSummary && x.packSummary.packs > 0 && x.status === "success")
      .map((x) => ({
        txHash: x.txHash,
        blockNumber: x.blockNumber,
        packs: x.packSummary.packs,
        priceUSDC: x.packSummary.priceUSDC,
        unitPriceUSDC: x.packSummary.unitPriceUSDC,
        feesUSDC: x.packSummary.extraFeesUSDC || 0,
        influenceTotal: x.packSummary.influence?.total || 0,
        mainClub: x.packSummary.shares?.mainClub?.clubId || null,
        secondariesCount: x.packSummary.shares?.secondaryClubs?.length || 0,
        details: x.packSummary,
      }));

    // 4) Agrégats
    const totalPacks = items.reduce((s, it) => s + (it.packs || 0), 0);
    const totalUSDC = items.reduce((s, it) => s + (it.priceUSDC || 0), 0);
    const totalInfluence = items.reduce((s, it) => s + (it.influenceTotal || 0), 0);
    const unitPriceAvg = totalPacks > 0 ? totalUSDC / totalPacks : null;

    return NextResponse.json({
      ok: true,
      wallet,
      scans: {
        source: "etherscan-v2",
        candidates: candidates.length,
        analyzed: analyzed.length,
        packsDetected: items.length,
        debug: {
          apikeyProvided: Boolean(apikey),
          pageSize,
          pagesRequested: pages,
          tokenTx: tokenDebug,
        },
      },
      totals: {
        packs: totalPacks,
        spentUSDC: totalUSDC,
        unitPriceAvgUSDC: unitPriceAvg,
        influence: totalInfluence,
      },
      items,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
