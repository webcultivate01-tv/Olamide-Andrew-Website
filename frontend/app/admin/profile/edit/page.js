import Link from "next/link";
import { redirect } from "next/navigation";
import { loadAdminSession } from "@/lib/server-api";
import AdminShell from "../../_components/admin-shell";
import ProfileForm from "../_components/profile-form";

export const metadata = {
  title: "Edit Profile — Admin",
  robots: { index: false, follow: false },
};

function BackLink() {
  return (
    <Link
      href="/admin/profile"
      className="font-nav mb-4 inline-block text-xs font-bold tracking-[0.14em] text-navy uppercase hover:underline"
    >
      ← Profile
    </Link>
  );
}

export default async function EditProfilePage() {
  const { ok, admin, stats } = await loadAdminSession();

  // redirect() works by throwing, so it must not sit inside a try block.
  if (!ok) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      breadcrumb={<BackLink />}
      title="Edit Profile"
      description="Your name, email and photo, shown across the admin panel."
    >
      <ProfileForm admin={admin} />
    </AdminShell>
  );
}
