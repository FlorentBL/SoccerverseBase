"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { COST_FIELDS } from "./utils";

// Calcule le flux net d'une semaine
function netWeek(week) {
  return Object.entries(week).reduce((acc, [k, v]) => {
    if (typeof v !== "number") return acc;
    return COST_FIELDS.includes(k) ? acc - Math.abs(v) : acc + v;
  }, 0);
}

export default function FinanceHistoryChart({ data = [] }) {
  if (!data || data.length === 0) return null;

  const seasonKeys = data.map(d => `S${d.season_id}`);
  const maxWeeks = Math.max(...data.map(d => d.weeks.length));
  const chartData = [];

  for (let i = 0; i < maxWeeks; i++) {
    const row = { week: i + 1 };
    data.forEach(d => {
      const week = d.weeks[i];
      if (week) {
        row[`S${d.season_id}`] = netWeek(week) / 10000; // conversion $SVC
      }
    });
    chartData.push(row);
  }

  const colors = ["#8884d8", "#82ca9d", "#ff7300", "#ffc658", "#00C49F", "#0088FE"];

  return (
    <div className="w-full h-80 mt-8">
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Legend />
          {seasonKeys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx % colors.length]}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
