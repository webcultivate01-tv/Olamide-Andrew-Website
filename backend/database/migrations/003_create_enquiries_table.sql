CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    -- Not in the original spec, but the public contact form already asks for
    -- a company, and dropping it on the floor would lose real information.
    company VARCHAR(150),
    subject VARCHAR(255),
    service VARCHAR(150),
    message TEXT NOT NULL,
    status ENUM(
        'NEW',
        'CONTACTED',
        'IN_PROGRESS',
        'CONVERTED',
        'CLOSED'
    ) NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- The list is filtered by status and the badge counts NEW rows, so both
    -- run off this index instead of scanning the table.
    INDEX idx_enquiries_status (status),
    -- The list is always newest first, and paging through it sorts on this.
    INDEX idx_enquiries_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
