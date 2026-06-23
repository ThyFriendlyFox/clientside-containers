import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProvider, listProviders } from "@/lib/gateway";

export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().min(1).max(64),
  kind: z.string().min(1).max(64),
  key: z.string().min(1),
});

export async function GET() {
  try {
    return NextResponse.json(await listProviders());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  try {
    const provider = await createProvider(parsed.data);
    return NextResponse.json(provider, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
