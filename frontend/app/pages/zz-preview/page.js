import HomeHero from "@/components/home/home-hero";
import BrandMessage from "@/components/home/brand-message";
import HowIThink from "@/components/home/how-i-think";

// Internal design preview, not a real page.
export const metadata = { robots: { index: false, follow: false } };

export default function Preview() {
  return (
    <>
      <HomeHero />
      <BrandMessage />
      <HowIThink />
    </>
  );
}
