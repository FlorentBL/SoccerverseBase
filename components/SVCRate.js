import { useEffect, useState } from "react";

export default function SVCRate() {
  const [rate, setRate] = useState(null);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch("https://api.soccerverse.games/api/market");
        const data = await res.json();
        setRate(data.SVC2USDC);
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
