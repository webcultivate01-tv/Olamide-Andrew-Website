"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import Reveal from "@/components/shared/reveal";
import { withPalette, displayCategory } from "@/components/insights/categories";

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

export default function InsightsGrid({ posts = [], categories = [] }) {
  const [active, setActive] = useState("all");
  // Every category from the admin panel gets a filter button, but only real
  // posts become cards - a category with no posts shows no card.
  const paletteCategories = withPalette(categories);

  const filtered =
    active === "all"
      ? posts
      : posts.filter((post) => post.tags?.includes(active));

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
        <Reveal
          as="div"
          className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 whitespace-nowrap sm:mx-0 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0"
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
                              className="object-contain"
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
            {posts.length
              ? "No posts in this category yet."
              : "No posts yet. Check back soon."}
          </p>
        )}
      </div>
    </section>
  );
}
