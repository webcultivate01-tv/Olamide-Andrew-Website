import Reveal from "../../components/reveal";
import SectionHeading from "./section-heading";

export default function WhoIWorkWith() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        Businesses with more{" "}
        <span className="text-accent">value to communicate.</span>
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-6 md:mt-8">
        <Reveal
          as="p"
          delay={120}
          className="text-base leading-relaxed text-black/75 md:text-lg"
        >
          I want to work with businesses that have built something real and are
          ready for their brand to reflect it. Maybe you’re entering a new
          market, going after higher-value clients, or competing for
          opportunities that need a stronger presentation. Maybe your business
          has grown, but your brand still shows an older version of you. Those
          are the gaps I like to close.
        </Reveal>
      </div>
    </section>
  );
}
