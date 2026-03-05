# 图像识别功能配置指南

## 功能说明

启蒙之光项目已集成腾讯云图像识别服务，支持以下三种识别类型：

1. **物体识别** - 识别图片中的物体、动物、植物等
2. **表情识别** - 识别人脸表情（开心、伤心、生气、惊讶等）
3. **场景识别** - 识别图片场景（室内、室外、自然风光等）

## 配置步骤

### 1. 注册腾讯云账号

访问 [腾讯云官网](https://cloud.tencent.com/) 注册账号并完成实名认证。

### 2. 开通图像识别服务

1. 登录腾讯云控制台
2. 搜索并开通以下服务：
   - **图像分析（TIIA）** - 用于物体识别和场景识别
   - **人脸识别（IAI）** - 用于表情识别
3. 这些服务都有免费额度，适合开发测试使用

### 3. 获取API密钥

1. 进入 [访问管理控制台](https://console.cloud.tencent.com/cam/capi)
2. 点击左侧菜单 **访问密钥 -> API密钥管理**
3. 点击 **新建密钥** 创建新的密钥对
4. 记录下 `SecretId` 和 `SecretKey`（请妥善保管，不要泄露）

### 4. 配置环境变量

编辑 `server/.env` 文件，添加以下配置：

```env
# 腾讯云服务配置（用于语音识别、语音合成、图像识别等）
TENCENT_SECRET_ID=your-tencent-secret-id-here
TENCENT_SECRET_KEY=your-tencent-secret-key-here
TENCENT_REGION=ap-guangzhou
```

将 `your-tencent-secret-id-here` 和 `your-tencent-secret-key-here` 替换为你的实际密钥。

**区域说明**：
- `ap-guangzhou` - 广州（推荐，国内访问快）
- `ap-shanghai` - 上海
- `ap-beijing` - 北京
- `ap-chengdu` - 成都

### 5. 重启服务

配置完成后，重启后端服务使配置生效：

```bash
cd server
npm run dev
```

## API使用示例

### 物体识别

```typescript
POST /api/ai/recognize-image

{
  "imageUrl": "https://example.com/image.jpg",
  "taskType": "object"
}

// 响应
{
  "objects": ["猫", "沙发", "窗户"],
  "confidence": 0.95,
  "description": "识别到：猫、沙发、窗户"
}
```

### 表情识别

```typescript
POST /api/ai/recognize-image

{
  "imageUrl": "https://example.com/face.jpg",
  "taskType": "emotion"
}

// 响应
{
  "emotions": ["开心", "微笑"],
  "confidence": 0.92,
  "description": "检测到表情：开心"
}
```

### 场景识别

```typescript
POST /api/ai/recognize-image

{
  "imageUrl": "https://example.com/scene.jpg",
  "taskType": "scene"
}

// 响应
{
  "scenes": ["室内", "客厅", "现代风格"],
  "confidence": 0.88,
  "description": "识别到场景：室内、客厅、现代风格"
}
```

## 支持的图片格式

- **URL方式**：支持 http/https 开头的图片链接
- **Base64方式**：支持直接传入Base64编码的图片数据
- **格式**：JPG、PNG、BMP、GIF
- **大小限制**：建议不超过5MB

## 费用说明

腾讯云图像识别服务采用按量计费：

### 免费额度（每月）
- 图像分析（物体识别、场景识别）：1000次
- 人脸识别（表情识别）：10000次

### 超出免费额度后
- 图像分析：0.0015元/次
- 人脸识别：0.0032元/次

**建议**：开发测试阶段免费额度完全够用，生产环境可根据实际使用量评估成本。

## 降级策略

如果未配置腾讯云密钥或服务调用失败，系统会自动降级：

1. 返回友好的提示信息
2. 不会影响其他功能的正常使用
3. 日志中会记录错误信息，方便排查问题

## 故障排查

### 1. 提示"腾讯云密钥未配置"

**原因**：`.env` 文件中未配置或配置错误

**解决**：
- 检查 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY` 是否正确配置
- 确保没有多余的空格或引号
- 重启服务使配置生效

### 2. 提示"认证失败"或"签名错误"

**原因**：密钥错误或已失效

**解决**：
- 检查密钥是否正确复制
- 在腾讯云控制台确认密钥是否启用
- 尝试重新创建密钥

### 3. 提示"服务未开通"

**原因**：未开通对应的腾讯云服务

**解决**：
- 登录腾讯云控制台
- 搜索并开通"图像分析"和"人脸识别"服务

### 4. 识别结果不准确

**原因**：图片质量或内容问题

**建议**：
- 使用清晰、光线充足的图片
- 物体识别：确保物体清晰可见
- 表情识别：确保人脸正面、清晰
- 场景识别：使用包含完整场景的图片

## 相关文档

- [腾讯云图像分析文档](https://cloud.tencent.com/document/product/865)
- [腾讯云人脸识别文档](https://cloud.tencent.com/document/product/867)
- [API密钥管理](https://console.cloud.tencent.com/cam/capi)

## 技术支持

如有问题，请联系项目维护者或查看腾讯云官方文档。
