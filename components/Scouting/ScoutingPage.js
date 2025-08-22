"use client";
import React, { useState } from "react";
import PlayerTab from "./PlayerTab";
import ClubTab from "./ClubTab";
import LeagueTab from "./LeagueTab";

const TAB_LABELS = {
  fr: { player: "Joueur", club: "Club", league: "Championnat" },
  en: { player: "Player", club: "Club", league: "League" },
  it: { player: "Giocatore", club: "Club", league: "Campionato" },
  es: { player: "Jugador", club: "Club", league: "Liga" },
  ko: { player: "선수", club: "클럽", league: "리그" },
};

export default function ScoutingPage({ lang = "fr" }) {
  const [tab, setTab] = useState("player");
  const labels = TAB_LABELS[lang] || TAB_LABELS.fr;

  return (
    <div style={{ minHeight: "100vh", color: "#f6f6f7", paddingTop: 60 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32 }}>
        {["player", "club", "league"].map(key => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              fontWeight: 800, fontSize: 17, border: "none", borderRadius: 10, padding: "12px 34px",
              background: tab === key ? "#21252b" : "#23272e", color: tab === key ? "#818cf8" : "#ccc",
              boxShadow: tab === key ? "0 4px 16px #818cf822" : "none", cursor: "pointer"
            }}>{labels[key]}</button>
        ))}
      </div>
      {tab === "player" && <PlayerTab lang={lang} />}
      {tab === "club" && <ClubTab lang={lang} />}
      {tab === "league" && <LeagueTab lang={lang} />}
    </div>
  );
}
