// app/api/diag/env/route.js
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasKey = Boolean(process.env.POLYGONSCAN_KEY);
  const rpc = process.env.POLYGON_RPC_URL || "";
  return NextResponse.json({
    ok: true,
    runtime: "nodejs",
    hasPolygonscanKey: hasKey,
    rpcUrlSet: Boolean(rpc),
  });
}
