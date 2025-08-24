// app/tx-inspector/page.jsx
"use client";

import React, { useState } from "react";

const DEFAULT_TX =
  "0x6b7c8b2ff0fa06713eac19a99d332fd9b56f5297b20f7dcc75f915d73a74dab5";
const DEFAULT_WALLET = "0x6CB18B7c29f84f28fA510aFFBE0fd00EFCE5e105";

const isTx = (s) => /^0x[0-9a-fA-F]{64}$/.test(s || "");
const isAddr = (s) => /^0x[0-9a-fA-F]{40}$/.test(s || "");

export default function TxInspectorPage() {
  const [txHash, setTxHash] = useState(DEFAULT_TX);
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  const onFetch = async () => {
    setLoading(true);
    setError("");
    setRes(null);
    try {
      const qs = isAddr(wallet) ? `?wallet=${wallet}` : "";
      const r = await fetch(`/api/tx/${txHash}${qs}`, { cache: "no-store" });
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

  const Field = ({ label, value, onChange, placeholder, validFn }) => (
    <div style={{ flex: "1 1 auto", minWidth: 360 }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          width: "100%",
          background: "#0e141b",
          border: `1px solid ${!value || validFn(value) ? "#1f2630" : "#7a2b2b"}`,
          borderRadius: 10,
          color: "#e7ecef",
          padding: "10px 12px",
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );

  const Badge = ({ ok, text, warn }) => (
    <span
      style={{
        background: warn ? "#3a3515" : ok ? "#16351f" : "#3a1515",
        border: `1px solid ${warn ? "#7a6f2b" : ok ? "#2b7a3f" : "#7a2b2b"}`,
        color: warn ? "#ffe07d" : ok ? "#7df1a9" : "#ff9b9b",
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
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>TX Inspector (Polygon)</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field
          label="Tx Hash"
          value={txHash}
          onChange={setTxHash}
          placeholder="0x…"
          validFn={isTx}
        />
        <Field
          label="Buyer Wallet (optionnel pour le prix)"
          value={wallet}
          onChange={setWallet}
          placeholder="0x…"
          validFn={isAddr}
        />
        <button
          onClick={onFetch}
          disabled={loading || !isTx(txHash)}
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
          title={!isTx(txHash) ? "Tx hash invalide" : "Analyser la transaction"}
        >
          {loading ? "Analyse…" : "Analyser"}
        </button>
      </div>

      {error && (
        <Card title="Erreur">
          <div style={{ color: "#ff6b6b" }}>{error}</div>
        </Card>
      )}

      {res && (
        <>
          <Card title="Résumé">
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 6 }}>
              <div style={{ opacity: 0.7 }}>Status</div>
              <div>
                <Badge ok={res.status === "success"} text={res.status} />
              </div>
              <div style={{ opacity: 0.7 }}>Block</div>
              <div>{res.blockNumber ?? "-"}</div>
              <div style={{ opacity: 0.7 }}>To</div>
              <div style={{ fontFamily: "monospace" }}>{res.to ?? "-"}</div>
              <div style={{ opacity: 0.7 }}>Logs</div>
              <div>{res.logsCount}</div>
              <div style={{ opacity: 0.7 }}>Tx Hash</div>
              <div style={{ fontFamily: "monospace" }}>{res.txHash}</div>
            </div>
          </Card>

          <Card title="Pack détecté">
            {res.packSummary ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", rowGap: 6 }}>
                  <div style={{ opacity: 0.7 }}>Buyer</div>
                  <div style={{ fontFamily: "monospace" }}>
                    {res.packSummary.buyer || <em>(non fourni)</em>}
                  </div>

                  <div style={{ opacity: 0.7 }}>Prix total (USDC)</div>
                  <div>{res.packSummary.priceUSDC != null ? res.packSummary.priceUSDC.toFixed(6) : "-"}</div>

                  <div style={{ opacity: 0.7 }}>Frais (USDC)</div>
                  <div>{res.packSummary.extraFeesUSDC?.toFixed(6) ?? "0"}</div>

                  <div style={{ opacity: 0.7 }}>Packs</div>
                  <div>
                    {res.packSummary.packs ?? "-"}
                    {res.packSummary.validation && (
                      <>
                        <Badge
                          ok={(res.packSummary.validation.mainSharesModulo || 0) === 0}
                          text={
                            (res.packSummary.validation.mainSharesModulo || 0) === 0
                              ? "principal OK"
                              : "principal modulo≠0"
                          }
                        />
                        <Badge
                          ok={!!res.packSummary.validation.secondariesHaveModuloZero}
                          text={
                            res.packSummary.validation.secondariesHaveModuloZero
                              ? "secondaires OK"
                              : "secondaires modulo≠0"
                          }
                        />
                      </>
                    )}
                  </div>

                  <div style={{ opacity: 0.7 }}>Prix / pack (USDC)</div>
                  <div>
                    {res.packSummary.unitPriceUSDC != null
                      ? (
                        <>
                          {res.packSummary.unitPriceUSDC.toFixed(6)}
                          {res.packSummary.unitPriceSuspect && (
                            <Badge warn text="⚠️ suspect" />
                          )}
                        </>
                        )
                      : "-"
                    }
                  </div>

                  <div style={{ opacity: 0.7 }}>Influence totale</div>
                  <div>{res.packSummary.influence?.total ?? "-"}</div>
                </div>

                <div style={{ height: 12 }} />

                <div
                  style={{
                    borderTop: "1px solid #232a34",
                    paddingTop: 12,
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    rowGap: 6,
                  }}
                >
                  <div style={{ opacity: 0.7 }}>Club principal</div>
                  <div>
                    {res.packSummary.shares?.mainClub ? (
                      <div>
                        Club #{res.packSummary.shares.mainClub.clubId} — parts:{" "}
                        <b>{res.packSummary.shares.mainClub.amount}</b>
                        {res.packSummary.shares.mainClub.handle && (
                          <span style={{ marginLeft: 8, opacity: 0.8 }}>
                            (handle: {res.packSummary.shares.mainClub.handle})
                          </span>
                        )}
                        {res.packSummary.influence?.main != null && (
                          <span style={{ marginLeft: 8 }}>
                            • influence: <b>{res.packSummary.influence.main}</b>
                          </span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </div>

                  <div style={{ opacity: 0.7, alignSelf: "start" }}>Clubs secondaires</div>
                  <div>
                    {res.packSummary.shares?.secondaryClubs?.length ? (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: "6px 4px" }}>
                              Club
                            </th>
                            <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: "6px 4px" }}>
                              Parts
                            </th>
                            <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: "6px 4px" }}>
                              Packs
                            </th>
                            <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: "6px 4px" }}>
                              Influence
                            </th>
                            <th style={{ textAlign: "center", borderBottom: "1px solid #232a34", padding: "6px 4px" }}>
                              Modulo
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {res.packSummary.shares.secondaryClubs.map((s, i) => (
                            <tr key={i}>
                              <td style={{ padding: "6px 4px" }}>#{s.clubId}</td>
                              <td style={{ padding: "6px 4px", textAlign: "right" }}>{s.amount}</td>
                              <td style={{ padding: "6px 4px", textAlign: "right" }}>{s.packsFromShares ?? "-"}</td>
                              <td style={{ padding: "6px 4px", textAlign: "right" }}>{s.influence ?? "-"}</td>
                              <td style={{ padding: "6px 4px", textAlign: "center" }}>
                                {(s.sharesModulo || 0) === 0 ? "OK" : s.sharesModulo}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <span style={{ opacity: 0.75 }}>—</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ opacity: 0.75 }}>Aucun pack détecté (ou wallet non fourni pour le prix).</div>
            )}
          </Card>

          <Card title={`Transferts décodés — ${res.transfers?.length || 0}`}>
            {res.transfers?.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: 6 }}>Standard</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: 6 }}>Contrat</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: 6 }}>From</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #232a34", padding: 6 }}>To</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>Amount/Id</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #232a34", padding: 6 }}>logIndex</th>
                  </tr>
                </thead>
                <tbody>
                  {res.transfers.map((t, i) => (
                    <tr key={i}>
                      <td style={{ padding: 6 }}>{t.standard}</td>
                      <td style={{ padding: 6, fontFamily: "monospace" }}>{t.contract}</td>
                      <td style={{ padding: 6, fontFamily: "monospace" }}>{t.from}</td>
                      <td style={{ padding: 6, fontFamily: "monospace" }}>{t.to}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{t.amountOrId || t.value || "-"}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{t.logIndex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ opacity: 0.75 }}>—</div>
            )}
          </Card>

          <Card title={`Payloads JSON détectés — ${res.interesting?.length || 0}`}>
            {res.interesting?.length ? (
              res.interesting.map((c, i) => (
                <details key={i} style={{ marginBottom: 8 }}>
                  <summary style={{ cursor: "pointer" }}>
                    {c.source} • {c.contract} • logIndex {c.logIndex}
                  </summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      background: "#0e141b",
                      border: "1px solid #1f2630",
                      borderRadius: 10,
                      padding: 12,
                      overflowX: "auto",
                    }}
                  >
                    {JSON.stringify(c.json, null, 2)}
                  </pre>
                </details>
              ))
            ) : (
              <div style={{ opacity: 0.75 }}>—</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
