export const metadata = {
  title: "Admin — Olamide",
  // Keeps the admin panel out of search results. This is only a hint to
  // crawlers, not protection — the API is what actually guards the data.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
