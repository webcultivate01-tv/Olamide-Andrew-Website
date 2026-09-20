import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import Reveal from "../../components/reveal";
import RevealWords from "../../components/reveal-words";
import CaseStudyBlocksMobile from "./case-study-blocks-mobile";
import CaseStudyDesktopBody from "./case-study-desktop-body";
import CaseStudyHero from "./case-study-hero";
import OtherCaseStudies from "./other-case-studies";

// `intro` is stored as blank-line separated paragraphs; a study with none
// yet falls back to its short grid `summary` so the page still has an
// opening paragraph instead of a gap.
function introParagraphs(study) {
  const fromIntro = (study.intro || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (fromIntro.length) return fromIntro;
  return study.summary ? [study.summary] : [];
}

/**
 * The public detail page for one case study: a pinned full-bleed hero, the
 * title with its categories sidebar and opening paragraphs, the project's
 * own content blocks, then a pointer to the other studies.
 */
export default function CaseStudyDetail({ study, otherStudies = [] }) {
  const heroSrc = mediaUrl(study.imageUrl);
  const paragraphs = introParagraphs(study);
  const hasCategories = study.categories?.length > 0;

  return (
    // `clip` rather than `hidden`: both stop a full-bleed row from widening
    // the page, but `overflow-x: hidden` forces the other axis to `auto`,
    // which would make this article a scroll container and leave the sticky
    // hero inside it with nothing to pin against.
    <article className="overflow-x-clip">
      {heroSrc ? (
        <CaseStudyHero src={heroSrc} alt={study.imageAlt || study.title || ""} />
      ) : null}

      {/* Everything below the hero rides up over it, so it has to be both
          above it in the stack and opaque — opaque across the full width,
          not just the 1600px column, or a wide screen would show the pinned
          hero down either side of the page. */}
      <div className="relative z-10 bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20 lg:px-20 lg:py-24">
          {/* Below md: a stacked, editorial read — breadcrumb, title, inset
              (non-pinned) hero, a pull-quote lifted from the opening
              paragraph, then the intro under an "Overview" label. */}
          <div className="md:hidden">
            {hasCategories ? (
              <Reveal as="p" className="font-nav text-xs text-black/45">
                Case Study<span className="mx-2">/</span>Categories
                <span className="mx-2">/</span>
                {study.categories[0]}
              </Reveal>
            ) : null}

            <RevealWords
              as="h1"
              text={study.title}
              step={45}
              className="font-headline mt-3 text-4xl leading-[1.05] tracking-[-0.01em] text-foreground uppercase"
            />

            {study.tagline ? (
              <Reveal as="p" delay={140} className="mt-3 text-base text-black/70">
                {study.tagline}
              </Reveal>
            ) : null}

            {heroSrc ? (
              <Reveal variant="wipe" delay={180} className="mt-8 overflow-hidden">
                <div className="relative aspect-[3/2] w-full">
                  <Image
                    src={heroSrc}
                    alt={study.imageAlt || study.title || ""}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            ) : null}

            {paragraphs.length ? (
              <RevealWords
                as="p"
                text={paragraphs[0]}
                step={22}
                delay={220}
                className="font-headline mt-10 text-2xl leading-[1.3] tracking-[-0.01em] text-foreground"
              />
            ) : null}

            {paragraphs.length ? (
              <>
                <Reveal
                  as="p"
                  delay={280}
                  className="mt-8 font-nav text-xs font-bold tracking-[0.2em] text-black/45 uppercase"
                >
                  Overview
                </Reveal>
                <div className="mt-4 space-y-5">
                  {paragraphs.map((paragraph, index) => (
                    <Reveal
                      as="p"
                      key={index}
                      delay={320 + index * 90}
                      className="text-base leading-[1.8] text-black/70"
                    >
                      {paragraph}
                    </Reveal>
                  ))}
                </div>
              </>
            ) : null}

            <CaseStudyBlocksMobile blocks={study.blocks} />
          </div>

          {/* md and up: the pinned full-bleed hero above rides under this,
              unchanged from before. */}
          <div className="hidden md:block">
            <CaseStudyDesktopBody
              study={study}
              paragraphs={paragraphs}
              hasCategories={hasCategories}
            />
          </div>

          <OtherCaseStudies studies={otherStudies} />
        </div>
      </div>
    </article>
  );
}
