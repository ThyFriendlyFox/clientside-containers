import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateContainer } from "@/lib/gateway";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  kind: z.enum(["sandbox", "environment"]),
  settings: z
    .object({
      runtimeMode: z.enum(["headless", "minios"]).optional(),
      miniosBaseId: z.string().optional(),
      networkEgress: z.enum(["minimal", "restricted", "custom"]).optional(),
      safetyProfile: z.enum(["strict", "balanced", "permissive"]).optional(),
      allowInferenceRouting: z.boolean().optional(),
    })
    .optional(),
  policyYaml: z.string().optional(),
});

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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  try {
    const view = await updateContainer(id, parsed.data);
    if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(view);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
