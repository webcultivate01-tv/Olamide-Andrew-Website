-- Ties a content block to one of the admin's blog categories (categories.slug,
-- the same list the post's own "Category" field picks from), for parity with
-- case_study_blocks.category. NULL means the block is not tied to any
-- category. Unlike case studies, the public blog page does not filter blocks
-- by category - a post only ever shows one category of its own, so there is
-- no per-category view to filter into. This column exists for the admin form
-- alone; every block still always shows on the post.
ALTER TABLE blog_post_blocks
    ADD COLUMN category VARCHAR(60) NULL AFTER layout;
