-- ============================================================
-- Migration: V002_20241206_add_avatar_url_to_users
-- Description: Add avatar_url field to users table
-- ============================================================
-- revision: V002
-- down_revision: V001
-- create_date: 2024-12-06
-- ============================================================

-- ==================== UPGRADE ====================
-- Add avatar_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
        COMMENT ON COLUMN users.avatar_url IS '用户头像URL';
        RAISE NOTICE 'Column avatar_url added to users table';
    ELSE
        RAISE NOTICE 'Column avatar_url already exists, skipping';
    END IF;
END $$;

-- ==================== DOWNGRADE ====================
-- To rollback this migration, run:
-- ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

-- ==================== VERIFICATION ====================
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'avatar_url';
