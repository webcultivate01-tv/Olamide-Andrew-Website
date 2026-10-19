import Reveal from "../../components/reveal";
import SectionHeading from "./section-heading";

const PARAGRAPHS = [
  "I’ve been curious about design since my early teens, when an older friend skilled in CorelDRAW showed me what was possible. Later, a small music group I belonged to kept needing flyers and posters, and I wanted to know how they were made.",
  "At university, I became part of a merchandise and customization business. We made custom jerseys, T-shirts, caps, mugs and painted denim for small businesses, shipping companies and oil and gas companies. I understood the business side, but I relied on other designers to bring our ideas to life. Working alongside them showed me how much creative execution matters to a business looking professional, and I wanted to learn the craft myself.",
  "Business books and magazines then raised a bigger question: why do some brands stay trusted for decades while others struggle to stand out? Studying graphic design, I realized design is only one part of the answer. That’s what led me to Strategic Brand Design.",
];

export default function MyStory() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        My journey started with <span className="text-accent">curiosity.</span>
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-8 md:mt-8">
        {PARAGRAPHS.map((text, i) => (
          <Reveal
            as="p"
            key={text.slice(0, 40)}
            delay={140 + i * 120}
            className="text-base leading-relaxed text-black/75 md:text-lg"
          >
            {text}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
