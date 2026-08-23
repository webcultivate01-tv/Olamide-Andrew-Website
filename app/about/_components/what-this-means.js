import Link from "next/link";
import Reveal from "../../components/reveal";
import SectionHeading from "./section-heading";

const LINES = [
  "Whether your brand is new or established, the same question applies:",
  "Is it communicating what your business has become?",
  "Together, we will uncover the gap between the value you deliver and the way your business is perceived, then build a brand that communicates with clarity, earns trust, and supports long-term growth.",
  "If that is the kind of thinking you want behind your brand, I would love to hear your story.",
];

export default function WhatThisMeans() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        What this <span className="text-accent">Means</span> for you
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-2 md:mt-8">
        {LINES.map((line, i) => (
          <Reveal
            as="p"
            key={line.slice(0, 40)}
            delay={120 + i * 90}
            className="text-base leading-relaxed text-black/75 md:text-lg"
          >
            {line}
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="mt-9">
        <Link
          href="/contact"
          className="font-nav inline-block bg-accent px-7 py-3.5 text-base font-bold tracking-[0.02em] text-black uppercase transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-accent-hover lg:text-lg"
        >
          Book a free brand clarity audit
        </Link>
      </Reveal>
    </section>
  );
}
