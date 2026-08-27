import Reveal from "../../components/reveal";

// Shared display heading for the About sections — Anton caps, with the
// emphasised word passed in as an accent-coloured <span> by the caller.
//
// The Reveal wrapper clips to the heading's own box, so the caps slide up
// from behind its bottom edge as the section scrolls in. Anton's caps only
// fill ~0.71em of the 1.05 line box, so nothing is trimmed by the clip.
export default function SectionHeading({ children, className = "" }) {
  return (
    <Reveal variant="mask">
      <h2
        className={`font-headline text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-foreground uppercase sm:text-5xl md:text-[3.5rem] lg:text-[4rem] ${className}`}
      >
        {children}
      </h2>
    </Reveal>
  );
}
