import Link from "next/link";
import Reveal from "../../components/reveal";

/**
 * The closing call to action on a post: a small eyebrow, a two-line headline
 * and a discovery-call button, flanked by two large grey discs that bleed off
 * the left and right edges. The discs are decoration only, so they are hidden
 * from assistive tech and never take pointer events.
 */
export default function BlogDiscoveryCta() {
  return (
    <section className="relative overflow-hidden bg-[#f4f7fa] px-4 pt-10 pb-[42px] text-center md:bg-white md:px-10 md:py-20 lg:px-0 lg:py-[80px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -left-[70%] hidden h-[140%] w-[95%] -translate-y-1/2 rounded-full bg-[#d9d9d9] md:block md:-left-[22%] md:w-[38%] lg:top-[-440px] lg:-left-[776px] lg:h-[1130px] lg:w-[1130px] lg:translate-y-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-[70%] hidden h-[140%] w-[95%] -translate-y-1/2 rounded-full bg-[#d9d9d9] md:block md:-right-[22%] md:w-[38%] lg:top-[-380px] lg:-right-[936px] lg:h-[1290px] lg:w-[1290px] lg:translate-y-0"
      />

      <div className="relative mx-auto max-w-[900px] rounded-3xl border border-[#c9ced4] px-4 pt-3 pb-[15px] md:rounded-none md:border-0 md:p-0">
        <Reveal as="p" className="text-[15px] leading-6 text-foreground/80 uppercase md:text-base">
          <span className="md:hidden">Ready to build something real?</span>
          <span className="hidden md:inline">Every business is different</span>
        </Reveal>

        <Reveal
          as="h2"
          variant="up"
          delay={100}
          className="font-headline mt-[14.5px] text-[32px] leading-[33px] tracking-normal text-foreground uppercase md:mt-6 md:text-[56px] md:leading-[1.15] lg:mt-[13.5px] lg:text-[64px] lg:leading-[65px] lg:tracking-normal"
        >
          Need more clarity on <br className="hidden md:block" />
          your <br className="md:hidden" /><span className="text-accent">brand?</span>
        </Reveal>

        <Reveal as="div" variant="roll" delay={220}>
          <Link
            href="/contact"
            className="font-headline mt-[9.5px] inline-block bg-accent px-[22px] py-3 text-[13px] md:px-3 md:text-xl leading-6 text-black uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover md:mt-14 lg:mt-[51.5px] lg:text-[24px]"
          >
            Schedule a discovery call
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
