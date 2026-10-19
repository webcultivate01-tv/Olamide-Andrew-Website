import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../../../_components/admin-shell";
import SeoForm from "../../_components/seo-form";

export const metadata = {
  title: "Post SEO — Admin",
  robots: { index: false, follow: false },
};

function BackLink({ id }) {
  return (
    <Link
      href={`/admin/blog/${encodeURIComponent(id)}`}
      className="font-nav mb-4 inline-block text-xs font-bold tracking-[0.14em] text-navy uppercase hover:underline"
    >
      ← Back to post
    </Link>
  );
}

export default async function BlogPostSeoPage({ params }) {
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

  if (detail.status === 404) {
    notFound();
  }

  const { admin, stats } = session;

  if (!detail.payload?.success) {
    return (
      <AdminShell admin={admin} stats={stats} breadcrumb={<BackLink id={id} />}>
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
      breadcrumb={<BackLink id={id} />}
      title={`SEO — ${post.title}`}
      description="Search title, meta description, keywords and share image for this post."
    >
      <SeoForm post={post} />
    </AdminShell>
  );
}
