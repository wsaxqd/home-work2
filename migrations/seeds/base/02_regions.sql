-- ============================================================
-- Seed: 02_regions.sql
-- Description: Base regions data
-- ============================================================

INSERT INTO regions (id, name, language_code, timezone, network_condition) VALUES
    (1, '中国大陆', 'zh-CN', 'Asia/Shanghai', 'good'),
    (2, '东南亚', 'en', 'Asia/Singapore', 'moderate'),
    (3, '非洲', 'en', 'Africa/Nairobi', 'poor'),
    (4, '南亚', 'en', 'Asia/Kolkata', 'moderate')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    language_code = EXCLUDED.language_code,
    timezone = EXCLUDED.timezone,
    network_condition = EXCLUDED.network_condition;

SELECT 'regions seeded' AS status;
