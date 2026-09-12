import Link from "next/link";
import { redirect } from "next/navigation";
import { adminName } from "@/lib/admin-config";
import { loadAdminSession } from "@/lib/server-api";
import AdminShell from "../_components/admin-shell";
import AdminAvatar from "../_components/admin-avatar";
import LocalTime from "../_components/local-time";
import ChangePasswordModal from "./_components/change-password-modal";

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

  const editButton = (
    <Link
      href="/admin/profile/edit"
      className="font-nav inline-block bg-navy px-6 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90"
    >
      Edit profile
    </Link>
  );

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      title="Profile"
      description="The account you are signed in with."
      actions={editButton}
    >
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 md:p-5">
        <AdminAvatar admin={admin} className="h-14 w-14 md:h-16 md:w-16" />
        <div className="min-w-0">
          <p className="font-headline text-xl tracking-tight text-navy uppercase md:text-2xl">
            {adminName(admin)}
          </p>
          <p className="mt-1 text-sm break-words text-black/60">{admin.email}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Name", value: adminName(admin) },
          { label: "Email", value: admin.email },
          { label: "Status", value: account.isActive ? "Active" : "Disabled" },
          {
            label: "Member since",
            value: <LocalTime value={account.createdAt} withTime />,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-black/10 bg-white p-4">
            <dt className="font-nav text-xs font-bold tracking-[0.18em] text-muted uppercase">
              {item.label}
            </dt>
            <dd className="mt-1.5 text-base font-semibold break-words text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 md:p-5">
        <div className="min-w-0">
          <h2 className="font-headline text-xl tracking-tight text-navy uppercase">Password</h2>
          <p className="mt-1 max-w-[60ch] text-sm leading-snug text-black/60">
            Set a new password for your account.
          </p>
        </div>
        <ChangePasswordModal />
      </div>
    </AdminShell>
  );
}
