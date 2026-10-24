import Reveal from "@/components/shared/reveal";
import SectionHeading from "@/components/about/section-heading";

const INTRO = [
  "I start by asking questions. Who are you trying to reach? What makes your business valuable? What sets you apart? I don’t believe every business needs a new logo. Sometimes the real problem is unclear messaging, or a business that has outgrown its positioning.",
  "From there, I bring research, strategy and creative work together:",
];

const PILLARS = [
  {
    title: "Brand Strategy",
    text: "Understand the business, its audience and what it needs to say.",
  },
  {
    title: "Visual Identity",
    text: "Turn that direction into a distinctive, consistent visual system.",
  },
  {
    title: "Brand Activation",
    text: "Apply the brand across touchpoints so its message stays consistent.",
  },
];

export default function HowIWork() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        Understand first. <span className="text-accent">Design with purpose.</span>
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-6 md:mt-8">
        {INTRO.map((text, i) => (
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

      <ul className="mt-10 grid gap-5 md:mt-12 md:grid-cols-3">
        {PILLARS.map((pillar, i) => (
          <Reveal
            as="li"
            key={pillar.title}
            delay={i * 120}
            className="rounded-[20px] border border-black/10 px-6 py-8 md:px-7 md:py-10"
          >
            <h3 className="font-headline text-[1.75rem] leading-[1.1] tracking-[-0.01em] text-foreground uppercase md:text-[2rem]">
              {pillar.title}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-black/75 md:text-lg">
              {pillar.text}
            </p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
