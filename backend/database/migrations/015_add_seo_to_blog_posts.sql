-- Per-post search engine settings, edited from the SEO panel on the admin
-- post form. Every column is optional: NULL means "fall back to the post's
-- own title / excerpt / tags", so a post with nothing set here still gets
-- sensible tags on the public page.
--
-- seo_keywords is a comma-separated list of phrases (spaces allowed, unlike
-- tags). seo_no_index hides the post from search engines and the sitemap
-- while leaving it published for anyone with the link.
ALTER TABLE blog_posts
    ADD COLUMN seo_title VARCHAR(70) NULL AFTER cover_image_alt,
    ADD COLUMN seo_description VARCHAR(320) NULL AFTER seo_title,
    ADD COLUMN seo_keywords VARCHAR(500) NULL AFTER seo_description,
    ADD COLUMN seo_image_url VARCHAR(500) NULL AFTER seo_keywords,
    ADD COLUMN seo_no_index TINYINT(1) NOT NULL DEFAULT 0 AFTER seo_image_url;
