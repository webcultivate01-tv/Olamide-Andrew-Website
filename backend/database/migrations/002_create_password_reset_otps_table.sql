CREATE TABLE IF NOT EXISTS password_reset_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    -- The bcrypt hash of the OTP, never the 6 digits themselves.
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    -- Set to TRUE once the OTP has been verified, so it cannot be used twice.
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_otps_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE CASCADE,

    INDEX idx_otps_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
