CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    -- The post's address. Unlike a case study, a blog post is meant to be
    -- linked to from elsewhere, so this is the part that must never change
    -- once the post is live - the controller only re-derives it while the
    -- post is still a draft.
    slug VARCHAR(200) NOT NULL UNIQUE,
    -- The blurb on the index card and in the meta description. Short on
    -- purpose: a paragraph, not the opening of the post.
    excerpt VARCHAR(400) NOT NULL,
    -- The post itself, written as Markdown. MEDIUMTEXT rather than TEXT
    -- because TEXT tops out around 64 KB, which a long post with embedded
    -- links can genuinely reach.
    content MEDIUMTEXT NOT NULL,
    -- Free text rather than a join to admins: posts can be credited to a guest
    -- or to the studio, and there is only ever one admin account to join to.
    author VARCHAR(150),
    -- A comma-separated list, normalised by the validator and handed to the
    -- API as an array. A join table would be the right answer for filtering by
    -- tag across thousands of posts; this is a handful of posts with two or
    -- three tags each, and the column keeps the whole feature in one table.
    tags VARCHAR(255),
    -- Either an upload (/uploads/blog/...) or a file already sitting in the
    -- Next.js public folder. Same two shapes as case_studies.image_url.
    cover_image_url VARCHAR(500),
    cover_image_alt VARCHAR(255),
    -- Minutes, worked out from the word count when the post is saved. Stored
    -- rather than computed on read so the index can show it without loading
    -- every post's body.
    reading_time INT NOT NULL DEFAULT 1,
    status ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    -- Set the first time a post goes live and left alone afterwards. This is
    -- also the sort key: a blog is chronological, so there is no hand-set
    -- display order the way the case study grid has one.
    published_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- The public list asks for published rows only, and the admin list filters
    -- on the same column.
    INDEX idx_blog_posts_status (status),
    -- Every list is ordered by this before anything else.
    INDEX idx_blog_posts_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
