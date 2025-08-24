// app/api/tx/[hash]/route.js
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────────────────────────────────────
// CONFIG
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const USDC_CONTRACT = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359".toLowerCase();

// Packs / Influence
const PACK_MAIN_SHARES = 10000;
const PACK_SECONDARY_SHARES = 2500;
const INFLUENCE_MAIN_PER_PACK = 40;
const INFLUENCE_SEC_PER_PACK = 10;

// ───────────────────────────────────────────────────────────────────────────────
// Low-level helpers
async function rpc(method, params) {
  const r = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    // Next 14: pas de cache pour des receipts fraiches
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
  } catch {
    return null;
  }
}
function tryParseJsonLoose(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    const m = str.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}
function hexToBigInt(h) { try { return h ? BigInt(h) : 0n; } catch { return 0n; } }
function hexToAddress(h) { return "0x" + (h?.slice(26) || "").toLowerCase(); }

// ───────────────────────────────────────────────────────────────────────────────
// ERC events decoding (standards)
const TOPIC_TRANSFER_ERC20_721 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // Transfer(address,address,uint256)
const TOPIC_TRANSFER_SINGLE_1155 =
  "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"; // TransferSingle(address,address,address,uint256,uint256)

// ERC20/721: topics[1]=from, topics[2]=to, data=tokenId/value
function decodeTransferERC20_721(log) {
  if (log.topics?.[0]?.toLowerCase() !== TOPIC_TRANSFER_ERC20_721) return null;
  const from = hexToAddress(log.topics[1]);
  const to = hexToAddress(log.topics[2]);
  const amountOrId = hexToBigInt(log.data).toString(); // string pour JSON
  return {
    standard: "ERC20/721",
    contract: log.address?.toLowerCase(),
    from,
    to,
    amountOrId,
    logIndex: parseInt(log.logIndex, 16),
  };
}

