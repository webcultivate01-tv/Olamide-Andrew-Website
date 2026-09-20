import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import Reveal from "../../components/reveal";
import RevealWords from "../../components/reveal-words";
import { FULL_FRAME, groupIntoRows } from "./case-study-layout";

// The mobile counterpart to case-study-blocks.js: every block full-width and
// stacked (no half/half split — there isn't room for it on a phone), inset
// inside the page's own padding rather than bled to the screen edges, with
// headings and body copy left-aligned instead of centred.

function ColorBlock({ block, delay = 0 }) {
  return (
    <Reveal variant="wipe" delay={delay} className="overflow-hidden">
      <div className={FULL_FRAME} style={{ backgroundColor: block.colorHex || "#e5e5e5" }} />
    </Reveal>
  );
}

function ImageBlock({ block, delay = 0 }) {
  const src = mediaUrl(block.imageUrl);
  if (!src) return null;

  return (
    <Reveal variant="wipe" delay={delay} className="overflow-hidden">
      <div>
        <div className={`relative ${FULL_FRAME}`}>
          <Image src={src} alt={block.imageAlt || ""} fill sizes="100vw" className="object-cover" />
        </div>
      </div>
    </Reveal>
  );
}

function TextBlock({ block, delay = 0 }) {
  return (
    <div className="py-10">
      {block.heading ? (
        <RevealWords
          as="h3"
          text={block.heading}
          step={35}
          delay={delay}
          className="font-headline text-2xl leading-[1.2] tracking-[-0.01em] text-foreground uppercase"
        />
      ) : null}
      {block.body ? (
        <Reveal as="p" delay={delay + 120} className="mt-4 text-base leading-[1.8] text-black/70">
          {block.body}
        </Reveal>
      ) : null}
    </div>
  );
}

function Block({ block, delay = 0 }) {
  if (block.type === "IMAGE") return <ImageBlock block={block} delay={delay} />;
  if (block.type === "COLOR") return <ColorBlock block={block} delay={delay} />;
  return <TextBlock block={block} delay={delay} />;
}

export default function CaseStudyBlocksMobile({ blocks = [] }) {
  if (!blocks.length) return null;

  const rows = groupIntoRows(blocks);

  return (
    <div className="mt-10 space-y-3">
      {rows.map((row, index) => {
        const delay = (index % 4) * 90;

        if (row.kind === "pair") {
          return (
            <div key={index} className="space-y-3">
              <Block block={row.blocks[0]} delay={delay} />
              <Block block={row.blocks[1]} delay={delay + 90} />
            </div>
          );
        }

        return <Block key={index} block={row.block} delay={delay} />;
      })}
    </div>
  );
}
