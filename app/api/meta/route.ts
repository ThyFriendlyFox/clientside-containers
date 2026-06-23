import { NextResponse } from "next/server";
import { MODE, GATEWAY_URL } from "@/lib/gateway";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    mode: MODE,
    gatewayUrl: MODE === "gateway" ? GATEWAY_URL : null,
  });
}
