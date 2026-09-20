-- The body of a case study's detail page: an ordered list of blocks, each an
-- image, a solid brand-colour panel, or a heading-and-paragraph statement.
-- One flexible table rather than fixed columns on case_studies, because the
-- detail page's body is a variable-length sequence an admin builds up
-- project by project, not a fixed set of fields every study fills in.
CREATE TABLE IF NOT EXISTS case_study_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_study_id INT NOT NULL,
    -- The page order. Set from the block's position in the admin's list on
    -- every save, the same way a block's own id is never reordered - only
    -- this column is.
    sort_order INT NOT NULL DEFAULT 0,
    type ENUM('IMAGE', 'COLOR', 'TEXT') NOT NULL,
    -- Whether the block takes the full row or sits half-width next to the
    -- next HALF block - the paired colour panels in the reference layout.
    layout ENUM('FULL', 'HALF') NOT NULL DEFAULT 'FULL',
    -- TEXT blocks only. PROMISE is the larger "brand promise" statement
    -- treatment; every other text block is DEFAULT.
    variant ENUM('DEFAULT', 'PROMISE') NOT NULL DEFAULT 'DEFAULT',
    heading VARCHAR(255) NULL,
    body TEXT NULL,
    -- Same two shapes as case_studies.image_url: an upload or a public file.
    image_url VARCHAR(500) NULL,
    image_alt VARCHAR(255) NULL,
    -- A hex value, the client's own brand colour rather than the site's -
    -- free text per block, not a reference to any fixed palette.
    color_hex VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE,
    -- Every read of a study's body asks for its blocks in page order.
    INDEX idx_case_study_blocks_study (case_study_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
