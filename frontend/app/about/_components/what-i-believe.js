import Reveal from "../../components/reveal";
import SectionHeading from "./section-heading";

const LINES = [
  "I believe every business already has a brand.",
  "The question is whether it is communicating intentionally.",
  "I believe strategy gives design direction.",
  "I believe clarity builds trust faster than aesthetics.",
  "I believe businesses should invest in design because it helps people understand, trust, remember, and choose them.",
  "When strategy comes first, design becomes more than something people see.",
  "It becomes something that helps a business grow.",
];

export default function WhatIBelieve() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        What I <span className="text-accent">Believe</span>
      </SectionHeading>

      {/* The manifesto is the one place the lines rise one after another
          rather than fading in as a block — read as a list of statements,
          the cascade is the point. The relaxed leading leaves enough
          half-leading below the baseline that the clip never cuts a
          descender. */}
      <div className="mt-6 max-w-[1180px] space-y-2 md:mt-8">
        {LINES.map((line, i) => (
          <Reveal key={line} variant="mask" delay={120 + i * 90}>
            <p className="text-base leading-relaxed text-black/75 md:text-lg">
              {line}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
