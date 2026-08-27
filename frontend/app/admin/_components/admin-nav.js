/**
 * What the sidebar lists, and the icons it lists it with.
 *
 * Kept apart from the sidebar itself so adding a section is a one-line change
 * here rather than an edit inside the markup: give it an href, a label and an
 * icon, and the sidebar, the mobile drawer and the header's section title all
 * pick it up together. Sections exist so the list can grow past the handful of
 * links it holds today without turning into an undifferentiated column.
 *
 * `badge: "enquiries"` marks the item that carries the unread count.
 */

const iconProps = {
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.7",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function DashboardIcon({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="4.5" rx="1.5" />
      <rect x="13.5" y="10.5" width="7.5" height="10.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

function EnquiriesIcon({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z" />
      <path d="m3.8 7 7.1 5.2a2 2 0 0 0 2.2 0L20.2 7" />
    </svg>
  );
}

function CaseStudiesIcon({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="m3.6 15.5 4.2-4a2 2 0 0 1 2.7 0l3.4 3.2" />
      <path d="m13.4 13.2 1.9-1.7a2 2 0 0 1 2.7 0l2.4 2.2" />
      <circle cx="9" cy="9" r="1.4" />
    </svg>
  );
}

function BlogIcon({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M5 3.5h9.5L19 8v12.5H5z" />
      <path d="M14 3.5V8h5" />
      <path d="M8.5 12.5h7M8.5 16h4.5" />
    </svg>
  );
}

function ProfileIcon({ className }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: DashboardIcon }],
  },
  {
    label: "Manage",
    items: [
      {
        href: "/admin/enquiries",
        label: "Enquiries",
        icon: EnquiriesIcon,
        badge: "enquiries",
      },
      {
        href: "/admin/case-studies",
        label: "Case Studies",
        icon: CaseStudiesIcon,
      },
      {
        href: "/admin/blog",
        label: "Blog",
        icon: BlogIcon,
      },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/admin/profile", label: "Profile", icon: ProfileIcon }],
  },
];

export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

// startsWith, not equality, so /admin/enquiries/12 still counts as being in
// the Enquiries section.
export const isCurrentNav = (pathname, href) =>
  pathname === href || pathname.startsWith(`${href}/`);

// The section name the header shows. Longest href wins, so a nested route
// never matches a shorter link by accident.
export const currentNavLabel = (pathname) =>
  NAV_ITEMS.filter((item) => isCurrentNav(pathname, item.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0]?.label || "Admin";
