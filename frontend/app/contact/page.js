import { pageMetadata } from "@/lib/site";
import ContactHero from "./_components/contact-hero";
import LetsWorkCta from "./_components/lets-work-cta";

export const metadata = pageMetadata({
  title: "Contact Olamide Andrew — Start Your Brand Project",
  description:
    "Building a new brand, repositioning an existing one, or exploring what's next? Get in touch with Olamide Andrew, Strategic Brand Designer, to start a conversation about your business.",
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
