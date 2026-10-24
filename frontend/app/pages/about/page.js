import { pageMetadata, SITE_URL, SITE_NAME, SAME_AS } from "@/lib/site";
import AboutHero from "@/components/about/about-hero";
import MyStory from "@/components/about/my-story";
import WhatIBelieve from "@/components/about/what-i-believe";
import HowIWork from "@/components/about/how-i-work";
import WhoIWorkWith from "@/components/about/who-i-work-with";
import BeyondDesign from "@/components/about/beyond-design";
import StartProjectCta from "@/components/about/start-project-cta";

const TITLE = "About Ọlámidé (Lah Meday) | Strategic Brand Designer";
const DESCRIPTION =
  "Meet Ọlámidé (Lah Meday), a Strategic Brand Designer with a BSc in Economics and a Diploma in Graphic Design, combining business thinking, brand strategy and visual design to help businesses communicate their value.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/about",
});

// About-only structured data: a profile page whose main subject is the person
// already declared in the site-wide graph (same @id, so the two merge), plus
// the credentials and expertise stated in the page copy. Not rendered visually.
const aboutStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/about#webpage`,
      url: `${SITE_URL}/about`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: { "@id": `${SITE_URL}/#person` },
      breadcrumb: { "@id": `${SITE_URL}/about#breadcrumb` },
      primaryImageOfPage: { "@id": `${SITE_URL}/about#portrait` },
      inLanguage: "en",
    },
    {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/about#portrait`,
      url: `${SITE_URL}/olamide.png`,
      contentUrl: `${SITE_URL}/olamide.png`,
      caption: "Ọlámidé (Lah Meday), Strategic Brand Designer",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}/about#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "About",
          item: `${SITE_URL}/about`,
        },
      ],
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Olamide Andrew",
      alternateName: ["Ọlámidé", "Lah Meday"],
      jobTitle: "Strategic Brand Designer",
      description:
        "Strategic Brand Designer who brings business thinking, brand strategy and visual design together to help businesses communicate their value clearly.",
      url: `${SITE_URL}/about`,
      image: `${SITE_URL}/olamide.png`,
      sameAs: SAME_AS,
      worksFor: { "@id": `${SITE_URL}/#business` },
      hasCredential: [
        {
          "@type": "EducationalOccupationalCredential",
          name: "BSc in Economics",
          credentialCategory: "degree",
        },
        {
          "@type": "EducationalOccupationalCredential",
          name: "Diploma in Graphic Design",
          credentialCategory: "diploma",
        },
        {
          "@type": "EducationalOccupationalCredential",
          name: "RGD Associate Member",
          credentialCategory: "membership",
        },
      ],
      knowsAbout: [
        "Brand strategy",
        "Brand positioning",
        "Visual identity design",
        "Brand activation",
        "Graphic design",
        "Business development",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: SITE_NAME,
      url: SITE_URL,
      founder: { "@id": `${SITE_URL}/#person` },
      sameAs: SAME_AS,
      audience: {
        "@type": "Audience",
        audienceType:
          "Established businesses entering new markets, targeting higher-value clients, or outgrowing their current brand",
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutStructuredData).replace(/</g, "\\u003c"),
        }}
      />
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
