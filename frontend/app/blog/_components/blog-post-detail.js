import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";
import { mediaUrl } from "@/lib/api";
import Reveal from "../../components/reveal";
import RevealWords from "../../components/reveal-words";
import ContentBlocks from "../../components/content-blocks";
import BlogDiscoveryCta from "./blog-discovery-cta";
import BlogMobileContact from "./blog-mobile-contact";
import InsightsCta from "../../insights/_components/insights-cta";
import { withPalette, displayCategory } from "../../insights/_components/categories";

// The shell every other page on the site is built in. The post used to sit in
// a narrower column of its own; matching the header, the case studies and the
// footer means the title, the cover image and the body all start on the same
// left gutter instead of the article stepping in from the page around it.
const SHELL = "mx-auto w-full max-w-[1600px] px-5 md:px-10 lg:px-20";

// "June 1, 2026" — the byline's date, plainer than the index card's ordinal
// form because it sits inside a sentence rather than on its own line.
const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// "scaling-brands" -> "Scaling Brands". The same shape displayCategory uses on
// a tag it doesn't recognise, pulled out here because the breadcrumb needs it
// for a tag that is deliberately *not* the category.
const titleCase = (slug) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// The last step of the breadcrumb: the post's first tag that isn't already the
// category standing to its left. A post tagged only with its category gets a
// two-step trail rather than the same word twice.
const breadcrumbTopic = (tags = [], categorySlug) => {
  const topic = tags.find((tag) => tag !== categorySlug);
  return topic ? titleCase(topic) : null;
};

/**
 * The public page for one post: a breadcrumb, the title and byline, the
 * cover image, whatever content blocks the admin built, the written body,
 * and a pointer to the other stories.
 *
 * A single centred column rather than the case study's sidebar layout — a
 * post is something to read start to finish, and the category it belongs to
 * is a label on it rather than a filter through it.
 */
export default function BlogPostDetail({ post, categories = [], otherPosts = [] }) {
  const coverSrc = mediaUrl(post.coverImageUrl);
  const category = displayCategory(withPalette(categories), post.tags);
  const topic = breadcrumbTopic(post.tags, category.slug);

  return (
    // `clip` rather than `hidden`: both stop a full-bleed block from widening
    // the page, but `overflow-x: hidden` forces the other axis to `auto`,
    // which would make this article a scroll container.
    <article className="overflow-x-clip bg-background">
      <div className={`${SHELL} pt-14 pb-6 md:pt-20 md:pb-8 lg:pt-24`}>
        <Reveal as="nav" className="text-sm text-black/55 md:text-[15px]" aria-label="Breadcrumb">
          <Link href="/insights" className="transition-colors hover:text-navy">
            Blog
          </Link>
          <span className="mx-4">&gt;</span>
          {category.label}
          {topic ? (
            <>
              <span className="mx-4">&gt;</span>
              {topic}
            </>
          ) : null}
        </Reveal>

        <RevealWords
          as="h1"
          text={post.title}
          step={45}
          className="font-headline mt-5 text-[40px] leading-[1.15] tracking-[-0.01em] text-foreground uppercase md:text-[48px] lg:text-[56px] lg:leading-[1.1]"
        />

        {post.excerpt ? (
          <Reveal as="p" delay={140} className="mt-3 max-w-[900px] text-base text-foreground/80 md:text-xl">
            {post.excerpt}
          </Reveal>
        ) : null}

        <Reveal as="p" delay={180} className="mt-8 text-sm text-foreground/80">
          {post.author ? (
            <>
              By <span className="text-accent">{post.author}</span>
            </>
          ) : null}
          {post.author && post.publishedAt ? " on " : null}
          {post.publishedAt ? formatDate(post.publishedAt) : null}
          {post.readingTime ? (
            <span className="text-black/50"> · {post.readingTime} min read</span>
          ) : null}
        </Reveal>

        {coverSrc ? (
          <Reveal variant="wipe" delay={220} className="mt-10 max-w-[1280px] overflow-hidden rounded-2xl">
            <div className="relative aspect-[370/200] w-full md:aspect-[1280/684]">
              <Image
                src={coverSrc}
                alt={post.coverImageAlt || post.title || ""}
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
        ) : null}

        {/* The admin's "Image description" doubles as the caption under the
            cover. It is already the sentence someone writes about what the
            picture is ("Sample: Coca Cola Branding"), so it reads to a screen
            reader and to everyone else alike. Its own Reveal rather than a
            second child of the wipe above, whose scale-and-settle is meant for
            the image face and would drag the caption through a zoom with it. */}
        {coverSrc && post.coverImageAlt ? (
          <Reveal as="p" delay={320} className="mt-4 text-center text-2xl font-medium text-black/55">
            {post.coverImageAlt}
          </Reveal>
        ) : null}
      </div>

      {/* The admin's own set pieces. Full-width images break out of the
          column above; the component handles that itself. */}
      <div className={SHELL}>
        <ContentBlocks blocks={post.blocks} />
      </div>

      {/* The written post. `blog-prose` is defined in globals.css alongside
          the rest of the site's type, so a heading written as ## here lands on
          the same scale as one typed into a content block. The measure is
          capped below the shell so a line of body copy stays readable even
          though it starts on the page's own gutter. */}
      <div className={`${SHELL} pt-6 pb-14 md:pt-8 md:pb-16`}>
        <Reveal as="div" className="blog-prose max-w-[1200px]">
          <Markdown>{post.content}</Markdown>
        </Reveal>
      </div>

      {otherPosts.length ? (
        <div className={`${SHELL} pb-16 md:pb-20`}>
          <div className="border-t border-black/10 pt-12 md:pt-16">
            <Reveal
              as="h2"
              className="text-center text-2xl font-semibold text-foreground md:text-3xl"
            >
              Related Stories
            </Reveal>

            <ul className="mt-8 list-disc space-y-3 pl-6">
              {otherPosts.map((other, index) => (
                <Reveal as="li" key={other.id} delay={index * 90}>
                  <Link
                    href={`/blog/${other.slug}`}
                    className="text-base font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-navy"
                  >
                    {other.title}
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <InsightsCta />
      <BlogDiscoveryCta />
      <BlogMobileContact />
    </article>
  );
}
