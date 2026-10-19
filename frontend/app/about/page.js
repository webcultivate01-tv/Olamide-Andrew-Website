import AboutHero from "./_components/about-hero";
import MyStory from "./_components/my-story";
import WhatIBelieve from "./_components/what-i-believe";
import HowIWork from "./_components/how-i-work";
import WhoIWorkWith from "./_components/who-i-work-with";
import BeyondDesign from "./_components/beyond-design";
import StartProjectCta from "./_components/start-project-cta";

export const metadata = {
  title: "About — Olamide",
  description:
    "Ọlámidé (Lah Meday) is a Strategic Brand Designer who helps businesses communicate their value clearly through brand strategy and visual design.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <MyStory />
      <WhatIBelieve />
      <HowIWork />
      <WhoIWorkWith />
      <BeyondDesign />
      <StartProjectCta />
    </>
  );
}
