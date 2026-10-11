// Shared shell for the legal pages. The header and footer come from the root
// layout, so this only supplies the title block and readable prose column.
export default function LegalPage({ title, updated, sections }) {
  return (
    <section className="bg-footer">
      <div className="mx-auto max-w-[900px] px-5 py-14 md:px-10 md:py-20 lg:py-24">
        <h1 className="font-headline text-[2.25rem] leading-[1.08] tracking-[-0.01em] text-foreground uppercase sm:text-[2.75rem] lg:text-[3.25rem]">
          {title}
        </h1>
        <p className="mt-4 text-sm text-black/60">Last updated: {updated}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-base leading-relaxed text-black/75 md:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
