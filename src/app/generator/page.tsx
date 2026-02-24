import { PlaceholderPage } from "@/components/placeholder-page";

export default function GeneratorPage() {
  return (
    <PlaceholderPage
      title="Tailored Resume Generator"
      subtitle="Generator"
      description="This next module will let students paste a job description, rank master-resume bullets by relevance, and generate saved resume versions before export."
      cards={[
        {
          title: "Job Description Input",
          body: "Paste text only. No scraping in MVP.",
          content: (
            <div className="space-y-2">
              <div className="h-24 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)]" />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--muted)]"
                >
                  Match Bullets
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--muted)]"
                >
                  Generate Draft
                </button>
              </div>
            </div>
          ),
        },
        {
          title: "AI Match Results",
          body: "Uses bullet tags + JD text to prioritize relevant content.",
          content: (
            <div className="space-y-2 text-sm text-[color:var(--muted)]">
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2">
                Product Strategy Intern bullet match: 92%
              </div>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2">
                Consulting case analysis bullet match: 84%
              </div>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2">
                Leadership workshop bullet match: 71%
              </div>
            </div>
          ),
        },
        {
          title: "Resume Version",
          body: "Saved snapshot: version name, JD, final resume content, timestamp.",
          content: (
            <div className="space-y-2 text-sm">
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] p-3">
                <p className="font-medium text-[color:var(--text)]">
                  Version: PM Intern - Northstar
                </p>
                <p className="mt-1 text-[color:var(--muted)]">
                  Saved from matched master bullets with manual edits before export.
                </p>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

