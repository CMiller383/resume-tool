import { PlaceholderPage } from "@/components/placeholder-page";

export default function ApplicationsPage() {
  return (
    <PlaceholderPage
      title="Application Tracker"
      subtitle="Tracker"
      description="Students will track applications in a simple dashboard linked to the exact resume version and job description used for each submission."
      cards={[
        {
          title: "Application Table",
          body: "Company - Role - Link - Date - Status - Resume Version - Notes",
          content: (
            <div className="space-y-2 text-xs text-[color:var(--muted)]">
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] p-2">
                <span>Northstar</span>
                <span>PM Intern</span>
                <span className="justify-self-end rounded-full bg-[color:var(--info-soft)] px-2 py-0.5 text-[color:var(--accent)]">
                  Applied
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] p-2">
                <span>Helio Labs</span>
                <span>Analyst</span>
                <span className="justify-self-end rounded-full bg-[color:var(--warn-soft)] px-2 py-0.5 text-[color:var(--warn)]">
                  Wishlist
                </span>
              </div>
            </div>
          ),
        },
        {
          title: "Status Workflow",
          body: "Wishlist / Applied / Interview / Offer / Rejected",
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {["Wishlist", "Applied", "Interview", "Offer", "Rejected"].map((status) => (
                <span
                  key={status}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1 text-[color:var(--muted)]"
                >
                  {status}
                </span>
              ))}
            </div>
          ),
        },
        {
          title: "Application Detail",
          body: "View linked resume version and stored job description snapshot.",
          content: (
            <div className="space-y-2 text-sm text-[color:var(--muted)]">
              <div className="h-14 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)]" />
              <div className="h-20 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)]" />
            </div>
          ),
        },
      ]}
    />
  );
}


