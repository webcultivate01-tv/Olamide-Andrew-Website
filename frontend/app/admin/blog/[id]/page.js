import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../../_components/admin-shell";
import LocalTime from "../../_components/local-time";
import BlogPostForm from "../_components/blog-post-form";

export const metadata = {
  title: "Edit Post — Admin",
  robots: { index: false, follow: false },
};

function BackLink() {
  return (
    <Link
      href="/admin/blog"
      className="font-nav mb-4 inline-block text-xs font-bold tracking-[0.14em] text-navy uppercase hover:underline"
    >
      ← All posts
    </Link>
  );
}

export default async function EditBlogPostPage({ params }) {
  // params is a promise in this version of Next.js.
  const { id } = await params;

  const [session, detail] = await Promise.all([
    loadAdminSession(),
    adminFetch(`/api/admin/blog/${encodeURIComponent(id)}`),
  ]);

  // redirect() and notFound() work by throwing, so they must not sit inside a
  // try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  // A missing post is a missing page, not a broken session — the API
  // distinguishes the two, and so must this.
  if (detail.status === 404) {
    notFound();
  }

  const { admin, stats } = session;

  if (!detail.payload?.success) {
    return (
      <AdminShell admin={admin} stats={stats} breadcrumb={<BackLink />}>
        <p
          role="alert"
          className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {detail.payload?.message ||
            "Could not load this post. Check the API is running, then reload."}
        </p>
      </AdminShell>
    );
  }

  const { post } = detail.payload.data;

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      breadcrumb={<BackLink />}
      title={post.title}
      description={
        post.publishedAt ? (
          <>
            Published <LocalTime value={post.publishedAt} /> · {post.readingTime} min read ·
            last edited <LocalTime value={post.updatedAt} withTime />
          </>
        ) : (
          <>
            Draft · {post.readingTime} min read · last edited{" "}
            <LocalTime value={post.updatedAt} withTime />
          </>
        )
      }
    >
      <BlogPostForm post={post} />
    </AdminShell>
  );
}
