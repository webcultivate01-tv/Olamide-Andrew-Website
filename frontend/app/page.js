import HomeHero from "./_components/home-hero";
import BrandMessage from "./_components/brand-message";
import HowIThink from "./_components/how-i-think";
import MyServices from "./_components/my-services";
import NewsletterCta from "./components/newsletter-cta";
import BrandWorkCta from "./components/brand-work-cta";

export const metadata = {
  title: "Olamide — Strategic Brand Designer",
  description:
    "Your brand looks good. Is it working? Brand strategy, positioning and identity for founders and growing businesses.",
};

export default function Home() {
  return (
    <>
      <HomeHero />
      <BrandMessage />
      <HowIThink />
      <MyServices />
      <NewsletterCta />
      <BrandWorkCta />
    </>
  );
}
