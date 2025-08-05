import { useEffect, useState } from "react";

export default function SVCRate() {
  const [rate, setRate] = useState(null);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch("https://services.soccerverse.com/gsp/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "market_getMarketData",
            params: [],
            id: "test",
          }),
        });
        const data = await res.json();
        setDebug(data); // Affichage complet pour diagnostic
        // on garde la logique précédente au cas où ça fonctionne
        if (data.result && data.result.data && data.result.data.SVC2USDC) {
          setRate(data.result.data.SVC2USDC);
        }
      } catch (error) {
        console.error("Erreur récupération SVC2USDC :", error);
      }
    }
    fetchRate();
  }, []);

  return (
    <div className="text-sm text-gray-300">
      {rate !== null ? (
        <p className="text-indigo-400">
          💰 Taux SVC actuel : <strong>1 SVC = {rate} USDC</strong>
        </p>
      ) : (
        <pre>{JSON.stringify(debug, null, 2)}</pre>
      )}
    </div>
  );
}
