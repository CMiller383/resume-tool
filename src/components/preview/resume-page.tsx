import { forwardRef } from "react";

import { formatDateRange, normalizeUrl } from "@/lib/formatting";
import type { PreviewResume } from "@/lib/selectors";

type ResumePageProps = {
  resume: PreviewResume;
};

function hasVisiblePersonal(resume: PreviewResume) {
  if (!resume.personal.selected) return false;
  const { fullName, email, phone, location, website, linkedin } = resume.personal;
  return [fullName, email, phone, location, website, linkedin].some((value) => value.trim());
}

function hasVisibleSummary(resume: PreviewResume) {
  return resume.summary.selected && resume.summary.text.trim().length > 0;
}

function hasVisibleEntrySection(section: PreviewResume["experience"]) {
  return section.some((entry) => entry.selected);
}

function hasVisibleSkills(resume: PreviewResume) {
  return resume.skills.some((group) => group.items.length > 0);
}

export const ResumePage = forwardRef<HTMLDivElement, ResumePageProps>(function ResumePage(
  { resume },
  forwardedRef,
) {
  const personalTokens = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.website,
    resume.personal.linkedin,
  ].filter((value) => value.trim());

  const visibleSections = {
    personal: hasVisiblePersonal(resume),
    summary: hasVisibleSummary(resume),
    experience: hasVisibleEntrySection(resume.experience),
    projects: hasVisibleEntrySection(resume.projects),
    leadership: hasVisibleEntrySection(resume.leadership),
    skills: hasVisibleSkills(resume),
  };

  return (
    <div
      className="resume-page relative h-[1056px] w-[816px] overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
      data-resume-page
    >
      <div
        ref={forwardedRef}
        className="resume-page-content h-full w-full px-[0.52in] py-[0.45in] text-[12px] leading-[1.38] text-black"
      >
        {visibleSections.personal && (
          <header className="border-b border-black/35 pb-3">
            {resume.personal.fullName && (
              <h1 className="font-[family-name:var(--font-serif)] text-[28px] leading-[1.05] tracking-tight text-black">
                {resume.personal.fullName}
              </h1>
            )}
            {personalTokens.length > 0 && (
              <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-black/80">
                {personalTokens.map((token, idx) => {
                  const isLink = token.includes(".") && !token.includes("@");
                  const href = isLink ? normalizeUrl(token) : undefined;
                  const content = href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-black/25 underline-offset-2 hover:decoration-black/60"
                    >
                      {token}
                    </a>
                  ) : (
                    token
                  );
                  return (
                    <span key={`${token}-${idx}`} className="inline-flex items-center gap-2">
                      {idx > 0 && (
                        <span aria-hidden="true" className="text-black/35">
                          |
                        </span>
                      )}
                      {content}
                    </span>
                  );
                })}
              </p>
            )}
          </header>
        )}

        {visibleSections.summary && (
          <section className="resume-section mt-4">
            <ResumeSectionHeading title="Summary" />
            <p className="mt-1.5 text-[11.4px] leading-[1.45] text-black/90">
              {resume.summary.text}
            </p>
          </section>
        )}

        {visibleSections.experience && (
          <section className="resume-section mt-4">
            <ResumeSectionHeading title="Experience" />
            <div className="mt-2 space-y-2.5">
              {resume.experience.map((entry) => (
                <ResumeEntryBlock key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {visibleSections.projects && (
          <section className="resume-section mt-4">
            <ResumeSectionHeading title="Projects" />
            <div className="mt-2 space-y-2.5">
              {resume.projects.map((entry) => (
                <ResumeEntryBlock key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {visibleSections.leadership && (
          <section className="resume-section mt-4">
            <ResumeSectionHeading title="Leadership" />
            <div className="mt-2 space-y-2.5">
              {resume.leadership.map((entry) => (
                <ResumeEntryBlock key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {visibleSections.skills && (
          <section className="resume-section mt-4">
            <ResumeSectionHeading title="Skills" />
            <div className="mt-2 space-y-1.5 text-[11.3px]">
              {resume.skills.map((group) => (
                <p key={group.id} className="leading-[1.35]">
                  <span className="font-semibold text-black">{group.groupName}: </span>
                  <span className="text-black/85">
                    {group.items.map((item) => item.label).join(", ")}
                  </span>
                </p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
});

function ResumeSectionHeading({ title }: { title: string }) {
  return (
    <div className="border-b border-black/20 pb-0.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-black">
        {title}
      </h2>
    </div>
  );
}

function ResumeEntryBlock({ entry }: { entry: PreviewResume["experience"][number] }) {
  if (!entry.selected) return null;
  return (
    <article>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4">
        <div className="min-w-0">
          <p className="text-[11.5px] leading-[1.25]">
            <span className="font-semibold text-black">{entry.title}</span>
            {entry.organization && (
              <>
                <span className="text-black/35"> | </span>
                <span className="italic text-black/90">{entry.organization}</span>
              </>
            )}
          </p>
          {entry.location && <p className="text-[10.9px] text-black/65">{entry.location}</p>}
        </div>
        <p className="text-right text-[10.9px] text-black/75">
          {formatDateRange(entry.startDate, entry.endDate)}
        </p>
      </div>

      {entry.bullets.length > 0 && (
        <ul className="mt-1.5 space-y-1 pl-4 text-[11.1px] leading-[1.35] text-black/90">
          {entry.bullets.map((bullet) => (
            <li key={bullet.id} className="list-disc marker:text-black/60">
              {bullet.text}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

