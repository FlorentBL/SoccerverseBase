"use client";

import { useEffect, useState } from "react";

export default function SVCRate({ className = "" }) {
  const [rate, setRate] = useState(null);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch("https://services.soccerverse.com/api/market");
        const data = await res.json();
        if (data && data.SVC2USDC) {
          setRate(data.SVC2USDC);
        }
      } catch (error) {
        console.error("Erreur récupération SVC2USDC :", error);
      }
    }
    fetchRate();
  }, []);

  if (rate === null) {
    return null;
  }

  return (
    <span className={`text-sm text-gray-300 ${className}`}>
      {`1 SVC = $${rate.toFixed(8)}`}
    </span>
  );
}
