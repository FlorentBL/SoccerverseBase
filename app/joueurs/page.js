import React, { useState } from "react";

export default function PlayerInfoFetcher() {
  const [playerId, setPlayerId] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchPlayer = async () => {
    setError("");
    setResult(null);
    if (!playerId || !token) {
      setError("ID du joueur et token requis.");
      return;
    }
    try {
      const res = await fetch(
        `https://services.soccerverse.com/api/players/${playerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        setError(`Erreur API : ${res.status} – ${msg}`);
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Erreur de connexion ou API.");
    }
  };

  return (
    <div style={{
      background: "#15181c",
      minHeight: "100vh",
      color: "#f8f8f8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, Arial, sans-serif",
    }}>
      <div style={{
        background: "#23272e",
        padding: 32,
        borderRadius: 12,
        boxShadow: "0 2px 12px #0007",
        minWidth: 340,
        maxWidth: 520,
      }}>
        <h2 style={{marginBottom: 24, fontWeight: 800, letterSpacing: 1}}>Recherche Joueur Soccerverse</h2>
        <label style={{display: "block", marginBottom: 12}}>
          <span style={{fontWeight: 600}}>ID Joueur :</span>
          <input
            type="text"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #363a42",
              background: "#191d22",
              color: "#f8f8f8",
              fontSize: 17,
              outline: "none",
              marginBottom: 14
            }}
            placeholder="Ex: 123456"
          />
        </label>
        <label style={{display: "block", marginBottom: 16}}>
          <span style={{fontWeight: 600}}>Bearer Token :</span>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #363a42",
              background: "#191d22",
              color: "#f8f8f8",
              fontSize: 17,
              outline: "none",
              marginBottom: 14
            }}
            placeholder="Colle ici ton token"
          />
        </label>
        <button
          onClick={fetchPlayer}
          style={{
            background: "linear-gradient(90deg, #0d8bff, #4f47ff)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "11px 26px",
            fontWeight: 700,
            fontSize: 17,
            cursor: "pointer",
            boxShadow: "0 1px 5px #0004",
            marginBottom: 18
          }}
        >
          Rechercher
        </button>
        {error && (
          <div style={{ color: "#ff5e57", marginTop: 10, fontWeight: 500 }}>
            {error}
          </div>
        )}
        {result && (
          <div style={{
            background: "#191d22",
            marginTop: 22,
            padding: 18,
            borderRadius: 8,
            fontSize: 16,
            wordBreak: "break-word",
            overflowX: "auto",
            boxShadow: "0 1px 4px #0003"
          }}>
            <b>Nom du joueur :</b> {result.name ?? "N/A"}
            <br/>
            <b>ID :</b> {result.id}
            <br/>
            <b>Nationalité :</b> {result.nationality}
            <br/>
            <b>Club ID :</b> {result.club_id}
            <br/>
            <b>Autres infos brutes :</b>
            <pre style={{
              background: "#101214",
              color: "#b4e1fa",
              fontSize: 14,
              padding: 8,
              borderRadius: 4,
              marginTop: 10,
              maxHeight: 320,
              overflow: "auto"
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
