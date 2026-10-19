import { Anton, Bodoni_Moda, Inter, Oswald } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import SiteChrome from "./components/site-chrome";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Bold condensed grotesque for the header nav + CTA.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

// Heavy condensed grotesque for oversized display headlines. Single weight.
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

// Variable didone — the footer wordmark pulls several weights from it.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
});

export const metadata = {
  // Makes every relative URL in metadata (canonical, social images) absolute.
  metadataBase: new URL(SITE_URL),
  title: "Olamide",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // "./" resolves to each page's own URL, so every page declares itself as
  // the canonical version and ?query strings don't split its ranking.
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_CA",
    title: "Olamide — Strategic Brand Designer",
    description: SITE_DESCRIPTION,
    images: [{ url: "/olamide.png", alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olamide — Strategic Brand Designer",
    description: SITE_DESCRIPTION,
    images: ["/olamide.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Paste the token from Google Search Console ("HTML tag" method) into
  // NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION. Omitted until it is set.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

// Structured data: tells Google who this site is about, which feeds the
// knowledge panel and sitelinks.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#person` },
      inLanguage: "en",
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Olamide Andrew",
      alternateName: "Lah Meday",
      jobTitle: "Strategic Brand Designer",
      url: SITE_URL,
      image: `${SITE_URL}/olamide.png`,
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} ${anton.variable} ${bodoni.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        {/* Reveals are started by an IntersectionObserver, which never runs
            without JS — undo their hidden starting state so the content is
            still readable. */}
        <noscript>
          <style>{`[data-reveal],[data-reveal]>*,[data-reveal]>*>*{opacity:1!important;clip-path:none!important;transform:none!important}`}</style>
        </noscript>
        <SiteChrome>
          <SiteHeader />
        </SiteChrome>
        <main className="flex-1">{children}</main>
        <SiteChrome>
          <SiteFooter />
        </SiteChrome>
      </body>
    </html>
  );
}
