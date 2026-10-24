import { pageMetadata } from "@/lib/site";
import { publicFetch } from "@/lib/server-api";
import InsightsHero from "@/components/insights/insights-hero";
import InsightsGrid from "@/components/insights/insights-grid";
import InsightsCta from "@/components/insights/insights-cta";

export const metadata = pageMetadata({
  title: "Insights on Brand Strategy & Visual Identity | Olamide Andrew",
  description:
    "Shaping brands while driving purpose — notes on brand strategy, visual identity and the campaigns that turn ideas into results, from Strategic Brand Designer Olamide Andrew.",
  path: "/insights",
});

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
