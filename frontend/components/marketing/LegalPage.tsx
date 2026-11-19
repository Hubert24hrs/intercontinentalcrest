import { PageHero } from "./PageHero";

export type LegalSection = { id?: string; title: string; body: React.ReactNode };

export function LegalPage({ eyebrow, title, updated, intro, sections }: { eyebrow: string; title: string; updated: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={<>Last updated {updated}</>} />
      <section className="py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav className="hidden lg:block" aria-label="Sections">
            <ol className="sticky top-28 space-y-1 text-sm">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <a href={`#${s.id || `s${i + 1}`}`} className="block rounded-lg px-3 py-1.5 text-fg-muted hover:bg-surface hover:text-fg">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="max-w-3xl">
            <div className="text-[17px] leading-relaxed text-fg-muted">{intro}</div>
            {sections.map((s, i) => (
              <section key={s.title} id={s.id || `s${i + 1}`} className="mt-10 scroll-mt-28">
                <h2 className="text-xl font-semibold text-fg">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-fg-muted">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
