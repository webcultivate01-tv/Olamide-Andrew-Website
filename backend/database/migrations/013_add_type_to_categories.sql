-- The categories table now serves two lists: the blog's ('blog') and the case
-- studies' ('case_study'). Every row that existed before this migration was a
-- blog category, which is what the default gives them.
ALTER TABLE categories
    ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'blog' AFTER slug;
