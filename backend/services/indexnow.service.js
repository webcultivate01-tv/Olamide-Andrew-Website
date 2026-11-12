import { env } from "../config/env.js";

// IndexNow - one POST tells every participating search engine (Bing, Yandex,
// Seznam, Naver, Yep...) that these URLs changed, so they are recrawled within
// minutes instead of weeks. https://www.indexnow.org/documentation
//
// Google does not take part in IndexNow; it finds changes through the sitemap
// (https://olamideandrew.com/sitemap.xml) submitted in Search Console.

const ENDPOINT = "https://api.indexnow.org/indexnow";

// IndexNow accepts up to 10,000 URLs per request.
const MAX_URLS = 10000;

/**
 * Submits site paths (e.g. "/case-studies/atlas-civil-group") to IndexNow.
 *
 * Fire-and-forget: it never throws and never delays the admin's save. A failed
 * ping only means the search engine finds the change on its next normal crawl.
 *
 * `force` skips the production-only switch; the manual submit script uses it.
 */
export const submitToIndexNow = (paths = [], { force = false } = {}) => {
  const { enabled, key, siteUrl } = env.indexNow;
  if ((!enabled && !force) || !key) return Promise.resolve(false);

  const urlList = [...new Set(paths.filter(Boolean))]
    .map((path) => (path.startsWith("http") ? path : `${siteUrl}${path}`))
    .slice(0, MAX_URLS);

  if (!urlList.length) return Promise.resolve(false);

  return fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(siteUrl).host,
      key,
      keyLocation: `${siteUrl}/${key}.txt`,
      urlList,
    }),
    signal: AbortSignal.timeout(10000),
  })
    .then((response) => {
      // 200 = submitted, 202 = accepted while the key is being validated.
      if (response.ok) return true;
      console.warn(`IndexNow: submission answered ${response.status} for ${urlList.join(", ")}`);
      return false;
    })
    .catch((error) => {
      console.warn(`IndexNow: submission failed (${error.message})`);
      return false;
    });
};

/**
 * Pings IndexNow after a case study or blog post is saved, published,
 * unpublished or deleted.
 *
 * Only changes a visitor can see are sent: editing a draft that was never
 * live tells search engines nothing. A page that went from live to draft or
 * was deleted IS sent, so it is recrawled, found gone (404) and dropped.
 *
 *   section  - "/case-studies" or "/blog"
 *   listPath - the page that lists them ("/case-studies" or "/insights")
 *   before   - { slug, status } before the change, or null when created
 *   after    - { slug, status } after the change, or null when deleted
 */
export const notifyContentChange = ({ section, listPath, before, after }) => {
  const wasLive = before?.status === "PUBLISHED";
  const isLive = after?.status === "PUBLISHED";
  if (!wasLive && !isLive) return;

  const paths = [listPath];
  if (isLive) paths.push(`${section}/${encodeURIComponent(after.slug)}`);
  // The old address too, when the page was live and has gone or moved.
  if (wasLive && (!isLive || before.slug !== after.slug)) {
    paths.push(`${section}/${encodeURIComponent(before.slug)}`);
  }

  submitToIndexNow(paths);
};
