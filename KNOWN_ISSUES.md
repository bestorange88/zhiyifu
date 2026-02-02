# 已知问题与修复记录

## 已修复问题（禁止回滚）

### 1. 时间显示8小时偏移问题
**问题描述**：群聊消息、AI对话等页面显示的时间比实际北京时间多8小时

**根本原因**：
- 服务器时区设置为 Asia/Shanghai，数据库存储的时间已经是北京时间
- 数据库返回的时间戳字符串没有时区信息（如"2026-02-01 06:02:00"）
- JavaScript的Date构造函数将其解释为UTC时间，然后转换到本地时区时多加了8小时

**修复方案**：
- 修改 `client/src/lib/utils.ts` 中的时间格式化函数
- 直接解析数据库时间戳字符串提取年月日时分秒，避免JavaScript的时区转换

**禁止操作**：
- ❌ 不要使用 `toLocaleString()` 带 `timeZone: "Asia/Shanghai"` 参数
- ❌ 不要修改服务器时区设置
- ❌ 不要在数据库中存储UTC时间

### 2. 实名认证批量审核失败
**问题描述**：批量通过/拒绝实名认证时返回400错误

**根本原因**：
- `adminIdentityBatchReviewSchema` 没有被正确导入到API文件中
- `ids` 字段使用 `z.array(z.any())` 无法正确验证和转换ID为数字类型

**修复方案**：
- 添加 schema 导入
- 将 `z.array(z.any())` 改为 `z.array(z.coerce.number())`

**禁止操作**：
- ❌ 不要移除 schema 验证
- ❌ 不要使用 `z.any()` 类型

### 3. 静态文件路径问题
**问题描述**：用户上传的图片（实名认证、充值凭证、收款码）无法显示

**根本原因**：
- 文件保存到 `attached_assets/uploads` 目录
- 静态服务配置的是 `uploads` 目录

**修复方案**：
- 修改静态文件服务路径，指向正确的 `attached_assets/uploads` 目录

**禁止操作**：
- ❌ 不要修改文件上传路径
- ❌ 不要删除 attached_assets 目录

### 4. VIP奖励重复发放
**问题描述**：同一VIP等级的升级奖励可能被重复发放

**修复方案**：
- 发放奖励前检查 ledger 表是否已有相同等级的奖励记录
- 添加 `checkAndRevokeDuplicateVipRewards()` 函数用于检查和撤回历史重复发放的奖励

**禁止操作**：
- ❌ 不要移除奖励发放前的重复检查
- ❌ 不要直接修改用户余额，必须通过 ledger 记录

### 5. 首页白屏问题
**问题描述**：首页加载时报错 `ASSETS is not defined`

**根本原因**：
- `HomePage.tsx` 中使用了 `ASSETS` 变量但从未定义

**修复方案**：
- 添加 `ASSETS` 常量定义，包含 banner 和 features 的图片URL

**禁止操作**：
- ❌ 不要删除 ASSETS 常量定义

## 待观察问题

### 1. PostgreSQL服务偶尔停止
**现象**：访问项目返回502错误

**临时解决**：
```bash
pg_ctlcluster 14 main start
pm2 restart ai-clone
```

**建议**：设置 PostgreSQL 开机自启和监控

## 注意事项

1. 修改任何时间相关代码前，必须先阅读本文档
2. 修改任何金额相关代码前，必须确保有 ledger 记录
3. 修改任何文件上传相关代码前，必须确认路径配置
4. 所有修复都必须记录在本文档中
