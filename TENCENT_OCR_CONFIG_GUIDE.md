# 腾讯云OCR配置指南

本指南将帮助您配置腾讯云文字识别(OCR)服务,用于启蒙之光平台的AI作业助手功能。

---

## 📋 功能说明

AI作业助手使用腾讯云OCR服务来识别拍照上传的作业题目图片,支持:

- ✅ 通用文字识别
- ✅ 数学公式识别
- ✅ 作业题目识别
- ✅ 小学语文、数学、英语、科学
- ✅ 初中语文、数学、英语、物理、化学、生物、历史、地理、政治

---

## 🚀 快速配置(5分钟)

### 1. 注册腾讯云账号

1. 访问 https://cloud.tencent.com
2. 点击右上角"注册"按钮
3. 使用手机号或邮箱完成注册
4. 完成实名认证(个人或企业)

### 2. 开通文字识别OCR服务

1. 访问 https://console.cloud.tencent.com/ocr
2. 点击"立即开通"
3. 阅读并同意服务协议
4. 选择付费方式:
   - **免费额度**: 每月1000次免费调用
   - **按量计费**: 超出免费额度后按次数收费

**价格参考**:
- 通用文字识别: 0.15元/次
- 数学公式识别: 0.15元/次
- 作业题目识别: 0.15元/次

### 3. 获取API密钥

1. 访问 https://console.cloud.tencent.com/cam/capi
2. 点击"新建密钥"
3. 记录生成的密钥信息:
   - **SecretId**: 例如 `AKIDxxxxxxxxxxxxx`
   - **SecretKey**: 例如 `xxxxxxxxxxxxxxxx`

⚠️ **重要提示**: 密钥具有您账号的所有权限,请妥善保管,不要泄露!

### 4. 配置环境变量

编辑 `server/.env` 文件,添加以下配置:

```env
# 腾讯云OCR配置
TENCENT_SECRET_ID=您的SecretId
TENCENT_SECRET_KEY=您的SecretKey
TENCENT_REGION=ap-guangzhou
```

**地域选择**:
- `ap-guangzhou`: 广州(推荐,国内速度快)
- `ap-beijing`: 北京
- `ap-shanghai`: 上海
- `ap-chengdu`: 成都

### 5. 重启服务

```bash
cd server
npm run dev
```

---

## 🧪 测试OCR功能

### 1. 启动前后端服务

**后端**:
```bash
cd server
npm run dev
```

**前端**:
```bash
cd app
npm run dev
```

### 2. 访问AI作业助手

1. 打开浏览器: http://localhost:5174
2. 登录账号
3. 访问: http://localhost:5174/homework
4. 选择年级和科目
5. 拍照或上传作业题目
6. 查看OCR识别结果和AI解答

---

## 📊 计费说明

### 免费额度

- 每月前1000次调用免费
- 适合个人开发和小规模使用

### 付费模式

超出免费额度后:
- 通用文字识别: 0.15元/次
- 数学公式识别: 0.15元/次

**成本估算**:
- 100个学生,每人每天5道题 = 500次/天 = 15000次/月
- 月费用: (15000 - 1000) × 0.15 = 2100元

### 降低成本的方法

1. **使用免费额度**: 适合小规模使用
2. **限制调用次数**: 设置每日/每用户调用上限
3. **购买资源包**: 大量使用可购买优惠资源包

---

## ⚠️ 常见问题

### 1. 认证失败: InvalidParameter.SecretIdNotFound

**原因**: SecretId 填写错误

**解决方案**:
1. 检查 .env 文件中的 TENCENT_SECRET_ID
2. 确保没有多余的空格或换行
3. 重新从腾讯云控制台复制 SecretId

### 2. 认证失败: AuthFailure.SignatureFailure

**原因**: SecretKey 填写错误

**解决方案**:
1. 检查 .env 文件中的 TENCENT_SECRET_KEY
2. 确保完整复制了 SecretKey
3. 重新生成新的密钥对

### 3. 调用失败: RequestLimitExceeded

**原因**: 超出了免费调用次数或并发限制

**解决方案**:
1. 查看腾讯云控制台的用量统计
2. 购买资源包或升级为付费版本
3. 限制应用的调用频率

### 4. 识别结果不准确

**原因**: 图片质量问题或题目类型复杂

**解决方案**:
1. 确保上传的图片清晰、光线充足
2. 题目完整,没有遮挡
3. 对于数学题,使用数学公式识别API
4. 调整识别参数,提高准确率

---

## 🔒 安全建议

1. **密钥管理**
   - ✅ 不要将密钥提交到Git仓库
   - ✅ 使用环境变量存储密钥
   - ✅ 定期更换密钥
   - ✅ 为不同环境使用不同的密钥

2. **访问控制**
   - ✅ 设置IP白名单(如果固定IP)
   - ✅ 限制密钥权限范围
   - ✅ 监控API调用日志

3. **成本控制**
   - ✅ 设置月度预算告警
   - ✅ 监控每日调用量
   - ✅ 实现客户端调用限流

---

## 📈 进阶配置

### 1. 提高识别准确率

在 `server/src/services/tencentOCRService.ts` 中配置:

```typescript
// 使用高精度识别
const action = 'GeneralAccurateOCR';

// 添加参数
const params = {
  ImageBase64: imageBase64,
  IsPdf: false,
  PdfPageNumber: 1,
  // 启用文字检测
  EnableDetectText: true,
  // 启用表格检测
  EnableDetectTextTable: true,
};
```

### 2. 批量识别优化

```typescript
// 实现图片缓存,避免重复识别
const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
// 检查是否已识别过
```

### 3. 监控和日志

```typescript
// 记录每次OCR调用
console.log(`OCR调用: ${userId} - ${questionType} - ${confidence}%`);

// 统计识别准确率
await query(
  'INSERT INTO ocr_stats (user_id, confidence, success) VALUES ($1, $2, $3)',
  [userId, confidence, success]
);
```

---

## 📚 相关文档

- [腾讯云OCR官方文档](https://cloud.tencent.com/document/product/866)
- [API接口文档](https://cloud.tencent.com/document/api/866/33526)
- [计费说明](https://cloud.tencent.com/document/product/866/17619)
- [SDK下载](https://cloud.tencent.com/document/sdk)

---

## 🆘 获取帮助

如果遇到问题:

1. 查看本文档"常见问题"章节
2. 检查腾讯云控制台的调用日志
3. 查看服务器日志: `server/logs/`
4. 提交Issue到GitHub仓库
5. 联系腾讯云技术支持

---

**配置完成后,您的AI作业助手就可以识别和解答小学初中作业题目了!** 🎉
