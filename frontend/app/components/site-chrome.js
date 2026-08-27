"use client";

import { usePathname } from "next/navigation";

// The marketing header and footer have no place on the admin panel, but both
// live in the root layout. This wrapper drops them on /admin routes, which
// keeps the rest of the site untouched.
export default function SiteChrome({ children }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return children;
}
