import { NextResponse } from "next/server";

const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

async function rpc(method, params) {
  const r = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!r.ok) throw new Error(`RPC HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers bas niveau

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
    } catch { return null; }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 1) Décodage standard des events Transfer (ERC20/721/1155)

const TOPIC_TRANSFER_ERC20_721 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // Transfer(address,address,uint256)
const TOPIC_TRANSFER_SINGLE_1155 = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"; // TransferSingle(address,address,address,uint256,uint256)
const TOPIC_TRANSFER_BATCH_1155  = "0x4a39dc06d4c0dbc64b70...c0d1ff9cf"; // raccourci, voir ci-dessous exact
// (mettons la vraie signature complète)
const TOPIC_TRANSFER_BATCH_1155_FULL = "0x4a39dc06d4c0dbc64b70...c0d1ff9cf".padEnd(66, "0"); // placeholder volontaire si tu veux ignorer Batch

function hexToBigInt(h) { return h ? BigInt(h) : 0n; }
function hexToAddress(h) { return "0x" + (h?.slice(26) || "").toLowerCase(); }

// ERC20/721: topics[1]=from, topics[2]=to, data=tokenId/value
function decodeTransferERC20_721(log) {
  if (log.topics?.[0]?.toLowerCase() !== TOPIC_TRANSFER_ERC20_721) return null;
  const from = hexToAddress(log.topics[1]);
  const to   = hexToAddress(log.topics[2]);
  const amountOrId = hexToBigInt(log.data).toString(); // string pour JSON safe
  return {
    standard: "ERC20/721",
    contract: log.address?.toLowerCase(),
    from, to,
    amountOrId,
    logIndex: parseInt(log.logIndex, 16),
  };
}

// ERC1155 TransferSingle: topics[1]=operator, topics[2]=from, topics[3]=to; data: id, value
function decodeTransferSingle1155(log) {
  if (log.topics?.[0]?.toLowerCase() !== TOPIC_TRANSFER_SINGLE_1155) return null;
  const data = hexToBytes(log.data);
  if (data.length < 64) return null;
  // data = 2 words: id, value
  const id = "0x" + Buffer.from(data.slice(0, 32)).toString("hex");
  const value = "0x" + Buffer.from(data.slice(32, 64)).toString("hex");
  return {
    standard: "ERC1155_SINGLE",
    contract: log.address?.toLowerCase(),
    operator: hexToAddress(log.topics[1]),
    from:     hexToAddress(log.topics[2]),
    to:       hexToAddress(log.topics[3]),
    id: BigInt(id).toString(),
    value: BigInt(value).toString(),
    logIndex: parseInt(log.logIndex, 16),
  };
}

// (Optionnel) ERC1155 TransferBatch: à coder si besoin ; souvent TransferSingle suffit pour nos cas d’achat
function decodeTransferBatch1155(_log) {
  return null; // pour garder le code minimaliste ici
}

// ───────────────────────────────────────────────────────────────────────────────
// 2) Extraction générique de bytes/string ABI-encodés (sans ABI)

function extractAbiLikeStringsFromLogData(logDataHex) {
  const bytes = hexToBytes(logDataHex);
  const res = [];

  // On parcourt par trames 32 bytes (words)
  const WORD = 32;
  if (bytes.length < WORD) return res;

  // Heuristique: on tente tous les offsets possibles qui pointent vers un bloc [offset]->[length]->[payload]
  for (let base = 0; base + WORD <= bytes.length; base += WORD) {
    // Lire offset (big-endian 32 bytes)
    const off = Number(BigInt("0x" + Buffer.from(bytes.slice(base, base + WORD)).toString("hex")));
    if (!Number.isFinite(off)) continue;
    if (off < WORD || off > bytes.length - WORD) continue; // offset minimal + bornes

    // Lecture length à offset
    const lenPos = off;
    if (lenPos + WORD > bytes.length) continue;
    const len = Number(BigInt("0x" + Buffer.from(bytes.slice(lenPos, lenPos + WORD)).toString("hex")));
    if (!Number.isFinite(len)) continue;
    if (len <= 0 || len > 100_000) continue; // borne raisonnable

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

// Fallback: input direct (rarement utile pour events, mais on garde)
function extractJsonFromInput(inputHex) {
  const raw = bytesToUtf8OrNull(hexToBytes(inputHex));
  const json = tryParseJsonLoose(raw || "");
  return json ? [{ source: "tx.input", raw, json }] : [];
}

// ───────────────────────────────────────────────────────────────────────────────

export async function GET(_req, { params }) {
  try {
    const { hash } = params || {};
    if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      return NextResponse.json({ ok: false, error: "tx hash invalide" }, { status: 400 });
    }

    const [receipt, tx] = await Promise.all([
      rpc("eth_getTransactionReceipt", [hash]),
      rpc("eth_getTransactionByHash", [hash]),
    ]);

    if (!receipt) {
      return NextResponse.json({ ok: false, error: "Receipt introuvable" }, { status: 404 });
    }

    // 1) Transfers décodés
    const decodedTransfers = [];
    for (const log of receipt.logs || []) {
      const t20 = decodeTransferERC20_721(log);
      if (t20) { decodedTransfers.push(t20); continue; }

      const t1155 = decodeTransferSingle1155(log);
      if (t1155) { decodedTransfers.push(t1155); continue; }

      const tBatch = decodeTransferBatch1155(log);
      if (tBatch) { decodedTransfers.push(tBatch); continue; }
    }

    // 2) Extraction de payloads ABI-like (JSON possibles) dans chaque log.data
    const jsonCandidates = [];
    for (const [i, log] of (receipt.logs || []).entries()) {
      if (!log?.data || log.data === "0x") continue;
      const found = extractAbiLikeStringsFromLogData(log.data);
      for (const f of found) {
        jsonCandidates.push({
          source: `log[${i}].data`,
          contract: log.address?.toLowerCase(),
          logIndex: parseInt(log.logIndex, 16),
          text: f.txt,
          json: f.json || null,
          meta: { offsetWordIndex: f.offsetWordIndex, offset: f.offset, length: f.length },
        });
      }
    }

    // 3) + fallback éventuel sur tx.input
    const inputJsons = extractJsonFromInput(tx?.input);

    // Sélection “intéressants” (mv / cmd / mint)
    const interesting = [...jsonCandidates, ...inputJsons].filter(
      (e) => e.json && (
        e.json.mv ||
        (e.json.cmd && typeof e.json.cmd === "object") ||
        (e.json.mint && typeof e.json.mint === "object")
      )
    );

    return NextResponse.json({
      ok: true,
      txHash: hash,
      status: receipt.status === "0x1" ? "success" : "failed",
      blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : null,
      to: tx?.to ?? receipt?.to ?? null,
      logsCount: receipt.logs?.length ?? 0,

      transfers: decodedTransfers,        // ← pour détecter achats (USDC out + NFT in)
      jsonCandidates,                     // ← strings/JSON extraits des logs.data (ABI-like)
      inputJsons,                         // ← fallback input
      interesting,                        // ← focus mv/cmd/mint
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
