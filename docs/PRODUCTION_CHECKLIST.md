# 启蒙之光 (QMZG) - 发布上线检查清单

**生成时间**: 2026-02-10
**项目版本**: V1.0
**当前状态**: P4阶段完成
**发布就绪度**: 75% ⚠️

---

## 📋 执行摘要

### 项目概况
- **代码规模**: 65,717行 (前端34,967 + 后端30,750)
- **功能完成度**: 95%
- **核心功能**: 100% ✅
- **安全性**: 60% ⚠️ (需要立即修复)
- **性能优化**: 85% ✅
- **测试覆盖**: 30% ⚠️

### 关键发现
- ✅ 核心业务功能完整
- ✅ 性能优化到位
- ⚠️ 安全配置严重不足
- ⚠️ 测试覆盖率低
- ⚠️ 生产环境配置不完整

---

## 🔴 P0 - 阻塞发布 (必须立即完成)

### 1. 安全密钥管理 - 严重风险 🚨

**问题描述**:
- `.env` 文件包含明文密钥，已提交到Git
- 生产环境多个关键密钥为空
- JWT密钥、数据库密码等敏感信息暴露

**影响**: 严重安全漏洞，可能导致数据泄露

**必须完成**:
```bash
# 1. 立即从Git历史中删除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .security-keys-backup.txt" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 生成新的生产环境密钥
# JWT_SECRET (64字节随机字符串)
openssl rand -hex 64

# JWT_REFRESH_SECRET (64字节随机字符串)
openssl rand -hex 64

# 3. 更新.gitignore
echo ".env*" >> .gitignore
echo ".security-keys-backup.txt" >> .gitignore
```

**配置清单**:
- [ ] 生成新的JWT_SECRET
- [ ] 生成新的JWT_REFRESH_SECRET
- [ ] 配置数据库密码
- [ ] 配置Dify API密钥
- [ ] 配置DeepSeek/智谱AI密钥
- [ ] 配置腾讯云密钥
- [ ] 配置SMTP邮件服务
- [ ] 使用密钥管理系统(AWS Secrets Manager/Vault)

**相关文件**:
- `server/.env` - 删除并重新生成
- `server/.env.production` - 配置生产密钥
- `.gitignore` - 添加敏感文件

---

### 2. 生产环境配置完善

**问题描述**:
- `.env.production` 中多个关键配置为空
- AI服务提供商未配置
- 邮件服务未配置

**必须完成**:
```env
# server/.env.production (示例)

# 数据库配置
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=qmzg_production
DB_USER=qmzg_user
DB_PASSWORD=<从密钥管理系统获取>

# JWT配置
JWT_SECRET=<从密钥管理系统获取>
JWT_REFRESH_SECRET=<从密钥管理系统获取>

# AI服务配置 (至少配置一个)
DIFY_API_KEY=<你的Dify密钥>
# 或
DEEPSEEK_API_KEY=<你的DeepSeek密钥>
# 或
ZHIPU_API_KEY=<你的智谱密钥>

# 腾讯云服务 (语音、图像识别)
TENCENT_SECRET_ID=<你的腾讯云ID>
TENCENT_SECRET_KEY=<你的腾讯云密钥>

# 邮件服务
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<你的邮箱>
SMTP_PASSWORD=<邮箱密码>
EMAIL_FROM=noreply@example.com

# Redis配置 (可选但推荐)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<Redis密码>

# CORS配置
CORS_ORIGIN=https://your-domain.com

# 日志配置
LOG_LEVEL=info
NODE_ENV=production
```

**配置清单**:
- [ ] 配置生产数据库连接
- [ ] 配置AI服务提供商(Dify/DeepSeek/智谱)
- [ ] 配置腾讯云服务(图像识别、语音)
- [ ] 配置邮件服务(SMTP)
- [ ] 配置Redis缓存(推荐)
- [ ] 配置CORS域名
- [ ] 配置日志级别

---

### 3. 数据库迁移执行

**问题描述**:
- 54个迁移文件已创建，但未确认执行
- 关键表可能未创建
- 新增的题库表需要迁移

