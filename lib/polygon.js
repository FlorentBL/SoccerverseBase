// lib/polygon.js
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

const RPC = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.POLYGON_RPC || "https://polygon-rpc.com"),
});

// Helper lecture de contrat
export function readContract(address, abi, functionName, args = []) {
  return publicClient.readContract({ address, abi, functionName, args });
}

// Helper logs (utile plus tard pour scanner les events)
export function getLogs(params) {
  return publicClient.getLogs(params);
}

