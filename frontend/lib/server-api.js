import { cookies } from "next/headers";
import { API_URL } from "./api";

/**
 * Calls a protected API route from a Server Component.
 *
 * The browser's session cookie has to be forwarded by hand: this request goes
 * from the Next.js server to Express, not from the browser, so nothing
 * attaches it automatically the way `credentials: "include"` does on the
 * client.
 *
 * The status is returned rather than swallowed, because the caller has to be
 * able to tell 401 (send them to the login page) from 404 (this enquiry is
 * gone) — collapsing both into "no data" would bounce an admin out of a
 * perfectly good session over a bad id in the URL.
 *
 * A status of 0 means the API could not be reached at all.
 */
export const adminFetch = async (path) => {
  const cookieStore = await cookies();

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { cookie: cookieStore.toString() },
      // Enquiries change constantly and are per-admin. Nothing here is ever
      // safe to serve from a cache.
      cache: "no-store",
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // A non-JSON body leaves payload null; status still tells the story.
    }

    return { status: response.status, payload };
  } catch {
    return { status: 0, payload: null };
  }
};

/**
 * Calls a public API route from a Server Component.
 *
 * No cookie is forwarded — these endpoints have no session and must not
 * behave differently for a signed-in admin than for a visitor.
 *
 * `no-store` rather than a revalidate window: publishing a case study should
 * show on the website immediately, and this is a handful of rows on a page
 * that is not under load.
 *
 * A failure returns null instead of throwing. A page that cannot reach the API
 * should render without that section, not become an error screen.
 */
export const publicFetch = async (path) => (await publicFetchResult(path)).data;

/**
 * The same call, with the reason for a failure kept instead of flattened into
 * null.
 *
 * `reachable` is false only when the API could not be talked to at all. A page
 * that turns "no data" into a 404 needs that apart from a genuine 404: a study
 * that has been deleted is permanently gone, whereas an API that is down or
 * still starting up is a page that will work again shortly. Answering 404 to
 * the second tells a crawler to drop a URL that was never actually removed,
 * and tells whoever is running the site that their content is missing when
 * what is actually missing is the backend.
 */
export const publicFetchResult = async (path) => {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // A body we cannot read — an HTML error page from a proxy, say — is
      // still a reply, not an unreachable API.
    }

    return {
      reachable: true,
      status: response.status,
      data: payload?.success ? payload.data : null,
    };
  } catch {
    return { reachable: false, status: 0, data: null };
  }
};

/**
 * Everything the admin chrome needs, for any signed-in page.
 *
 * The session check and the enquiry counts are fetched together, in parallel,
 * because every admin page needs both: the first decides whether to render at
 * all, the second fills in the notification bell. Fetching the counts on the
 * server rather than after mount means the badge is correct in the very first
 * paint instead of appearing a moment later.
 *
 * `ok` is false for an invalid session AND for an unreachable API. Both should
 * end at the login page: there is nothing useful to show either way, and the
 * login screen asks the API about the session itself.
 */
export const loadAdminSession = async () => {
  const [session, stats] = await Promise.all([
    adminFetch("/api/admin/dashboard"),
    adminFetch("/api/admin/enquiries/stats"),
  ]);

  return {
    ok: session.payload?.success === true,
    admin: session.payload?.data?.admin ?? null,
    account: session.payload?.data?.account ?? null,
    // Null if the stats call alone failed. The bell renders a zero until the
    // next refresh rather than taking the whole page down with it.
    stats: stats.payload?.data ?? null,
  };
};
