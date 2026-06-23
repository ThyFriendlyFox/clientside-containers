import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteEnvironment, getEnvironment, setEnvironmentAutostart } from "@/lib/gateway";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const env = await getEnvironment(id);
    if (!env) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(env);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

const PatchSchema = z.object({ autostart: z.boolean() });

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected { autostart: boolean }" }, { status: 400 });
  }
  try {
    const env = await setEnvironmentAutostart(id, parsed.data.autostart);
    if (!env) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(env);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const ok = await deleteEnvironment(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
