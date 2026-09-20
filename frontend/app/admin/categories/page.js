import { redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import CategoriesTable from "./_components/categories-table";

export const metadata = {
  title: "Categories — Admin",
  robots: { index: false, follow: false },
};

/**
 * Renders on the server, so the session is checked before the category list
 * reaches the browser. The full list is fetched here too, so the table is in
 * the HTML rather than appearing after a spinner - there is no paging, the
 * same way the tag list has none either.
 */
export default async function CategoriesPage() {
  const [session, list] = await Promise.all([
    loadAdminSession(),
    adminFetch("/api/admin/categories?type=blog"),
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
      <AdminShell admin={admin} stats={stats} title="Categories">
        <p
          role="alert"
          className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {list.payload?.message ||
            "Could not load categories. Check the API is running, then reload this page."}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      title="Categories"
      description="The categories used to organise the blog and the case studies. Pick a list, then add, rename or remove them here."
    >
      <CategoriesTable initial={list.payload.data} />
    </AdminShell>
  );
}
