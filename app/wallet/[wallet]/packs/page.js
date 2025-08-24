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
function shortHash(h) {
  return h ? `${h.slice(0, 8)}…${h.slice(-6)}` : "—";
}
function getBaseUrl() {
  // Prend le host/proto REELS de la requête (fonctionne en prod & preview)
  const hdrs = headers();
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const host =
    hdrs.get("x-forwarded-host") ||
    hdrs.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
    process.env.VERCEL_URL;

  if (!host) return null;
  return `${proto}://${host}`;
}

export default async function WalletPacksPage({ params, searchParams }) {
  const wallet = (params.wallet || "").toLowerCase();
  const pages = Number(searchParams?.pages ?? "3");
  const pageSize = Number(searchParams?.pageSize ?? "100");
  const limit = Number(searchParams?.limit ?? "80");

  const qs = new URLSearchParams({
    wallet,
    pages: String(pages),
    pageSize: String(pageSize),
    limit: String(limit),
  });

  // Forward clé API si dispo côté serveur (facultatif)
  const apikey =
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    "";
  if (apikey) qs.set("apikey", apikey);

  // URL ABSOLUE basée sur le host courant (évite la 401 des previews protégées)
  let base = getBaseUrl();
  if (!base) {
    // Fallback dev: localhost
    base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
  }
  const apiUrl = `${base}/api/packs/by-wallet?${qs.toString()}`;

  let data;
  try {
    const res = await fetch(apiUrl, { cache: "no-store", next: { revalidate: 0 } });
    const text = await res.text();

    try {
      data = JSON.parse(text);
    } catch {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-2">Packs par wallet</h1>
          <p className="text-red-600">Réponse non-JSON de l’API ({res.status}) :</p>
          <div className="text-xs text-gray-500 mt-1">URL: {apiUrl}</div>
          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">{text}</pre>
        </div>
      );
    }

    if (!res.ok || !data?.ok) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-2">Packs par wallet</h1>
          <p className="text-red-600">Erreur API {res.status}: {data?.error || "unknown"}</p>
          <div className="text-xs text-gray-500 mt-1">URL: {apiUrl}</div>
        </div>
      );
    }
  } catch (err) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Packs par wallet</h1>
        <p className="text-red-600">Fetch a échoué :</p>
        <div className="text-xs text-gray-500 mt-1">URL: {apiUrl}</div>
        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
          {String(err && (err.message || err))}
        </pre>
      </div>
    );
  }

  const { totals, items, scans } = data;
  const rows = [...(items || [])].sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Packs par wallet</h1>
          <p className="text-sm text-gray-500">Wallet: <span className="font-mono">{data.wallet}</span></p>
          <p className="text-sm text-gray-500">
            Source: {scans?.source} • Candidates: {scans?.candidates} • Analysées: {scans?.analyzed}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Total packs</div>
            <div className="text-xl font-semibold">{totals?.packs ?? 0}</div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Dépensé (USDC)</div>
            <div className="text-xl font-semibold">{fmt(totals?.spentUSDC, 6)}</div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Prix moyen / pack</div>
            <div className="text-xl font-semibold">{fmt(totals?.unitPriceAvgUSDC, 6)}</div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Influence</div>
            <div className="text-xl font-semibold">{totals?.influence ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Tx</th>
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
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  Aucun achat détecté.
                </td>
              </tr>
            )}
            {rows.map((it) => {
              const main = it?.details?.shares?.mainClub;
              const secs = it?.details?.shares?.secondaryClubs || [];
              return (
                <tr key={it.txHash} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono">
                    <Link className="underline" href={`https://polygonscan.com/tx/${it.txHash}`} target="_blank">
                      {shortHash(it.txHash)}
                    </Link>
                  </td>
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
                      <summary className="cursor-pointer text-blue-600">voir</summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded max-w-lg overflow-auto">
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
        API :{" "}
        <code>
          /api/packs/by-wallet?wallet={wallet}&amp;pages={pages}&amp;pageSize={pageSize}&amp;limit={limit}
        </code>
      </div>
    </div>
  );
}
