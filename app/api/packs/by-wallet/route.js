// app/api/packs/by-wallet/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── ENV helper: accepte plusieurs noms
function getPolygonscanKey() {
  return (
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    ""
  );
}

// ── CONFIG
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

// USDC natif & USDC.e (pour le calcul de prix)
const USDC_NATIVE  = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359".toLowerCase();
const USDC_BRIDGED = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174".toLowerCase();
const USDC_SET = new Set([USDC_NATIVE, USDC_BRIDGED]);
const isUsdc = (a) => USDC_SET.has((a || "").toLowerCase());

// Packs / influence
const SHARES_PER_PACK_MAIN = 40;
const SHARES_PER_PACK_SEC  = 10;
const INFLUENCE_MAIN_PER_PACK = 40;
const INFLUENCE_SEC_PER_PACK  = 10;

// ── RPC helpers
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
const to0x = (x) => (x?.startsWith("0x") ? x : "0x" + x);

function hexToBytes(hex){const s=hex?.startsWith("0x")?hex.slice(2):hex||"";if(s.length%2)return new Uint8Array();const o=new Uint8Array(s.length/2);for(let i=0;i<o.length;i++)o[i]=parseInt(s.slice(2*i,2*i+2),16);return o;}
function bytesToUtf8OrNull(b){try{const t=new TextDecoder().decode(b);return /[{}\[\]":,a-z0-9\s._-]/i.test(t)?t.replace(/\u0000/g,""):null;}catch{return null;}}
function tryParseJsonLoose(s){if(!s)return null;try{return JSON.parse(s);}catch{const m=s.match(/\{[\s\S]*\}/);if(!m)return null;try{return JSON.parse(m[0]);}catch{return null;}}}
function hexToBigInt(h){try{return h?BigInt(h):0n;}catch{return 0n;}}
function hexToAddress(h){return "0x"+(h?.slice(26)||"").toLowerCase();}

// ── Topics / decoders
const TOPIC_TRANSFER_ERC20_721 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TOPIC_TRANSFER_SINGLE_1155 =
  "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";

function decodeTransferERC20_721(log){
  if((log.topics?.[0]||"").toLowerCase()!==TOPIC_TRANSFER_ERC20_721) return null;
  const from=hexToAddress(log.topics[1]);
  const to=hexToAddress(log.topics[2]);
  const amountOrId=hexToBigInt(log.data).toString();
  return { standard:"ERC20/721", contract:(log.address||"").toLowerCase(), from, to, amountOrId, logIndex:parseInt(log.logIndex,16) };
}
function decodeTransferSingle1155(log){
  if((log.topics?.[0]||"").toLowerCase()!==TOPIC_TRANSFER_SINGLE_1155) return null;
  const data=hexToBytes(log.data); if(data.length<64) return null;
  const idHex   = "0x"+Buffer.from(data.slice(0,32)).toString("hex");
  const valHex  = "0x"+Buffer.from(data.slice(32,64)).toString("hex");
  return {
    standard:"ERC1155_SINGLE",
    contract:(log.address||"").toLowerCase(),
    operator:hexToAddress(log.topics[1]),
    from:hexToAddress(log.topics[2]),
    to:hexToAddress(log.topics[3]),
    id:BigInt(idHex).toString(),
    value:BigInt(valHex).toString(),
    logIndex:parseInt(log.logIndex,16),
  };
}

// ── Heuristiques d’extraction (bytes → texte/JSON)
function extractAbiLikeStringsFromLogData(logDataHex){
  const bytes=hexToBytes(logDataHex);
  const out=[]; const WORD=32;
  if(bytes.length<WORD) return out;
  for(let base=0;base+WORD<=bytes.length;base+=WORD){
    const offHex=Buffer.from(bytes.slice(base,base+WORD)).toString("hex");
    let off; try{off=Number(BigInt("0x"+offHex));}catch{continue;}
    if(!Number.isFinite(off)||off<WORD||off>bytes.length-WORD) continue;
    const lenPos=off; if(lenPos+WORD>bytes.length) continue;
    const lenHex=Buffer.from(bytes.slice(lenPos,lenPos+WORD)).toString("hex");
    let len; try{len=Number(BigInt("0x"+lenHex));}catch{continue;}
    if(!Number.isFinite(len)||len<=0||len>100_000) continue;
    const dataStart=lenPos+WORD, dataEnd=dataStart+len; if(dataEnd>bytes.length) continue;
    const cand=bytes.slice(dataStart,dataEnd);
    const txt=bytesToUtf8OrNull(cand); if(!txt) continue;
    const json=tryParseJsonLoose(txt);
    out.push({ txt, json, offsetWordIndex:base/WORD, offset:off, length:len });
  }
  return out;
}
function extractJsonFromInput(inputHex){
  const raw=bytesToUtf8OrNull(hexToBytes(inputHex));
  const json=tryParseJsonLoose(raw||"");
  return json ? [{ source:"tx.input", raw, json }] : [];
}

// ── Pack summary
function normalizeUSDC(v){try{return Number(BigInt(v))/1e6;}catch{return 0;}}
function buildPackSummary({ jsonCandidates, transfers, buyerWallet }){
  const shares=[]; const clubSmc=[];
  for(const c of jsonCandidates){
    const j=c.json;
    if(j?.cmd?.mint?.shares){
      const s=j.cmd.mint.shares;
      const clubId=s?.s?.club ?? s?.club ?? null;
      const n=s?.n ?? null;
      const r=s?.r ?? j?.r ?? null;
      if(clubId && n) shares.push({ clubId, n, r, fromLog:c.source, contract:c.contract });
    }
    if(j?.cmd?.mint?.clubsmc){
      const m=j.cmd.mint.clubsmc;
      if(m?.c && m?.n) clubSmc.push({ clubId:m.c, n:m.n, fromLog:c.source, contract:c.contract });
    }
  }
  if(!shares.length) return null;

  const main=shares.reduce((a,b)=>(b.n>(a?.n??0)?b:a), null);
  const secondaries=shares.filter((s)=>s!==main);
  const smcForMain=clubSmc.find((x)=>x.clubId===main?.clubId)||null;

  // prix: plus gros débit USDC (natif/bridgé) du wallet dans cette tx
  let priceUSDC=null, feeUSDC=0;
  if(buyerWallet){
    const w=buyerWallet.toLowerCase();
    const usdcTransfers=transfers.filter(
      (t)=>t.standard==="ERC20/721" && isUsdc(t.contract) && (t.from||"").toLowerCase()===w
    );
    if(usdcTransfers.length){
      const amounts=usdcTransfers.map((t)=>normalizeUSDC(t.amountOrId)).sort((a,b)=>b-a);
      priceUSDC=amounts[0]??null;
      feeUSDC=amounts.slice(1).reduce((s,x)=>s+x,0);
    }
  }

  return {
    buyer: buyerWallet || null,
    priceUSDC,
    extraFeesUSDC: feeUSDC || 0,
    shares: {
      mainClub: main ? { clubId: main.clubId, amount: main.n, handle: main.r || null } : null,
      secondaryClubs: secondaries.map((s)=>({ clubId:s.clubId, amount:s.n })),
      totalShares: shares.reduce((s,x)=>s+(x.n||0),0),
    },
    clubsmc: smcForMain,
    isConsistent: Boolean(main && smcForMain && smcForMain.clubId===main.clubId),
  };
}
function enrichPackWithInfluenceAndUnitPrice(pack){
  if(!pack?.shares?.mainClub) return pack;
  const mainShares=Number(pack.shares.mainClub.amount||0);
  const packs=Math.floor(mainShares/SHARES_PER_PACK_MAIN);
  const mainModulo=mainShares%SHARES_PER_PACK_MAIN;

  const pricePerPack=packs>0 && typeof pack.priceUSDC==="number" ? pack.priceUSDC/packs : null;
  const mainInfluence=packs*INFLUENCE_MAIN_PER_PACK;

  const secondaries=(pack.shares.secondaryClubs||[]).map((s)=>{
    const secShares=Number(s.amount||0);
    const packsSec=Math.floor(secShares/SHARES_PER_PACK_SEC);
    const secModulo=secShares%SHARES_PER_PACK_SEC;
    const secInfluence=packsSec*INFLUENCE_SEC_PER_PACK;
    return { ...s, packsFromShares:packsSec, sharesModulo:secModulo, influence:secInfluence };
  });

  const totalSecondaryInfluence=secondaries.reduce((acc,x)=>acc+(x.influence||0),0);
  const totalInfluence=mainInfluence+totalSecondaryInfluence;

  return {
    ...pack,
    packs,
    unitPriceUSDC: pricePerPack,
    validation: {
      mainSharesModulo: mainModulo,
      secondariesHaveModuloZero: secondaries.every((x)=>x.sharesModulo===0),
    },
    influence: { main: mainInfluence, secondary: totalSecondaryInfluence, total: totalInfluence },
    shares: { ...pack.shares, secondaryClubs: secondaries },
  };
}

// ── Polygonscan: **pagination de account.txlist** (toutes les TX, comme /tokentxns UI)
async function fetchTxListPaginated_Polygonscan(
  wallet,
  { startblock, endblock, pageSize = 100, maxPages = 20, sort = "desc" } = {},
  apiKey
){
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL("https://api.polygonscan.com/api");
    url.searchParams.set("module", "account");
    url.searchParams.set("action", "txlist");
    url.searchParams.set("address", wallet);
    if (Number.isFinite(startblock)) url.searchParams.set("startblock", String(startblock));
    if (Number.isFinite(endblock))   url.searchParams.set("endblock", String(endblock));
    url.searchParams.set("page", String(page));
    url.searchParams.set("offset", String(pageSize));
    url.searchParams.set("sort", sort);
    url.searchParams.set("apikey", apiKey);

    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Polygonscan HTTP ${r.status}`);
    const j = await r.json();

    // Quand il n'y a plus de résultats : result = []
    if (!Array.isArray(j.result) || j.result.length === 0) break;

    for (const x of j.result) {
      out.push({
        hash: x.hash,
        from: (x.from || "").toLowerCase(),
        to: (x.to || "").toLowerCase(),
        timeStamp: x.timeStamp,
        blockNumber: Number(x.blockNumber || 0),
      });
    }
    if (j.result.length < pageSize) break; // dernière page
  }

  // dédup par hash, garder le plus récent
  const map = new Map();
  for (const t of out) {
    const prev = map.get(t.hash);
    if (!prev || Number(t.timeStamp || 0) > Number(prev.timeStamp || 0)) map.set(t.hash, t);
  }
  return Array.from(map.values()).sort((a,b)=>Number(b.timeStamp||0)-Number(a.timeStamp||0));
}

// ── Analyse d'une TX via RPC (on garde ce que tu avais)
async function analyzeTx(txHash, buyerWallet){
  const [receipt, tx] = await Promise.all([
    rpc("eth_getTransactionReceipt", [txHash]),
    rpc("eth_getTransactionByHash",   [txHash]),
  ]);

  const transfers=[];
  for(const log of receipt?.logs||[]){
    const t20=decodeTransferERC20_721(log); if(t20){transfers.push(t20); continue;}
    const t1155=decodeTransferSingle1155(log); if(t1155){transfers.push(t1155); continue;}
  }

  const jsonCandidates=[];
  for(const [i,log] of (receipt?.logs||[]).entries()){
    if(!log?.data || log.data==="0x") continue;
    const found=extractAbiLikeStringsFromLogData(log.data);
    for(const f of found){
      jsonCandidates.push({
        source:`log[${i}].data`,
        contract:(log.address||"").toLowerCase(),
        logIndex:parseInt(log.logIndex,16),
        text:f.txt,
        json:f.json||null,
      });
    }
  }

  const inputJsons = tx?.input ? extractJsonFromInput(tx.input) : [];
  const interesting = [...jsonCandidates, ...inputJsons].filter(
    (e)=> e.json && (e.json.mv || (e.json.cmd && typeof e.json.cmd==="object") || (e.json.mint && typeof e.json.mint==="object"))
  );

  const packSummaryRaw = buildPackSummary({ jsonCandidates: interesting, transfers, buyerWallet });
  const packSummary    = packSummaryRaw ? enrichPackWithInfluenceAndUnitPrice(packSummaryRaw) : null;

  return {
    txHash,
    blockNumber: receipt?.blockNumber ? parseInt(receipt.blockNumber,16) : null,
    status: receipt?.status === "0x1" ? "success" : "failed",
    packSummary,
  };
}

// ── Utils
async function getLatestBlockNumber(){
  const hex=await rpc("eth_blockNumber",[]);
  return parseInt(hex,16);
}
async function mapWithConcurrency(items, limit, fn){
  const results=new Array(items.length);
  let i=0;
  const workers=Array(Math.min(limit,items.length)).fill(0).map(async()=>{
    while(true){
      const idx=i++; if(idx>=items.length) break;
      try{results[idx]=await fn(items[idx],idx);}catch(e){results[idx]={ error:e.message||String(e) };}
    }
  });
  await Promise.all(workers);
  return results;
}

// ── Handler
export async function GET(req){
  try{
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
    const limit  = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") || "50",10)));
    const sourceParam = (url.searchParams.get("source") || "auto").toLowerCase(); // auto|polygonscan|rpc
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "100",10)));
    const maxPages = Math.max(1, Math.min(50,  parseInt(url.searchParams.get("maxPages") || "10",10)));
    let startblock  = parseInt(url.searchParams.get("startblock") || "0",10);
    let endblock    = parseInt(url.searchParams.get("endblock") || "0",10);

    if(!/^0x[0-9a-fA-F]{40}$/.test(wallet)){
      return NextResponse.json({ ok:false, error:"wallet invalide" }, { status:400 });
    }

    const latest = await getLatestBlockNumber();
    if(!startblock) startblock = Math.max(0, latest - 1_000_000);
    if(!endblock)   endblock   = latest;

    const apiKey = getPolygonscanKey();

    let sourceUsed = "rpc";
    if (sourceParam === "polygonscan" || (sourceParam === "auto" && apiKey)) sourceUsed = "polygonscan";
    if (sourceUsed === "polygonscan" && !apiKey) {
      return NextResponse.json({ ok:false, error:"POLYGONSCAN_API_KEY manquante côté serveur" }, { status:400 });
    }

    // 1) Pagination Polygonscan: **toutes les tx** de l'adresse
    let baseTxs = [];
    if (sourceUsed === "polygonscan") {
      baseTxs = await fetchTxListPaginated_Polygonscan(
        wallet,
        { startblock, endblock, pageSize, maxPages, sort: "desc" },
        apiKey
      );
    } else {
      baseTxs = []; // (optionnel: implémenter une pagination RPC, mais Polygonscan est préféré)
    }

    // On ne garde que les tx où le wallet est **expéditeur**
    const outgoing = baseTxs.filter(t => (t.from || "").toLowerCase() === wallet);

    // Dédup + tri + limite
    const byTx = new Map();
    for (const t of outgoing) {
      const prev = byTx.get(t.hash);
      if (!prev || Number(t.timeStamp||0) > Number(prev.timeStamp||0)) byTx.set(t.hash, t);
    }
    const candidates = Array.from(byTx.values()).sort((a,b)=>Number(b.timeStamp||0)-Number(a.timeStamp||0)).slice(0, limit);

    // 2) Analyse pack tx par tx (concurrence 4)
    const analyzed = await mapWithConcurrency(candidates, 4, async (c) => {
      const r = await analyzeTx(c.hash, wallet);
      return { ...c, ...r };
    });

    // 3) Packs détectés
    const items = analyzed
      .filter(x => x.packSummary && x.packSummary.packs > 0 && x.status === "success")
      .map(x => ({
        txHash: x.txHash,
        blockNumber: x.blockNumber,
        timeStamp: x.timeStamp || null,
        packs: x.packSummary.packs,
        priceUSDC: x.packSummary.priceUSDC,
        unitPriceUSDC: x.packSummary.unitPriceUSDC,
        influenceTotal: x.packSummary.influence?.total || 0,
        mainClub: x.packSummary.shares?.mainClub?.clubId || null,
        secondariesCount: x.packSummary.shares?.secondaryClubs?.length || 0,
        details: x.packSummary,
      }));

    // 4) Agrégats
    const totalPacks      = items.reduce((s,it)=>s+(it.packs||0),0);
    const totalUSDC       = items.reduce((s,it)=>s+(it.priceUSDC||0),0);
    const totalInfluence  = items.reduce((s,it)=>s+(it.influenceTotal||0),0);
    const unitPriceAvg    = totalPacks>0 ? totalUSDC/totalPacks : null;

    return NextResponse.json({
      ok: true,
      wallet,
      scans: {
        source: sourceUsed,
        candidates: candidates.length,
        analyzed: analyzed.length,
        packsDetected: items.length,
        range: { startblock, endblock },
        debug: {
          hasPolygonscanKey: Boolean(apiKey),
          requestedSource: sourceParam,
          pageSize, maxPages,
          baseTxCount: baseTxs.length,
          outgoingCount: outgoing.length,
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
  } catch(e){
    return NextResponse.json({ ok:false, error:e.message||"Unhandled error" }, { status:500 });
  }
}
