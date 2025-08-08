"use client";
import { useState, useEffect } from "react";

export default function SvcConverterPage() {
  const [svcRate, setSvcRate] = useState(null);
  const [influenceCost, setInfluenceCost] = useState(0.076);
  const [margin, setMargin] = useState(0);
  const [packPrice, setPackPrice] = useState(1.99875);
  const [packParts, setPackParts] = useState(100);
  const [sellResult, setSellResult] = useState("");
  const [packResult, setPackResult] = useState("");

  useEffect(() => {
    const proxy = "https://corsproxy.io/?";
    const apiUrl = "https://services.soccerverse.com/api/market";
    fetch(proxy + encodeURIComponent(apiUrl))
      .then((r) => r.json())
      .then((data) => setSvcRate(data.SVC2USDC))
      .catch(() => setSvcRate(null));
  }, []);

  function calculateSellPrice() {
    if (!svcRate) {
      setSellResult("Taux SVC/USDC non disponible.");
      return;
    }
    const costPerInfluence = influenceCost / 10;
    const priceInSVC = costPerInfluence / svcRate;
    const priceWithMargin = priceInSVC * (1 + margin / 100);
    setSellResult(
      `Prix minimum (sans marge) : ${priceInSVC.toFixed(4)} SVC\n` +
        `Prix avec ${margin}% de marge : ${priceWithMargin.toFixed(4)} SVC`
    );
  }

  function comparePack() {
    if (!svcRate) {
      setPackResult("Taux SVC/USDC non disponible.");
      return;
    }
    const pricePerPartUSDC = packPrice / packParts;
    const pricePerPartSVC = pricePerPartUSDC / svcRate;
    setPackResult(
      `Prix par part dans le pack : ${pricePerPartUSDC.toFixed(5)} USDC\n` +
        `Équivalent en SVC : ${pricePerPartSVC.toFixed(4)} SVC\n` +
        `👉 Ne pas acheter une part au-dessus de ${pricePerPartSVC.toFixed(4)} SVC sur le marché.`
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 border rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-4">Calculateur de parts en SVC</h2>
      <div className="mb-4 text-gray-700">
        Taux actuel : {" "}
        {svcRate ? `1 SVC = ${svcRate.toFixed(8)} USDC` : "Chargement..."}
      </div>

      <hr className="my-4" />

      <h3 className="font-semibold mb-2">🔹 1. Calculer prix de revente par part</h3>
      <label className="block mt-3">
        Coût total d'influence (ex. pour 10 parts) en USDC :
        <input
          type="number"
          className="w-full p-2 border mt-1"
          value={influenceCost}
          step="0.0001"
          onChange={(e) => setInfluenceCost(parseFloat(e.target.value))}
        />
      </label>
      <label className="block mt-3">
        Marge bénéficiaire (%) :
        <input
          type="number"
          className="w-full p-2 border mt-1"
          value={margin}
          step="0.1"
          onChange={(e) => setMargin(parseFloat(e.target.value))}
        />
      </label>
      <button
        onClick={calculateSellPrice}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Calculer le prix de revente
      </button>
      {sellResult && (
        <div className="mt-4 font-bold whitespace-pre-line">{sellResult}</div>
      )}

      <hr className="my-6" />

      <h3 className="font-semibold mb-2">🔹 2. Comparer au prix d’un pack</h3>
      <label className="block mt-3">
        Prix du pack (en USDC) :
        <input
          type="number"
          className="w-full p-2 border mt-1"
          value={packPrice}
          step="0.00001"
          onChange={(e) => setPackPrice(parseFloat(e.target.value))}
        />
      </label>
      <label className="block mt-3">
        Nombre de parts dans le pack :
        <input
          type="number"
          className="w-full p-2 border mt-1"
          value={packParts}
          step="1"
          onChange={(e) => setPackParts(parseFloat(e.target.value))}
        />
      </label>
      <button
        onClick={comparePack}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Calculer le prix max par part
      </button>
      {packResult && (
        <div className="mt-4 font-bold whitespace-pre-line">{packResult}</div>
      )}
    </div>
  );
}

