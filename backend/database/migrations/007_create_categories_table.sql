-- Blog categories, managed from the admin panel sidebar. Kept as its own
-- small table rather than a comma-joined column like blog_posts.tags: a
-- category is a short, curated list an admin actively manages (add, rename,
-- delete), not free text typed per post.
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    -- The URL-safe handle, derived from the name unless one is typed by hand.
    slug VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
