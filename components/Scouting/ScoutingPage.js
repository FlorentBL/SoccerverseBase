"use client";
import React, { useState } from "react";
import PlayerTab from "./PlayerTab";
import ClubTab from "./ClubTab";
import LeagueTab from "./LeagueTab";

const TABS = [
  { key: "player", label: "Joueur" },
  { key: "club", label: "Club" },
  { key: "league", label: "Championnat" },
];

export default function ScoutingPage() {
  const [tab, setTab] = useState("player");

  return (
    <div style={{ minHeight: "100vh", background: "#181c21", color: "#f6f6f7", paddingTop: 60 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              fontWeight: 800, fontSize: 17, border: "none", borderRadius: 10, padding: "12px 34px",
              background: tab === t.key ? "#21252b" : "#23272e", color: tab === t.key ? "#3fcf60" : "#ccc",
              boxShadow: tab === t.key ? "0 4px 16px #0d8bff22" : "none", cursor: "pointer"
            }}>{t.label}</button>
        ))}
      </div>
      {tab === "player" && <PlayerTab />}
      {tab === "club" && <ClubTab />}
      {tab === "league" && <LeagueTab />}
    </div>
  );
}
