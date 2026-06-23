export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="#76b900" strokeWidth="1.6" />
        <path d="M7 16V8l5 5 5-5v8" stroke="#76b900" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>
        clientside<span className="text-nv-green">-containers</span>
      </span>
    </span>
  );
}
