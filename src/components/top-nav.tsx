"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { requestResumePdfExport } from "@/lib/export-pdf";

const NAV_ITEMS = [
  { href: "/", label: "Builder" },
  { href: "/generator", label: "Generator" },
  { href: "/applications", label: "Applications" },
  { href: "/instructor", label: "Instructor Review" },
] as const;

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function TopNav() {
  const pathname = usePathname();
  const isBuilder = pathname === "/";

  return (
    <header className="no-print sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:rgba(255,255,255,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-4 px-4 md:px-6">
        <div className="mr-1 flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--panel-elevated)] text-sm font-semibold tracking-tight text-[color:var(--accent)]">
            RT
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--text)]">
              Resume Tool
            </p>
            <p className="truncate text-xs text-[color:var(--muted)]">
              Master Resume Workspace
            </p>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-1 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[color:var(--panel-elevated)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--border-strong)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--text)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isBuilder ? (
            <>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("resume-tool:reset-request"))
                }
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--panel-elevated)]"
              >
                Reset Sample
              </button>
              <button
                type="button"
                onClick={() => requestResumePdfExport()}
                className="rounded-xl border border-[color:var(--accent-strong)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(11,94,215,0.22)] transition hover:brightness-105"
              >
                Export PDF
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm font-medium text-[color:var(--text)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--panel-elevated)]"
            >
              Open Builder
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
