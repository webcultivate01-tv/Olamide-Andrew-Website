import { publicFetch } from "@/lib/server-api";
import InsightsHero from "./_components/insights-hero";
import InsightsGrid from "./_components/insights-grid";
import InsightsCta from "./_components/insights-cta";

export const metadata = {
  title: "Insights — Olamide",
  description:
    "Shaping brands while driving purpose — thinking on brand strategy, visual identity and brand activation.",
};

export default async function InsightsPage() {
  // Same contract as the case studies page: null when the API can't be
  // reached, rendered as an empty list (or, for categories, an empty filter)
  // rather than an error page.
  const [data, categoriesData] = await Promise.all([
    publicFetch("/api/blog?perPage=48"),
    publicFetch("/api/categories"),
  ]);

  return (
    <>
      <InsightsHero />
      <InsightsGrid posts={data?.posts ?? []} categories={categoriesData?.categories ?? []} />
      <InsightsCta />
    </>
  );
}
