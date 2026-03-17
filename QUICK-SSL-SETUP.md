# 🔐 15分钟搞定腾讯云免费 SSL 证书

## 步骤 1：登录腾讯云（2分钟）

1. 访问：https://console.cloud.tencent.com
2. 登录你的腾讯云账号

## 步骤 2：申请免费证书（3分钟）

1. 在控制台搜索框输入：**SSL 证书**
2. 点击进入「SSL 证书」服务
3. 点击「申请免费证书」
4. 选择「域名型（DV）免费证书」
5. 填写信息：
   - 绑定域名：`qmzgai.com`
   - 证书备注名：`qmzg生产环境`
6. 点击「提交申请」

## 步骤 3：域名验证（5分钟）

### 方法 A：DNS 验证（推荐）

1. 腾讯云会给你一条 TXT 记录
2. 复制这条记录
3. 去你的域名管理（DNSPod 或域名注册商）
4. 添加 TXT 记录
5. 等待 5-10 分钟
6. 回到腾讯云点击「查看域名验证状态」

### 方法 B：文件验证

1. 下载验证文件
2. 上传到你的服务器根目录
3. 确保可以访问：`http://qmzgai.com/.well-known/xxx`
4. 回到腾讯云点击「验证」

## 步骤 4：下载证书（2分钟）

1. 验证通过后，点击「下载」
2. 选择「Nginx」格式
3. 下载压缩包并解压

你会得到 2 个文件：
```
qmzgai.com_bundle.crt  （证书文件）
qmzgai.com.key         （私钥文件）
```

## 步骤 5：复制到项目（1分钟）

### Windows（本地开发）：

```bash
# 将下载的文件改名并复制到 ssl 目录
copy qmzgai.com_bundle.crt ssl\fullchain.pem
copy qmzgai.com.key ssl\privkey.pem
```

### 或者直接在文件管理器操作：
1. 打开下载的证书文件夹
2. 将 `qmzgai.com_bundle.crt` 改名为 `fullchain.pem`
3. 将 `qmzgai.com.key` 改名为 `privkey.pem`
4. 复制这两个文件到项目的 `ssl` 目录

## 步骤 6：验证文件（1分钟）

```bash
# 检查文件是否存在
ls -la ssl/

# 应该看到：
# fullchain.pem
# privkey.pem
```

## ✅ 完成！

SSL 证书配置完成！总共 15 分钟！

---

**下一步：执行一键部署**

```bash
bash deploy-production.sh
```