**必须完成**:
```bash
# 1. 检查数据库连接
cd server
npm run db:check

# 2. 执行所有迁移
npm run migrate

# 3. 验证关键表
psql -h localhost -U admin -d qmzg -c "\dt"

# 4. 检查新增的题库表
psql -h localhost -U admin -d qmzg -c "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'knowledge_points',
  'questions',
  'user_question_records',
  'user_knowledge_mastery',
  'learning_paths'
);
"
```

**迁移清单**:
- [ ] 执行047_create_question_bank_tables.sql
- [ ] 执行048_insert_sample_questions.sql
- [ ] 验证所有54个表已创建
- [ ] 检查数据库索引
- [ ] 测试数据库连接性能

**关键表验证**:
```sql
-- 验证题库表
SELECT COUNT(*) FROM knowledge_points;  -- 应该有15条
SELECT COUNT(*) FROM questions;         -- 应该有18条

-- 验证其他核心表
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM learning_maps;
SELECT COUNT(*) FROM game_records;
```

---

### 4. 修复中间件重复定义

**问题描述**:
- `auth.ts` 和 `authMiddleware.ts` 存在重复
- 4个控制器使用旧的导入路径

**必须完成**:
```bash
# 1. 更新所有引用
# 将以下文件中的导入统一为 './middleware/auth'
- server/src/controllers/noteController.ts
- server/src/controllers/bookmarkController.ts
- server/src/controllers/shopController.ts
- server/src/controllers/feedbackController.ts

# 2. 删除兼容层
rm server/src/middleware/authMiddleware.ts
```

**修复清单**:
- [ ] 更新noteController.ts导入
- [ ] 更新bookmarkController.ts导入
- [ ] 更新shopController.ts导入
- [ ] 更新feedbackController.ts导入
- [ ] 删除authMiddleware.ts文件
- [ ] 运行TypeScript编译检查

---

## 🟠 P1 - 高优先级 (发布前必须)

### 5. 完善错误处理和日志

**问题描述**:
- 错误日志不够详细
- 缺少错误追踪系统
- 生产环境错误信息过于简洁

**建议完成**:
```bash
# 1. 安装日志库
npm install winston winston-daily-rotate-file

# 2. 安装错误追踪
npm install @sentry/node @sentry/tracing
```

**配置示例**:
```typescript
// server/src/utils/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d'
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    })
  ]
});
```

**配置清单**:
- [ ] 安装Winston日志库
- [ ] 配置日志轮转
- [ ] 集成Sentry错误追踪
- [ ] 替换所有console.log为logger
- [ ] 配置日志级别

---

### 6. 完成剩余TODO

**问题描述**:
- 2个TODO注释未完成
- 某些功能使用降级方案

**必须完成**:

**TODO 1**: 实现知识图谱推荐
```typescript
// server/src/services/adaptiveLearningService.ts:579
// TODO: 实现基于知识图谱的进阶推荐

async getAdvancedRecommendations(userId: string, subject: string) {
  // 1. 获取用户已掌握的知识点
  // 2. 分析知识图谱找出进阶路径
  // 3. 推荐下一步学习内容
}
```

**TODO 2**: 实现学习趋势计算
```typescript
// server/src/services/learningBehaviorService.ts:408
// TODO: 计算趋势

calculateTrend(recentScores: number[]): 'rising' | 'stable' | 'declining' {
  if (recentScores.length < 3) return 'stable';

  const trend = recentScores[recentScores.length - 1] - recentScores[0];
  if (trend > 10) return 'rising';
  if (trend < -10) return 'declining';
  return 'stable';
}
```

**配置清单**:
- [ ] 实现知识图谱推荐算法
- [ ] 实现学习趋势计算
- [ ] 移除或标记模拟数据
- [ ] 添加功能降级文档

---

### 7. 类型安全改进

**问题描述**:
- 代码中存在386处 `as any` 类型断言
- JWT解码缺少类型定义

**建议完成**:
```typescript
// server/src/middleware/auth.ts
interface JWTPayload {
  userId: string;
  id?: string;
  type?: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: '未提供认证token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.userId = decoded.userId || decoded.id;
    req.userType = decoded.type || 'user';

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '无效的token' });
  }
};
```

**配置清单**:
- [ ] 定义JWT类型接口
- [ ] 定义数据库查询结果类型
- [ ] 移除不必要的 `as any`
- [ ] 运行 `tsc --noEmit` 检查类型错误

