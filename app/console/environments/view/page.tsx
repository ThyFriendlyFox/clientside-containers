"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EnvironmentDetail } from "@/components/EnvironmentDetail";

function Inner() {
  const id = useSearchParams().get("id") ?? "";
  return <EnvironmentDetail id={id} />;
}

export default function EnvironmentViewPage() {
  return (
    <div>
      <Link href="/console/environments" className="mb-4 inline-block text-sm text-zinc-400 hover:text-nv-green">
        ← Environments
      </Link>
      <Suspense fallback={<div className="card p-6 text-sm text-zinc-500">Loading…</div>}>
        <Inner />
      </Suspense>
    </div>
  );
}
