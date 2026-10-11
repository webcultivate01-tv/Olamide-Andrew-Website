import LegalPage from "../components/legal-page";

export const metadata = {
  title: "Terms & Conditions — Olamide",
  description: "The terms that apply when you use the Olamide Andrew website.",
};

const SECTIONS = [
  {
    heading: "Use of this website",
    body: [
      "By accessing this website you agree to these terms. Please do not use the site if you do not agree with them.",
    ],
  },
  {
    heading: "Intellectual property",
    body: [
      "All content, including case studies, images, text and branding, belongs to Olamide Andrew or the respective clients and may not be copied, reproduced or distributed without written permission.",
    ],
  },
  {
    heading: "Enquiries and services",
    body: [
      "Submitting an enquiry does not create a contract. Services are provided under a separate written agreement agreed by both parties.",
    ],
  },
  {
    heading: "Limitation of liability",
    body: [
      "The website is provided as is. We make reasonable efforts to keep information accurate but are not liable for losses arising from its use.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "We may update these terms from time to time. Continued use of the site means you accept the updated terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="October 2026"
      sections={SECTIONS}
    />
  );
}
