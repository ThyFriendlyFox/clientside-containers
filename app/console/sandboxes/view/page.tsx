"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SandboxDetail } from "@/components/SandboxDetail";

function Inner() {
  const id = useSearchParams().get("id") ?? "";
  return <SandboxDetail id={id} />;
}

export default function SandboxViewPage() {
  return (
    <div>
      <Link href="/console/sandboxes" className="mb-4 inline-block text-sm text-zinc-400 hover:text-nv-green">
        ← Sandboxes
      </Link>
      <Suspense fallback={<div className="card p-6 text-sm text-zinc-500">Loading…</div>}>
        <Inner />
      </Suspense>
    </div>
  );
}
