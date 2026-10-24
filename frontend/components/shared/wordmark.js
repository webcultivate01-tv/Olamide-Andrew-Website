import Image from "next/image";

const LAPTOP_IMAGE_SRC = "/laptop-footer.png";
// Cropped to just the "OLAMIDE" lockup — the source screenshot also
// included the footer nav row (Case Studies, About, ...), which is already
// rendered separately by SiteFooter, so it's cropped out here.
const MOBILE_IMAGE_SRC = "/mobile-footer.png";

export default function Wordmark({ className = "" }) {
  return (
    <>
      <Image
        src={MOBILE_IMAGE_SRC}
        alt="Olamide"
        width={402}
        height={144}
        className={`block h-auto w-full sm:hidden ${className}`}
      />
      <Image
        src={LAPTOP_IMAGE_SRC}
        alt="Olamide"
        width={849}
        height={294}
        className={`hidden h-auto w-full sm:block ${className}`}
      />
    </>
  );
}
