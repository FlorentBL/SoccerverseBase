// lib/polygon.js
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

export function getPolygonClient() {
  const rpc = process.env.POLYGON_RPC_URL;
  if (!rpc) {
    throw new Error(
      "POLYGON_RPC_URL manquant. Ajoute la variable d'environnement sur Vercel."
    );
  }
  return createPublicClient({
    chain: polygon,
    transport: http(rpc),
  });
}
