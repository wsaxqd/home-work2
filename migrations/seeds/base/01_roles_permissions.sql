-- ============================================================
-- Seed: 01_roles_permissions.sql
-- Description: Base roles and permissions data
-- ============================================================

INSERT INTO roles (id, name, description) VALUES
    (1, 'student', '学生 - 学习课程的主要用户'),
    (2, 'teacher', '教师 - 创建和管理课程内容'),
    (3, 'volunteer', '志愿者 - 提供学习支持和帮助'),
    (4, 'admin', '管理员 - 系统管理和配置')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO permissions (id, code, description) VALUES
    (1, 'course:view', '查看课程'),
    (2, 'course:create', '创建课程'),
    (3, 'course:edit', '编辑课程'),
    (4, 'course:delete', '删除课程'),
    (5, 'course:publish', '发布课程'),
    (6, 'user:view', '查看用户'),
    (7, 'user:manage', '管理用户'),
    (8, 'content:translate', '翻译内容'),
    (9, 'ticket:view', '查看工单'),
    (10, 'ticket:handle', '处理工单'),
    (11, 'analytics:view', '查看分析报告'),
    (12, 'system:admin', '系统管理')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    description = EXCLUDED.description;

SELECT 'roles_permissions seeded' AS status;
