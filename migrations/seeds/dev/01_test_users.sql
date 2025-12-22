-- ============================================================
-- Seed: dev/01_test_users.sql
-- Description: Test users for development environment
-- ============================================================

INSERT INTO users (id, role_id, region_id, username, email, phone, password_hash, status) VALUES
    (1, 4, 1, 'admin_test', 'admin@test.local', '13800000001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTkYBZQ4Q2lK2G', 'active'),
    (2, 2, 1, 'teacher_test', 'teacher@test.local', '13800000002', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTkYBZQ4Q2lK2G', 'active'),
    (3, 1, 1, 'student_test', 'student@test.local', '13800000003', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTkYBZQ4Q2lK2G', 'active')
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    updated_at = CURRENT_TIMESTAMP;

SELECT 'dev test_users seeded' AS status;
