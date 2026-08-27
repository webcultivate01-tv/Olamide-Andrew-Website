CREATE TABLE IF NOT EXISTS case_studies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    -- A stable, URL-safe handle for the study. Nothing links to it yet, but it
    -- is what a /case-studies/<slug> page would be built on, and the UNIQUE on
    -- it is what stops the same project being entered twice by accident.
    slug VARCHAR(180) NOT NULL UNIQUE,
    client VARCHAR(150),
    service VARCHAR(150),
    -- The paragraph under the title on the website's grid.
    summary VARCHAR(600) NOT NULL,
    -- Either an upload (/uploads/case-studies/...) or a file already sitting in
    -- the Next.js public folder (/case-studies/...). The frontend resolves the
    -- first against the API's origin and serves the second itself.
    image_url VARCHAR(500),
    -- Kept next to the image and required alongside it: the grid is four large
    -- photographs, and a missing alt makes the whole page unreadable to a
    -- screen reader.
    image_alt VARCHAR(255),
    status ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    -- The website shows these in a deliberate order, not by date - the strongest
    -- work goes first. Lowest number wins.
    sort_order INT NOT NULL DEFAULT 0,
    -- Set the first time a study goes live, and left alone afterwards, so
    -- unpublishing and republishing does not rewrite its history.
    published_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- The public list asks for published rows only, and the admin list filters
    -- on the same column.
    INDEX idx_case_studies_status (status),
    -- Both lists are ordered by this before anything else.
    INDEX idx_case_studies_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
