import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import BlogPostsTable from "./_components/blog-posts-table";

export const metadata = {
  title: "Blog — Admin",
  robots: { index: false, follow: false },
};

/**
 * Renders on the server, so the session is checked before any of the blog —
 * drafts included — reaches the browser.
 *
 * The first page of results, the counts and the tag list are fetched here too,
 * so the table is in the HTML rather than appearing after a spinner.
 */
export default async function BlogPage() {
  const [session, list, stats, tags] = await Promise.all([
    loadAdminSession(),
    adminFetch("/api/admin/blog?page=1&perPage=20"),
    adminFetch("/api/admin/blog/stats"),
    adminFetch("/api/admin/blog/tags"),
  ]);

  // redirect() works by throwing, so it must not sit inside a try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  const { admin } = session;

  const newButton = (
    <Link
      href="/admin/blog/new"
      className="font-nav inline-block bg-navy px-6 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90"
    >
      New post
    </Link>
  );

  // The session is fine but the list call failed — a database problem, most
  // likely. Say so rather than bouncing the admin to a login page that would
  // let them straight back in to the same broken page.
  if (!list.payload?.success) {
    return (
      <AdminShell admin={admin} stats={session.stats} title="Blog">
        <p
          role="alert"
          className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {list.payload?.message ||
            "Could not load the blog. Check the API is running, then reload this page."}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      stats={session.stats}
      title="Blog"
      description="Everything written for the website. Drafts stay private until you publish them, and published posts appear newest first."
      actions={newButton}
    >
      <BlogPostsTable
        initial={list.payload.data}
        // Null and [] if those calls alone failed. The cards show zeros and the
        // tag filter hides itself until the next fetch, rather than taking the
        // whole page down.
        initialStats={stats.payload?.data ?? null}
        initialTags={tags.payload?.data?.tags ?? []}
      />
    </AdminShell>
  );
}
