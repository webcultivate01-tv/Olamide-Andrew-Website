// Submits every URL in the live sitemap to IndexNow in one request.
//
//   npm run indexnow:submit
//
// Run it once after a deploy that changes fixed pages (home, about, contact,
// titles, descriptions...). Case studies and blog posts do not need it: the
// API pings IndexNow by itself whenever one is published, edited or removed.
//
// Google does not use IndexNow. For Google, open Search Console, check the
// sitemap (https://olamideandrew.com/sitemap.xml) is submitted, and use
// "URL inspection" -> "Request indexing" on the pages that changed.

import { env } from "../config/env.js";
import { submitToIndexNow } from "../services/indexnow.service.js";

const { siteUrl, key } = env.indexNow;

// The key file must be live first, or IndexNow rejects the submission (403).
const keyFile = await fetch(`${siteUrl}/${key}.txt`);
const keyText = keyFile.ok ? (await keyFile.text()).trim() : "";
if (keyText !== key) {
  console.error(
    `The key file ${siteUrl}/${key}.txt is not live (status ${keyFile.status}). Deploy the frontend first.`
  );
  process.exit(1);
}

const response = await fetch(`${siteUrl}/sitemap.xml`);
if (!response.ok) {
  console.error(`Could not read ${siteUrl}/sitemap.xml (status ${response.status}).`);
  process.exit(1);
}

const xml = await response.text();
const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
  .map((match) => match[1].replace(/&amp;/g, "&"))
  .filter((url) => new URL(url).host === new URL(siteUrl).host);

if (!urls.length) {
  console.error("The sitemap has no URLs for this site.");
  process.exit(1);
}

const ok = await submitToIndexNow(urls, { force: true });
console.log(ok ? `Submitted ${urls.length} URLs to IndexNow:` : "IndexNow submission failed:");
urls.forEach((url) => console.log(`  ${url}`));
process.exit(ok ? 0 : 1);
