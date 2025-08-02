"use client";
import React, { useEffect, useState } from "react";

const POSITIONS = {
  1: "GK", 2: "LB", 4: "CB", 8: "RB", 16: "LM", 32: "CM", 64: "RM",
  128: "LW", 256: "CF", 512: "RW",
  16384: "MULTI"
};

function timestampToAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob * 1000);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (
    <span style={{ color: "#00ffd0", fontWeight: 700 }}>
      {(val / 10000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} SVC
    </span>
  );
}

function ratingColor(val) {
  if (val == null) return "#fff";
  if (val >= 75) return "#64ffae";
  if (val < 65) return "#ff7575";
  return "#fff";
}
function deltaColor(delta) {
  if (delta == null) return "#aaa";
  if (delta > 0) return "#00ff77";
  if (delta < 0) return "#ff4e5e";
  return "#fff";
}

export default function FreebenchTable() {
  const [players, setPlayers] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [minRating, setMinRating] = useState("");
  const [sortKey, setSortKey] = useState("rating");
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch freebench
  useEffect(() => {
    async function fetchFreebench() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("https://gsppub.soccerverse.io/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "test",
            jsonrpc: "2.0",
            method: "get_freebench",
            params: {}
          }),
        });
        const data = await res.json();
        setPlayers(data.result?.data || []);
      } catch (e) {
        setErr("Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    fetchFreebench();
  }, []);

  // Fetch soccerratings ratings
  useEffect(() => {
    async function fetchRatings() {
      const ids = players.map(p => p.player_id);
      const toFetch = ids.filter(id => ratings[id] === undefined).slice(0, 30);
      if (toFetch.length === 0) return;
      const newRatings = {};
      await Promise.all(
        toFetch.map(async id => {
          try {
            const res = await fetch(`https://soccerratings.org/api/player/${id}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.nodata === 0) {
              newRatings[id] = {
                current: data.current_rating?.overall ?? null,
                projected: data.projected_rating?.overall ?? null,
                name: data.name || id,
                photo: data.photo || "",
                nat: data.nat_short || "",
              };
            }
          } catch (e) {}
        })
      );
      if (Object.keys(newRatings).length > 0)
        setRatings(r => ({ ...r, ...newRatings }));
    }
    if (players.length > 0) fetchRatings();
  }, [players]);

  // Filtrage et tri
  let filteredPlayers = players.filter(
    p => !minRating || p.rating >= parseInt(minRating)
  );
  filteredPlayers = filteredPlayers.sort((a, b) => {
    let av, bv;
    if (sortKey === "current") {
      av = ratings[a.player_id]?.current ?? -999;
      bv = ratings[b.player_id]?.current ?? -999;
    } else if (sortKey === "projected") {
      av = ratings[a.player_id]?.projected ?? -999;
      bv = ratings[b.player_id]?.projected ?? -999;
    } else if (sortKey === "delta") {
      const aDelta = ratings[a.player_id]?.projected - ratings[a.player_id]?.current;
      const bDelta = ratings[b.player_id]?.projected - ratings[b.player_id]?.current;
      av = aDelta ?? -999;
      bv = bDelta ?? -999;
    } else {
      av = a[sortKey] ?? -999;
      bv = b[sortKey] ?? -999;
    }
    if (typeof av === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? av - bv : bv - av;
  });

  const COLUMNS = [
    { key: "name", label: "Nom" },
    { key: "photo", label: "", style: { minWidth: 42 } },
    { key: "country_id", label: "Pays" },
    { key: "age", label: "Âge" },
    { key: "rating", label: "Note" },
    { key: "current", label: "Current" },
    { key: "projected", label: "Projected" },
    { key: "delta", label: "Δ OVR" },
    { key: "position", label: "Poste" },
    { key: "value", label: "Valeur" },
    { key: "wages", label: "Salaire" }
  ];

  return (
    <div style={{
      width: "100%",
      maxWidth: 1450,
      background: "#21232e",
      borderRadius: 15,
      boxShadow: "0 4px 22px #000a",
      padding: "10px 8px 8px 8px",
      marginBottom: 28,
      marginTop: 6
    }}>
      <div style={{ fontWeight: 900, fontSize: 23, marginBottom: 8, color: "#ffd700" }}>
        Freebench – Joueurs sans contrat
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontWeight: 600, fontSize: 16, color: "#ffd700" }}>Note minimale</label>
        <input
          type="number"
          value={minRating}
          min={0}
          max={99}
          onChange={e => setMinRating(e.target.value)}
          style={{
            marginLeft: 8, width: 74, padding: "6px 8px", borderRadius: 5,
            border: "1px solid #363a42", background: "#191d22", color: "#f8f8f8", fontSize: 16
          }}
          placeholder="65"
        />
      </div>
      {loading && <div style={{ color: "#ffd700", fontWeight: 500, margin: 12 }}>Chargement…</div>}
      {err && <div style={{ color: "#ff4e5e", margin: 12 }}>{err}</div>}
      {!loading && !err && (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#fff",
            fontSize: 16,
            minWidth: 1200,
            whiteSpace: "nowrap"
          }}>
            <thead>
              <tr style={{ background: "#181b2a", color: "#ffd700" }}>
                {COLUMNS.map(col => (
                  <th key={col.key}
                    onClick={() => {
                      if (sortKey === col.key) setSortAsc(s => !s);
                      else { setSortKey(col.key); setSortAsc(false); }
                    }}
                    style={{
                      padding: "7px 6px",
                      cursor: "pointer",
                      background: sortKey === col.key ? "#191e2b" : undefined,
                      color: "#ffd700", userSelect: "none", minWidth: col.style?.minWidth || 72,
                      textAlign: "left", fontWeight: 800, fontSize: 16, border: "none"
                    }}>
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{
                        marginLeft: 5, fontSize: 13
                      }}>{sortAsc ? "▲" : "▼"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((p, idx) => {
                const r = ratings[p.player_id] || {};
                const delta = r.projected != null && r.current != null
                  ? r.projected - r.current : null;
                return (
                  <tr key={p.player_id}
                    style={{
                      background: idx % 2 === 0 ? "#1a1c22" : "#181b22",
                      borderBottom: "1px solid #23242e",
                      transition: "background 0.13s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#23233a"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#1a1c22" : "#181b22"}
                  >
                    {/* Nom (lien + drapeau) */}
                    <td style={{ padding: "7px", fontWeight: 700, whiteSpace: "nowrap" }}>
                      <a
                        href={`https://play.soccerverse.com/player/${p.player_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#4f47ff", fontWeight: 700, textDecoration: "underline", whiteSpace: "nowrap"
                        }}>
                        {r.name || p.player_id}
                      </a>
                    </td>
                    {/* Photo */}
                    <td style={{ padding: "7px" }}>
                      {r.photo
                        ? <img src={r.photo} alt="." style={{
                            width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #222", background: "#333"
                          }}/>
                        : <span style={{ color: "#aaa" }}>-</span>
                      }
                    </td>
                    <td style={{ padding: "7px", fontWeight: 700 }}>{p.country_id || r.nat || "-"}</td>
                    <td style={{ padding: "7px", fontWeight: 700 }}>{timestampToAge(p.dob)}</td>
                    <td style={{
                      padding: "7px", fontWeight: 900,
                      color: ratingColor(p.rating)
                    }}>{p.rating ?? "-"}</td>
                    <td style={{
                      padding: "7px", fontWeight: 900,
                      color: ratingColor(r.current)
                    }}>{r.current ?? <span style={{ color: "#888" }}>…</span>}</td>
                    <td style={{
                      padding: "7px", fontWeight: 900,
                      color: ratingColor(r.projected)
                    }}>{r.projected ?? <span style={{ color: "#888" }}>…</span>}</td>
                    <td style={{
                      padding: "7px", fontWeight: 900,
                      color: deltaColor(delta)
                    }}>{delta != null ? (delta > 0 ? "+" : "") + delta : <span style={{ color: "#888" }}>…</span>}</td>
                    <td style={{ padding: "7px", fontWeight: 700, color: "#ffd700" }}>
                      {POSITIONS[p.position] || p.position}
                    </td>
                    <td style={{ padding: "7px", fontWeight: 700 }}>{formatSVC(p.value)}</td>
                    <td style={{ padding: "7px", fontWeight: 700 }}>{formatSVC(p.wages)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPlayers.length === 0 && (
            <div style={{ textAlign: "center", color: "#b0b8cc", padding: 14, fontSize: 18 }}>
              Aucun joueur ne correspond au filtre.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
