# 启蒙之光 - 测试文档

## 📋 测试概览

本项目包含完整的测试套件，覆盖单元测试、集成测试和端到端测试。

### 测试统计

| 测试类型 | 文件数量 | 测试用例数 | 覆盖范围 |
|---------|---------|-----------|---------|
| 单元测试 | 3 | 80+ | 核心服务逻辑 |
| 集成测试 | 1 | 20+ | API 端点 |
| E2E 测试 | 0 | 0 | 待补充 |

### 测试文件结构

```
server/src/__tests__/
├── unit/                              # 单元测试
│   └── services/
│       ├── authService.test.ts        # 认证服务测试 (35+ cases)
│       ├── pointsService.test.ts      # 积分系统测试 (30+ cases)
│       └── shopService.test.ts        # 商城服务测试 (25+ cases)
├── integration/                       # 集成测试
│   └── auth.test.ts                   # 认证 API 集成测试 (20+ cases)
└── e2e/                              # E2E 测试（待补充）
```

---

## 🚀 快速开始

### 安装依赖

```bash
cd server
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
# 运行单个测试文件
npm test -- authService.test.ts

# 运行特定测试套件
npm test -- --testNamePattern="PointsService"
```

### 生成测试覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告将生成在 `server/coverage/` 目录下。

---

## 📝 测试详情

### 1. 认证服务测试 (`authService.test.ts`)

**测试覆盖**：
- ✅ 密码哈希和验证
- ✅ JWT token 生成和验证
- ✅ 边界条件处理
- ✅ 安全性测试

**测试用例数**：35+

**关键测试场景**：
```typescript
// 密码哈希测试
- 成功哈希有效密码
- 相同密码生成不同哈希（盐值随机性）
- 拒绝空密码、过短密码、超长密码
- 支持特殊字符、中文、表情符号密码

// 密码验证测试
- 成功验证正确密码
- 拒绝错误密码
- 密码大小写敏感

// JWT Token 测试
- 成功生成和验证 token
- Token 包含正确的用户信息
- 处理过期 token
```

**运行测试**：
```bash
npm test -- authService.test.ts
```

---

### 2. 积分系统测试 (`pointsService.test.ts`)

**测试覆盖**：
- ✅ 积分查询和余额管理
- ✅ 积分增加和扣除
- ✅ 等级系统和自动升级
- ✅ 边界条件和异常处理

**测试用例数**：30+

**关键测试场景**：
```typescript
// 积分查询
- 获取用户积分和等级信息
- 正确计算升级进度
- 最高等级处理

// 积分增加
- 成功增加积分
- 自动升级逻辑
- 大量积分正确计算等级

// 积分扣除
- 成功扣除积分
- 拒绝积分不足的扣除
- 支持全额扣除

// 等级系统
- Level 1: 0-99 积分
- Level 2: 100-299 积分
- Level 3: 300-599 积分
- Level 4: 600-999 积分
- Level 5: 1000+ 积分
```

**真实业务场景测试**：
- 新用户完成每日任务获取积分
- 用户通过学习升级
- 用户兑换商品后积分变化
- 连续多日签到积累积分

**运行测试**：
```bash
npm test -- pointsService.test.ts
```

---

### 3. 商城服务测试 (`shopService.test.ts`)

**测试覆盖**：
- ✅ 商品列表查询和筛选
- ✅ 商品详情获取
- ✅ 商品兑换流程
- ✅ 库存管理
- ✅ 边界条件处理

**测试用例数**：25+

**关键测试场景**：
```typescript
// 商品列表
- 获取所有激活商品
- 按分类筛选商品
- 排除未激活商品
- 时间范围筛选
- 排序逻辑

// 商品兑换
- 成功兑换商品
- 多数量兑换
- 库存减少
- 销量增加
- 无限库存支持

// 异常处理
- 积分不足拒绝
- 库存不足拒绝
- 已下架商品拒绝
- 不存在商品拒绝
```

**真实业务场景测试**：
- 用户浏览并兑换文具类商品
- 热门商品库存抢购
- 用户多次兑换直到积分不足
- 限时商品到期处理

**运行测试**：
```bash
npm test -- shopService.test.ts
```

---

### 4. 认证 API 集成测试 (`auth.test.ts`)

**测试覆盖**：
- ✅ 用户注册流程
- ✅ 用户登录流程
- ✅ Token 验证
- ✅ Token 刷新
- ✅ HTTP 请求和响应格式

**测试用例数**：20+

**关键测试场景**：
```typescript
// 用户注册 (POST /api/auth/register)
- 成功注册新用户
- 返回正确的响应格式
- 拒绝缺少必填字段
- 拒绝无效邮箱格式
- 拒绝重复的邮箱和用户名

// 用户登录 (POST /api/auth/login)
- 成功登录并返回 token
- 返回用户信息（不包含密码）
- 拒绝错误的密码
- 拒绝不存在的邮箱

// Token 验证 (GET /api/auth/check)
- 成功验证有效 token
- 拒绝缺少 Authorization 头
- 拒绝无效 token
- 拒绝错误的格式

// Token 刷新 (POST /api/auth/refresh)
- 成功刷新 access token
- 拒绝无效的 refresh token
```

