import { pool, closePool } from "../../config/db.js";
import { CASE_STUDIES } from "./case-studies.data.js";

// Puts the three categories the blog page used to have hard-coded into the
// database, so the admin panel's category list - and the website's category
// filter, which now reads from the same table - are not empty the moment this
// feature ships.
//
// Running it twice is safe: a category whose slug is already there is left
// alone, so a rename made in the panel afterwards survives.
//
// Run with:  npm run db:seed:categories

const BLOG_CATEGORIES = [
  { name: "Brand Strategy", slug: "brand-strategy" },
  { name: "Visual Identity", slug: "visual-identity" },
  { name: "Brand Activation", slug: "brand-activation" },
  { name: "Branding", slug: "branding" },
];

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// The labels the seeded case studies already use, so their categories are
// managed entries from the start. A slug the blog list already holds gets a
// "-case-study" suffix, since slugs are unique across both lists.
const blogSlugs = new Set(BLOG_CATEGORIES.map((category) => category.slug));
const caseStudyNames = [
  ...new Set(CASE_STUDIES.flatMap((study) => study.categories ?? [])),
];

const CATEGORIES = [
  ...BLOG_CATEGORIES.map((category) => ({ ...category, type: "blog" })),
  ...caseStudyNames.map((name) => {
    const slug = slugify(name);
    return {
      name,
      slug: blogSlugs.has(slug) ? `${slug}-case-study` : slug,
      type: "case_study",
    };
  }),
];

const run = async () => {
  let created = 0;

  for (const category of CATEGORIES) {
    const [rows] = await pool.query(
      "SELECT id FROM categories WHERE slug = ? LIMIT 1",
      [category.slug]
    );

    if (rows.length > 0) {
      console.log(`skipped  ${category.slug} (already there, id ${rows[0].id})`);
      continue;
    }

    const [result] = await pool.query(
      "INSERT INTO categories (name, slug, type) VALUES (?, ?, ?)",
      [category.name, category.slug, category.type]
    );

    console.log(`created  ${category.slug} (id ${result.insertId})`);
    created++;
  }

  console.log(created === 0 ? "Categories already seeded." : `${created} category/categories created.`);
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message || error.code);
    process.exitCode = 1;
  })
  .finally(closePool);
