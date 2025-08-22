import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

const FALLBACKS = [
  process.env.POLYGON_RPC_URL,                 // ton RPC si disponible
  "https://polygon-bor.publicnode.com",       // public
  "https://polygon-rpc.com",                  // public
  "https://rpc.ankr.com/polygon",             // public
].filter(Boolean);

export function getPolygonClient() {
  let lastErr;
  for (const url of FALLBACKS) {
    try {
      return createPublicClient({
        chain: polygon,
        transport: http(url, { retryCount: 2, timeout: 12000 }),
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Aucun RPC Polygon disponible.");
}
