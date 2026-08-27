import ContactHero from "./_components/contact-hero";
import LetsWorkCta from "./_components/lets-work-cta";

export const metadata = {
  title: "Contact — Olamide",
  description: "Get in touch with Olamide about your next project.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <LetsWorkCta />
    </>
  );
}
