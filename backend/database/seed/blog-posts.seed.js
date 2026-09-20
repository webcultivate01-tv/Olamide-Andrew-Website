import { pool, closePool } from "../../config/db.js";
import { BLOG_POSTS } from "./blog-posts.data.js";

// Puts the website's first blog posts into the database, so /insights and the
// post pages it links to are not empty before anything has been written in
// the panel.
//
// Running it twice is safe: a post whose slug is already there is left
// exactly as it is, so an edit made in the panel always survives.
//
// Run with:  npm run db:seed:blog-posts

// How fast a person reads prose, in words a minute - the same number
// blog-post.controller.js uses, so a seeded post and a written one report
// their length the same way.
const WORDS_PER_MINUTE = 200;

const readingTime = (content) =>
  Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE));

const run = async () => {
  let created = 0;

  for (const post of BLOG_POSTS) {
    const [rows] = await pool.query(
      "SELECT id FROM blog_posts WHERE slug = ? LIMIT 1",
      [post.slug]
    );

    if (rows.length > 0) {
      console.log(`skipped  ${post.slug} (already there, id ${rows[0].id})`);
      continue;
    }

    const [result] = await pool.query(
      `INSERT INTO blog_posts
         (title, slug, excerpt, content, author, tags, cover_image_url,
          cover_image_alt, reading_time, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', NOW())`,
      [
        post.title,
        post.slug,
        post.excerpt,
        post.content,
        post.author,
        post.tags.length ? post.tags.join(",") : null,
        post.coverImageUrl,
        post.coverImageAlt,
        readingTime(post.content),
      ]
    );

    console.log(`created  ${post.slug} (id ${result.insertId})`);
    created++;
  }

  console.log(created === 0 ? "Blog posts already seeded." : `${created} post(s) created.`);
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message || error.code);
    process.exitCode = 1;
  })
  .finally(closePool);
