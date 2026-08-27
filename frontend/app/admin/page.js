import { redirect } from "next/navigation";

// /admin on its own is not a page. Logged in, the dashboard is what was meant.
// Logged out, proxy.js turns this into a trip to the login screen first.
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
