import { pageMetadata } from "@/lib/site";
import HomeHero from "./_components/home-hero";
import BrandMessage from "./_components/brand-message";
import HowIThink from "./_components/how-i-think";
import MyServices from "./_components/my-services";
import BrandWorkCta from "./components/brand-work-cta";

export const metadata = pageMetadata({
  title: "Olamide Andrew — Strategic Brand Designer | Brand Strategy & Identity",
  description:
    "Your brand looks good. Is it working? Olamide Andrew is a Strategic Brand Designer helping founders and growing businesses with brand strategy, positioning and visual identity.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <HomeHero />
      <BrandMessage />
      <HowIThink />
      <MyServices />
      <BrandWorkCta />
    </>
  );
}
