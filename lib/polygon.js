// lib/polygon.js
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

// Optionnel: définir POLYGON_RPC dans .env.local pour un endpoint dédié
export const polygonClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.POLYGON_RPC || "https://polygon-rpc.com"),
});
