// app/api/packs/history/route.js
import { NextResponse } from "next/server";
import { resolveWalletByName } from "@/lib/resolveWalletByName"; // on crée un petit helper ci-dessous
// Si tu préfères réutiliser ton /api/resolve_wallet existant, tu peux l’appeler via fetch.

const SUBGRAPH_URL = process.env.SUBGRAPH_URL;

/**
 * Requête GraphQL générique qui couvre plusieurs schémas possibles.
 * Adapte les champs si ton subgraph a d'autres noms.
 *
 * Hypothèse raisonnable d'entités:
 *  - packMints: [
 *      id, timestamp, buyer, tier, numPacks, unitUSDC, totalUSDC,
 *      primaryClubId,
 *      components: [{ clubId, influence }]
 *    ]
 */
const GQL = `
query PackMints($buyer: String!, $first: Int!, $skip: Int!) {
  packMints(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: asc
    where: { buyer: $buyer }
  ) {
    id
    timestamp
    buyer
    tier
    numPacks
    unitUSDC
    totalUSDC
    primaryClubId
    components {
      clubId
      influence
    }
  }
}
`;

async function fetchAllMintsFromSubgraph(buyer) {
  if (!SUBGRAPH_URL) throw new Error("SUBGRAPH_URL manquant (env)");
  const pageSize = 1000;
  let skip = 0;
  const all = [];

  // pagination
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resp = await fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GQL,
        variables: { buyer: buyer.toLowerCase(), first: pageSize, skip },
      }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`Subgraph HTTP ${resp.status}`);
    const { data, errors } = await resp.json();
    if (errors?.length) {
      throw new Error(errors.map((e) => e.message || String(e)).join(" | "));
    }
    const page = data?.packMints || [];
    all.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

// Petit helper local pour résoudre un pseudo → wallet via ton route existante
async function resolveWalletLocal(name) {
  if (!name) throw new Error("name manquant");
  try {
    // tu as déjà /api/resolve_wallet
    const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/resolve_wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      cache: "no-store",
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || "resolve_wallet KO");
    return j.wallet;
  } catch (e) {
    // fallback direct (si tu veux bypass HTTP): utilise ton code interne
    if (typeof resolveWalletByName === "function") {
      const w = await resolveWalletByName(name);
      return w;
    }
    throw e;
  }
}

/**
 * Agrège le coût pack en USD par club à partir des mints.
 * Pour chaque mint:
 *   - prix total = unitUSDC * numPacks (ou totalUSDC si dispo)
 *   - somme influences = primary + secondaires (components)
 *   - coût par influence = prix total / somme influences
 *   - coût club = costPerInf * influence_du_club
 */
function allocatePackCostsByClub(mints) {
  const spentPackUSDByClub = new Map();
  const audit = [];

  for (const m of mints) {
    const unit = Number(m?.unitUSDC || 0);
    const n = Number(m?.numPacks || 0);
    const total = Number(m?.totalUSDC || 0) || unit * n;

    const comps = Array.isArray(m?.components) ? m.components : [];
    // S'il n'y a pas components, on fallback au primaryClubId avec influence = ??? (si le subgraph ne l’expose pas, laisse 0)
    const arr = [...comps];
    // certains subgraph stockent aussi le club principal séparément:
    if (m?.primaryClubId != null && !arr.some((c) => Number(c.clubId) === Number(m.primaryClubId))) {
      // si on ne connaît pas l'influence principale exact via subgraph, on ne peut pas la rajouter arbitrairement.
      // On garde seulement ce que le subgraph fournit. (Mieux: faire évoluer le subgraph pour inclure l'influence principale.)
    }

    const totalInf = arr.reduce((s, x) => s + Number(x?.influence || 0), 0);
    if (totalInf <= 0 || total <= 0) {
      audit.push({ id: m.id, skipped: true });
      continue;
    }
    const costPerInf = total / totalInf;

    for (const c of arr) {
      const cid = Number(c?.clubId);
      const inf = Number(c?.influence || 0);
      if (!cid || inf <= 0) continue;
      const cost = costPerInf * inf;
      spentPackUSDByClub.set(cid, (spentPackUSDByClub.get(cid) || 0) + cost);
    }

    audit.push({
      id: m.id,
      ts: Number(m?.timestamp || 0),
      unitUSDC: unit,
      numPacks: n,
      totalUSDC: total,
      totalInf,
    });
  }

  return { spentPackUSDByClub, audit };
}

async function handle(nameRaw) {
  const name = (nameRaw || "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Paramètre 'name' manquant" }, { status: 400 });
  }

  try {
    const wallet = await resolveWalletLocal(name);
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Wallet introuvable" }, { status: 404 });
    }

    // 1) Subgraph
    const mints = await fetchAllMintsFromSubgraph(wallet);
    const { spentPackUSDByClub, audit } = allocatePackCostsByClub(mints);

    // sérialisation Map → array
    const spentArray = [...spentPackUSDByClub.entries()].map(([clubId, usd]) => ({
      clubId: Number(clubId),
      usd: Number(usd),
    }));

    return NextResponse.json({
      ok: true,
      wallet,
      spentPackUSDByClub: spentArray,
      mints: audit,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || searchParams.get("username");
  return handle(name);
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = body?.name || body?.username;
  return handle(name);
}

/**
 * Exemple de helper local (facultatif) si tu préfères ne pas repasser par HTTP
 * et utiliser ton code existant pour résoudre un pseudo → wallet.
 * Ici on expose juste la signature; à remplir si tu veux.
 */
// lib/resolveWalletByName.js
// export async function resolveWalletByName(name) { ... }
