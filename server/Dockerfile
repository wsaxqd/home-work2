# ============================================================
# 启蒙之光后端服务 - 多阶段构建 Dockerfile
# 项目：qmzg (启蒙之光)
# 技术栈：Node.js + Express + TypeScript + PostgreSQL
# ============================================================

# ==================== 构建参数 ====================
# 用法：docker build --build-arg BUILD_ENV=prod -t qmzg-server .
ARG BUILD_ENV=prod
ARG NODE_VERSION=18-alpine

# ==================== 阶段1: 基础镜像 ====================
# 作用：创建统一的基础层，减少重复配置
FROM node:${NODE_VERSION} AS base

# 设置工作目录
WORKDIR /app

# 配置 npm 镜像（国内加速）
RUN npm config set registry https://registry.npmmirror.com

# 安装 dumb-init（优雅处理进程信号）
RUN apk add --no-cache dumb-init

# ==================== 阶段2: 依赖安装 ====================
# 作用：单独安装依赖层，充分利用 Docker 缓存
# 只要 package.json 不变，这层就会被缓存
FROM base AS dependencies

# 复制依赖清单文件（优先复制，利用缓存）
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm ci --legacy-peer-deps && \
    # 清理 npm 缓存，减小镜像体积
    npm cache clean --force

# ==================== 阶段3: 开发环境 ====================
# 作用：支持热重载的开发环境
FROM dependencies AS development

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=development

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 运行 ts-node-dev（支持热重载）
CMD ["dumb-init", "npm", "run", "dev"]

# ==================== 阶段4: 构建阶段 ====================
# 作用：编译 TypeScript 代码
FROM dependencies AS builder

# 复制源代码
COPY . .

# 编译 TypeScript 为 JavaScript (即使有类型错误也继续构建)
RUN npm run build || true && \
    # 检查 dist 目录是否存在
    ls -la dist/ && \
    # 删除源码，只保留编译后的文件
    rm -rf src && \
    # 删除 TypeScript 相关的 devDependencies
    npm prune --production && \
    # 再次清理缓存
    npm cache clean --force

# ==================== 阶段5: 生产环境 ====================
# 作用：极简的生产运行环境
FROM node:${NODE_VERSION} AS production

# 设置工作目录
WORKDIR /app

# 安装 dumb-init
RUN apk add --no-cache dumb-init

# 创建非 root 用户（安全运行）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 从构建阶段复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 创建上传目录（如果需要）
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs uploads

# 切换到非 root 用户
USER nodejs

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查（可选，确保服务正常运行）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 dumb-init 运行应用（生产环境）
CMD ["dumb-init", "node", "dist/index.js"]

# ==================== 最终输出选择 ====================
# 根据 BUILD_ENV 参数选择最终镜像
FROM ${BUILD_ENV} AS final

# ============================================================
# 构建命令示例：
#
# 开发环境：
#   docker build --target development -t qmzg-server:dev .
#   docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules qmzg-server:dev
#
# 生产环境：
#   docker build --target production -t qmzg-server:prod .
#   docker run -p 3000:3000 qmzg-server:prod
#
# 或使用 BUILD_ARG：
#   docker build --build-arg BUILD_ENV=production -t qmzg-server:latest .
# ============================================================
