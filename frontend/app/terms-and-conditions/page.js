import { pageMetadata } from "@/lib/site";
import LegalPage from "../components/legal-page";

export const metadata = pageMetadata({
  title: "Terms & Conditions | Olamide Andrew",
  description:
    "The terms that apply when you use the Olamide Andrew website and contact Olamide about a project.",
  path: "/terms-and-conditions",
});

const SECTIONS = [
  {
    heading: "1. Introduction",
    body: [
      "Welcome to Olamide. These Terms and Conditions govern your access to and use of our website, services, and content. By accessing or using our website, you agree to comply with these terms and any applicable laws and regulations.",
    ],
  },
  {
    heading: "2. Use of Our Website",
    body: [
      "You agree to use this website only for lawful purposes and in a manner that does not violate the rights of others. You must not misuse the website, attempt unauthorised access, disrupt its functionality, or engage in activities that could harm our business or other users.",
    ],
  },
  {
    heading: "3. Our Services",
    body: [
      "Olamide provides information about its business, services, and offerings through this website. The details presented are for general informational purposes, and the scope, availability, and terms of any specific service may be confirmed separately with us.",
    ],
  },
  {
    heading: "4. Enquiries and Communication",
    body: [
      "When submitting an enquiry or contacting us through the website, you agree to provide accurate and complete information. Submitting an enquiry does not automatically establish a business relationship, confirm an order, or create a contractual obligation unless separately agreed upon.",
    ],
  },
  {
    heading: "5. Intellectual Property Rights",
    body: [
      "Unless otherwise stated, the content on this website, including text, graphics, logos, images, designs, and other materials, is owned by Olamide or used with appropriate permission. You may not copy, reproduce, distribute, modify, or commercially use these materials without prior authorisation, except where permitted by law.",
    ],
  },
  {
    heading: "6. Accuracy of Information",
    body: [
      "We make reasonable efforts to keep the information on our website accurate and up to date. However, we do not guarantee that all content is complete, current, or free from errors, and we reserve the right to update website content when necessary.",
    ],
  },
  {
    heading: "7. Third-Party Links",
    body: [
      "Our website may include links to external websites or third-party services for additional information or convenience. Olamide does not control these external platforms and is not responsible for their content, availability, policies, or practices.",
    ],
  },
  {
    heading: "8. Limitation of Liability",
    body: [
      "To the extent permitted by applicable law, Olamide will not be liable for indirect or consequential losses arising from the use of, or inability to use, this website. Nothing in these terms excludes or limits liability where such exclusion or limitation is prohibited by law.",
    ],
  },
  {
    heading: "9. Privacy and Personal Information",
    body: [
      "Your use of this website may involve the collection of personal information through contact forms, enquiry forms, or newsletter subscriptions. Our Privacy Policy explains how we collect, use, and protect your information and should be read alongside these Terms and Conditions.",
    ],
  },
  {
    heading: "10. Website Availability and Security",
    body: [
      "We aim to keep our website accessible and functioning properly, but we cannot guarantee uninterrupted or error-free availability at all times. We may temporarily suspend, modify, or discontinue parts of the website for maintenance, security, technical, or operational reasons.",
    ],
  },
  {
    heading: "11. Prohibited Activities",
    body: [
      "You must not use this website to distribute malicious software, submit fraudulent information, violate applicable laws, or interfere with website security. We reserve the right to take reasonable action against misuse of the website, subject to applicable law.",
    ],
  },
  {
    heading: "12. Changes to These Terms",
    body: [
      "Olamide may update these Terms and Conditions to reflect changes in its services, website functionality, business operations, or legal requirements. Revised terms will be published on this page with an updated date, and continued use of the website after changes take effect may be subject to the revised terms where legally permitted.",
    ],
  },
  {
    heading: "13. Governing Law",
    body: [
      "These Terms and Conditions will be governed by the laws applicable to Olamide’s business and the relevant jurisdiction, subject to any mandatory legal protections that apply to users. Any disputes will be handled by the competent courts or dispute-resolution bodies as determined by applicable law.",
    ],
  },
  {
    heading: "14. Contact Us",
    body: [
      "If you have any questions regarding these Terms and Conditions or need clarification about the use of our website, please contact us through the Contact page. We will review your enquiry and provide further information as appropriate.",
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
