import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setPolicy } from "@/lib/gateway";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({ policy: z.string().min(1) });

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing policy field" }, { status: 400 });
  }
  try {
    const sandbox = await setPolicy(id, parsed.data.policy);
    if (!sandbox) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sandbox);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
