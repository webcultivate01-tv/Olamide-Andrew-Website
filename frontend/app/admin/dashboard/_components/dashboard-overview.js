"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboardOverview } from "@/lib/api";
import { useEnquiryNotifications } from "../../_components/enquiry-notifications";
import { CHART, STATUS_COLORS, formatNumber, formatPercent } from "./chart-theme";
import ContentBreakdown from "./content-breakdown";
import DashboardCard from "./dashboard-card";
import EnquiriesTrend from "./enquiries-trend";
import RecentEnquiries from "./recent-enquiries";
import ServicesBars from "./services-bars";
import StatTile from "./stat-tile";
import StatusDonut from "./status-donut";

/**
 * The whole dashboard: four figures, four charts and the activity list.
 *
 * The server renders this with data it fetched itself, so the charts are in
 * the first paint rather than arriving after a spinner. From then on it is
 * live — the notifications provider raises `version` whenever the socket says
 * something changed, and this refetches on that signal alone. It never trusts
 * the event's own payload: an event says *that* something changed, and the
 * answer to *what* always comes from the API.
 *
 * The counts also come from the provider where it has them, because they are
 * the same ones the header bell reads. Two places on screen showing a
 * different number for the same thing is worse than either being a moment
 * stale.
 */

// The tail of the daily series each tile's sparkline draws.
const SPARK_DAYS = 14;

export default function DashboardOverview({ initial }) {
  const { stats, version } = useEnquiryNotifications();

  const [data, setData] = useState(initial);

  // The server already fetched the first copy, so the effect below has to sit
  // out the mount and only run on later bumps — otherwise every page load
  // fires an immediate second request for data it is already rendering.
  const lastVersion = useRef(version);

  const refresh = useCallback(async () => {
    try {
      const payload = await getDashboardOverview();
      setData(payload.data);
    } catch {
      // Nearly always an expired session, which the next navigation resolves
      // at the login page. Keeping the last good figures on screen beats
      // blanking a dashboard over one failed refresh.
    }
  }, []);

  useEffect(() => {
    if (version === lastVersion.current) return;
    lastVersion.current = version;
    refresh();
  }, [version, refresh]);

  if (!data) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-sm text-red-700"
      >
        Could not load the dashboard figures. Check the API is running, then
        reload this page.
      </p>
    );
  }

  // Live counts where the provider has them, the server's copy otherwise.
  const total = stats?.total ?? data.enquiries.total;
  const byStatus = stats?.byStatus ?? data.enquiries.byStatus;
  const unread = stats?.unread ?? data.enquiries.unread;

  const converted = byStatus.CONVERTED ?? 0;
  const published = data.caseStudies.byStatus.PUBLISHED + data.blog.byStatus.PUBLISHED;
  const drafts = data.caseStudies.byStatus.DRAFT + data.blog.byStatus.DRAFT;

  const spark = data.enquiries.byDay.slice(-SPARK_DAYS).map((point) => point.total);
  const { periods } = data.enquiries;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total enquiries"
          value={formatNumber(total)}
          href="/admin/enquiries"
          delta={{
            current: periods.current,
            previous: periods.previous,
            periodDays: periods.days,
          }}
          spark={{ values: spark, color: CHART.volume }}
        />

        <StatTile
          label="Awaiting reply"
          value={formatNumber(unread)}
          href="/admin/enquiries"
          // The card changes colour only when there is something to do, so
          // the accent means "act on this" rather than "this is the enquiries
          // card".
          accent={unread > 0}
          caption={
            unread > 0
              ? `${formatPercent(unread, total)} of everything received`
              : "Everything has been picked up"
          }
        />

        <StatTile
          label="Converted"
          value={formatPercent(converted, total)}
          href="/admin/enquiries"
          meter={{
            ratio: total > 0 ? converted / total : 0,
            color: STATUS_COLORS.CONVERTED,
          }}
          caption={`${formatNumber(converted)} of ${formatNumber(total)} became work`}
        />

        <StatTile
          label="Live content"
          value={formatNumber(published)}
          href="/admin/case-studies"
          caption={
            drafts > 0
              ? `${formatNumber(drafts)} ${drafts === 1 ? "draft" : "drafts"} not published yet`
              : "Nothing sitting in drafts"
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <DashboardCard
          title="Enquiries received"
          action="All enquiries"
          actionHref="/admin/enquiries"
          className="lg:col-span-2"
        >
          <EnquiriesTrend byDay={data.enquiries.byDay} />
        </DashboardCard>

        <DashboardCard title="Pipeline" bodyClassName="flex items-center">
          <StatusDonut total={total} byStatus={byStatus} />
        </DashboardCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard
          title="Top services"
          hint={`What people asked about in the last ${data.rangeDays} days.`}
        >
          <ServicesBars services={data.enquiries.byService} rangeDays={data.rangeDays} />
        </DashboardCard>

        <DashboardCard title="Content library">
          <ContentBreakdown caseStudies={data.caseStudies} blog={data.blog} />
        </DashboardCard>
      </div>

      <DashboardCard
        title="Latest enquiries"
        action="View all"
        actionHref="/admin/enquiries"
      >
        <RecentEnquiries enquiries={data.enquiries.recent} />
      </DashboardCard>
    </div>
  );
}
