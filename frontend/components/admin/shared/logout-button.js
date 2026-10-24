"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

function LogoutIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17v1.5A2.5 2.5 0 0 1 12.5 21h-6A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3h6A2.5 2.5 0 0 1 15 5.5V7" />
      <path d="M10 12h11" />
      <path d="m18 9 3 3-3 3" />
    </svg>
  );
}

// The two places a sign-out lives: red and full-width at the foot of the
// sidebar, or a quiet outline anywhere it sits beside other controls.
const VARIANTS = {
  danger:
    "w-full justify-center bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  outline:
    "border border-black/15 text-navy hover:bg-navy hover:text-white focus-visible:outline-navy",
};

// Asks the API to clear the session cookie, then goes back to the login page.
export default function LogoutButton({ variant = "outline", className = "" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await logout();
    } catch {
      // Even if the call fails there is nothing useful to show here - send
      // them to the login page either way.
    }

    router.refresh();
    router.replace("/admin/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`font-nav inline-flex items-center gap-2.5 px-5 py-3 text-sm font-bold tracking-[0.02em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      <LogoutIcon />
      {loading ? "Signing out…" : "Logout"}
    </button>
  );
}
