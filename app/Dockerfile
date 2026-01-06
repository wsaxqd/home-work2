# ============================================================
# 启蒙之光前端应用 - 多阶段构建 Dockerfile
# 项目：qmzg (启蒙之光)
# 技术栈：React + Vite + TypeScript
# ============================================================

# ==================== 构建参数 ====================
ARG NODE_VERSION=20-alpine
ARG NGINX_VERSION=alpine

# ==================== 阶段1: 基础镜像 ====================
FROM node:${NODE_VERSION} AS base

WORKDIR /app

# 配置 npm 镜像（国内加速）
RUN npm config set registry https://registry.npmmirror.com

# ==================== 阶段2: 依赖安装 ====================
# 作用：单独安装依赖层，充分利用 Docker 缓存
FROM base AS dependencies

# 复制依赖清单（package.json 不变时，这层会被缓存）
COPY package*.json ./

# 安装依赖
# 开发环境使用 npm install 处理版本不匹配问题
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# ==================== 阶段3: 开发环境 ====================
# 作用：支持 Vite 热重载的开发环境
FROM dependencies AS development

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=development

# 暴露 Vite 开发服务器端口
EXPOSE 5173

# 启动 Vite 开发服务器（支持热重载）
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ==================== 阶段4: 构建阶段 ====================
# 作用：编译生产代码
FROM dependencies AS builder

# 复制源代码
COPY . .

# 设置生产环境变量
ENV NODE_ENV=production

# 构建生产版本
RUN npm run build && \
    # 只保留 dist 目录，删除其他文件
    ls -la dist/

# ==================== 阶段5: 生产环境（Nginx） ====================
# 作用：使用 Nginx 提供静态文件服务，极简高效
FROM nginx:${NGINX_VERSION} AS production

# 创建非 root 用户
RUN addgroup -g 1001 -S nginx-runner && \
    adduser -S nginx-runner -u 1001

# 从构建阶段复制编译后的文件到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（如果需要）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 修改 Nginx 权限（让非 root 用户可以运行）
RUN chown -R nginx-runner:nginx-runner /usr/share/nginx/html && \
    chown -R nginx-runner:nginx-runner /var/cache/nginx && \
    chown -R nginx-runner:nginx-runner /var/log/nginx && \
    chown -R nginx-runner:nginx-runner /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-runner:nginx-runner /var/run/nginx.pid

# 切换到非 root 用户
USER nginx-runner

# 暴露端口（Nginx 默认 80）
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# 构建命令示例：
#
# 开发环境：
#   docker build --target development -t qmzg-app:dev ./app
#   docker run -p 5173:5173 -v $(pwd)/app:/app -v /app/node_modules qmzg-app:dev
#
# 生产环境：
#   docker build --target production -t qmzg-app:prod ./app
#   docker run -p 80:80 qmzg-app:prod
# ============================================================
