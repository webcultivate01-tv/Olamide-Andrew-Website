import { pageMetadata, SITE_URL, SITE_NAME, SAME_AS } from "@/lib/site";
import HomeHero from "./_components/home-hero";
import BrandMessage from "./_components/brand-message";
import HowIThink from "./_components/how-i-think";
import MyServices from "./_components/my-services";
import BrandWorkCta from "./components/brand-work-cta";

const TITLE = "Olamide Andrew | Strategic Brand Designer & Brand Strategist";
const DESCRIPTION =
  "Olamide Andrew is a Strategic Brand Designer helping founders and growing businesses with brand strategy, positioning and visual identity. Book a free brand audit.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/",
});

// Home-only structured data: what the business offers and how the process
// works, in a form search and answer engines can read. Not rendered visually.
const SERVICES = [
  {
    name: "Brand Strategy",
    description:
      "Defining how a business should be perceived, what makes it different, and how its brand should communicate, before any design begins.",
  },
  {
    name: "Visual Identity",
    description:
      "A cohesive visual system that expresses a brand consistently and builds trust across every interaction.",
  },
  {
    name: "Brand Activation",
    description:
      "Visuals and creative systems that help a brand show up consistently across every touchpoint.",
  },
];

const PROCESS = [
  {
    name: "Research",
    text: "Examine the audience, competitors and business environment to understand how the brand is perceived, what customers need and where opportunities exist.",
  },
  {
    name: "Strategy",
    text: "Connect business goals with customer needs to clarify value, shape messaging and determine the direction the brand should take.",
  },
  {
    name: "Positioning",
    text: "Define what makes the business relevant and different, so customers understand why the brand is the right fit.",
  },
];

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#business` },
      inLanguage: "en",
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: SITE_NAME,
      url: SITE_URL,
      image: `${SITE_URL}/olamide.png`,
      description: DESCRIPTION,
      founder: { "@id": `${SITE_URL}/#person` },
      sameAs: SAME_AS,
      knowsAbout: [
        "Brand strategy",
        "Brand positioning",
        "Visual identity design",
        "Brand activation",
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Founders and growing businesses",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Brand design services",
        itemListElement: SERVICES.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service.name,
            description: service.description,
            provider: { "@id": `${SITE_URL}/#business` },
          },
        })),
      },
    },
    {
      "@type": "HowTo",
      "@id": `${SITE_URL}/#process`,
      name: "How Olamide Andrew builds a brand that works",
      step: PROCESS.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomeHero />
      <BrandMessage />
      <HowIThink />
      <MyServices />
      <BrandWorkCta />
    </>
  );
}
