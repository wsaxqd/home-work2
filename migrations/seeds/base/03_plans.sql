-- ============================================================
-- Seed: 03_plans.sql
-- Description: Subscription plans for AI Universal Education Platform
-- ============================================================
-- Idempotent: Yes (uses ON CONFLICT)
-- ============================================================

INSERT INTO plans (id, name, price, features, is_active, sort_order) VALUES
(1, 'Free', 0.00,
 '[
    {"key": "courses_access", "label": "免费课程访问", "value": "基础课程"},
    {"key": "video_quality", "label": "视频清晰度", "value": "标清 480p"},
    {"key": "offline_download", "label": "离线下载", "value": false},
    {"key": "certificate", "label": "结业证书", "value": false},
    {"key": "support", "label": "技术支持", "value": "社区支持"},
    {"key": "ai_assistant", "label": "AI学习助手", "value": false},
    {"key": "progress_sync", "label": "多设备同步", "value": false},
    {"key": "ads", "label": "广告", "value": true}
 ]'::jsonb,
 TRUE, 1),

(2, 'Pro', 88.00,
 '[
    {"key": "courses_access", "label": "课程访问", "value": "全部课程"},
    {"key": "video_quality", "label": "视频清晰度", "value": "高清 1080p"},
    {"key": "offline_download", "label": "离线下载", "value": true},
    {"key": "certificate", "label": "结业证书", "value": true},
    {"key": "support", "label": "技术支持", "value": "邮件支持 24h响应"},
    {"key": "ai_assistant", "label": "AI学习助手", "value": true},
    {"key": "progress_sync", "label": "多设备同步", "value": true},
    {"key": "ads", "label": "广告", "value": false},
    {"key": "early_access", "label": "新课程抢先看", "value": true},
    {"key": "playback_speed", "label": "播放速度调节", "value": "0.5x - 3x"}
 ]'::jsonb,
 TRUE, 2),

(3, 'Team', 188.00,
 '[
    {"key": "courses_access", "label": "课程访问", "value": "全部课程 + 企业专属"},
    {"key": "video_quality", "label": "视频清晰度", "value": "超清 4K"},
    {"key": "offline_download", "label": "离线下载", "value": true},
    {"key": "certificate", "label": "结业证书", "value": true},
    {"key": "support", "label": "技术支持", "value": "专属客服 1h响应"},
    {"key": "ai_assistant", "label": "AI学习助手", "value": true},
    {"key": "progress_sync", "label": "多设备同步", "value": true},
    {"key": "ads", "label": "广告", "value": false},
    {"key": "early_access", "label": "新课程抢先看", "value": true},
    {"key": "playback_speed", "label": "播放速度调节", "value": "0.5x - 3x"},
    {"key": "team_members", "label": "团队成员", "value": "最多10人"},
    {"key": "admin_dashboard", "label": "管理后台", "value": true},
    {"key": "learning_analytics", "label": "学习数据分析", "value": "团队报表"},
    {"key": "api_access", "label": "API访问", "value": true},
    {"key": "sso", "label": "企业SSO登录", "value": true}
 ]'::jsonb,
 TRUE, 3)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

-- ==================== VERIFICATION ====================
SELECT id, name, price, is_active FROM plans ORDER BY sort_order;
