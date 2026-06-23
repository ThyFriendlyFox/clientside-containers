import Link from "next/link";
import { SandboxDetail } from "@/components/SandboxDetail";

export const dynamic = "force-dynamic";

export default async function SandboxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <Link href="/console/sandboxes" className="mb-4 inline-block text-sm text-zinc-400 hover:text-nv-green">
        ← Sandboxes
      </Link>
      <SandboxDetail id={id} />
    </div>
  );
}
