// app/api/packs/by-wallet/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────── ENV
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const getPsKey = () =>
  process.env.POLYGONSCAN_API_KEY ||
  process.env.POLYGONSCAN_KEY ||
  process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
  "";

// USDC (natifs + bridgé)
const USDC_NATIVE  = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359".toLowerCase();
const USDC_BRIDGED = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174".toLowerCase();
const USDC_SET = new Set([USDC_NATIVE, USDC_BRIDGED]);
const isUsdc = (a) => USDC_SET.has((a || "").toLowerCase());

// Packs / influence
const SHARES_PER_PACK_MAIN = 40;
const SHARES_PER_PACK_SEC  = 10;
const INFLUENCE_MAIN_PER_PACK = 40;
const INFLUENCE_SEC_PER_PACK  = 10;

// ─────────── RPC helpers
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
function hexToBytes(hex){const s=hex?.startsWith("0x")?hex.slice(2):hex||"";if(s.length%2)return new Uint8Array();const o=new Uint8Array(s.length/2);for(let i=0;i<o.length;i++)o[i]=parseInt(s.slice(2*i,2*i+2),16);return o;}
function bytesToUtf8OrNull(b){try{const t=new TextDecoder().decode(b);return /[{}\[\]":,a-z0-9\s._-]/i.test(t)?t.replace(/\u0000/g,""):null;}catch{return null;}}
function tryParseJsonLoose(s){if(!s)return null;try{return JSON.parse(s);}catch{const m=s.match(/\{[\s\S]*\}/);if(!m)return null;try{return JSON.parse(m[0]);}catch{return null;}}}
function hexToBigInt(h){try{return h?BigInt(h):0n;}catch{return 0n;}}
function hexToAddress(h){return "0x"+(h?.slice(26)||"").toLowerCase();}

// ─────────── Topics / decoders
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

// ─────────── Extraction bytes → JSON
function extractAbiLikeStringsFromLogData(dataHex){
  const bytes=hexToBytes(dataHex);
  const res=[]; const WORD=32;
  if(bytes.length<WORD) return res;
  for(let base=0;base+WORD<=bytes.length;base+=WORD){
    const offHex=Buffer.from(bytes.slice(base,base+WORD)).toString("hex");
    let off; try{off=Number(BigInt("0x"+offHex));}catch{continue;}
    if(!Number.isFinite(off)||off<WORD||off>bytes.length-WORD) continue;
    const lenPos=off; if(lenPos+WORD>bytes.length) continue;
    const lenHex=Buffer.from(bytes.slice(lenPos,lenPos+WORD)).toString("hex");
    let len; try{len=Number(BigInt("0x"+lenHex));}catch{continue;}
    if(!Number.isFinite(len)||len<=0||len>100_000) continue;
    const dataStart=lenPos+WORD, dataEnd=dataStart+len; if(dataEnd>bytes.length) continue;
    const slice=bytes.slice(dataStart,dataEnd);
    const txt=bytesToUtf8OrNull(slice); if(!txt) continue;
    const json=tryParseJsonLoose(txt);
    res.push({ txt, json });
  }
  return res;
}
function extractJsonFromInput(inputHex){
  const raw=bytesToUtf8OrNull(hexToBytes(inputHex));
  const json=tryParseJsonLoose(raw||"");
  return json ? [{ source:"tx.input", raw, json }] : [];
}

// ─────────── Pack summary
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
      if(clubId && n) shares.push({ clubId, n, r });
    }
    if(j?.cmd?.mint?.clubsmc){
      const m=j.cmd.mint.clubsmc;
      if(m?.c && m?.n) clubSmc.push({ clubId:m.c, n:m.n });
    }
  }
  if(!shares.length) return null;

  const main=shares.reduce((a,b)=>(b.n>(a?.n??0)?b:a), null);
  const secondaries=shares.filter((s)=>s!==main);

  // prix: plus gros débit USDC du wallet
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
  };
}
function enrichPack(pack){
  if(!pack?.shares?.mainClub) return pack;
  const mainShares=Number(pack.shares.mainClub.amount||0);
  const packs=Math.floor(mainShares/SHARES_PER_PACK_MAIN);
  const unitPrice=packs>0 && typeof pack.priceUSDC==="number" ? pack.priceUSDC/packs : null;

  const sec=(pack.shares.secondaryClubs||[]).map((s)=>{
    const n=Number(s.amount||0);
    const p=Math.floor(n/SHARES_PER_PACK_SEC);
    return { ...s, packsFromShares:p, sharesModulo:n%SHARES_PER_PACK_SEC, influence:p*INFLUENCE_SEC_PER_PACK };
  });
  const inflMain=packs*INFLUENCE_MAIN_PER_PACK;
  const inflSec = sec.reduce((a,x)=>a+(x.influence||0),0);

  return {
    ...pack,
    packs,
    unitPriceUSDC: unitPrice,
    influence: { main: inflMain, secondary: inflSec, total: inflMain+inflSec },
    shares: { ...pack.shares, secondaryClubs: sec },
  };
}

