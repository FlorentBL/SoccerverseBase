// app/wallet/[wallet]/packs/page.js
import Link from "next/link";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fmt(n, d = 6) {
  if (n == null || Number.isNaN(n)) return "—";
  const s = Number(n).toFixed(d);
  return s.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
}
function shortHash(h) { return h ? `${h.slice(0,8)}…${h.slice(-6)}` : "—"; }
function tsToUTC(ts) {
  if (!ts) return "—";
  const d = new Date(Number(ts) * 1000);
  return d.toISOString().replace("T", " ").replace(".000Z", " UTC");
}
function getBaseUrl() {
  const hdrs = headers();
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const host =
    hdrs.get("x-forwarded-host") ||
    hdrs.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
    process.env.VERCEL_URL;
  return host ? `${proto}://${host}` : "http://127.0.0.1:3000";
}

export default async function WalletPacksPage({ params, searchParams }) {
  const wallet   = (params.wallet || "").toLowerCase();
  const pages    = Number(searchParams?.pages ?? "3");
  const pageSize = Number(searchParams?.pageSize ?? "100");
  const limit    = Number(searchParams?.limit ?? "80");
  // NOUVEAU : éliminer les micro-fees par défaut
  const minAmountUSDC = Number(searchParams?.minAmountUSDC ?? "2");

  const qs = new URLSearchParams({
    wallet,
    pages: String(pages),
    pageSize: String(pageSize),
    limit: String(limit),
    minAmountUSDC: String(minAmountUSDC),
  });

  const apikey =
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    "";
  if (apikey) qs.set("apikey", apikey);

  const apiUrl = `${getBaseUrl()}/api/packs/by-wallet?${qs.toString()}`;

  let data, text, res;
  try {
    res = await fetch(apiUrl, { cache: "no-store", next: { revalidate: 0 } });
    text = await res.text();
    data = JSON.parse(text);
    if (!res.ok || !data?.ok) {
      throw new Error(`API ${res.status}: ${data?.error || "unknown"}`);
    }
  } catch (e) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Packs par wallet</h1>
        <p className="text-red-600">Fetch a échoué : {String(e.message || e)}</p>
        <div className="text-xs text-gray-500 mt-1">URL: {apiUrl}</div>
        <pre className="mt-2 text-xs bg-white text-black p-2 rounded overflow-auto">{text || ""}</pre>
      </div>
    );
  }

  const { totals, items, scans } = data;
  const rows = [...(items || [])].sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));

  return (
    <div className="p-6 space-y-6">
      {/* Header + KPIs */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Packs par wallet</h1>
          <p className="text-sm text-gray-400">
            Wallet: <span className="font-mono">{data.wallet}</span>
          </p>
          <p className="text-sm text-gray-400">
            Source: {scans?.source} • Candidates: {scans?.candidates} • Analysées: {scans?.analyzed}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Params: pages={pages} • pageSize={pageSize} • limit={limit} • minAmountUSDC={minAmountUSDC}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-gray-400">Total packs</div>
            <div className="text-xl font-semibold">{totals?.packs ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-gray-400">Dépensé (USDC)</div>
            <div className="text-xl font-semibold">{fmt(totals?.spentUSDC, 6)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-gray-400">Prix moyen / pack</div>
            <div className="text-xl font-semibold">{fmt(totals?.unitPriceAvgUSDC, 6)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-gray-400">Influence</div>
            <div className="text-xl font-semibold">{totals?.influence ?? 0}</div>
          </div>
        </div>
      </div>

      {/* TABLE CLAIRE SUR FOND SOMBRE */}
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="text-left text-gray-700">
              <th className="p-3">Tx</th>
              <th className="p-3">Date (UTC)</th>
              <th className="p-3">Block</th>
              <th className="p-3">Main club</th>
              <th className="p-3">Packs</th>
              <th className="p-3">Prix total (USDC)</th>
              <th className="p-3">Prix / pack</th>
              <th className="p-3">Frais USDC</th>
              <th className="p-3">Influence</th>
              <th className="p-3">Détail</th>
            </tr>
          </thead>
          <tbody className="bg-white text-gray-900">
            {rows.length === 0 && (
              <tr><td colSpan={10} className="p-6 text-center text-gray-500">Aucun achat détecté.</td></tr>
            )}
            {rows.map((it, i) => {
              const main = it?.details?.shares?.mainClub;
              const zebra = i % 2 ? "bg-gray-50" : "bg-white";
              return (
                <tr key={it.txHash} className={`${zebra} border-t border-gray-200`}>
                  <td className="p-3 font-mono">
                    <Link className="underline" href={`https://polygonscan.com/tx/${it.txHash}`} target="_blank">
                      {shortHash(it.txHash)}
                    </Link>
                  </td>
                  <td className="p-3">{tsToUTC(it.timeStamp)}</td>
                  <td className="p-3">{it.blockNumber ?? "—"}</td>
                  <td className="p-3">
                    {main ? (
                      <div className="flex flex-col">
                        <span>#{main.clubId}</span>
                        <span className="text-xs text-gray-500">
                          main: {main.amount} parts{main.handle ? ` • @${main.handle}` : ""}
                        </span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="p-3">{it.packs}</td>
                  <td className="p-3">{fmt(it.priceUSDC, 6)}</td>
                  <td className="p-3">{fmt(it.unitPriceUSDC, 6)}</td>
                  <td className="p-3">{fmt(it.feesUSDC, 6)}</td>
                  <td className="p-3">{it.influenceTotal}</td>
                  <td className="p-3">
                    <details>
                      <summary className="cursor-pointer text-blue-700">voir</summary>
                      <pre className="mt-2 text-xs bg-white text-black p-2 rounded max-h-80 max-w-lg overflow-auto border border-gray-200">
                        {JSON.stringify(it.details, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400">
        API : <code>/api/packs/by-wallet?wallet={wallet}&amp;pages={pages}&amp;pageSize={pageSize}&amp;limit={limit}&amp;minAmountUSDC={minAmountUSDC}</code>
      </div>
    </div>
  );
}
