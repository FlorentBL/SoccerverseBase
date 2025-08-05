"use client";
import React, { useState } from "react";
import PlayerCompare from "@/components/PlayerCompare";

export default function Page({ searchParams }) {
  const initial = searchParams?.player_ids || "";
  const [idsInput, setIdsInput] = useState(initial);
  const [ids, setIds] = useState(
    initial ? initial.split(",").map((i) => i.trim()).filter(Boolean) : []
  );

  const submit = (e) => {
    e.preventDefault();
    setIds(
      idsInput
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean)
    );
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 900,
      margin: "0 auto",
      padding: 20,
      color: "#fff",
    }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: "#ffd700", marginBottom: 16 }}>
        Comparer des joueurs
      </h1>
      <form onSubmit={submit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={idsInput}
          onChange={(e) => setIdsInput(e.target.value)}
          placeholder="Ex : 1,2,3"
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #444",
            width: 260,
            marginRight: 10,
            color: "#000",
          }}
        />
        <button
          type="submit"
          style={{
            background: "#ffd700",
            color: "#23232c",
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 6,
          }}
        >
          Charger
        </button>
      </form>
      <PlayerCompare playerIds={ids} />
    </div>
  );
}

