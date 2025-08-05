"use client";
import { useEffect, useState } from "react";

const T = {
  fr: {
    title: "Carrière",
    season: "Saison",
    club: "Club",
    transfer: "Transfert",
    loading: "Chargement...",
    error: "Erreur de chargement",
    noData: "Aucun historique"
  },
  en: {
    title: "Career",
    season: "Season",
    club: "Club",
    transfer: "Transfer",
    loading: "Loading...",
    error: "Load error",
    noData: "No history"
  },
  it: {
    title: "Carriera",
    season: "Stagione",
    club: "Club",
    transfer: "Trasferimento",
    loading: "Caricamento...",
    error: "Errore di caricamento",
    noData: "Nessuna cronologia"
  }
};

export default function PlayerCareerTimeline({ playerId, lang = "fr" }) {
  const [history, setHistory] = useState([]);
  const [clubs, setClubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const t = T[lang] || T.fr;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const [histRes, clubRes] = await Promise.all([
          fetch(`/api/players/${playerId}/career`),
          fetch(`/club_mapping.json`)
        ]);
        if (!histRes.ok) throw new Error("history");
        const hist = await histRes.json();
        const clubMap = clubRes.ok ? await clubRes.json() : {};
        setHistory(hist.items || hist.history || hist);
        setClubs(clubMap);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (playerId) load();
  }, [playerId]);

  if (loading) return <div>{t.loading}</div>;
  if (err) return <div style={{ color: "#f66" }}>{t.error}</div>;
  if (!history || history.length === 0) return <div>{t.noData}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{t.title}</h2>
      <ul style={{ listStyle: "none", borderLeft: "3px solid #4f47ff", marginLeft: 10, paddingLeft: 20 }}>
        {history.map((item, idx) => {
          const prev = idx > 0 ? history[idx - 1] : null;
          const clubName = clubs[item.club_id]?.name || item.club_name || item.club_id;
          const transferred = prev && prev.club_id !== item.club_id;
          return (
            <li key={idx} style={{ marginBottom: 12, position: "relative" }}>
              <div style={{ position: "absolute", left: -27, top: 6, width: 12, height: 12, borderRadius: "50%", background: "#4f47ff" }} />
              <div style={{ fontWeight: 600 }}>{t.season} {item.season_id ?? item.season}</div>
              <div>{t.club}: {clubName}</div>
              {transferred && <div style={{ color: "#4f47ff", fontSize: 14 }}>{t.transfer}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
