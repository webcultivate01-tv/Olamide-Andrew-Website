import Reveal from "@/components/shared/reveal";
import SectionHeading from "@/components/about/section-heading";

const PARAGRAPHS = [
  "A logo makes a business recognizable. A website presents its services. But neither explains why someone should choose you.",
  "I believe a brand is shaped by what people understand about a business, how they feel about it, and whether their experience matches its promises. A business can do excellent work and still struggle to show its value. That’s why I believe strategy should give design its direction.",
];

export default function WhatIBelieve() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        A brand is more than{" "}
        <span className="text-accent">what people see.</span>
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-6 md:mt-8">
        {PARAGRAPHS.map((text, i) => (
          <Reveal
            as="p"
            key={text.slice(0, 40)}
            delay={120 + i * 120}
            className="text-base leading-relaxed text-black/75 md:text-lg"
          >
            {text}
          </Reveal>
        ))}
      </div>

      {/* The belief is the page's one pull-quote, so it gets display type of
          its own rather than body copy. */}
      <Reveal variant="mask" delay={200} className="mt-10 md:mt-12">
        <p className="font-headline max-w-[1180px] text-[1.75rem] leading-[1.3] tracking-[-0.01em] text-foreground uppercase sm:text-4xl sm:leading-[1.15] md:text-[2.75rem]">
          Looking good is the minimum.{" "}
          <span className="text-accent">Working is the goal.</span>
        </p>
      </Reveal>
    </section>
  );
}
