/**
 * The public address of the site, used for canonical URLs, the sitemap,
 * robots.txt and social previews.
 *
 * Search engines need absolute URLs, and the right one is the production
 * domain — not whatever host a build happens to run on. Set
 * NEXT_PUBLIC_SITE_URL to override it (a staging domain, say, so staging never
 * advertises production URLs as its own).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://olamideandrew.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Olamide Andrew";

export const SITE_DESCRIPTION =
  "Ọlámidé (Lah Meday) is a Strategic Brand Designer. Brand strategy, positioning and identity for founders and growing businesses.";

/** Absolute URL for a site path such as "/about". */
export const absoluteUrl = (path = "/") => `${SITE_URL}${path}`;

/** Share image used when a page has no picture of its own. */
export const DEFAULT_SHARE_IMAGE = { url: "/olamide.png", alt: SITE_NAME };

/**
 * The SEO tags for one page: title, description, canonical address, and the
 * Open Graph / Twitter tags that control how a link looks when shared.
 *
 * A page's own `openGraph` replaces the layout's rather than adding to it, so
 * every field is spelled out here and each page gets a complete set.
 *
 *   export const metadata = pageMetadata({
 *     title: "About — Olamide",
 *     description: "...",
 *     path: "/about",
 *   });
 */
export const pageMetadata = ({
  title,
  description,
  path,
  image = DEFAULT_SHARE_IMAGE,
  type = "website",
  extra = {},
}) => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type,
    siteName: SITE_NAME,
    locale: "en_CA",
    url: path,
    title,
    description,
    images: [image],
    ...extra,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image.url],
  },
});
