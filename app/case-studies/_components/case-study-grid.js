import Image from "next/image";
import Reveal from "../../components/reveal";

const CASE_STUDIES = [
  {
    title: "Patches",
    body: "Repositioning a SaaS startup for Series A growth with a bold, modern identity system.",
    src: "/case-studies/patches.jpg",
    alt: "Patches branded burger box packaging",
  },
  {
    title: "Skyline Finance",
    body: "Launch campaign for a fintech platform making investing accessible to everyone.",
    src: "/case-studies/skyline.jpg",
    alt: "Skyline Finance campaign wrapped around a corner billboard",
  },
  {
    title: "Lumina Wellness",
    body: "Creating a serene brand identity for a wellness startup focused on mindful living.",
    src: "/case-studies/lumina.jpg",
    alt: "Client receiving a facial treatment at a Lumina Wellness studio",
  },
  {
    title: "Atlas Construction Group",
    body: "Launch campaign for a fintech platform making investing accessible to everyone.",
    src: "/case-studies/atlas.jpg",
    alt: "ACG signage fixed to a construction site hoarding",
  },
];

export default function CaseStudyGrid() {
  return (
    <section className="bg-footer">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
        {/* 82px over 1.05 leading is the design's 919 × 259 headline block:
            three lines at an 86px pitch, the widest running 910. The measure is
            doing the breaking — it holds line one to "…WITH A" — and each step
            down keeps that same three-line break inside its breakpoint. */}
        <Reveal variant="mask">
          <h2 className="font-headline mx-auto max-w-[960px] text-center text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-foreground uppercase sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.75rem] xl:text-[5.125rem]">
            Every concept starts with a business problem, not a design brief.
          </h2>
        </Reveal>

        {/* The copy trails the headline rather than moving with it: the stagger
            is what makes the block read as one gesture. */}
        <Reveal
          as="p"
          delay={180}
          className="mx-auto mt-8 max-w-[600px] text-center text-lg leading-[2.1] text-black/65 md:mt-10 md:text-xl"
        >
          The goal isn&apos;t to showcase visuals. It&apos;s to show how
          strategic thinking shapes an effective brand.
        </Reveal>

        <div className="mt-12 grid gap-x-5 gap-y-11 sm:grid-cols-2 md:mt-16 lg:mt-20">
          {CASE_STUDIES.map((study, index) => (
            <article key={study.title}>
              {/* The notch and the rounding are cut here rather than baked into
                  the photo, so any replacement crop picks up the same shape.
                  Both clips apply at once — the visible area is their overlap —
                  and they sit outside the Reveal on purpose: the wipe animates
                  clip-path on its own child, which would overwrite the notch.
                  See the wipe rules in globals.css. */}
              <div className="clip-notch overflow-hidden rounded-[20px]">
                <Reveal variant="wipe" delay={index % 2 ? 140 : 0}>
                  {/* The inner div is the clipped frame the image eases out of
                      its zoom behind — it can't be the Reveal wrapper itself. */}
                  <div>
                    {/* 21:20 — the 630-wide column the two-up grid gives at
                        the 1440 design width, over the design's 600 height. */}
                    <div className="relative aspect-[21/20] w-full">
                      <Image
                        src={study.src}
                        alt={study.alt}
                        fill
                        sizes="(min-width: 1600px) 710px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </Reveal>
              </div>

              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {study.title}
              </h3>

              <p className="mt-2 max-w-[540px] text-base leading-[1.9] text-black/70">
                {study.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
