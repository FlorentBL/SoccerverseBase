// app/tx-inspector/page.jsx
"use client";

import React, { useState } from "react";

const DEFAULT_TX =
  "0x6b7c8b2ff0fa06713eac19a99d332fd9b56f5297b20f7dcc75f915d73a74dab5";

export default function TxInspectorPage() {
  const [txHash, setTxHash] = useState(DEFAULT_TX);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  const onFetch = async () => {
    setLoading(true);
    setError("");
    setRes(null);
    try {
      const r = await fetch(`/api/tx/${txHash}`);
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

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x…"
          spellCheck={false}
          style={{
            flex: "1 1 auto",
            minWidth: 480,
            background: "#0e141b",
            border: "1px solid #1f2630",
            borderRadius: 10,
            color: "#e7ecef",
            padding: "10px 12px",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={onFetch}
          disabled={loading || !/^0x[0-9a-fA-F]{64}$/.test(txHash)}
          style={{
            background: loading ? "#2b3240" : "#1c7cf0",
            border: "none",
            borderRadius: 10,
            color: "white",
            padding: "10px 16px",
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
          title={
            !/^0x[0-9a-fA-F]{64}$/.test(txHash)
              ? "Tx hash invalide"
              : "Analyser la transaction"
          }
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
                <span
                  style={{
                    background:
                      res.status === "success" ? "#16351f" : "#3a1515",
                    border: "1px solid " + (res.status === "success" ? "#2b7a3f" : "#7a2b2b"),
                    color: res.status === "success" ? "#7df1a9" : "#ff9b9b",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  {res.status}
                </span>
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

          <Card title={`Candidats (payloads pertinents) — ${res.candidates?.length || 0}`}>
            {res.candidates?.length ? (
              res.candidates.map((c, i) => (
                <details key={i} style={{ marginBottom: 8 }}>
                  <summary style={{ cursor: "pointer" }}>
                    {c.source}
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
              <div style={{ opacity: 0.75 }}>
                Aucun candidat détecté (pas de clé <code>mv</code>, <code>cmd</code> ou <code>mint</code>).
              </div>
            )}
          </Card>

          <Card title={`Tous les JSON détectés — ${res.jsonBlobs?.length || 0}`}>
            {res.jsonBlobs?.length ? (
              res.jsonBlobs.map((b, i) => (
                <details key={i} style={{ marginBottom: 8 }}>
                  <summary style={{ cursor: "pointer" }}>
                    {b.source}
                  </summary>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ opacity: 0.7, marginBottom: 4 }}>JSON</div>
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
                      {JSON.stringify(b.json, null, 2)}
                    </pre>
                    <div style={{ opacity: 0.7, marginTop: 8, marginBottom: 4 }}>
                      Chaîne brute décodée (debug)
                    </div>
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
                      {b.raw}
                    </pre>
                  </div>
                </details>
              ))
            ) : (
              <div style={{ opacity: 0.75 }}>
                Aucun JSON détecté dans la calldata ni les logs.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
