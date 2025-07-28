import { useEffect, useState } from "react";

export default function SVCRate() {
  const [rate, setRate] = useState(null);

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
        if (data.result && data.result.data && data.result.data.SVC2USDC) {
          setRate(data.result.data.SVC2USDC);
        } else {
          console.error("Réponse JSON inattendue", data);
        }
      } catch (error) {
        console.error("Erreur récupération SVC2USDC :", error);
      }
    }
    fetchRate();
  }, []);

  if (rate === null)
    return <p className="text-sm text-gray-400">Chargement du taux SVC...</p>;

  return (
    <p className="text-sm text-green-400">
      💰 Taux SVC actuel : <strong>1 SVC = {rate} USDC</strong>
    </p>
  );
}