---

## 🟡 P2 - 中优先级 (发布前建议)

### 8. 性能优化

**建议完成**:

**Redis缓存配置**:
```typescript
// server/src/config/redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// 缓存热点数据
export async function cacheUserData(userId: string, data: any) {
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(data));
}
```

**数据库索引优化**:
```sql
-- 添加常用查询索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_knowledge_point ON questions(knowledge_point_id);
```

**配置清单**:
- [ ] 配置Redis缓存
- [ ] 添加数据库索引
- [ ] 配置CDN加速
- [ ] 实现API响应缓存
- [ ] 优化前端bundle size

---

### 9. 增加测试覆盖

**问题描述**:
- 仅有3个单元测试
- 关键功能未覆盖

**建议完成**:
```bash
# 安装测试框架
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

# 运行测试
npm test
```

**测试清单**:
- [ ] 用户认证测试
- [ ] AI服务测试
- [ ] 题库查询测试
- [ ] 学习地图解锁测试
- [ ] 勋章授予测试
- [ ] API集成测试

---

### 10. 文档完善

**建议完成**:

**API文档**:
- [ ] 生成Swagger/OpenAPI文档
- [ ] 编写API使用示例
- [ ] 文档化所有端点

**部署文档**:
- [ ] 编写生产环境部署指南
- [ ] 编写数据库迁移指南
- [ ] 编写监控配置指南

**用户文档**:
- [ ] 编写用户使用手册
- [ ] 编写家长端使用指南
- [ ] 编写常见问题FAQ

---

## 🟢 P3 - 低优先级 (发布后优化)

### 11. 监控和告警

**建议配置**:
- [ ] 配置应用性能监控(APM)
- [ ] 配置服务器监控
- [ ] 配置数据库监控
- [ ] 配置错误告警
- [ ] 配置日志聚合

### 12. 备份和恢复

**建议配置**:
- [ ] 配置数据库自动备份
- [ ] 配置文件存储备份
- [ ] 编写灾难恢复计划
- [ ] 测试备份恢复流程

### 13. 持续集成/部署

**建议配置**:
- [ ] 配置CI/CD流水线
- [ ] 配置自动化测试
- [ ] 配置自动化部署
- [ ] 配置回滚机制

---

## 📊 发布前检查表

### 安全检查
- [ ] 所有密钥已从Git历史中删除
- [ ] 生产环境密钥已配置
- [ ] 使用密钥管理系统
- [ ] HTTPS已配置
- [ ] CORS已正确配置
- [ ] SQL注入防护已验证
- [ ] XSS防护已验证
- [ ] CSRF防护已验证

### 功能检查
- [ ] 所有数据库迁移已执行
- [ ] 核心功能已测试
- [ ] AI服务已配置并测试
- [ ] 图像识别已配置并测试
- [ ] 邮件服务已配置并测试
- [ ] 支付功能已测试(如有)

### 性能检查
- [ ] Redis缓存已配置
- [ ] 数据库索引已优化
- [ ] API响应时间<500ms
- [ ] 前端加载时间<3s
- [ ] 静态资源已压缩

### 运维检查
- [ ] 日志系统已配置
- [ ] 错误追踪已配置
- [ ] 监控告警已配置
- [ ] 备份策略已实施
- [ ] 部署文档已完成

---

## 🚀 发布流程建议

### 阶段1: 准备 (1-2天)
1. 完成所有P0优先级任务
2. 配置生产环境
3. 执行数据库迁移
4. 配置密钥管理

### 阶段2: 测试 (2-3天)
1. 完成P1优先级任务
2. 执行全面功能测试
3. 执行性能测试
4. 执行安全测试

### 阶段3: 预发布 (1天)
1. 部署到预发布环境
2. 执行冒烟测试
3. 验证所有配置
4. 准备回滚方案

### 阶段4: 发布 (1天)
1. 部署到生产环境
2. 执行健康检查
3. 监控系统状态
4. 准备应急响应

---

## 📞 支持联系

如有问题，请联系：
- 技术支持: tech@example.com
- 紧急联系: emergency@example.com

---

**最后更新**: 2026-02-10
**文档版本**: 1.0
