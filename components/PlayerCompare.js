"use client";
import React, { useEffect, useState, useMemo } from "react";

function formatSVC(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  return (val / 10000).toLocaleString("fr-FR") + " SVC";
}

const columns = [
  { key: "name", label: "Nom", style: { minWidth: 120 }, sortable: true },
  { key: "age", label: "Âge", style: { minWidth: 40 }, sortable: true, highlight: "min" },
  { key: "rating", label: "Note", style: { minWidth: 40, fontWeight: 700 }, sortable: true, highlight: "max" },
  { key: "value", label: "Valeur", style: { minWidth: 80 }, sortable: true, highlight: "max", format: formatSVC },
  { key: "wages", label: "Salaire", style: { minWidth: 80 }, sortable: true, highlight: "min", format: formatSVC },
];

export default function PlayerCompare({ playerIds = [] }) {
  const [players, setPlayers] = useState([]);
  const [sortKey, setSortKey] = useState("rating");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function fetchPlayers() {
      if (!playerIds.length) { setPlayers([]); return; }
      const results = await Promise.all(playerIds.map(async (id) => {
        try {
          const res = await fetch(`/api/players/detail?player_id=${id}`);
          const data = await res.json();
          const p = data?.items?.[0];
          if (!p) return null;
          return {
            player_id: p.player_id,
            name: p.name || p.nom || p.player_id,
            age: p.age,
            rating: p.rating,
            value: p.value,
            wages: p.wages,
          };
        } catch (e) {
          return null;
        }
      }));
      setPlayers(results.filter(Boolean));
    }
    fetchPlayers();
  }, [playerIds]);

  const bestValues = useMemo(() => {
    const res = {};
    columns.forEach(col => {
      if (col.highlight === "max")
        res[col.key] = Math.max(...players.map(p => p[col.key] ?? -Infinity));
      if (col.highlight === "min")
        res[col.key] = Math.min(...players.map(p => p[col.key] ?? Infinity));
    });
    return res;
  }, [players]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return sortAsc ? av - bv : bv - av;
      return sortAsc
        ? ("" + av).localeCompare("" + bv)
        : ("" + bv).localeCompare("" + av);
    });
  }, [players, sortKey, sortAsc]);

  if (!playerIds.length) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        color: "#fff",
        fontSize: 16,
        minWidth: 600,
        whiteSpace: "nowrap"
      }}>
        <thead>
          <tr style={{ background: "#181b2a", color: "#ffd700" }}>
            {columns.map(col => (
              <th key={col.key}
                onClick={() => col.sortable && (
                  sortKey === col.key ? setSortAsc(s => !s) : (setSortKey(col.key), setSortAsc(false))
                )}
                style={{
                  padding: "7px 6px",
                  userSelect: "none",
                  textAlign: "left",
                  fontWeight: 800,
                  cursor: col.sortable ? "pointer" : undefined,
                  ...col.style
                }}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: 5, fontSize: 13 }}>
                    {sortAsc ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p, idx) => (
            <tr key={p.player_id}
              style={{
                background: idx % 2 === 0 ? "#1a1c22" : "#181b22",
                borderBottom: "1px solid #23242e"
              }}
            >
              {columns.map(col => {
                const val = p[col.key];
                const best = bestValues[col.key];
                const isBest = best !== undefined && val === best;
                return (
                  <td key={col.key}
                    style={{
                      padding: "7px 6px",
                      ...col.style,
                      color: isBest ? "#64ffae" : undefined,
                      fontWeight: isBest ? 700 : undefined
                    }}
                  >
                    {col.format ? col.format(val) : (val ?? "-")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

