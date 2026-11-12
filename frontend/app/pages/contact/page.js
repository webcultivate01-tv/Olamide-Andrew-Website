import { pageMetadata } from "@/lib/site";
import ContactHero from "@/components/contact/contact-hero";
import LetsWorkCta from "@/components/contact/lets-work-cta";

export const metadata = pageMetadata({
  title: "Contact Olamide Andrew — Brand Designer in Canada",
  description:
    "Start your project with Olamide Andrew, Winnipeg strategic brand designer. Request a free Brand Clarity Audit, or ask about strategy, identity and activation.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <LetsWorkCta />
    </>
  );
}
