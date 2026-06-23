import Link from "next/link";
import { EnvironmentDetail } from "@/components/EnvironmentDetail";

export const dynamic = "force-dynamic";

export default async function EnvironmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <Link href="/console/environments" className="mb-4 inline-block text-sm text-zinc-400 hover:text-nv-green">
        ← Environments
      </Link>
      <EnvironmentDetail id={id} />
    </div>
  );
}