// ERC1155 TransferSingle: data contient id (32B) + value (32B)
function decodeTransferSingle1155(log) {
  if (log.topics?.[0]?.toLowerCase() !== TOPIC_TRANSFER_SINGLE_1155) return null;
  const data = hexToBytes(log.data);
  if (data.length < 64) return null;
  const idHex = "0x" + Buffer.from(data.slice(0, 32)).toString("hex");
  const valueHex = "0x" + Buffer.from(data.slice(32, 64)).toString("hex");
  return {
    standard: "ERC1155_SINGLE",
    contract: log.address?.toLowerCase(),
    operator: hexToAddress(log.topics[1]),
    from: hexToAddress(log.topics[2]),
    to: hexToAddress(log.topics[3]),
    id: BigInt(idHex).toString(),
    value: BigInt(valueHex).toString(),
    logIndex: parseInt(log.logIndex, 16),
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Extraction heuristique de strings/JSON ABI-like dans log.data
function extractAbiLikeStringsFromLogData(logDataHex) {
  const bytes = hexToBytes(logDataHex);
  const res = [];
  const WORD = 32;
  if (bytes.length < WORD) return res;

  for (let base = 0; base + WORD <= bytes.length; base += WORD) {
    const offHex = Buffer.from(bytes.slice(base, base + WORD)).toString("hex");
    const off = Number(BigInt("0x" + offHex));
    if (!Number.isFinite(off)) continue;
    if (off < WORD || off > bytes.length - WORD) continue;

    const lenPos = off;
    if (lenPos + WORD > bytes.length) continue;
    const lenHex = Buffer.from(bytes.slice(lenPos, lenPos + WORD)).toString("hex");
    const len = Number(BigInt("0x" + lenHex));
    if (!Number.isFinite(len)) continue;
    if (len <= 0 || len > 100_000) continue;

    const dataStart = lenPos + WORD;
    const dataEnd = dataStart + len;
    if (dataEnd > bytes.length) continue;

    const candidate = bytes.slice(dataStart, dataEnd);
    const txt = bytesToUtf8OrNull(candidate);
    if (!txt) continue;

    const json = tryParseJsonLoose(txt);
    res.push({
      txt,
      json,
      offsetWordIndex: base / WORD,
      offset: off,
      length: len,
    });
  }
  return res;
}

function extractJsonFromInput(inputHex) {
  const raw = bytesToUtf8OrNull(hexToBytes(inputHex));
  const json = tryParseJsonLoose(raw || "");
  return json ? [{ source: "tx.input", raw, json }] : [];
}

// ───────────────────────────────────────────────────────────────────────────────
// Pack summary builders
function normalizeUSDC(valueStr) {
  // USDC: 6 décimales
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

  // principal = n max
  const main = shares.reduce((a, b) => (b.n > (a?.n ?? 0) ? b : a), null);
  const secondaries = shares.filter((s) => s !== main);
  const smcForMain = clubSmc.find((x) => x.clubId === main?.clubId) || null;

  let priceUSDC = null;
  let feeUSDC = 0;
  if (buyerWallet) {
    const w = buyerWallet.toLowerCase();
    const usdcTransfers = transfers.filter(
      (t) =>
        t.standard === "ERC20/721" &&
        (t.contract || "") === USDC_CONTRACT &&
        (t.from || "").toLowerCase() === w
    );
    if (usdcTransfers.length) {
      const amounts = usdcTransfers
        .map((t) => normalizeUSDC(t.amountOrId))
        .sort((a, b) => b - a);
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
  const packs = Math.floor(mainShares / PACK_MAIN_SHARES);
  const mainModulo = mainShares % PACK_MAIN_SHARES;

  const pricePerPack =
    packs > 0 && typeof pack.priceUSDC === "number"
      ? pack.priceUSDC / packs
      : null;

  const mainInfluence = packs * INFLUENCE_MAIN_PER_PACK;

  const secondaries = (pack.shares.secondaryClubs || []).map((s) => {
    const secShares = Number(s.amount || 0);
    const packsSec = Math.floor(secShares / PACK_SECONDARY_SHARES);
    const secModulo = secShares % PACK_SECONDARY_SHARES;
    const secInfluence = packsSec * INFLUENCE_SEC_PER_PACK;
    return {
      ...s,
      packsFromShares: packsSec,
      sharesModulo: secModulo,
      influence: secInfluence,
    };
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
    influence: {
      main: mainInfluence,
      secondary: totalSecondaryInfluence,
      total: totalInfluence,
      details: {
        principalPerPack: INFLUENCE_MAIN_PER_PACK,
        secondaryPerPack: INFLUENCE_SEC_PER_PACK,
      },
    },
    shares: {
      ...pack.shares,
      secondaryClubs: secondaries,
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    const { hash } = params || {};
    if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      return NextResponse.json({ ok: false, error: "tx hash invalide" }, { status: 400 });
    }

    const url = new URL(req.url);
    const buyerWallet = url.searchParams.get("wallet");

    const [receipt, tx] = await Promise.all([
      rpc("eth_getTransactionReceipt", [hash]),
      rpc("eth_getTransactionByHash", [hash]),
    ]);

    if (!receipt) {
      return NextResponse.json({ ok: false, error: "Receipt introuvable" }, { status: 404 });
    }

    // Transfers
    const transfers = [];
    for (const log of receipt.logs || []) {
      const t20 = decodeTransferERC20_721(log);
      if (t20) { transfers.push(t20); continue; }
      const t1155 = decodeTransferSingle1155(log);
      if (t1155) { transfers.push(t1155); continue; }
    }

    // JSON candidates depuis log.data
    const jsonCandidates = [];
    for (const [i, log] of (receipt.logs || []).entries()) {
      if (!log?.data || log.data === "0x") continue;
      const found = extractAbiLikeStringsFromLogData(log.data);
      for (const f of found) {
        jsonCandidates.push({
          source: `log[${i}].data`,
          contract: (log.address || "").toLowerCase(),
          logIndex: parseInt(log.logIndex, 16),
          text: f.txt,
          json: f.json || null,
          meta: { offsetWordIndex: f.offsetWordIndex, offset: f.offset, length: f.length },
        });
      }
    }

    // Fallback input
    const inputJsons = tx?.input ? extractJsonFromInput(tx.input) : [];

    // Focus “intéressants”
    const interesting = [...jsonCandidates, ...inputJsons].filter(
      (e) =>
        e.json &&
        (e.json.mv ||
          (e.json.cmd && typeof e.json.cmd === "object") ||
          (e.json.mint && typeof e.json.mint === "object"))
    );

    // Pack summary
    const packSummaryRaw = buildPackSummary({ jsonCandidates: interesting, transfers, buyerWallet });
    const packSummary = packSummaryRaw ? enrichPackWithInfluenceAndUnitPrice(packSummaryRaw) : null;

    return NextResponse.json({
      ok: true,
      txHash: hash,
      status: receipt.status === "0x1" ? "success" : "failed",
      blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : null,
      to: tx?.to ?? receipt?.to ?? null,
      logsCount: receipt.logs?.length ?? 0,
      transfers,
      jsonCandidates,
      inputJsons,
      interesting,
      packSummary, // ← prêt à consommer côté UI
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
