import { pool, closePool } from "../../config/db.js";
import { CASE_STUDIES } from "./case-studies.data.js";

// Puts the four case studies the website was launched with into the database.
//
// They used to be a hardcoded array inside the Next.js page. Now that the page
// reads from the API, an empty table would mean an empty portfolio - so this
// moves that same content in, images and all, and the admin panel takes over
// from there.
//
// Running it twice is safe. A study whose slug is already there keeps
// everything it has: only a detail field that is still empty gets filled in,
// and its blocks are only written if it has none at all. So an edit made in
// the panel always survives, while a study that predates the detail-page
// content picks it up on the next run instead of staying a bare hero.
//
// Run with:  npm run db:seed:case-studies

const insertBlocks = async (caseStudyId, blocks) => {
  for (const [index, block] of blocks.entries()) {
    await pool.query(
      `INSERT INTO case_study_blocks
         (case_study_id, sort_order, type, layout, variant, heading, body, image_url, image_alt, color_hex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        caseStudyId,
        index,
        block.type,
        block.layout ?? "FULL",
        block.variant ?? "DEFAULT",
        block.heading ?? null,
        block.body ?? null,
        block.imageUrl ?? null,
        block.imageAlt ?? null,
        block.colorHex ?? null,
      ]
    );
  }
};

// COALESCE with NULLIF so a column that is NULL *or* an empty string counts as
// unfilled - anything an admin actually typed is left exactly as it is.
const backfillDetail = async (caseStudyId, study) => {
  const [result] = await pool.query(
    `UPDATE case_studies
        SET tagline    = COALESCE(NULLIF(tagline, ''), ?),
            categories = COALESCE(NULLIF(categories, ''), ?),
            intro      = COALESCE(NULLIF(intro, ''), ?)
      WHERE id = ?`,
    [
      study.tagline ?? null,
      study.categories ? study.categories.join(", ") : null,
      study.intro ? study.intro.join("\n\n") : null,
      caseStudyId,
    ]
  );

  return result.changedRows > 0;
};

const run = async () => {
  let created = 0;
  let backfilled = 0;

  for (const study of CASE_STUDIES) {
    const [rows] = await pool.query(
      "SELECT id FROM case_studies WHERE slug = ? LIMIT 1",
      [study.slug]
    );

    if (rows.length > 0) {
      const id = rows[0].id;
      const filledFields = await backfillDetail(id, study);

      const [[{ blockCount }]] = await pool.query(
        "SELECT COUNT(*) AS blockCount FROM case_study_blocks WHERE case_study_id = ?",
        [id]
      );

      let addedBlocks = 0;
      if (blockCount === 0 && study.blocks?.length) {
        await insertBlocks(id, study.blocks);
        addedBlocks = study.blocks.length;
      }

      if (filledFields || addedBlocks) {
        backfilled++;
        console.log(
          `filled   ${study.slug} (id ${id})` +
            (addedBlocks ? ` + ${addedBlocks} content block(s)` : "")
        );
      } else {
        console.log(`skipped  ${study.slug} (already there, id ${id})`);
      }

      continue;
    }

    const [result] = await pool.query(
      `INSERT INTO case_studies
         (title, slug, client, service, summary, image_url, image_alt, status, sort_order, published_at,
          tagline, categories, intro)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, NOW(), ?, ?, ?)`,
      [
        study.title,
        study.slug,
        study.client,
        study.service,
        study.summary,
        study.imageUrl,
        study.imageAlt,
        study.sortOrder,
        study.tagline ?? null,
        study.categories ? study.categories.join(", ") : null,
        study.intro ? study.intro.join("\n\n") : null,
      ]
    );

    console.log(`created  ${study.slug} (id ${result.insertId})`);
    created++;

    if (study.blocks?.length) {
      await insertBlocks(result.insertId, study.blocks);
      console.log(`  + ${study.blocks.length} content block(s)`);
    }
  }

  if (created === 0 && backfilled === 0) {
    console.log("Case studies already seeded.");
  } else {
    const parts = [];
    if (created) parts.push(`${created} case study/studies created`);
    if (backfilled) parts.push(`${backfilled} filled in`);
    console.log(`${parts.join(", ")}.`);
  }
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message || error.code);
    process.exitCode = 1;
  })
  .finally(closePool);