// ─────────── Polygonscan: pagination **tokentx** (pas de bornes de block)
async function fetchTokenTxsPaginated(wallet, { pageSize=100, maxPages=10, sort="desc" }={}, apiKey){
  const all=[];
  for(let page=1; page<=maxPages; page++){
    const url = new URL("https://api.polygonscan.com/api");
    url.searchParams.set("module","account");
    url.searchParams.set("action","tokentx");
    url.searchParams.set("address",wallet);
    url.searchParams.set("page",String(page));
    url.searchParams.set("offset",String(pageSize));
    url.searchParams.set("sort",sort);
    url.searchParams.set("apikey",apiKey);

    const r = await fetch(url, { cache:"no-store" });
    if(!r.ok) throw new Error(`Polygonscan HTTP ${r.status}`);
    const j = await r.json();

    if(!Array.isArray(j.result) || j.result.length===0) break; // fin

    for(const x of j.result){
      all.push({
        hash: x.hash || x.transactionHash,
        from: (x.from || "").toLowerCase(),
        to: (x.to || "").toLowerCase(),
        timeStamp: x.timeStamp,
        contractAddress: (x.contractAddress || "").toLowerCase(),
      });
    }
    if(j.result.length < pageSize) break;
  }

  // dédup + tri
  const map=new Map();
  for(const t of all){
    if(!t.hash) continue;
    const ts=Number(t.timeStamp||0);
    const prev=map.get(t.hash);
    if(!prev || ts>Number(prev.timeStamp||0)) map.set(t.hash,t);
  }
  return Array.from(map.values()).sort((a,b)=>Number(b.timeStamp||0)-Number(a.timeStamp||0));
}

// ─────────── Analyse d’une TX via RPC
async function analyzeTx(txHash, wallet){
  const [receipt, tx] = await Promise.all([
    rpc("eth_getTransactionReceipt",[txHash]),
    rpc("eth_getTransactionByHash",[txHash]),
  ]);

  const transfers=[];
  for(const log of receipt?.logs||[]){
    const t20=decodeTransferERC20_721(log); if(t20){transfers.push(t20); continue;}
    const t1155=decodeTransferSingle1155(log); if(t1155){transfers.push(t1155); continue;}
  }

  const jsonCandidates=[];
  for(const log of (receipt?.logs||[])){
    if(!log?.data || log.data==="0x") continue;
    const found=extractAbiLikeStringsFromLogData(log.data);
    for(const f of found) jsonCandidates.push({ text:f.txt, json:f.json||null });
  }
  const inputs = tx?.input ? extractJsonFromInput(tx.input) : [];
  const interesting=[...jsonCandidates, ...inputs].filter(e => e.json && (e.json.mv || e.json.cmd || e.json.mint));

  const raw = buildPackSummary({ jsonCandidates: interesting, transfers, buyerWallet: wallet });
  const pack = raw ? enrichPack(raw) : null;

  return {
    txHash,
    blockNumber: receipt?.blockNumber ? parseInt(receipt.blockNumber,16) : null,
    status: receipt?.status === "0x1" ? "success" : "failed",
    packSummary: pack,
  };
}

// ─────────── Handler
export async function GET(req){
  try{
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
    const limit  = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") || "100",10)));
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "100",10)));
    const maxPages = Math.max(1, Math.min(50,  parseInt(url.searchParams.get("maxPages") || "10",10)));
    const sourceParam = (url.searchParams.get("source") || "polygonscan").toLowerCase();

    if(!/^0x[0-9a-fA-F]{40}$/.test(wallet)){
      return NextResponse.json({ ok:false, error:"wallet invalide" }, { status:400 });
    }
    const apiKey = getPsKey();
    if(!apiKey) return NextResponse.json({ ok:false, error:"POLYGONSCAN_API_KEY manquante" }, { status:400 });

    // 1) On pagine les **token transfers** (comme l’UI /tokentxns)
    const tokenTxs = await fetchTokenTxsPaginated(wallet, { pageSize, maxPages, sort:"desc" }, apiKey);

    // on ne garde que ceux émis par le wallet (colonne From sur l’UI)
    const outgoing = tokenTxs.filter(t => (t.from||"").toLowerCase() === wallet);

    // 2) analyse RPC par tx
    const candidates = outgoing.slice(0, limit);
    const analyzed = await Promise.all(candidates.map(c => analyzeTx(c.hash, wallet)));

    // 3) packs
    const items = analyzed
      .filter(x => x.packSummary && x.packSummary.packs > 0 && x.status === "success")
      .map(x => ({
        txHash: x.txHash,
        blockNumber: x.blockNumber,
        packs: x.packSummary.packs,
        priceUSDC: x.packSummary.priceUSDC,
        unitPriceUSDC: x.packSummary.unitPriceUSDC,
        influenceTotal: x.packSummary.influence?.total || 0,
        mainClub: x.packSummary.shares?.mainClub?.clubId || null,
        secondariesCount: x.packSummary.shares?.secondaryClubs?.length || 0,
        details: x.packSummary,
      }));

    // 4) agrégats
    const totalPacks = items.reduce((s,it)=>s+(it.packs||0),0);
    const totalUSDC  = items.reduce((s,it)=>s+(it.priceUSDC||0),0);
    const totalInf   = items.reduce((s,it)=>s+(it.influenceTotal||0),0);
    const unitAvg    = totalPacks>0 ? totalUSDC/totalPacks : null;

    return NextResponse.json({
      ok: true,
      wallet,
      scans: {
        source: "polygonscan",
        candidates: candidates.length,
        analyzed: analyzed.length,
        packsDetected: items.length,
        debug: {
          requestedSource: sourceParam,
          pageSize, maxPages,
          tokenTxCount: tokenTxs.length,
          outgoingCount: outgoing.length,
        },
      },
      totals: {
        packs: totalPacks,
        spentUSDC: totalUSDC,
        unitPriceAvgUSDC: unitAvg,
        influence: totalInf,
      },
      items,
    });
  } catch(e){
    return NextResponse.json({ ok:false, error:e.message || "Unhandled error" }, { status:500 });
  }
}
