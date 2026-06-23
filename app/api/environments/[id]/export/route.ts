import { NextRequest, NextResponse } from "next/server";
import { getEnvironment } from "@/lib/gateway";
import { buildBundle, buildZip, envSlug } from "@/lib/export";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const env = await getEnvironment(id);
  if (!env) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format");
  if (format === "json") {
    return NextResponse.json({ slug: envSlug(env), files: buildBundle(env) });
  }

  const zip = await buildZip(env);
  return new NextResponse(zip as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="nemoclaw-${envSlug(env)}.zip"`,
    },
  });
}
