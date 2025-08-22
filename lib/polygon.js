// /lib/polygon.js
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

const POLY_RPC = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

export const publicClient = createPublicClient({
  chain: polygon,              // 🔒 force mainnet (chainId 137)
  transport: http(POLY_RPC),   // ou ton Alchemy/Infura
});
