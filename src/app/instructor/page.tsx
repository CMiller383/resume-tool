import { PlaceholderPage } from "@/components/placeholder-page";

export default function InstructorPage() {
  return (
    <PlaceholderPage
      title="Instructor Review Portal"
      subtitle="Instructor"
      description="Instructors will create classes, review student master resumes and tailored versions, leave comments on bullets or entire resumes, and mark submissions reviewed."
      cards={[
        {
          title: "Classes + Roster",
          body: "Create classes, generate join codes, and manage students.",
          content: (
            <div className="space-y-2 text-sm text-[color:var(--muted)]">
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2">
                Career Practicum 301 - 28 students
              </div>
              <div className="rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2">
                Join Code: CRR-2026-01
              </div>
            </div>
          ),
        },
        {
          title: "Student Resume Review",
          body: "View master resume + submitted versions in a structured reader.",
          content: (
            <div className="grid gap-2 text-sm text-[color:var(--muted)]">
              <div className="h-16 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)]" />
              <div className="h-28 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)]" />
            </div>
          ),
        },
        {
          title: "Comments + Review Status",
          body: "Basic Google-Docs-style commenting on bullets and full resumes.",
          content: (
            <div className="space-y-2 text-sm">
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] p-3">
                <p className="font-medium text-[color:var(--text)]">Comment on bullet</p>
                <p className="mt-1 text-[color:var(--muted)]">
                  &quot;Quantify the impact in the first sentence.&quot;
                </p>
              </div>
              <span className="inline-flex rounded-full bg-[color:var(--success-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--success)]">
                Mark Reviewed
              </span>
            </div>
          ),
        },
      ]}
    />
  );
}


