// lib/polygon.js
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

const RPC =
  process.env.POLYGON_RPC_URL?.trim() ||
  // Public endpoint (works fine for read-only):
  "https://polygon-rpc.com";

export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(RPC, { batch: true, timeout: 15_000 }),
});
