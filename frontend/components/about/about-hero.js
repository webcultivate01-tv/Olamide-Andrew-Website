import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/shared/reveal";

export default function AboutHero() {
  return (
    <section className="bg-footer">
      {/* The portrait leads on mobile and moves back into the right-hand
          column from lg up, so the order is set visually rather than in the
          DOM — the headline stays first in the reading order. */}
      <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-5 py-12 md:px-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-20 lg:py-16">
        <div className="order-2 min-w-0 lg:order-1">
          {/* Anton's caps fill ~0.71em of the line box, so 1.08 leading keeps a
              clear band of white between the two wrapped lines. */}
          <Reveal variant="mask">
            <h1 className="font-headline text-[2.25rem] leading-[1.25] tracking-[-0.01em] text-foreground uppercase sm:text-[2.75rem] sm:leading-[1.08] lg:text-[3.25rem]">
              Hi, I&apos;m Ọlámidé (Lah Meday).
            </h1>
          </Reveal>

          {/* The copy trails the headline rather than moving with it: the
              stagger is what makes the block read as one gesture. */}
          <Reveal
            as="p"
            delay={180}
            className="mt-6 max-w-[520px] text-base leading-relaxed text-black/75 md:text-lg"
          >
            I&apos;m a Strategic Brand Designer who helps businesses
            communicate their value clearly. I bring together business
            thinking, brand strategy and visual design to help businesses show
            what makes them valuable and what sets them apart.
          </Reveal>

          <Reveal
            as="p"
            delay={280}
            className="mt-6 max-w-[520px] text-xs tracking-[0.04em] text-black/70 uppercase md:text-sm"
          >
            BSc in Economics · Diploma in Graphic Design · RGD Associate Member
          </Reveal>

          {/* Two even columns on mobile: at 402px the pair is a few pixels too
              wide to sit side by side on its own and would otherwise break
              onto separate lines. */}
          <Reveal
            delay={380}
            className="mt-9 flex flex-nowrap items-center gap-2 sm:gap-4"
          >
            <Link
              href="/contact"
              className="font-nav inline-block bg-accent px-3 py-3.5 text-center text-[clamp(0.6875rem,1.1vw,1.125rem)] font-bold tracking-[0.02em] whitespace-nowrap text-black uppercase transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-accent-hover sm:px-5 xl:px-7"
            >
              Book a Free Brand Clarity Audit
            </Link>
            <Link
              href="/case-studies"
              className="font-nav inline-block border border-foreground px-3 py-3.5 text-center text-[clamp(0.6875rem,1.1vw,1.125rem)] font-bold tracking-[0.02em] whitespace-nowrap text-foreground uppercase transition-[transform,background-color,color] duration-300 hover:-translate-y-0.5 hover:bg-foreground hover:text-white sm:px-5 xl:px-7"
            >
              View my concept work →
            </Link>
          </Reveal>
        </div>

        {/* The notched top-right corner is baked into the asset, so the image
            renders flush with no clipping of its own. */}
        <Reveal
          variant="wipe"
          delay={120}
          className="order-1 min-w-0 lg:order-2 lg:justify-self-end"
        >
          {/* The inner div is the clipped frame the image eases out of its
              zoom behind — see the wipe rules in globals.css for why it
              can't be the Reveal wrapper itself. */}
          <div className="max-w-[632px]">
            <Image
              src="/olamide.png"
              alt="Ọlámidé, Strategic Brand Designer"
              width={632}
              height={666}
              priority
              sizes="(min-width: 1024px) 632px, 100vw"
              className="h-auto w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
