import Link from "next/link";

/**
 * The white panel every chart and list on the dashboard sits in.
 *
 * One component rather than the same six utility classes repeated eight times,
 * so the padding and the hairline are decided once. `action` is the small link
 * in the top-right corner — a chart is a summary, and the reader nearly always
 * wants a way through to the full thing.
 */
export default function DashboardCard({
  title,
  hint,
  action,
  actionHref,
  className = "",
  bodyClassName = "",
  children,
}) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-black/10 bg-white p-5 md:p-6 ${className}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-nav text-xs font-bold tracking-[0.18em] text-navy uppercase">
          {title}
        </h3>

        {action && actionHref ? (
          <Link
            href={actionHref}
            className="font-nav text-[0.68rem] font-bold tracking-[0.14em] text-muted uppercase transition-colors hover:text-navy"
          >
            {action}
          </Link>
        ) : null}

        {hint ? (
          <p className="w-full text-xs leading-relaxed text-black/45">{hint}</p>
        ) : null}
      </header>

      <div className={`mt-5 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
