# 工程约束规范

## 时间处理（单一真源）

### 时区规范
- 服务器时区：`Asia/Shanghai` (UTC+8)
- 数据库存储：北京时间（无时区后缀）
- 前端显示：直接解析数据库时间字符串，不做时区转换

### 时间格式化函数（唯一入口）
位置：`client/src/lib/utils.ts`
- `formatDateTime()` - 完整格式 yyyy/MM/dd HH:mm:ss
- `formatDateTimeShort()` - 简短格式 MM-dd HH:mm
- `formatDate()` - 仅日期 yyyy/MM/dd
- `formatTime()` - 仅时间 HH:mm

### 禁止
- ❌ 使用 `new Date().toLocaleString()` 带 timeZone 参数
- ❌ 使用 `moment.js` 或 `dayjs` 等第三方时间库
- ❌ 在组件中直接格式化时间，必须使用 utils.ts 中的函数

## 金额处理（单一真源）

### 存储规范
- 数据库字段类型：`numeric` / `decimal`
- 精度：2位小数
- 单位：人民币元

### 禁止
- ❌ 使用浮点数存储金额
- ❌ 前端进行金额计算（所有计算在后端完成）
- ❌ 直接修改用户余额，必须通过 ledger 记录

## 权限处理

### 用户角色
- `user` - 普通用户
- `admin` - 管理员

### 认证方式
- JWT Token（存储在 localStorage）
- Token 过期时间：7天

### 禁止
- ❌ 添加新的认证方式
- ❌ 修改 JWT 密钥配置
- ❌ 在前端存储敏感信息

## 国际化（i18n）

### 当前状态
- 仅支持中文
- 无多语言计划

### 禁止
- ❌ 添加 i18n 库
- ❌ 创建语言文件
- ❌ 使用翻译函数包装文本

## 禁止的 API 模式

- ❌ GraphQL
- ❌ WebSocket（除群聊功能外）
- ❌ Server-Sent Events
- ❌ 第三方支付直连（仅支持手动充值审核）

## 禁止的代码模式

- ❌ `eval()` 或 `Function()` 动态执行
- ❌ `any` 类型（TypeScript）
- ❌ `// @ts-ignore` 注释
- ❌ `console.log` 在生产代码中（调试后必须删除）
- ❌ 硬编码密钥或凭证

## 全局约束

### 文件结构
- 前端代码：`client/src/`
- 后端代码：`server/`
- 共享类型：`shared/`
- 数据库模型：`shared/schema.ts`

### 命名规范
- 组件：PascalCase（如 `HomePage.tsx`）
- 函数：camelCase（如 `getUserById`）
- 常量：UPPER_SNAKE_CASE（如 `MAX_RETRY_COUNT`）
- 数据库表：snake_case（如 `user_wallets`）

### 提交规范
- feat: 新功能
- fix: 修复Bug
- refactor: 重构
- docs: 文档
- style: 样式调整
