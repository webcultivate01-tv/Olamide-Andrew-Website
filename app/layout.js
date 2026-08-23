import { Anton, Bodoni_Moda, Inter, Oswald } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";

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
  title: "Olamide",
  description: "Olamide — case studies, services and insights.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} ${anton.variable} ${bodoni.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Reveals are started by an IntersectionObserver, which never runs
            without JS — undo their hidden starting state so the content is
            still readable. */}
        <noscript>
          <style>{`[data-reveal],[data-reveal]>*,[data-reveal]>*>*{opacity:1!important;clip-path:none!important;transform:none!important}`}</style>
        </noscript>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
