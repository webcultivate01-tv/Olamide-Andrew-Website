import AboutHero from "./_components/about-hero";
import MyStory from "./_components/my-story";
import WhatIBelieve from "./_components/what-i-believe";
import HowIWork from "./_components/how-i-work";
import WhatThisMeans from "./_components/what-this-means";
import StartProjectCta from "./_components/start-project-cta";

export const metadata = {
  title: "About — Olamide",
  description:
    "Ọlámidé is a Strategic Brand Designer helping founders and growing businesses build brands with clarity, trust and direction.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <MyStory />
      <WhatIBelieve />
      <HowIWork />
      <WhatThisMeans />
      <StartProjectCta />
    </>
  );
}
