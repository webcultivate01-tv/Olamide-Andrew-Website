import Reveal from "../../components/reveal";
import SectionHeading from "./section-heading";

// Each entry is one paragraph block; a block with two strings keeps the
// closing line on its own line without opening a full paragraph gap.
const PARAGRAPHS = [
  [
    "My interest in branding started long before I became a designer. While studying Economics, I built a small merchandise and apparel business, producing custom clothing through Direct-to-Film (DTF), Direct-to-Garment (DTG) printing and Embroidery. I partnered with local artists and created branded merchandise for small businesses, block parties, talent shows, and community events. That experience made me curious. Why did some businesses instantly feel credible while others struggled to be noticed? Why did some brands remain relevant for years while others faded away?",
  ],
  [
    "After moving to Canada, I enrolled in a Graphic Design diploma program to develop my creative skills. But the more I learned, the more my curiosity grew beyond design itself. I began exploring branding, positioning, marketing, messaging, and the psychology behind how people perceive businesses. One idea became impossible to ignore. There are good designs. And there are impactful designs. The difference is strategy.",
    "Today, I help businesses close the gap between the value they deliver and the way they are perceived.",
  ],
];

export default function MyStory() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        My <span className="text-accent">Story</span>
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-8 md:mt-8">
        {PARAGRAPHS.map((lines, i) => (
          <Reveal
            as="p"
            key={lines[0].slice(0, 40)}
            delay={140 + i * 120}
            className="text-base leading-relaxed text-black/75 md:text-lg"
          >
            {lines.map((line) => (
              <span key={line.slice(0, 40)} className="block">
                {line}
              </span>
            ))}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
