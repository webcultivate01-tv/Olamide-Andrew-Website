// The shapes a case study's images are cut to, and the rule that decides
// which blocks share a row. Shared by the public detail page and the admin
// preview so what an admin builds and what a visitor sees cannot drift
// apart.

// Every full-width rectangle on a detail page is cut a touch shorter than
// the hero above it — the hero keeps its own full-bleed ratio, everything
// after it reads as a slightly lower-profile column of images.
export const FULL_FRAME =
  "aspect-[3/2] w-full sm:aspect-[2/1] md:aspect-[1440/726]";

// Two HALF blocks split that same width between them. Cut to the full
// frame's own ratio each one would come out a thin strip, so a half block is
// given back some height — still shorter than a full image, but tall enough
// to hold a subject.
export const HALF_FRAME = "aspect-[8/9] w-full sm:aspect-[4/3] md:aspect-[5/3]";

// The sliver of page left showing between two half blocks. Deliberately
// slight — wide enough that the pair reads as two images rather than one
// accidental join, narrow enough that the row still reads as a single band
// split in two rather than as a pair of cards.
export const PAIR_GAP = "gap-2 md:gap-3";

// Pulls a row out of the page's padded column so it spans the whole
// viewport, which is what puts a full image's edges — and the outer edges of
// a half pair — flush against the left and right of the screen. The article
// around it is overflow-x-hidden, so the scrollbar's width cannot turn this
// into a horizontal scroll.
export const FULL_BLEED = "relative left-1/2 w-screen -translate-x-1/2";

export const frameFor = (layout) =>
  layout === "HALF" ? HALF_FRAME : FULL_FRAME;

// A half block covers half the viewport, a full one all of it; the browser
// needs to be told which before it picks a file to download.
export const sizesFor = (layout) => (layout === "HALF" ? "50vw" : "100vw");

/**
 * Groups the flat, ordered block list into rows: two consecutive HALF blocks
 * pair up into one two-column row, everything else (FULL, or a HALF with no
 * partner) stands alone. Done here rather than in the database, so the admin
 * can reorder blocks without having to think about pairing at all — whatever
 * comes out consecutive on save is what pairs up on the page.
 */
export function groupIntoRows(blocks) {
  const rows = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];

    if (block.layout === "HALF" && next?.layout === "HALF") {
      rows.push({ kind: "pair", blocks: [block, next], index: i });
      i++;
    } else {
      rows.push({ kind: "single", block, index: i });
    }
  }

  return rows;
}
