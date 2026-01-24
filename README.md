# AI-Clone-Deploy Project

这是一个基于 React + Node.js + PostgreSQL 的全栈应用，集成了 VIP 会员系统、钱包/支付功能、AI 聊天（集成 Replit/OpenAI）、抽奖系统以及完善的后台管理面板。

## 技术栈 (Tech Stack)

-   **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, TanStack Query, Wouter (Routing).
-   **Backend**: Node.js, Express, WebSocket.
-   **Database**: PostgreSQL, Drizzle ORM.
-   **Validation**: Zod.
-   **Authentication**: Passport.js, JWT.

## 项目结构 (Project Structure)

-   `client/`: 前端代码 (React).
-   `server/`: 后端代码 (Express).
-   `shared/`: 前后端共享代码 (Schema, Types).
-   `migrations/`: 数据库迁移文件.

## 快速开始 (Quick Start)

1.  **安装依赖**:
    ```bash
    npm install
    ```

2.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    这将同时启动前端和后端服务。

3.  **构建**:
    ```bash
    npm run build
    ```

## 最近更新 (Recent Updates)

-   **性能优化 (Performance Optimization)**:
    -   实现了路由懒加载 (Route-based Code Splitting)。
    -   使用 `React.lazy` 和 `Suspense` 对 `App.tsx` 中的所有页面组件进行了动态导入。
    -   添加了 `Loading` 组件作为页面加载时的回退显示。
    -   这一改进显著减少了初始包体积 (Initial Bundle Size)，加快了首屏加载速度。

## 功能特性 (Features)

-   **用户端**:
    -   首页 (AI 工具, 资讯).
    -   VIP 会员中心 (等级, 权益).
    -   钱包 (充值, 提现, 账单).
    -   聊天 (AI 助手, 客服).
    -   推广系统 (分销, 团队管理).
-   **管理端 (/admin)**:
    -   仪表盘 (数据统计).
    -   用户管理.
    -   财务管理 (订单, 提现审核).
    -   内容管理.
    -   系统设置.

## 注意事项 (Notes)

-   项目包含大量针对中文用户的硬编码文本，后续可考虑引入 i18n 进行国际化改造。
-   数据库配置请检查 `.env` 文件（或 `.env.example`）。
