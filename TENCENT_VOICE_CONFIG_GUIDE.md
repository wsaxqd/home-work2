# 腾讯云语音服务配置指南

本指南将帮助您配置腾讯云语音识别(ASR)和语音合成(TTS)服务。

## 📋 目录

- [功能概述](#功能概述)
- [前置要求](#前置要求)
- [获取腾讯云密钥](#获取腾讯云密钥)
- [配置步骤](#配置步骤)
- [功能说明](#功能说明)
- [API接口](#api接口)
- [音色列表](#音色列表)
- [常见问题](#常见问题)

---

## 功能概述

腾讯云语音服务为启蒙之光平台提供以下功能:

### 1. 语音识别 (ASR - Automatic Speech Recognition)
- **一句话识别**: 将短音频(60秒内)转换为文字
- **支持格式**: MP3、WAV、M4A等主流音频格式
- **采样率**: 8000Hz、16000Hz
- **应用场景**:
  - AI对话语音输入
  - 作业辅导语音提问
  - 语音互动游戏

### 2. 语音合成 (TTS - Text To Speech)
- **文字转语音**: 将文本转换为自然流畅的语音
- **多种音色**: 10+种音色可选(男声、女声、儿童声等)
- **参数调节**: 支持语速、音量调节
- **应用场景**:
  - 故事朗读
  - AI助手语音回复
  - 学习内容播报

---

## 前置要求

1. **腾讯云账号**: 需要注册腾讯云账号
2. **实名认证**: 完成个人或企业实名认证
3. **开通服务**:
   - 语音识别服务 (ASR)
   - 语音合成服务 (TTS)
4. **费用说明**:
   - 语音识别: 免费额度 15,000次/月,超出后 0.0048元/次
   - 语音合成: 免费额度 100万字符/月,超出后 0.2元/万字符

---

## 获取腾讯云密钥

### 步骤 1: 登录腾讯云控制台

访问 [腾讯云控制台](https://console.cloud.tencent.com/)

### 步骤 2: 开通语音服务

#### 开通语音识别服务
1. 访问 [语音识别控制台](https://console.cloud.tencent.com/asr)
2. 点击"立即开通"
3. 同意服务协议

#### 开通语音合成服务
1. 访问 [语音合成控制台](https://console.cloud.tencent.com/tts)
2. 点击"立即开通"
3. 同意服务协议

### 步骤 3: 创建密钥

1. 访问 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 点击"新建密钥"
3. 记录 `SecretId` 和 `SecretKey`

**⚠️ 安全提示**:
- 密钥具有账号完全权限,请妥善保管
- 不要将密钥提交到代码仓库
- 建议使用子账号密钥,并限制权限范围

### 步骤 4: 配置子账号(推荐)

为了安全,建议创建子账号并只授予语音服务权限:

1. 访问 [用户列表](https://console.cloud.tencent.com/cam)
2. 点击"新建用户" → "自定义创建"
3. 选择"可访问资源并接收消息"
4. 填写用户信息
5. 设置权限:
   - 搜索并勾选 `QcloudASRFullAccess` (语音识别全读写)
   - 搜索并勾选 `QcloudTTSFullAccess` (语音合成全读写)
6. 创建完成后,记录 `SecretId` 和 `SecretKey`

---

## 配置步骤

### 1. 配置环境变量

编辑项目根目录的 `.env` 文件:

```bash
# 腾讯云密钥(OCR、语音识别、语音合成共用)
TENCENT_SECRET_ID=your_secret_id_here
TENCENT_SECRET_KEY=your_secret_key_here
TENCENT_REGION=ap-guangzhou

# 默认音色类型(可选,默认为10-智瑜)
TENCENT_VOICE_TYPE=10
```

**地域选择**:
- `ap-guangzhou`: 广州(推荐,延迟低)
- `ap-beijing`: 北京
- `ap-shanghai`: 上海

### 2. 重启服务

```bash
# 如果使用 Docker
docker-compose restart server

# 如果直接运行
npm run dev
```

### 3. 验证配置

创建测试文件 `test-voice-service.js`:

```javascript
const axios = require('axios');

// 测试语音合成
async function testTTS() {
  try {
    const response = await axios.post('http://localhost:3001/api/ai/text-to-speech', {
      text: '你好,我是启蒙之光AI助手',
      voiceType: 10
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    });

    console.log('✅ 语音合成成功:', response.data);
  } catch (error) {
    console.error('❌ 语音合成失败:', error.response?.data || error.message);
  }
}

// 测试语音识别
async function testASR() {
  try {
    // 需要提供音频文件的Base64编码
    const response = await axios.post('http://localhost:3001/api/ai/speech-to-text', {
      audioBase64: 'YOUR_AUDIO_BASE64',
      format: 'mp3'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    });

    console.log('✅ 语音识别成功:', response.data);
  } catch (error) {
    console.error('❌ 语音识别失败:', error.response?.data || error.message);
  }
}

testTTS();
```

运行测试:
```bash
node test-voice-service.js
```

---

## 功能说明

### 语音识别 (ASR)

#### 支持的音频格式
- MP3
- WAV
- M4A
- FLAC
- AAC

#### 音频要求
- **时长**: 60秒以内
- **采样率**: 8000Hz 或 16000Hz
- **声道**: 单声道或双声道
- **文件大小**: 5MB以内

#### 识别语言
- 中文普通话
- 中英文混合

### 语音合成 (TTS)

#### 文本要求
- **长度**: 单次最多500字
- **语言**: 中文
- **特殊字符**: 自动处理标点符号

#### 输出格式
- **编码**: MP3
- **采样率**: 16000Hz
- **比特率**: 48kbps

#### 可调参数
- **语速**: -2 到 2 (默认0)
  - -2: 0.6倍速
  - -1: 0.8倍速
  - 0: 正常速度
  - 1: 1.2倍速
  - 2: 1.5倍速
- **音量**: 0 到 10 (默认5)

---

## API接口

### 1. 语音识别接口

**接口地址**: `POST /api/ai/speech-to-text`

**请求参数**:
```json
{
  "audioBase64": "音频文件的Base64编码",
  "format": "mp3",
  "audioUrl": "或者提供音频URL"
}
```

**响应示例**:
```json
{
  "success": true,
  "text": "识别出的文字内容",
  "duration": 5
}
```

### 2. 语音合成接口

**接口地址**: `POST /api/ai/text-to-speech`

**请求参数**:
```json
{
  "text": "要合成的文本内容",
  "voiceType": 10,
  "speed": 0,
  "volume": 5,
  "saveToFile": true
}
```

**响应示例**:
```json
{
  "success": true,
  "audioUrl": "/uploads/audio/tts_123_1234567890.mp3",
  "duration": 3
}
```

### 3. 获取音色列表

**接口地址**: `GET /api/ai/voice-types`

**响应示例**:
```json
{
  "success": true,
  "voiceTypes": [
    {
      "id": 0,
      "name": "云小宁",
      "description": "亲和女声"
    },
    {
      "id": 10,
      "name": "智瑜",
      "description": "情感女声"
    }
  ]
}
```

---

## 音色列表

### 基础音色(免费)

| ID | 名称 | 性别 | 特点 | 适用场景 |
|----|------|------|------|----------|
| 0 | 云小宁 | 女 | 亲和、温柔 | 故事朗读、温馨提示 |
| 1 | 云小奇 | 男 | 亲和、稳重 | 知识讲解、新闻播报 |

### 精品音色(推荐)

| ID | 名称 | 性别 | 特点 | 适用场景 |
|----|------|------|------|----------|
| 10 | 智瑜 | 女 | 情感丰富、自然 | AI对话、情感故事 |
| 11 | 智聆 | 女 | 通用、清晰 | 通用场景、学习内容 |
| 12 | 智美 | 女 | 甜美、客服 | 客服场景、温馨提示 |
| 13 | 智云 | 男 | 通用、沉稳 | 知识讲解、正式场合 |
| 14 | 智莉 | 女 | 温暖、亲切 | 儿童教育、温馨场景 |
| 15 | 智言 | 男 | 客服、专业 | 客服场景、专业讲解 |

### 高级音色

| ID | 名称 | 性别 | 特点 | 适用场景 |
|----|------|------|------|----------|
| 1050 | 智瑜(精品) | 女 | 情感更丰富 | 高质量AI对话 |
| 1051 | 智聆(精品) | 女 | 音质更清晰 | 高质量内容播报 |

**推荐配置**:
- **儿童教育**: 智莉(14) - 温暖亲切
- **AI对话**: 智瑜(10) - 情感丰富
- **故事朗读**: 云小宁(0) - 温柔动听
- **知识讲解**: 智云(13) - 沉稳专业

---

## 常见问题

### Q1: 提示"腾讯云语音服务配置缺失"

**原因**: 未配置 `TENCENT_SECRET_ID` 或 `TENCENT_SECRET_KEY`

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确认环境变量已正确配置
3. 重启服务使配置生效

### Q2: 语音识别返回空文本

**可能原因**:
1. 音频文件格式不支持
2. 音频质量太差(噪音过大)
3. 音频时长超过60秒
4. 音频内容为非中文

**解决方案**:
1. 使用支持的音频格式(MP3/WAV)
2. 确保音频清晰,降低背景噪音
3. 将长音频切分为多段
4. 确认音频内容为中文普通话

### Q3: 语音合成失败

**可能原因**:
1. 文本长度超过500字
2. 包含特殊字符或表情符号
3. API密钥权限不足

**解决方案**:
1. 将长文本分段合成
2. 清理文本中的特殊字符
3. 检查API密钥权限配置

### Q4: 音频文件保存失败

**可能原因**:
1. 上传目录不存在
2. 目录权限不足

**解决方案**:
```bash
# 创建上传目录
mkdir -p uploads/audio

# 设置权限(Linux/Mac)
chmod 755 uploads/audio

# Windows下确保目录可写
```

### Q5: 如何降低成本?

**优化建议**:
1. **缓存机制**: 相同文本的语音合成结果可以缓存
2. **按需使用**: 只在必要时使用语音功能
3. **文本优化**: 合成前精简文本内容
4. **监控用量**: 定期检查API调用量

### Q6: 语音合成音质不佳

**优化方案**:
1. 使用精品音色(ID: 1050, 1051)
2. 调整语速参数(推荐0或-1)
3. 优化文本断句,添加适当标点
4. 避免过长的单句

### Q7: 如何测试语音功能?

**测试步骤**:
1. 使用Postman或curl测试API
2. 检查服务器日志
3. 验证返回的音频文件
4. 测试不同音色和参数

**测试命令**:
```bash
# 测试语音合成
curl -X POST http://localhost:3001/api/ai/text-to-speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text":"测试语音合成","voiceType":10}'
```

---

## 技术支持

### 官方文档
- [腾讯云语音识别文档](https://cloud.tencent.com/document/product/1093)
- [腾讯云语音合成文档](https://cloud.tencent.com/document/product/1073)

### 联系方式
- 腾讯云工单系统: [提交工单](https://console.cloud.tencent.com/workorder)
- 技术支持电话: 4009100100

### 项目相关
- 如有项目集成问题,请查看项目文档或联系开发团队

---

## 更新日志

### v1.0.0 (2025-01-XX)
- ✅ 实现语音识别功能
- ✅ 实现语音合成功能
- ✅ 支持10+种音色
- ✅ 支持语速、音量调节
- ✅ 支持Base64和URL两种输入方式

---

**配置完成后,您的启蒙之光平台将拥有完整的语音交互能力!** 🎉
