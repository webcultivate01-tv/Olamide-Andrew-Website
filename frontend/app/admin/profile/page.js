import Link from "next/link";
import { redirect } from "next/navigation";
import { adminName, adminRole } from "@/lib/admin-config";
import { loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import AdminAvatar from "../_components/admin-avatar";
import LocalTime from "../_components/local-time";

export const metadata = {
  title: "Profile — Admin",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const { ok, admin, account, stats } = await loadAdminSession();

  // redirect() works by throwing, so it must not sit inside a try block.
  if (!ok) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      title="Profile"
      description="The account you are signed in with."
    >
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-black/10 bg-white p-6 md:p-8">
        <AdminAvatar admin={admin} className="h-20 w-20 md:h-24 md:w-24" />
        <div className="min-w-0">
          <p className="font-headline text-2xl tracking-tight text-navy uppercase md:text-3xl">
            {adminName(admin)}
          </p>
          <p className="font-nav mt-1 text-[0.7rem] font-bold tracking-[0.2em] text-muted uppercase">
            {adminRole(admin)}
          </p>
          <p className="mt-2 text-sm break-words text-black/60">{admin.email}</p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Email", value: admin.email },
          { label: "Role", value: admin.role },
          { label: "Status", value: account.isActive ? "Active" : "Disabled" },
          {
            label: "Member since",
            value: <LocalTime value={account.createdAt} withTime />,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-black/10 bg-white p-6">
            <dt className="font-nav text-xs font-bold tracking-[0.18em] text-muted uppercase">
              {item.label}
            </dt>
            <dd className="mt-3 text-lg font-semibold break-words text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 md:p-8">
        <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Password</h2>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-black/60">
          Passwords are changed through the emailed one-time code, the same way
          a forgotten one is reset. That keeps a stolen session from being
          enough on its own to lock the real owner out of the account.
        </p>
        <Link
          href="/admin/forgot-password"
          className="font-nav mt-6 inline-block border border-black/15 px-5 py-2.5 text-sm font-bold tracking-[0.02em] text-navy uppercase transition-colors hover:bg-navy hover:text-white"
        >
          Change password
        </Link>
      </div>
    </AdminShell>
  );
}
