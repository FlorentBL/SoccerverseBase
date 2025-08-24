import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPolygonscanKey() {
  return (
    process.env.POLYGONSCAN_API_KEY ||
    process.env.POLYGONSCAN_KEY ||
    process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY ||
    ""
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    runtime: "nodejs",
    hasPolygonscanKey: Boolean(getPolygonscanKey()),
    rpcUrlSet: Boolean(process.env.POLYGON_RPC_URL),
    // debug optionnel: quels noms existent (sans exposer de secrets)
    keysSeen: {
      POLYGONSCAN_API_KEY: Boolean(process.env.POLYGONSCAN_API_KEY),
      POLYGONSCAN_KEY: Boolean(process.env.POLYGONSCAN_KEY),
      NEXT_PUBLIC_POLYGONSCAN_API_KEY: Boolean(process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY),
    },
  });
}
