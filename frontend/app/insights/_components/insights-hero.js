import Reveal from "../../components/reveal";

// The three linked topics in the feature row. Fixed copy per the design —
// this card is a standing feature, not driven by the post list below it.
const TOPICS = [
  {
    kicker: "BRANDING",
    lines: ["How to build thoughtful", "brands with clear", "direction"],
  },
  {
    kicker: "STRATEGY",
    lines: [
      "Adopting strategies that",
      "helps scale your brands",
      "effortlessly",
    ],
  },
  {
    kicker: "CAMPAIGN",
    lines: ["Scaling branding", "via converting", "campaigns"],
  },
];

/**
 * The Insights page's hero — same text-led, Anton-headline shape as the
 * home and about heroes, with the three standing topics as navy feature
 * cards instead of a photo band.
 */
export default function InsightsHero() {
  return (
    <section className="overflow-hidden bg-footer">
      <div className="mx-auto max-w-[1600px] px-5 pt-6 pb-16 md:px-10 md:pt-8 md:pb-20 lg:px-20 lg:pt-10 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal
            as="p"
            variant="up"
            className="font-nav text-xs font-semibold tracking-[0.18em] text-navy/70 uppercase sm:text-sm"
          >
            Shaping brands while driving purpose
          </Reveal>

          {/* Lines fly in from opposite edges and converge, same as the
              home hero, but left as inline spans so they sit on one line
              once there's room instead of always forcing a hard break. */}
          <h1 className="font-headline mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.01em] text-foreground uppercase sm:text-[3.5rem] md:text-[4.25rem] lg:text-[5rem]">
            <Reveal as="span" variant="wide-left" className="inline-block">
              Ideas worth
            </Reveal>{" "}
            <Reveal as="span" variant="wide-right" delay={150} className="inline-block">
              <span className="text-accent">building</span> on
            </Reveal>
          </h1>

          <Reveal
            as="p"
            variant="up"
            delay={220}
            className="mx-auto mt-6 max-w-[560px] text-lg leading-relaxed text-black/70 md:text-xl"
          >
            Notes on brand strategy, visual identity and the campaigns that turn
            a good-looking brand into one that actually works.
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3 md:mt-16 md:gap-6">
          {TOPICS.map((topic, index) => (
            <Reveal
              as="div"
              variant="roll"
              delay={300 + index * 100}
              key={topic.kicker}
              className="rounded-2xl bg-navy p-7 transition-transform duration-300 hover:-translate-y-1 lg:p-8"
            >
              <span className="font-headline text-3xl text-accent">
                0{index + 1}
              </span>
              <p className="font-nav mt-4 text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">
                {topic.kicker}
              </p>
              <p className="mt-3 text-lg leading-relaxed font-semibold text-white">
                {topic.lines.join(" ")}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
