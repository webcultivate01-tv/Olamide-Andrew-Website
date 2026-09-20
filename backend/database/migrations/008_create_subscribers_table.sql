-- Email addresses collected from the newsletter signup on the public blog
-- page. Write-only from the website's side - reading and deleting rows both
-- live behind the admin login.
CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- The admin list is newest first.
    INDEX idx_subscribers_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
