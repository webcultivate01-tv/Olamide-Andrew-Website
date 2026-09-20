"use client";

import { useState } from "react";
import Reveal from "../../components/reveal";
import RevealWords from "../../components/reveal-words";
import ContentBlocks from "../../components/content-blocks";

/**
 * The md-and-up half of the detail page: the categories sidebar, the title
 * and intro next to it, and the content blocks below. Pulled out of
 * CaseStudyDetail (a server component) because the sidebar is clickable here
 * - selecting a category filters the blocks to the ones tagged with it,
 * which needs state a server component cannot hold.
 *
 * A block with no category of its own always shows, filtered or not - only
 * blocks an admin has actually tied to a category are ever hidden.
 */
export default function CaseStudyDesktopBody({ study, paragraphs, hasCategories }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const blocks = study.blocks ?? [];
  const visibleBlocks = activeCategory
    ? blocks.filter((block) => !block.category || block.category === activeCategory)
    : blocks;

  const selectCategory = (category) => {
    setActiveCategory((current) => (current === category ? null : category));
  };

  return (
    <>
      <div
        className={
          hasCategories
            ? "grid gap-10 md:grid-cols-[200px_1fr] md:gap-14 lg:grid-cols-[240px_1fr] lg:gap-20"
            : ""
        }
      >
        {hasCategories ? (
          <Reveal as="div" variant="left">
            <p className="font-nav text-xs font-bold tracking-[0.2em] text-black/45 uppercase">
              Categories
            </p>
            <ul className="mt-4 space-y-2">
              {study.categories.map((category) => {
                const active = activeCategory === category;
                return (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={() => selectCategory(category)}
                      aria-pressed={active}
                      className={`text-left text-sm transition-colors ${
                        active ? "font-semibold text-navy" : "text-black/65 hover:text-navy"
                      }`}
                    >
                      {category}
                    </button>
                  </li>
                );
              })}
            </ul>
            {activeCategory ? (
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="font-nav mt-4 text-xs font-bold tracking-[0.08em] text-black/45 uppercase hover:text-navy"
              >
                Show all
              </button>
            ) : null}
          </Reveal>
        ) : null}

        <div>
          <RevealWords
            as="h1"
            text={study.title}
            step={45}
            className="font-headline text-4xl leading-[1.05] tracking-[-0.01em] text-foreground uppercase sm:text-5xl md:text-6xl lg:text-[4.25rem]"
          />

          {study.tagline ? (
            <Reveal
              as="p"
              delay={140}
              className="mt-4 max-w-[640px] text-lg text-black/70 md:mt-5 md:text-xl"
            >
              {study.tagline}
            </Reveal>
          ) : null}

          {paragraphs.length ? (
            <div className="mt-10 max-w-[640px] space-y-6 md:mt-12">
              {paragraphs.map((paragraph, index) => (
                <Reveal
                  as="p"
                  key={index}
                  delay={200 + index * 90}
                  className={
                    index === 0
                      ? "text-xl leading-[1.6] text-foreground md:text-2xl"
                      : "text-base leading-[1.9] text-black/70 md:text-lg"
                  }
                >
                  {paragraph}
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <ContentBlocks blocks={visibleBlocks} />
    </>
  );
}
