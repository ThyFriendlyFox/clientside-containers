"use client";

interface Props {
  containerId: string;
  name: string;
  className?: string;
}

export function DesktopBottleFrame({ containerId, name, className }: Props) {
  const base = process.env.PAGES_BASE_PATH ?? "";
  const src = `${base}/console/runtime/desktop/?id=${encodeURIComponent(containerId)}`;

  return (
    <iframe
      title={`${name} desktop bottle`}
      src={src}
      className={className ?? "h-full w-full rounded-lg border border-ink-600 bg-ink-900"}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