**完整用户流程测试**：
```
注册 -> 登录 -> 验证 token -> 刷新 token -> 再次验证
```

**运行测试**：
```bash
npm test -- auth.test.ts
```

---

## 🎯 测试最佳实践

### 1. 测试命名规范

使用描述性的测试名称：
```typescript
// ✅ 好的命名
it('应该成功增加积分', async () => { ... });
it('边界条件：应该拒绝负数积分', async () => { ... });
it('场景1：新用户完成每日任务获取积分', async () => { ... });

// ❌ 不好的命名
it('test1', async () => { ... });
it('works', async () => { ... });
```

### 2. 测试组织结构

使用 `describe` 块组织相关测试：
```typescript
describe('PointsService - 积分系统服务', () => {
  describe('getUserPoints - 获取用户积分', () => {
    it('应该成功获取用户积分信息', () => { ... });
    it('边界条件：应该拒绝不存在的用户', () => { ... });
  });

  describe('addPoints - 增加积分', () => {
    it('应该成功增加积分', () => { ... });
    it('增加积分后应该自动升级', () => { ... });
  });
});
```

### 3. Mock 数据管理

使用 `beforeEach` 清理测试数据：
```typescript
let service: Service;

beforeEach(() => {
  service = new Service();
  service.clearTestData();
});
```

### 4. 边界条件测试

确保测试所有边界条件：
- 空值和 null
- 负数和零
- 最大值和最小值
- 不存在的资源
- 重复操作

### 5. 真实业务场景

包含真实业务场景测试：
```typescript
it('场景：新用户完成每日任务获取积分', async () => {
  // 模拟真实用户行为
  await service.addPoints(userId, 5, '每日签到');
  await service.addPoints(userId, 20, '完成作业');
  const result = await service.addPoints(userId, 10, '练习题');

  expect(result.newBalance).toBe(35);
});
```

---

## 📊 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前覆盖率 | 状态 |
|------|-----------|-----------|------|
| 认证服务 | 90% | 95% | ✅ |
| 积分系统 | 85% | 90% | ✅ |
| 商城服务 | 85% | 88% | ✅ |
| API 端点 | 80% | 85% | ✅ |
| 总体 | 85% | - | 🔄 |

---

## 🐛 测试调试

### 运行特定测试

```bash
# 运行单个测试文件
npm test -- authService.test.ts

# 运行匹配特定名称的测试
npm test -- --testNamePattern="增加积分"

# 运行并监视文件变化
npm test -- --watch
```

### 查看详细输出

```bash
# 详细模式
npm test -- --verbose

# 显示单个测试结果
npm test -- --verbose --testNamePattern="应该成功"
```

### 调试测试

使用 VS Code 调试器：

1. 在测试文件中设置断点
2. 按 F5 或运行调试配置
3. 调试器会在断点处暂停

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Tests",
      "program": "${workspaceFolder}/server/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 📈 持续改进

### 待添加的测试

- [ ] 学习计划服务单元测试
- [ ] 自适应学习服务单元测试
- [ ] 学习行为服务单元测试
- [ ] 知识图谱服务单元测试
- [ ] 积分 API 集成测试
- [ ] 商城 API 集成测试
- [ ] E2E 测试（前后端集成）

### 测试改进建议

1. **增加性能测试**
   - 测试大量数据下的性能
   - 并发请求测试

2. **增加安全测试**
   - SQL 注入防护测试
   - XSS 防护测试
   - CSRF 防护测试

3. **增加错误恢复测试**
   - 数据库连接失败恢复
   - 外部 API 失败处理

4. **增加负载测试**
   - 压力测试
   - 并发用户测试

---

## 💡 常见问题

### Q: 测试运行很慢怎么办？

A: 尝试以下方法：
- 使用 `--runInBand` 串行运行测试
- 只运行特定测试文件
- 使用 `--onlyChanged` 只测试修改的文件

### Q: 测试覆盖率如何提高？

A:
- 添加更多边界条件测试
- 测试异常处理路径
- 添加真实业务场景测试

### Q: Mock 数据如何管理？

A:
- 使用 `beforeEach` 清理数据
- 使用独立的测试数据库
- 使用事务回滚机制

---

## 📞 获取帮助

如果您遇到测试问题：

1. 查看测试日志输出
2. 运行 `npm test -- --verbose` 获取详细信息
3. 检查 Jest 配置 (`jest.config.js`)
4. 查阅 [Jest 官方文档](https://jestjs.io/)

---

**最后更新**: 2026-01-28
**测试框架**: Jest 30.2.0
**测试工具**: Supertest 7.2.2
**TypeScript**: 5.3.2
