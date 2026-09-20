import { notFound } from "next/navigation";
import { publicFetch, publicFetchResult } from "@/lib/server-api";
import BlogPostDetail from "../_components/blog-post-detail";

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
    return { title: "Blog — Olamide" };
  }

  return {
    title: `${post.title} — Olamide`,
    description: post.excerpt,
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

  return (
    <BlogPostDetail
      post={detail.data.post}
      categories={categoryData?.categories ?? []}
      otherPosts={pickOtherPosts(listData?.posts ?? [], slug)}
    />
  );
}
