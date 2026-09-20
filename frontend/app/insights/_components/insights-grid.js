"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import Reveal from "../../components/reveal";
import { withPalette, displayCategory } from "./categories";

// "May 6th, 2024" — the ordinal suffix is what the design calls for, and
// Intl has no built-in for it.
const ORDINAL = (day) => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  return `${month} ${day}${ORDINAL(day)}, ${date.getFullYear()}`;
};

// The design is built around two full rows (six cards, one of each category
// per row). Real posts come first; while the blog has fewer than six
// published, these fill the rest out to that shape rather than leaving the
// grid looking sparse.
//
// Built from whatever categories the admin panel has right now rather than a
// fixed three, so this still works once a fourth is added - the slice below
// caps it back down to MIN_CARDS regardless of how many that produces, and an
// empty category list just skips the filler rather than crashing.
const buildFillerPosts = (categories) =>
  categories.length
    ? [0, 1].flatMap((row) =>
        categories.map((category, index) => {
          // The first Branding card carries the featured article's title and
          // a photo from the home hero.
          const featured = category.slug === "branding" && row === 0;

          return {
            id: `filler-${category.slug}-${row}-${index}`,
            slug: featured
              ? "how-to-build-thoughtful-brands-with-clear-direction"
              : undefined,
            title: featured
              ? "How to build thoughtful brands with clear direction"
              : "Designing Brands geared to make impact.",
            tags: [category.slug],
            readingTime: 6,
            publishedAt: "2024-05-06",
            coverImageUrl: featured ? "/uploads/blog/branding/the-problem-with-pressure/26f64686bd8dbd2bc9f766a3bce0c778.png" : null,
            coverImageAlt: featured ? "Sample: Coca Cola Branding" : undefined,
          };
        })
      )
    : [];

const MIN_CARDS = 6;

export default function InsightsGrid({ posts = [], categories = [] }) {
  const [active, setActive] = useState("all");
  const paletteCategories = withPalette(categories);
  const fillerPosts = buildFillerPosts(paletteCategories);
  const source =
    posts.length >= MIN_CARDS
      ? posts
      : [...posts, ...fillerPosts].slice(0, MIN_CARDS);

  const filtered =
    active === "all"
      ? source
      : source.filter((post) => post.tags?.includes(active));

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
        <Reveal
          as="div"
          className="flex flex-wrap items-center gap-3"
          aria-label="Filter by category"
        >
          <button
            type="button"
            onClick={() => setActive("all")}
            aria-pressed={active === "all"}
            className={`font-nav rounded-full px-5 py-2.5 text-sm font-bold tracking-[0.02em] uppercase transition-colors ${
              active === "all"
                ? "bg-foreground text-white"
                : "bg-black/[0.05] text-foreground/70 hover:bg-black/[0.08]"
            }`}
          >
            All
          </button>

          {paletteCategories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setActive(category.slug)}
              aria-pressed={active === category.slug}
              className={`font-nav inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold tracking-[0.02em] uppercase transition-colors ${
                active === category.slug
                  ? "bg-foreground text-white"
                  : "bg-black/[0.05] text-foreground/70 hover:bg-black/[0.08]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${category.dot}`} />
              {category.label}
            </button>
          ))}
        </Reveal>

        {filtered.length ? (
          <div className="mt-12 grid gap-x-5 gap-y-11 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
            {filtered.map((post, index) => {
              const category = displayCategory(paletteCategories, post.tags);

              // The filler cards that pad the grid out to two rows stand for
              // posts that have not been written, so there is nothing for
              // them to link to — only a real post becomes a link.
              const Card = post.slug
                ? ({ children }) => (
                    <Link href={`/blog/${post.slug}`} className="group block">
                      {children}
                    </Link>
                  )
                : ({ children }) => <>{children}</>;

              return (
                <Reveal
                  as="article"
                  variant="roll"
                  delay={(index % 3) * 90}
                  key={post.id}
                >
                  <Card>
                  <div className="clip-notch overflow-hidden rounded-[20px] border border-black/10">
                    <Reveal variant="wipe" delay={index % 2 ? 140 : 0}>
                      <div>
                        <div className="relative aspect-[580/516] w-full bg-footer">
                          {post.coverImageUrl ? (
                            <Image
                              src={mediaUrl(post.coverImageUrl)}
                              alt={post.coverImageAlt || post.title || ""}
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover"
                            />
                          ) : null}

                          <span
                            className={`font-nav absolute bottom-4 left-4 rounded px-3 py-1.5 text-xs font-bold tracking-[0.04em] text-white uppercase ${category.badge}`}
                          >
                            {category.label}
                          </span>
                        </div>
                      </div>
                    </Reveal>
                  </div>

                  <h3 className="mt-3 text-lg leading-snug font-semibold text-foreground transition-colors group-hover:text-navy">
                    {post.title}
                  </h3>

                  <p className="mt-2 text-sm text-black/50">
                    {post.readingTime} mins read · {formatDate(post.publishedAt)}
                  </p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <p className="mt-16 text-center text-black/50">
            No posts in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}
