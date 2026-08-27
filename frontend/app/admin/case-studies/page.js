import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import CaseStudiesTable from "./_components/case-studies-table";

export const metadata = {
  title: "Case Studies — Admin",
  robots: { index: false, follow: false },
};

/**
 * Renders on the server, so the session is checked before any of the portfolio
 * — drafts included — reaches the browser.
 *
 * The first page of results and the counts are fetched here too, so the table
 * is in the HTML rather than appearing after a spinner.
 */
export default async function CaseStudiesPage() {
  const [session, list, stats] = await Promise.all([
    loadAdminSession(),
    adminFetch("/api/admin/case-studies?page=1&perPage=20"),
    adminFetch("/api/admin/case-studies/stats"),
  ]);

  // redirect() works by throwing, so it must not sit inside a try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  const { admin } = session;

  const newButton = (
    <Link
      href="/admin/case-studies/new"
      className="font-nav inline-block bg-navy px-6 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90"
    >
      New case study
    </Link>
  );

  // The session is fine but the list call failed — a database problem, most
  // likely. Say so rather than bouncing the admin to a login page that would
  // let them straight back in to the same broken page.
  if (!list.payload?.success) {
    return (
      <AdminShell admin={admin} stats={session.stats} title="Case Studies">
        <p
          role="alert"
          className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {list.payload?.message ||
            "Could not load case studies. Check the API is running, then reload this page."}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      stats={session.stats}
      title="Case Studies"
      description="The work shown on the website. Drafts stay private until you publish them, and the display order is what the grid follows."
      actions={newButton}
    >
      <CaseStudiesTable
        initial={list.payload.data}
        // Null if the stats call alone failed. The cards show zeros until the
        // next fetch rather than taking the whole page down.
        initialStats={stats.payload?.data ?? null}
      />
    </AdminShell>
  );
}
