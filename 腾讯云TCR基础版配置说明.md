# 腾讯云容器镜像服务基础版配置说明

## 📋 购买后需要获取的信息

完成购买后，请在腾讯云控制台获取以下信息：

### 1. 实例信息
- **实例名称：** `qmzg-registry`（你创建时填写的名称）
- **实例访问域名：** 格式类似 `qmzg-registry.tencentcloudcr.com`
  - 查看位置：实例列表 → 点击实例名称 → 基本信息

### 2. 访问凭证
- **用户名：** 你的腾讯云账号ID（100开头的数字）
  - 查看位置：右上角用户名 → 账号信息
- **密码/Token：** 访问令牌
  - 生成位置：右上角用户名 → 访问凭证 → 生成访问令牌

---

## 🔧 需要修改的配置文件

### 1. build-and-push.sh（本地构建脚本）

找到第 35 行：
```bash
# 修改前
REGISTRY_URL="ccr.ccs.tencentyun.com"

# 修改后（替换成你的实例域名）
REGISTRY_URL="你的实例名.tencentcloudcr.com"
```

### 2. docker-compose.prod-image.yml（服务器部署配置）

找到第 57 行：
```yaml
# 修改前
image: ${REGISTRY_URL}/${REGISTRY_NAMESPACE}/qmzg-server:${VERSION:-latest}

# 确保 .env.production 中有：
REGISTRY_URL=你的实例名.tencentcloudcr.com
```

### 3. .env.production（环境变量）

添加或修改：
```env
# 镜像仓库配置
REGISTRY_URL=你的实例名.tencentcloudcr.com
REGISTRY_NAMESPACE=qmzg
VERSION=v1.0.0
```

---

## 🚀 配置完成后的使用流程

### 1. 本地登录镜像仓库
```bash
docker login 你的实例名.tencentcloudcr.com
# 用户名：你的腾讯云账号ID
# 密码：访问令牌
```

### 2. 构建并推送镜像
```bash
./build-and-push.sh v1.0.0 --push
```

### 3. 服务器部署
```bash
# 服务器上也需要登录
docker login 你的实例名.tencentcloudcr.com

# 执行部署
./deploy-server.sh deploy v1.0.0
```

---

## 📝 示例配置

假设你的实例名为 `qmzg-registry`，则：

**镜像地址格式：**
```
qmzg-registry.tencentcloudcr.com/qmzg/qmzg-server:v1.0.0
         ↑                        ↑      ↑          ↑
      实例域名                 命名空间  镜像名     版本号
```

---

## ⚠️ 重要提醒

1. **访问令牌只显示一次** - 生成后立即复制保存
2. **本地和服务器都需要登录** - 两边都要执行 docker login
3. **检查网络连通性** - 确保服务器可以访问实例域名

---

购买完成后，请把实例域名告诉我，我会帮你批量修改所有配置文件！
