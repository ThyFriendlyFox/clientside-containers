import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSandbox, listSandboxes } from "@/lib/gateway";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().max(64).optional(),
  agent: z.enum(["openclaw", "hermes", "langchain-deepagents-code"]),
  driver: z.enum(["docker", "podman", "microvm", "kubernetes"]),
  provider: z.string().nullable().optional(),
  presetId: z.string().nullable().optional(),
});

export async function GET() {
  try {
    return NextResponse.json(await listSandboxes());
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
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  try {
    const sandbox = await createSandbox(parsed.data);
    return NextResponse.json(sandbox, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
