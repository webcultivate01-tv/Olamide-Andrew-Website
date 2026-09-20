import Image from "next/image";
import Reveal from "../../components/reveal";

// The three linked topics in the bottom band. Fixed copy per the design —
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
 * The Insights page's standing hero card.
 *
 * Drop the wood-grain background photo in as
 * `frontend/public/insights/hero-bg.jpg` — the layout, ribbon and copy are
 * otherwise final.
 */
export default function InsightsHero() {
  return (
    <section className="bg-footer">
      <div className="mx-auto max-w-[1600px] px-5 pt-12 md:px-10 md:pt-16 lg:px-20 lg:pt-20">
        <Reveal variant="wipe">
          <div className="relative isolate overflow-hidden rounded-2xl">
            <Image
              src="/insights/hero-bg.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1600px) 1560px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />

            {/* Ribbon: the folded tab reads as one shape made of two
                triangles either side of the label block, sitting on top of
                the navy panel below it. */}
            <div className="relative px-6 pt-8 sm:px-10 sm:pt-10 lg:px-14 lg:pt-14">
              <div className="relative inline-flex max-w-full items-stretch">
                <div className="h-auto w-6 shrink-0 self-stretch bg-[#a9c6da] [clip-path:polygon(0_0,100%_0,0_100%)] sm:w-8" />
                <div className="bg-white px-5 py-4 sm:px-8 sm:py-5">
                  <p className="font-nav text-[11px] font-semibold tracking-[0.18em] text-black/60 uppercase sm:text-sm">
                    Shaping brands while driving purpose
                  </p>
                  <p className="font-headline mt-1 text-2xl tracking-[-0.01em] text-foreground uppercase sm:text-4xl lg:text-5xl">
                    Blog post
                  </p>
                </div>
                <div className="h-auto w-6 shrink-0 self-stretch bg-white [clip-path:polygon(0_0,100%_0,100%_100%)] sm:w-8" />
              </div>
            </div>

            {/* Navy band: the ribbon's white face sits flush on its top
                edge, so the band starts right under the ribbon rather than
                as a separate block with a gap. */}
            <div className="relative -mt-px bg-navy px-6 pt-10 pb-10 sm:px-10 sm:pb-14 lg:px-14 lg:pb-16">
              <div className="grid sm:grid-cols-3 sm:gap-6 lg:gap-10">
                {TOPICS.map((topic, index) => (
                  <div key={topic.kicker}>
                    {index > 0 && (
                      <div className="my-6 h-px w-56 max-w-[65%] bg-white/25 sm:hidden" />
                    )}
                    <div
                      className={
                        index > 0
                          ? "sm:border-l sm:border-white/25 sm:pl-6 lg:pl-10"
                          : ""
                      }
                    >
                      <p className="font-nav text-xs leading-[32px] font-semibold tracking-[0.14em] text-white/70 uppercase">
                        {topic.kicker}
                      </p>
                      <p className="mt-3 text-lg leading-[40px] font-bold text-white sm:text-xl">
                        {topic.lines.map((line, lineIndex) => (
                          <span key={line}>
                            {lineIndex > 0 && (
                              <br className="hidden sm:inline" />
                            )}
                            {lineIndex > 0 && " "}
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
