import { notFound } from "next/navigation";
import { publicFetch, publicFetchResult } from "@/lib/server-api";
import { mediaUrl } from "@/lib/api";
import { pageMetadata, absoluteUrl, SITE_URL, SITE_NAME } from "@/lib/site";
import BlogPostDetail from "@/components/blog/blog-post-detail";

// The stories to point to at the foot of the page: the newest few that are
// not this one. A blog is ordered by date rather than hand-arranged, so
// "related" here means recent, not curated.
const RELATED_COUNT = 3;

const pickOtherPosts = (posts, currentSlug) =>
  posts.filter((post) => post.slug !== currentSlug).slice(0, RELATED_COUNT);

export async function generateMetadata({ params }) {
  // params is a promise in this version of Next.js.
  const { slug } = await params;
  const data = await publicFetch(`/api/blog/${encodeURIComponent(slug)}`);
  const post = data?.post;

  if (!post) {
    return { title: "Blog | Olamide Andrew" };
  }

  // The admin's SEO panel wins wherever it was filled in; anything left blank
  // falls back to the post's own title, excerpt and cover.
  const image = mediaUrl(post.seoImageUrl || post.coverImageUrl);
  const keywords = post.seoKeywords?.length ? post.seoKeywords : post.tags;

  const metadata = pageMetadata({
    title: post.seoTitle || `${post.title} | Olamide Andrew`,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${encodeURIComponent(post.slug)}`,
    type: "article",
    image: image
      ? { url: image, alt: post.coverImageAlt || post.title }
      : undefined,
    extra: {
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      authors: post.author ? [post.author] : undefined,
      tags: keywords?.length ? keywords : undefined,
    },
  });

  return {
    ...metadata,
    keywords: keywords?.length ? keywords : undefined,
    ...(post.seoNoIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  const [detail, listData, categoryData] = await Promise.all([
    publicFetchResult(`/api/blog/${encodeURIComponent(slug)}`),
    publicFetch("/api/blog?perPage=12"),
    publicFetch("/api/categories"),
  ]);

  // An API that cannot be reached is not the same as a post that isn't there.
  // Answering 404 to an outage would tell a crawler this URL is gone and leave
  // whoever runs the site looking for a deleted post, when what is down is the
  // backend. Throwing gives the error page — and a retryable 500 — instead,
  // and says which it was in the server log.
  if (!detail.reachable) {
    throw new Error(
      `Blog post "${slug}": the API at ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"} could not be reached. Is the backend running?`,
    );
  }

  // Reachable and still nothing: this post really is missing.
  if (!detail.data?.post) {
    notFound();
  }

  const post = detail.data.post;
  const image = mediaUrl(post.seoImageUrl || post.coverImageUrl);
  const keywords = post.seoKeywords?.length ? post.seoKeywords : post.tags;

  // Structured data: lets Google show the post as an article, with its date
  // and author, in search results.
  const articleData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    url: absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
    mainEntityOfPage: absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
    image: image ? [image] : undefined,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    author: { "@type": "Person", name: post.author || "Olamide Andrew" },
    publisher: { "@id": `${SITE_URL}/#person` },
    isPartOf: { "@type": "Blog", name: `${SITE_NAME} — Insights`, url: absoluteUrl("/insights") },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleData).replace(/</g, "\\u003c"),
        }}
      />
      <BlogPostDetail
        post={post}
        categories={categoryData?.categories ?? []}
        otherPosts={pickOtherPosts(listData?.posts ?? [], slug)}
      />
    </>
  );
}
