// lib/polygon.js
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

const rpc = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

export const client = createPublicClient({
  chain: polygon,
  transport: http(rpc),
});
