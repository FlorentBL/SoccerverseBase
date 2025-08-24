// app/api/tx/[hash]/route.js
import { NextResponse } from "next/server";

/**
 * RPC Polygon
 * - En dev, le public suffit : https://polygon-rpc.com
 * - En prod, utilisez un endpoint privé (Alchemy/QuickNode/Chainstack) pour fiabilité & débit.
 */
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
// Décodage hex → texte UTF‑8 (best-effort) + tentative de parse JSON

function hexToUtf8Safe(hex) {
  try {
    if (!hex || hex === "0x") return null;
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = clean.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
    const txt = new TextDecoder().decode(new Uint8Array(bytes));
    // On filtre grossièrement les strings non textuelles, et on retire padding nul
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
    // Le JSON est parfois encapsulé dans du bruit → on tente d’isoler {...}
    const m = str.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Extrait tous les objets JSON qu’on peut trouver dans:
 *  - la calldata tx.input
 *  - chaque log.data
 */
function extractJsonBlobs({ input, logs }) {
  const blobs = [];

  const pushIfJson = (source, hex) => {
    const s = hexToUtf8Safe(hex);
    const j = tryParseJsonLoose(s);
    if (j) blobs.push({ source, json: j, raw: s });
  };

  if (input) pushIfJson("tx.input", input);
  for (const [i, log] of (logs || []).entries()) {
    if (log?.data) pushIfJson(`log[${i}].data`, log.data);
  }
  return blobs;
}

function looksInteresting(obj) {
  // Critères souples pour détecter vos payloads cibles
  return Boolean(
    obj?.mv ||
    (obj?.cmd && typeof obj.cmd === "object") ||
    (obj?.mint && typeof obj.mint === "object")
  );
}

export async function GET(_req, { params }) {
  try {
    const { hash } = params || {};
    if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      return NextResponse.json({ ok: false, error: "tx hash invalide" }, { status: 400 });
    }

    // 1) Receipt (status + logs)
    const receipt = await rpc("eth_getTransactionReceipt", [hash]);
    if (!receipt) {
      return NextResponse.json({ ok: false, error: "Receipt introuvable (pending ou inconnue)" }, { status: 404 });
    }

    // 2) Transaction (pour lire input)
    const tx = await rpc("eth_getTransactionByHash", [hash]);

    // 3) Extraction JSON “best-effort”
    const jsonBlobs = extractJsonBlobs({ input: tx?.input, logs: receipt?.logs });

    // 4) Sélection pratique : candidats “intéressants” (mv/cmd/mint)
    const candidates = jsonBlobs
      .filter((b) => looksInteresting(b.json))
      .map((b) => ({ source: b.source, json: b.json }));

    const res = {
      ok: true,
      txHash: hash,
      status: receipt.status === "0x1" ? "success" : "failed",
      blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : null,
      to: tx?.to ?? receipt?.to ?? null,
      logsCount: receipt.logs?.length ?? 0,
      candidates, // JSON parsés pertinents (sans le raw)
      jsonBlobs,  // Tous les JSON parsés trouvés (+ raw si besoin debug)
    };

    return NextResponse.json(res, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Unhandled error" }, { status: 500 });
  }
}
