import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import Reveal from "./reveal";
import RevealWords from "./reveal-words";
import {
  FULL_BLEED,
  PAIR_GAP,
  frameFor,
  groupIntoRows,
  sizesFor,
} from "@/app/case-studies/_components/case-study-layout";
import SplitRow from "@/app/case-studies/_components/split-row";

// The body a case study and a blog post are both built out of: an ordered
// list of images, brand-colour panels and headed statements. Nothing here
// knows which of the two it is rendering - a block is a block - so the two
// features cannot drift apart in how they lay one out.
//
// The shapes still come from case-study-layout, which is where they were
// written and which the admin preview already reads them from.

function ColorBlock({ block, delay = 0 }) {
  return (
    <Reveal variant="wipe" delay={delay} className="overflow-hidden">
      <div
        className={frameFor(block.layout)}
        style={{ backgroundColor: block.colorHex || "#e5e5e5" }}
      />
    </Reveal>
  );
}

function ImageBlock({ block, delay = 0 }) {
  const src = mediaUrl(block.imageUrl);
  if (!src) return null;

  // Three levels deep on purpose: the wipe reveal clips on the frame and
  // zooms the face inside it (see [data-reveal="wipe"] in globals.css).
  return (
    <Reveal variant="wipe" delay={delay} className="overflow-hidden">
      <div>
        <div className={`relative ${frameFor(block.layout)}`}>
          <Image
            src={src}
            alt={block.imageAlt || ""}
            fill
            sizes={sizesFor(block.layout)}
            className="object-cover"
          />
        </div>
      </div>
    </Reveal>
  );
}

function TextBlock({ block, delay = 0 }) {
  const isPromise = block.variant === "PROMISE";

  return (
    <div
      className={
        isPromise
          ? "mx-auto max-w-[880px] py-12 text-left md:py-16"
          : "mx-auto max-w-[880px] py-12 text-center md:py-16"
      }
    >
      {block.heading ? (
        <RevealWords
          as="h3"
          text={block.heading}
          step={35}
          delay={delay}
          className="font-headline text-2xl leading-[1.2] tracking-[-0.01em] text-foreground uppercase sm:text-3xl md:text-4xl"
        />
      ) : null}
      {block.body ? (
        <Reveal
          as="p"
          delay={delay + 120}
          className={
            isPromise
              ? "mt-5 max-w-2xl text-base leading-[1.9] text-black/70 md:text-lg"
              : "mt-5 text-base leading-[1.9] text-black/70 md:text-lg"
          }
        >
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

/**
 * The ordered list of images, brand-colour panels and headed statements an
 * admin builds up. Renders nothing for a record with no blocks yet, rather
 * than an empty section.
 *
 * Images span the screen — a full one alone, a half pair splitting the
 * screen between them, separated by a hairline gap and with their outer
 * edges flush against it. Text is the exception throughout: it stays inside
 * the page's own column, where it is readable.
 */
export default function ContentBlocks({ blocks = [] }) {
  if (!blocks.length) return null;

  const rows = groupIntoRows(blocks);

  return (
    <div className="mt-16 space-y-3 md:mt-20 md:space-y-4">
      {rows.map((row, index) => {
        const delay = (index % 4) * 90;

        if (row.kind === "pair") {
          return (
            <SplitRow
              key={index}
              className={`grid grid-cols-2 ${PAIR_GAP}`}
              left={<Block block={row.blocks[0]} delay={delay} />}
              right={<Block block={row.blocks[1]} delay={delay + 90} />}
            />
          );
        }

        if (row.block.type === "TEXT") {
          return <Block key={index} block={row.block} delay={delay} />;
        }

        // A half block left without a partner keeps to its half of the
        // screen rather than stretching across it, so its shape stays the
        // one the admin picked.
        if (row.block.layout === "HALF") {
          return (
            <div key={index} className={`${FULL_BLEED} grid grid-cols-2 ${PAIR_GAP}`}>
              <Block block={row.block} delay={delay} />
            </div>
          );
        }

        return (
          <div key={index} className={FULL_BLEED}>
            <Block block={row.block} delay={delay} />
          </div>
        );
      })}
    </div>
  );
}
