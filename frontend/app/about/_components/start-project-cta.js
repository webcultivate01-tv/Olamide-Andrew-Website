import Link from "next/link";
import Reveal from "../../components/reveal";

export default function StartProjectCta() {
  return (
    <section className="bg-footer">
      <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-16 lg:px-20 lg:py-20">
        {/* The card lifts in as one piece, then its contents follow — the
            frame arrives first so the copy has somewhere to land. */}
        <Reveal className="flex flex-col gap-8 rounded-[20px] border border-black/10 px-6 py-10 md:px-10 md:py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div>
            <Reveal
              as="p"
              delay={220}
              className="text-xs tracking-[0.04em] text-black/70 uppercase md:text-sm"
            >
              Ready to build something real?
            </Reveal>

            {/* 1.12 leading leaves a clear band of white between the two
                wrapped lines of Anton caps. */}
            <Reveal variant="mask" delay={300} className="mt-4">
              <h2 className="font-headline max-w-[900px] text-[2rem] leading-[1.12] tracking-[-0.01em] text-foreground uppercase sm:text-[2.5rem] lg:text-[3rem]">
                Lets turn your ideas into{" "}
                <span className="text-accent">
                  thoughtful brands with a clear direction.
                </span>
              </h2>
            </Reveal>
          </div>

          <Reveal delay={420} className="shrink-0 self-start lg:self-auto">
            <Link
              href="/contact"
              className="font-nav inline-block bg-accent px-7 py-3.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-accent-hover lg:text-lg"
            >
              Start a project
            </Link>
          </Reveal>
        </Reveal>
      </div>
    </section>
  );
}
