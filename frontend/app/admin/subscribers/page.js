import { redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import SubscribersTable from "./_components/subscribers-table";

export const metadata = {
  title: "Subscribers — Admin",
  robots: { index: false, follow: false },
};

/**
 * Renders on the server, so the session is checked before a single email
 * address reaches the browser.
 *
 * The first page of results is fetched here too, so the table is in the HTML
 * rather than appearing after a spinner.
 */
export default async function SubscribersPage() {
  const [session, list] = await Promise.all([
    loadAdminSession(),
    adminFetch("/api/admin/subscribers?page=1&perPage=20"),
  ]);

  // redirect() works by throwing, so it must not sit inside a try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  const { admin, stats } = session;

  // The session is fine but the list call failed - a database problem, most
  // likely. Say so rather than bouncing the admin to a login page that would
  // let them straight back in to the same broken page.
  if (!list.payload?.success) {
    return (
      <AdminShell admin={admin} stats={stats} title="Subscribers">
        <p
          role="alert"
          className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {list.payload?.message ||
            "Could not load subscribers. Check the API is running, then reload this page."}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      title="Subscribers"
      description="Everyone who signed up for the newsletter from the website, newest first."
    >
      <SubscribersTable initial={list.payload.data} />
    </AdminShell>
  );
}
