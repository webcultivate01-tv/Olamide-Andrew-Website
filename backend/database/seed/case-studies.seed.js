import { pool, closePool } from "../../config/db.js";
import { CASE_STUDIES } from "./case-studies.data.js";

// Puts the four case studies the website was launched with into the database.
//
// They used to be a hardcoded array inside the Next.js page. Now that the page
// reads from the API, an empty table would mean an empty portfolio - so this
// moves that same content in, images and all, and the admin panel takes over
// from there.
//
// Running it twice is safe: a study whose slug is already there is left alone,
// so any edit made in the panel afterwards survives.
//
// Run with:  npm run db:seed:case-studies

const run = async () => {
  let created = 0;

  for (const study of CASE_STUDIES) {
    const [rows] = await pool.query(
      "SELECT id FROM case_studies WHERE slug = ? LIMIT 1",
      [study.slug]
    );

    if (rows.length > 0) {
      console.log(`skipped  ${study.slug} (already there, id ${rows[0].id})`);
      continue;
    }

    const [result] = await pool.query(
      `INSERT INTO case_studies
         (title, slug, client, service, summary, image_url, image_alt, status, sort_order, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, NOW())`,
      [
        study.title,
        study.slug,
        study.client,
        study.service,
        study.summary,
        study.imageUrl,
        study.imageAlt,
        study.sortOrder,
      ]
    );

    console.log(`created  ${study.slug} (id ${result.insertId})`);
    created++;
  }

  console.log(
    created === 0 ? "Case studies already seeded." : `${created} case study/studies created.`
  );
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message || error.code);
    process.exitCode = 1;
  })
  .finally(closePool);
