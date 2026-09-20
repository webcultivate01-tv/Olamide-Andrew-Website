-- The admin panel lets the signed-in admin set their own display name and
-- profile photo, neither of which the table had a place for before.
ALTER TABLE admins
    ADD COLUMN name VARCHAR(150) NULL AFTER email,
    ADD COLUMN avatar_url VARCHAR(500) NULL AFTER role;
