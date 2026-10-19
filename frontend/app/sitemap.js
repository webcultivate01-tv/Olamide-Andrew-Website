import { publicFetch } from "@/lib/server-api";
import { SITE_URL } from "@/lib/site";

// Generates https://olamideandrew.com/sitemap.xml
//
// The sitemap is the list of every page we want Google to find. It has three
// parts: the fixed pages, every published case study, and every published
// blog post. The last two are read from the backend, so a new post shows up
// here automatically with no code change.

const SITE = SITE_URL;

// Rebuild on every request so new posts appear straight away.
export const dynamic = "force-dynamic";

// 1. Fixed pages. Add a line here if a new page is created.
const PAGES = [
  "", // home
  "/about",
  "/case-studies",
  "/insights",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
];

// The backend only returns up to 50 blog posts at a time, so ask page by page.
async function getAllBlogPosts() {
  const posts = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await publicFetch(`/api/blog?page=${page}&perPage=50`);
    if (!data) break;
    posts.push(...data.posts);
    totalPages = data.pagination.totalPages;
    page++;
  }

  return posts;
}

export default async function sitemap() {
  const caseStudyData = await publicFetch("/api/case-studies");
  const caseStudies = caseStudyData?.caseStudies ?? [];
  const blogPosts = await getAllBlogPosts();

  return [
    // Fixed pages
    ...PAGES.map((path) => ({ url: `${SITE}${path}` })),

    // One entry per case study
    ...caseStudies.map((study) => ({
      url: `${SITE}/case-studies/${study.slug}`,
      lastModified: study.updatedAt,
    })),

    // One entry per blog post, except any hidden from search engines in the
    // post's SEO settings
    ...blogPosts.filter((post) => !post.seoNoIndex).map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: post.updatedAt,
    })),
  ];
}
