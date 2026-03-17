# 项目 Skills 说明

本项目已配置以下 Claude Code Skills，这些 skills 为项目开发提供专业支持。

## 已安装的 Skills

### 1. dr-shao-devops-assistant - DevOps 部署助手

基于 Dr. 邵的 AI 辅助开发方法论，提供服务器部署、配置管理和生产环境搭建支持。

**核心特性：**
- 🤔 **反问法引导**：不知道怎么问时，AI 会引导你提供必要信息
- 🚀 **生产级配置**：提供经过实战验证的配置模板
- 🔧 **完整覆盖**：从服务器连接到自动化部署的全流程支持
- 📚 **故障排查**：系统化的问题诊断和解决方案

**使用场景：**
- 服务器连接与管理（SSH、VNC）
- SSL 证书申请与配置
- Nginx 反向代理配置（20+ 功能）
- Docker 生产环境部署
- 自动化部署脚本编写
- 环境配置管理
- 问题排查与性能优化

**快速开始：**
```bash
# 直接向 Claude Code 描述你的需求
"帮我配置 Nginx 反向代理"
"连接腾讯云服务器需要什么参数"
"生成生产环境的 docker-compose.yml"
"我的网站 502 错误怎么排查"
```

**配置模板：**
- `templates/docker-compose.production.yml` - 生产环境 Docker 配置
- `templates/deploy.sh` - 自动化部署脚本
- `templates/nginx.conf` - Nginx 完整配置
- `templates/.env.template` - 环境变量模板
- `templates/init.sql` - 数据库初始化脚本

**详细文档：**
- [完整功能说明](./dr-shao-devops-assistant/SKILL.md)
- [快速参考手册](./dr-shao-devops-assistant/QUICKREF.md)
- [用户指南](./dr-shao-devops-assistant/README.md)

## 如何使用 Skills

### 方式 1: 直接对话（推荐）
直接向 Claude Code 描述你的需求，AI 会自动识别并使用相应的 skill。

```
"帮我规划一个完整的生产环境部署方案"
"Nginx 配置 HTTPS 需要哪些步骤"
```

### 方式 2: 使用配置模板
需要配置文件时，可以直接请求模板：

```
"给我一个生产环境的 docker-compose 配置"
"生成自动化部署脚本"
```

### 方式 3: 问题排查
遇到问题时，使用反问法让 AI 引导你：

```
"网站访问出现 502 错误，应该检查哪些地方"
"SSL 证书配置后还是显示不安全，需要提供什么信息"
```

## 反问法核心思想

**不知道怎么问时，先问 AI 需要什么信息！**

这是 AI 时代的高级思维技巧：
- 让 AI 告诉你需要提供哪些参数
- 你提供你知道的，AI 提供它知道的
- 双向互补，不断追问，把问题问出来

**示例：**
```
用户："我想部署到生产环境，但不知道从哪开始"

AI："让我帮你梳理一下，我需要了解：
1. 你使用什么云服务商？（腾讯云/阿里云/AWS）
2. 你的应用是什么类型？（前后端分离/单体应用）
3. 你有域名了吗？
4. 数据库是自建还是云服务？

先告诉我这些，我会给你定制化的部署方案。"
```

## 添加更多 Skills

如果你有其他全局 skills（位于 `C:\Users\Lenovo\.claude\skills`），可以通过以下方式添加到项目：

```bash
# 复制 skill 到项目
cp -r "C:\Users\Lenovo\.claude\skills\skill-name" ".claude\skills\skill-name"
```

## 最佳实践

1. **安全原则**：
   - ✅ 生产环境必须使用 HTTPS
   - ✅ 使用 .env 文件管理敏感信息
   - ✅ 不要将 .env 文件提交到 Git
   - ⚠️ AI 不要直接操作已上线的生产服务器

2. **部署原则**：
   - ✅ 使用自动化脚本，避免手动操作
   - ✅ 实现无感知升级（毫秒级切换）
   - ✅ 保留旧版本镜像，便于回滚
   - ✅ 设置容器自动重启策略

3. **问题排查**：
   - ✅ 提供完整的错误日志
   - ✅ 说明你的环境（开发/生产）
   - ✅ 描述你已经尝试过的方法
   - ✅ 使用反问法让 AI 引导你

## 学习资源

- [Docker 官方文档](https://docs.docker.com/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**准备好提升开发效率了吗？** 直接向 Claude Code 提问即可开始！🚀
