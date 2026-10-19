import Reveal from "../../components/reveal";
import SectionHeading from "./section-heading";

export default function BeyondDesign() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        Curious about people, ideas and{" "}
        <span className="text-accent">how things are built.</span>
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-6 md:mt-8">
        <Reveal
          as="p"
          delay={120}
          className="text-base leading-relaxed text-black/75 md:text-lg"
        >
          I’m curious about people, culture and how ideas become real. I’m
          fascinated by the planning and teamwork behind big engineering
          projects and remarkable buildings, and that same curiosity draws me
          to business development: understanding people, spotting opportunities
          and building relationships. Whether you’re building a structure, a
          business or a brand, good outcomes need a clear direction and careful
          execution.
        </Reveal>
      </div>
    </section>
  );
}
