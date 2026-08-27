import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import LocalTime from "../_components/local-time";
import DashboardOverview from "./_components/dashboard-overview";

export const metadata = {
  title: "Dashboard — Admin",
  robots: { index: false, follow: false },
};

// This page renders on the server, so the check below happens before any of
// the dashboard reaches the browser.
//
// proxy.js already turned away visitors with no cookie, but that check only
// looks at whether a cookie exists. This one is the real one: the API verifies
// the token and re-reads the account, and anything it rejects ends up back at
// the login page.
//
// The figures are fetched here too, alongside the session rather than after
// it, so the cards and charts are in the first paint instead of appearing once
// the browser has run some JavaScript and asked for them itself.

export default async function DashboardPage() {
  const [session, overview] = await Promise.all([
    loadAdminSession(),
    adminFetch("/api/admin/dashboard/overview"),
  ]);

  // redirect() works by throwing, so it has to sit outside a try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  const { admin, account, stats } = session;

  return (
    <AdminShell admin={admin} stats={stats}>
      <DashboardOverview initial={overview.payload?.data ?? null} />

      <h2 className="font-nav mt-10 text-xs font-bold tracking-[0.22em] text-muted uppercase">
        Account
      </h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <dl className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {[
            { label: "Email", value: admin.email },
            { label: "Role", value: admin.role },
            { label: "Status", value: account.isActive ? "Active" : "Disabled" },
            {
              label: "Member since",
              value: <LocalTime value={account.createdAt} withTime />,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-black/10 bg-white p-5">
              <dt className="font-nav text-xs font-bold tracking-[0.18em] text-muted uppercase">
                {item.label}
              </dt>
              <dd className="mt-2.5 text-base font-semibold break-words text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* The three things an admin comes to this panel to do, so the
            dashboard is somewhere to start from and not only somewhere to
            read. */}
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h3 className="font-nav text-xs font-bold tracking-[0.18em] text-navy uppercase">
            Quick actions
          </h3>

          <div className="mt-4 grid gap-2.5">
            {[
              { href: "/admin/enquiries", label: "Manage enquiries" },
              { href: "/admin/case-studies/new", label: "New case study" },
              { href: "/admin/blog/new", label: "Write a post" },
            ].map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={`font-nav block px-4 py-3 text-center text-xs font-bold tracking-[0.14em] uppercase transition-colors ${
                  index === 0
                    ? "bg-navy text-white hover:bg-navy/90"
                    : "border border-black/10 text-navy hover:border-navy/40 hover:bg-navy/[0.04]"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
