import type { ReactNode } from "react";

import { TopNav } from "@/components/top-nav";
import { ToastHost } from "@/components/toast-host";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <div
        aria-hidden="true"
        className="no-print pointer-events-none fixed inset-0 -z-10 opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(11,94,215,0.10),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(14,165,233,0.08),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.06),transparent_50%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>
      <TopNav />
      <main className="mx-auto w-full max-w-[1800px] px-3 pb-3 pt-3 md:px-6 md:pb-6 md:pt-5">
        {children}
      </main>
      <ToastHost />
    </div>
  );
}
