import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEnvironment, listEnvironments } from "@/lib/gateway";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().max(64).optional(),
  templateId: z.string().nullable().optional(),
  baseId: z.string().optional(),
  apps: z.array(z.string()).optional(),
  resources: z
    .object({
      cpus: z.number().int().min(1).max(64),
      memoryMb: z.number().int().min(256).max(262144),
      diskGb: z.number().int().min(1).max(2048),
    })
    .optional(),
  driver: z.enum(["docker", "podman", "microvm", "kubernetes"]).optional(),
  autostart: z.boolean().optional(),
});

export async function GET() {
  try {
    return NextResponse.json(await listEnvironments());
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
    const env = await createEnvironment(parsed.data);
    return NextResponse.json(env, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
