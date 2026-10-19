import { pageMetadata } from "@/lib/site";
import LegalPage from "../components/legal-page";

export const metadata = pageMetadata({
  title: "Privacy Policy | Olamide Andrew",
  description:
    "How Olamide Andrew collects, uses, stores and protects the personal information you share through this website.",
  path: "/privacy-policy",
});

const SECTIONS = [
  {
    heading: "1. Introduction",
    body: [
      "Welcome to Olamide. We respect your privacy and are committed to protecting the personal information you share with us through our website. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or contact us.",
    ],
  },
  {
    heading: "2. Information We Collect",
    body: [
      "We may collect personal information that you voluntarily provide through our enquiry forms, contact forms, or newsletter subscriptions. This information may include your name, company name, email address, phone number, and the message or details you submit to us.",
    ],
  },
  {
    heading: "3. How We Use Your Information",
    body: [
      "We use the information we collect to respond to your enquiries, communicate with you about potential projects, provide requested services, and send newsletter updates when you have subscribed. We may also use this information to improve our website, understand user needs, and enhance our services.",
    ],
  },
  {
    heading: "4. Cookies and Tracking Technologies",
    body: [
      "Our website may use cookies and similar technologies to improve website functionality, understand visitor behaviour, and enhance the browsing experience. Where required by applicable law, we will request your consent before using non-essential cookies or tracking technologies.",
    ],
  },
  {
    heading: "5. Sharing of Information",
    body: [
      "We do not sell your personal information to third parties. We may share relevant information with trusted service providers who help us operate our website, manage communications, or deliver our services, or when disclosure is required by law.",
    ],
  },
  {
    heading: "6. Data Security",
    body: [
      "We take reasonable technical and organisational measures to protect the personal information we collect against unauthorised access, misuse, loss, alteration, or disclosure. However, no method of storing or transmitting information over the internet can be guaranteed to be completely secure.",
    ],
  },
  {
    heading: "7. Data Retention",
    body: [
      "We retain personal information only for as long as reasonably necessary to fulfil the purposes described in this Privacy Policy, respond to enquiries, maintain relevant business records, and meet applicable legal obligations. When the information is no longer required, we will take appropriate steps to delete or securely dispose of it.",
    ],
  },
  {
    heading: "8. Your Privacy Rights",
    body: [
      "Depending on the laws applicable to you, you may have the right to request access to, correction of, or deletion of your personal information. You can contact us to exercise these rights, and we will review and respond to your request in accordance with applicable legal requirements.",
    ],
  },
  {
    heading: "9. Newsletter and Marketing Preferences",
    body: [
      "If you subscribe to our newsletter, we may use your email address to send updates, announcements, and other information relevant to our services. You can unsubscribe at any time by using the unsubscribe link included in our emails or by contacting us directly.",
    ],
  },
  {
    heading: "10. Third-Party Links",
    body: [
      "Our website may contain links to third-party websites, platforms, or services for your convenience and reference. We do not control the privacy practices of these external websites, so we encourage you to review their respective privacy policies before sharing personal information with them.",
    ],
  },
  {
    heading: "11. Children’s Privacy",
    body: [
      "Our website is not intended to knowingly collect personal information from children where such collection is prohibited by applicable law. If we become aware that personal information has been collected inappropriately from a child, we will take reasonable steps to review the situation and delete the information where required.",
    ],
  },
  {
    heading: "12. Changes to This Privacy Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our website, business practices, services, or applicable legal requirements. Any updates will be published on this page along with the revised “Last Updated” date, and we encourage visitors to review this page periodically.",
    ],
  },
  {
    heading: "13. Contact Us",
    body: [
      "If you have questions about this Privacy Policy, how we handle your personal information, or wish to make a privacy-related request, please contact us through the Contact page on our website. We will review your enquiry and respond as appropriate under applicable privacy requirements.",
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
