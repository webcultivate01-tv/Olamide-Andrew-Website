-- The detail page needs more than the grid card did: a subtitle under the
-- title (tagline), the sidebar list of categories the project touched
-- (categories - a comma-separated list of display labels, free text rather
-- than a join to the `categories` table, which is the blog's own curated
-- list), and the intro paragraphs above the fold (intro - blank-line
-- separated, TEXT rather than VARCHAR since it can run to several
-- paragraphs). `summary` is left alone - it is still the shorter blurb the
-- grid card shows.
ALTER TABLE case_studies
    ADD COLUMN tagline VARCHAR(255) NULL AFTER title,
    ADD COLUMN categories VARCHAR(500) NULL AFTER service,
    ADD COLUMN intro TEXT NULL AFTER summary;
