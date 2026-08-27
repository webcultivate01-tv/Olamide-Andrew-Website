import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminFetch, loadAdminSession } from "@/lib/server-api";
import AdminShell from "../../_components/admin-shell";
import LocalTime from "../../_components/local-time";
import EnquiryActions from "../_components/enquiry-actions";

export const metadata = {
  title: "Enquiry — Admin",
  robots: { index: false, follow: false },
};

// One labelled fact from the enquiry.
function Detail({ label, children }) {
  return (
    <div>
      <dt className="font-nav text-xs font-bold tracking-[0.18em] text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-2 text-base break-words text-foreground">{children || "—"}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/enquiries"
      className="font-nav mb-4 inline-block text-xs font-bold tracking-[0.14em] text-navy uppercase hover:underline"
    >
      ← All enquiries
    </Link>
  );
}

export default async function EnquiryDetailPage({ params }) {
  // params is a promise in this version of Next.js.
  const { id } = await params;

  const [session, detail] = await Promise.all([
    loadAdminSession(),
    adminFetch(`/api/admin/enquiries/${encodeURIComponent(id)}`),
  ]);

  // redirect() and notFound() work by throwing, so they must not sit inside a
  // try block.
  if (!session.ok) {
    redirect("/admin/login");
  }

  // A missing enquiry is a missing page, not a broken session — the API
  // distinguishes the two, and so must this.
  if (detail.status === 404) {
    notFound();
  }

  const { admin, stats } = session;

  if (!detail.payload?.success) {
    return (
      <AdminShell admin={admin} stats={stats} breadcrumb={<BackLink />}>
        <p
          role="alert"
          className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {detail.payload?.message ||
            "Could not load this enquiry. Check the API is running, then reload."}
        </p>
      </AdminShell>
    );
  }

  const { enquiry } = detail.payload.data;

  return (
    <AdminShell
      admin={admin}
      stats={stats}
      breadcrumb={<BackLink />}
      title={enquiry.subject || enquiry.service || "Enquiry"}
      description={
        <>
          From {enquiry.name} · <LocalTime value={enquiry.createdAt} withTime />
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
            <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Details</h2>

            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <Detail label="Name">{enquiry.name}</Detail>
              <Detail label="Email">
                <a href={`mailto:${enquiry.email}`} className="text-navy hover:underline">
                  {enquiry.email}
                </a>
              </Detail>
              <Detail label="Phone">
                {enquiry.phone ? (
                  <a href={`tel:${enquiry.phone}`} className="text-navy hover:underline">
                    {enquiry.phone}
                  </a>
                ) : null}
              </Detail>
              <Detail label="Company">{enquiry.company}</Detail>
              <Detail label="Subject">{enquiry.subject}</Detail>
              <Detail label="Service">{enquiry.service}</Detail>
              <Detail label="Submitted">
                <LocalTime value={enquiry.createdAt} withTime />
              </Detail>
              <Detail label="Last updated">
                <LocalTime value={enquiry.updatedAt} withTime />
              </Detail>
            </dl>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
            <h2 className="font-headline text-2xl tracking-tight text-navy uppercase">Message</h2>
            {/* The message is rendered as text, never as markup. React escapes
                it, so a visitor who types <script> gets those nine characters
                back and nothing else. whitespace-pre-wrap keeps the paragraph
                breaks they typed without needing any HTML to do it. */}
            <p className="mt-5 text-base leading-relaxed break-words whitespace-pre-wrap text-foreground">
              {enquiry.message}
            </p>
          </div>
        </div>

        <EnquiryActions enquiry={enquiry} />
      </div>
    </AdminShell>
  );
}
