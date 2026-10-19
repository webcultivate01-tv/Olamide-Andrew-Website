import HomeHero from "../_components/home-hero";
import BrandMessage from "../_components/brand-message";
import HowIThink from "../_components/how-i-think";

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
