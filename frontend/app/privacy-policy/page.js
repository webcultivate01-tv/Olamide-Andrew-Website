import LegalPage from "../components/legal-page";

export const metadata = {
  title: "Privacy Policy — Olamide",
  description: "How Olamide Andrew collects, uses and protects your information.",
};

const SECTIONS = [
  {
    heading: "Information we collect",
    body: [
      "When you contact us through the enquiry form or subscribe to the newsletter, we collect the details you provide, such as your name, company, email address, phone number and message.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "We use your information to respond to enquiries, discuss potential projects, send newsletter updates you have asked for, and improve the website.",
      "We do not sell your personal information to third parties.",
    ],
  },
  {
    heading: "Data retention and security",
    body: [
      "We keep your information only as long as needed for the purposes above and take reasonable steps to protect it from unauthorised access.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can unsubscribe from the newsletter at any time, and you may ask us to access, correct or delete the personal information we hold about you.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "For any privacy questions, please reach out through the Contact page.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026"
      sections={SECTIONS}
    />
  );
}
