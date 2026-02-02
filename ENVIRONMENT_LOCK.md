# 环境版本锁定

## 运行时版本（精确锁定）

### Node.js
```
版本：v20.20.0
```
- ❌ 禁止升级到 Node.js 21 或更高版本
- ❌ 禁止降级到 Node.js 18 或更低版本

### npm
```
版本：10.8.2
```
- ❌ 禁止升级 npm 主版本

### PostgreSQL
```
版本：14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)
```
- ❌ 禁止升级到 PostgreSQL 15 或更高版本
- ❌ 禁止降级到 PostgreSQL 13 或更低版本

## 包管理器

### 使用 npm
- 安装依赖：`npm install`
- 添加依赖：`npm install <package>`
- ❌ 禁止使用 yarn、pnpm 或其他包管理器
- ❌ 禁止运行 `npm audit fix --force`

## 核心依赖版本（禁止升级）

### 前端框架
- React: ^18.x
- Vite: ^5.x
- TypeScript: ^5.x

### UI 组件
- Tailwind CSS: ^3.x
- Radix UI: 当前版本
- Lucide React: 当前版本

### 后端框架
- Express: ^4.x
- Drizzle ORM: 当前版本

### 数据库
- pg (node-postgres): 当前版本
- drizzle-kit: 当前版本

## 禁止升级声明

### 绝对禁止
- ❌ 运行 `npm update` 批量升级
- ❌ 运行 `npx npm-check-updates -u`
- ❌ 手动修改 package.json 中的版本号（除非修复安全漏洞）
- ❌ 删除 package-lock.json 后重新安装

### 添加新依赖前必须确认
1. 该依赖是否真的必要？能否用现有代码实现？
2. 该依赖是否与现有依赖版本兼容？
3. 该依赖的维护状态如何？

## 服务器环境

### 操作系统
- Ubuntu 22.04 LTS

### 时区
- Asia/Shanghai (UTC+8)
- ❌ 禁止修改服务器时区

### 进程管理
- PM2
- 进程名：ai-clone

### 端口
- 应用端口：5000
- PostgreSQL：5432

## 部署流程（固定）

```bash
# 1. 构建
npm run build

# 2. 上传 dist 目录到服务器
scp -r dist/* root@服务器IP:/www/AI-Clone-Deploy/dist/

# 3. 重启服务
pm2 restart ai-clone
```

- ❌ 禁止修改部署流程
- ❌ 禁止引入 Docker、Kubernetes 等容器化方案
- ❌ 禁止引入 CI/CD 自动部署（除非明确要求）
