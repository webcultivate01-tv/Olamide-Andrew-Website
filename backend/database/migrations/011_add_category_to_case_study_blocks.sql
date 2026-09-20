-- Ties a content block to one of its case study's own categories (the free
-- text list on case_studies.categories, not a join to the `categories`
-- table - a block's category has to be one of the labels typed for that
-- specific study, the same list its sidebar shows). NULL means the block
-- is not tied to any category and stays visible no matter which one a
-- visitor has selected.
ALTER TABLE case_study_blocks
    ADD COLUMN category VARCHAR(60) NULL AFTER layout;
