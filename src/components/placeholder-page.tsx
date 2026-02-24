import type { ReactNode } from "react";

import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  subtitle: string;
  description: string;
  cards: Array<{
    title: string;
    body: string;
    content: ReactNode;
  }>;
};

export function PlaceholderPage({
  title,
  subtitle,
  description,
  cards,
}: PlaceholderPageProps) {
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-[var(--shadow-soft)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Coming Next
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl leading-tight text-[color:var(--text)] md:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--muted)] md:text-base">
              {description}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-4 py-2 text-sm font-medium text-[color:var(--text)] transition hover:border-[color:var(--border-strong)]"
          >
            Back to Builder
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                {subtitle}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{card.body}</p>
            </div>
            <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel-elevated)] p-4">
              {card.content}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
