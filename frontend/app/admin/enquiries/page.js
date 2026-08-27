import { redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import EnquiriesTable from "./_components/enquiries-table";

export const metadata = {
  title: "Enquiries — Admin",
  robots: { index: false, follow: false },
};

/**
 * Renders on the server, so the session is checked before a single enquiry
 * reaches the browser.
 *
 * proxy.js already turned away visitors with no cookie, but that only looks at
 * whether a cookie exists. This is the real check: the API verifies the token
 * and re-reads the account, and anything it rejects ends up at the login page.
 *
 * The first page of results is fetched here too, so the table is in the HTML
 * rather than appearing after a spinner.
 */
export default async function EnquiriesPage() {
  const [session, list] = await Promise.all([
    loadAdminSession(),
    adminFetch("/api/admin/enquiries?page=1&perPage=20"),
  ]);

  // redirect() works by throwing, so it must not sit inside a try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  const { admin, stats } = session;

  // The session is fine but the list call failed — a database problem, most
  // likely. Say so rather than bouncing the admin to a login page that would
  // let them straight back in to the same broken page.
  if (!list.payload?.success) {
    return (
      <AdminShell admin={admin} stats={stats} title="Enquiries">
        <p
          role="alert"
          className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {list.payload?.message ||
            "Could not load enquiries. Check the API is running, then reload this page."}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      title="Enquiries"
      description="Every message sent from the website, newest first. New ones appear here as they arrive — no need to reload."
    >
      <EnquiriesTable initial={list.payload.data} />
    </AdminShell>
  );
}
