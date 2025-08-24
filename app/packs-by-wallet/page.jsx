// app/packs-by-wallet/page.jsx
"use client";

import React, { useState } from "react";

const isAddr = (s) => /^0x[0-9a-fA-F]{40}$/.test(s || "");
const fmt = (n, d = 6) => (typeof n === "number" ? n.toFixed(d) : "-");
const tsToLocal = (ts) =>
  ts ? new Date(Number(ts) * 1000).toLocaleString() : "-";

export default function PacksByWalletPage() {
  const [wallet, setWallet] = useState("0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  const onScan = async () => {
    setLoading(true);
    setError("");
    setRes(null);
    try {
      const params = new URLSearchParams();
      params.set("wallet", wallet);
      params.set("limit", String(limit || 50));
      const r = await fetch(`/api/packs/by-wallet?${params.toString()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRes(j);
    } catch (e) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ title, children }) => (
    <div
      style={{
        background: "#12151a",
        border: "1px solid #232a34",
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{title}</h3>
      <div style={{ fontSize: 13, lineHeight: 1.4 }}>{children}</div>
    </div>
  );

  const Badge = ({ text }) => (
    <span
      style={{
        background: "#16351f",
        border: "1px solid #2b7a3f",
        color: "#7df1a9",
        padding: "2px 8px",
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 12,
        marginLeft: 8,
      }}
    >
      {text}
    </span>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        color: "#e7ecef",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>Packs par wallet</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 auto", minWidth: 420 }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Wallet</div>
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            style={{
              width: "100%",
              background: "#0e141b",
              border: `1px solid ${!wallet || isAddr(wallet) ? "#1f2630" : "#7a2b2b"}`,
              borderRadius: 10,
              color: "#e7ecef",
              padding: "10px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ width: 140 }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Limit tx</div>
          <input
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value || 50))}
            style={{
              width: "100%",
              background: "#0e141b",
              border: "1px solid #1f2630",
              borderRadius: 10,
              color: "#e7ecef",
              padding: "10px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={onScan}
          disabled={loading || !isAddr(wallet)}
          style={{
            height: 40,
            background: loading ? "#2b3240" : "#1c7cf0",
            border: "none",
            borderRadius: 10,
            color: "white",
            padding: "0 16px",
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
          title={!isAddr(wallet) ? "Wallet invalide" : "Scanner"}
        >
          {loading ? "Scan…" : "Scanner"}
        </button>
      </div>

      {error && (
        <Card title="Erreur">
          <div style={{ color: "#ff6b6b" }}>{error}</div>
        </Card>
      )}

      {res && res.ok && (
        <>
          <Card title="Résumé">
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", rowGap: 6 }}>
              <div style={{ opacity: 0.7 }}>Wallet</div>
              <div style={{ fontFamily: "monospace" }}>{res.wallet}</div>

              <div style={{ opacity: 0.7 }}>Candidats analysés</div>
              <div>
                {res.scans.analyzed} (sur {res.scans.candidates})
                <Badge text={`${res.scans.packsDetected} packs détectés`} />
              </div>

              <div style={{ opacity: 0.7 }}>Total packs</div>
              <div>{res.totals.packs}</div>

              <div style={{ opacity: 0.7 }}>Total dépensé (USDC)</div>
              <div>{fmt(res.totals.spentUSDC)}</div>

              <div style={{ opacity: 0.7 }}>Prix moyen / pack (USDC)</div>
              <div>{res.totals.unitPriceAvgUSDC != null ? fmt(res.totals.unitPriceAvgUSDC, 6) : "-"}</div>

              <div style={{ opacity: 0.7 }}>Influence totale</div>
              <div>{res.totals.influence}</div>
            </div>
          </Card>

          <Card title={`Transactions (packs) — ${res.items.length}`}>
            {res.items.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: 6 }}>Date</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: 6 }}>Tx</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>Packs</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>Prix (USDC)</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>Prix/pack</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>Influence</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>Principal</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>#Sec</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: 6 }}>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {res.items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ padding: 6 }}>{tsToLocal(it.timeStamp)}</td>
                      <td style={{ padding: 6 }}>
                        <a
                          href={`https://polygonscan.com/tx/${it.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#7fb3ff", textDecoration: "none", fontFamily: "monospace" }}
                        >
                          {it.txHash.slice(0, 10)}…{it.txHash.slice(-6)}
                        </a>
                      </td>
                      <td style={{ padding: 6, textAlign: "right" }}>{it.packs}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{fmt(it.priceUSDC)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{fmt(it.unitPriceUSDC)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{it.influenceTotal}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>#{it.mainClub ?? "-"}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{it.secondariesCount}</td>
                      <td style={{ padding: 6 }}>
                        <details>
                          <summary style={{ cursor: "pointer" }}>voir</summary>
                          <div style={{ marginTop: 8 }}>
                            <div style={{ opacity: 0.7, marginBottom: 4 }}>
                              Club principal : #{it.details?.shares?.mainClub?.clubId} • parts: {it.details?.shares?.mainClub?.amount} • packs: {it.details?.packs} • influence: {it.details?.influence?.main}
                            </div>
                            {it.details?.shares?.secondaryClubs?.length ? (
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: "4px 4px" }}>Club</th>
                                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: "4px 4px" }}>Parts</th>
                                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: "4px 4px" }}>Packs</th>
                                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: "4px 4px" }}>Influence</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {it.details.shares.secondaryClubs.map((s, k) => (
                                    <tr key={k}>
                                      <td style={{ padding: "4px 4px" }}>#{s.clubId}</td>
                                      <td style={{ padding: "4px 4px", textAlign: "right" }}>{s.amount}</td>
                                      <td style={{ padding: "4px 4px", textAlign: "right" }}>{s.packsFromShares ?? "-"}</td>
                                      <td style={{ padding: "4px 4px", textAlign: "right" }}>{s.influence ?? "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div style={{ opacity: 0.7 }}>Aucun club secondaire.</div>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ opacity: 0.75 }}>Aucun pack détecté sur l’échantillon analysé.</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
