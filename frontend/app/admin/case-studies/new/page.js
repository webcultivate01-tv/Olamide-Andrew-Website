import Link from "next/link";
import { redirect } from "next/navigation";
import { loadAdminSession } from "@/lib/server-api";
import AdminShell from "../../_components/admin-shell";
import CaseStudyForm from "../_components/case-study-form";

export const metadata = {
  title: "New Case Study — Admin",
  robots: { index: false, follow: false },
};

export default async function NewCaseStudyPage() {
  const session = await loadAdminSession();

  // redirect() works by throwing, so it must not sit inside a try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      admin={session.admin}
      stats={session.stats}
      breadcrumb={
        <Link
          href="/admin/case-studies"
          className="font-nav mb-4 inline-block text-xs font-bold tracking-[0.14em] text-navy uppercase hover:underline"
        >
          ← All case studies
        </Link>
      }
      title="New case study"
      description="It is saved as a draft unless you set it to published, so nothing reaches the website before you are ready."
    >
      {/* No `study` prop: the same form, in its adding mode. */}
      <CaseStudyForm />
    </AdminShell>
  );
}
