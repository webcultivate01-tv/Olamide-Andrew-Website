"use client";

import Image from "next/image";
import { Fragment, useRef } from "react";

const SERVICES = [
  {
    title: "Brand Strategy",
    body: "Create clarity before design. Before visuals come direction. Together, we'll define how your business should be perceived, what makes it different, and how your brand should communicate.",
    src: "/services/Service1.png",
    alt: "Studio team working through a brand strategy session",
  },
  {
    title: "Visual Identity",
    body: "Turn strategy into a recognizable brand. A cohesive visual system designed to express your brand consistently and build trust across every interaction.",
    src: "/services/Service2.png",
    alt: "Brand identity applied to a delivery vehicle livery",
  },
  {
    title: "Brand Activation",
    body: "Bring your brand to life. Good campaigns don't just look good — they create momentum. I design visuals and creative systems that help brands show up consistently across every touchpoint.",
    src: "/services/Service3.png",
    alt: "Creative team reviewing campaign artwork and colour swatches",
  },
];

// Below lg the services are a plain vertical stack — image, title, copy, next.
// The pinning layout only starts where there is room for the two columns: the
// header is 7rem from md up, so every panel fills exactly what is left of the
// viewport underneath it.
const PANEL =
  "lg:sticky lg:top-28 lg:h-[calc(100svh_-_7rem)] lg:bg-background";

export default function MyServices() {
  // Zero-height markers sitting at each panel's position in normal flow. The
  // panels themselves are sticky — once pinned, their own box no longer
  // reports where they start, so scrolling back to one has to target these.
  const anchors = useRef([]);

  function goTo(index) {
    anchors.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="mx-auto max-w-[1600px] px-5 pt-16 md:px-10 md:pt-20 lg:px-20 lg:pt-24">
      <h2 className="font-headline text-center text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-foreground uppercase md:text-[3.5rem] lg:text-[5.25rem]">
        My Services
      </h2>

      {/* Each panel pins in turn and the next one rides up over it, so the
          stack needs one extra panel of runway at the end — otherwise the last
          service has nowhere to pin and the pinned ones behind it reappear.
          Neither the runway nor the gaps between stacked cards apply at the
          other breakpoint, hence the pair of one-sided spacing rules. */}
      <div className="relative mt-9 flex flex-col gap-12 md:mt-16 lg:block lg:pb-[calc(100svh_-_7rem)]">
        {SERVICES.map((service, index) => (
          <Fragment key={service.title}>
            <div
              ref={(node) => {
                anchors.current[index] = node;
              }}
              aria-hidden="true"
              className="hidden scroll-mt-28 lg:block"
            />

            <article className={PANEL}>
              {/* Both columns are capped rather than fluid, so the pair is
                  centred in the section instead of hugging the left edge on
                  wide screens. */}
              <div className="grid gap-6 lg:h-full lg:content-center lg:gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,520px)] lg:justify-center lg:gap-x-14 xl:grid-cols-[minmax(0,490px)_minmax(0,560px)] xl:gap-x-20">
                {/* The notched top-right corner and the rounding are baked into
                    the PNG's alpha, so nothing is clipped or tinted here — a
                    background would show through the transparent corner. */}
                <div className="relative aspect-[632/741] w-full lg:max-w-none">
                  <Image
                    src={service.src}
                    alt={service.alt}
                    fill
                    sizes="(min-width: 1280px) 490px, (min-width: 1024px) 440px, 100vw"
                    className="object-cover"
                  />
                </div>

                <div className="lg:max-w-none lg:self-center">
                  {/* Position marker and jump nav in one — the filled dot is
                      the panel you are on. Only meaningful while the panels
                      pin, so it is left out of the stacked layout. A plain div
                      rather than a <nav> so the three copies don't register as
                      three landmarks. */}
                  <div className="hidden flex-col items-start gap-3.5 lg:flex">
                    {SERVICES.map((target, dot) => (
                      <button
                        key={target.title}
                        type="button"
                        onClick={() => goTo(dot)}
                        aria-current={dot === index ? "true" : undefined}
                        aria-label={`Go to ${target.title}`}
                        className={
                          dot === index
                            ? "h-4 w-4 rounded-full bg-navy"
                            : "h-3.5 w-3.5 rounded-full bg-navy/30 transition-colors hover:bg-navy/60"
                        }
                      />
                    ))}
                  </div>

                  {/* One tinted panel behind both the heading and the copy,
                      hugging their line boxes with no padding of its own. Only
                      from lg,
                      where the copy sits beside the image — stacked, the tint
                      would read as a stray grey block under each photo. */}
                  <div className="lg:mt-9 lg:bg-footer">
                    <h3 className="font-headline text-[1.75rem] leading-[1.15] tracking-[-0.01em] text-foreground md:text-[2.25rem] lg:text-[3rem]">
                      {service.title}
                    </h3>

                    <p className="mt-3 text-base leading-relaxed text-black/75 md:text-lg lg:mt-4 lg:text-xl">
                      {service.body}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
