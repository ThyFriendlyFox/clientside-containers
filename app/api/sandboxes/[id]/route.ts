import { NextResponse } from "next/server";
import { deleteSandbox, getSandbox } from "@/lib/gateway";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const sandbox = await getSandbox(id);
    if (!sandbox) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sandbox);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const ok = await deleteSandbox(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
