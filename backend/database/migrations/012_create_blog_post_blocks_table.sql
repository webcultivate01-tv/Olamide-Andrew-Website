-- The set pieces in a blog post's body: an ordered list of blocks, each an
-- image, a solid brand-colour panel, or a heading-and-paragraph statement.
-- The post's own `content` column stays what it is - the Markdown body of the
-- article - and these sit above it, the same way a case study's blocks sit
-- below its intro.
--
-- Unlike case_study_blocks there is no `category` column here. A post's
-- category is whichever of its tags matches a row in `categories`, which is
-- the pairing the blog grid already uses, so a per-block one would be a
-- second answer to a question that already has one.
CREATE TABLE IF NOT EXISTS blog_post_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_post_id INT NOT NULL,
    -- The page order. Set from the block's position in the admin's list on
    -- every save, the same way a block's own id is never reordered - only
    -- this column is.
    sort_order INT NOT NULL DEFAULT 0,
    type ENUM('IMAGE', 'COLOR', 'TEXT') NOT NULL,
    -- Whether the block takes the full row or sits half-width next to the
    -- next HALF block.
    layout ENUM('FULL', 'HALF') NOT NULL DEFAULT 'FULL',
    -- TEXT blocks only. PROMISE is the larger statement treatment; every
    -- other text block is DEFAULT.
    variant ENUM('DEFAULT', 'PROMISE') NOT NULL DEFAULT 'DEFAULT',
    -- A TEXT block's heading on the page. An IMAGE block's name for the
    -- folder its uploads are filed under - see the `folder` field the upload
    -- middleware reads.
    heading VARCHAR(255) NULL,
    body TEXT NULL,
    -- Same two shapes as blog_posts.cover_image_url: an upload or a public
    -- file.
    image_url VARCHAR(500) NULL,
    image_alt VARCHAR(255) NULL,
    color_hex VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    -- Every read of a post's body asks for its blocks in page order.
    INDEX idx_blog_post_blocks_post (blog_post_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
