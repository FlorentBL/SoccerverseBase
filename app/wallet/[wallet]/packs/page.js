// app/wallet/[wallet]/packs/page.js
import Link from "next/link";

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

export default async function WalletPacksPage({ params, searchParams }) {
  const wallet = (params.wallet || "").toLowerCase();
  const pages = Number(searchParams?.pages ?? "3");
  const pageSize = Number(searchParams?.pageSize ?? "100");
  const limit = Number(searchParams?.limit ?? "80");

  // Clé API côté serveur si dispo (Etherscan v2 cross-chain)
  const apikey =
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    "";

  const qs = new URLSearchParams({
    wallet,
    pages: String(pages),
    pageSize: String(pageSize),
    limit: String(limit),
  });
  if (apikey) qs.set("apikey", apikey);

  const res = await fetch(`/api/packs/by-wallet?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Packs par wallet</h1>
        <p className="text-red-600">Erreur HTTP {res.status}</p>
      </div>
    );
  }
  const data = await res.json();
  if (!data.ok) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Packs par wallet</h1>
        <p className="text-red-600">Erreur: {data.error || "unknown"}</p>
      </div>
    );
  }

  const { totals, items } = data;
  const rows = [...items].sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Packs par wallet</h1>
          <p className="text-sm text-gray-500">
            Wallet: <span className="font-mono">{data.wallet}</span>
          </p>
          <p className="text-sm text-gray-500">
            Source: {data.scans.source} • Candidates: {data.scans.candidates} • Analysées: {data.scans.analyzed}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Total packs</div>
            <div className="text-xl font-semibold">{totals.packs}</div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Dépensé (USDC)</div>
            <div className="text-xl font-semibold">{fmt(totals.spentUSDC, 6)}</div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Prix moyen / pack</div>
            <div className="text-xl font-semibold">{fmt(totals.unitPriceAvgUSDC, 6)}</div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="text-xs text-gray-500">Influence</div>
            <div className="text-xl font-semibold">{totals.influence}</div>
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
              <th className="p-3">Secondaires</th>
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
              const secsLabel =
                secs.length === 0
                  ? "—"
                  : secs
                      .slice(0, 4)
                      .map((s) => `${s.clubId} (${s.amount})`)
                      .join(", ") + (secs.length > 4 ? `, +${secs.length - 4}…` : "");
              const warn =
                data.totals.unitPriceAvgUSDC != null &&
                it.unitPriceUSDC != null &&
                Math.abs(it.unitPriceUSDC - data.totals.unitPriceAvgUSDC) / data.totals.unitPriceAvgUSDC > 0.1;

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
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">{it.packs}</td>
                  <td className="p-3">{fmt(it.priceUSDC, 6)}</td>
                  <td className="p-3">
                    <span className={warn ? "px-2 py-0.5 rounded bg-yellow-100 text-yellow-800" : ""}>
                      {fmt(it.unitPriceUSDC, 6)}
                    </span>
                  </td>
                  <td className="p-3">{fmt(it.feesUSDC, 6)}</td>
                  <td className="p-3">{it.influenceTotal}</td>
                  <td className="p-3">{secsLabel}</td>
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
        API:{" "}
        <code>
          /api/packs/by-wallet?wallet={wallet}&amp;pages={pages}&amp;pageSize={pageSize}&amp;limit={limit}
        </code>
      </div>
    </div>
  );
}
