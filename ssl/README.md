# SSL 证书目录说明

## 📁 目录用途

这个目录用于存放 SSL/TLS 证书文件，用于 HTTPS 配置。

## 📝 需要的文件

申请 SSL 证书后，需要将以下文件放到这个目录：

```
ssl/
├── fullchain.pem      # 完整证书链（必需）
├── privkey.pem        # 私钥文件（必需）
└── chain.pem          # 中间证书（可选）
```

## 🔐 安全注意事项

⚠️ **重要：**
- 私钥文件（privkey.pem）**绝对不能**提交到 Git！
- 已在 `.gitignore` 中排除此目录
- 证书文件权限应设置为 `600` 或 `400`

## 📖 如何申请证书

请参考项目根目录的 `SSL-CERTIFICATE-GUIDE.md` 文件。

## ✅ 文件权限设置（Linux/服务器上）

```bash
chmod 600 ssl/privkey.pem
chmod 644 ssl/fullchain.pem
chmod 644 ssl/chain.pem
```

## 📅 证书续期

Let's Encrypt 证书有效期为 90 天，需要定期续期。
建议使用自动续期脚本（详见部署文档）。
