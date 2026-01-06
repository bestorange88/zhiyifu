import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// ============ USERS & AUTH ============
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).unique(),
  passwordHash: text("password_hash").notNull(),
  inviteCode: varchar("invite_code", { length: 20 }).unique().notNull(),
  inviterId: integer("inviter_id"),
  vipLevel: integer("vip_level").default(0).notNull(),
  vipExpireAt: timestamp("vip_expire_at"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceFingerprint: text("device_fingerprint"),
  lastIp: varchar("last_ip", { length: 50 }),
  lastLoginAt: timestamp("last_login_at"),
  riskScore: integer("risk_score").default(0),
});

// ============ WALLET & LEDGER ============
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  balanceCashAvailable: decimal("balance_cash_available", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceCashFrozen: decimal("balance_cash_frozen", { precision: 10, scale: 2 }).default("0").notNull(),
  balancePoints: integer("balance_points").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ledger = pgTable("ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  currency: varchar("currency", { length: 30 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  refId: integer("ref_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ CHECK-IN SYSTEM ============
export const checkins = pgTable("checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  checkDate: date("check_date").notNull(),
  streakCount: integer("streak_count").default(1).notNull(),
  rewardSpinTimes: integer("reward_spin_times").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkinRules = pgTable("checkin_rules", {
  id: serial("id").primaryKey(),
  ruleKey: varchar("rule_key", { length: 50 }).unique().notNull(),
  value: integer("value").notNull(),
  description: text("description"),
});

// ============ LOTTERY WHEEL ============
export const spinBalance = pgTable("spin_balance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  availableSpins: integer("available_spins").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const wheelPrizes = pgTable("wheel_prizes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0"),
  probability: decimal("probability", { precision: 5, scale: 4 }).notNull(),
  stock: integer("stock"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const wheelSpins = pgTable("wheel_spins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestId: varchar("request_id", { length: 50 }).unique().notNull(),
  prizeId: integer("prize_id").references(() => wheelPrizes.id),
  prizeName: varchar("prize_name", { length: 50 }),
  status: varchar("status", { length: 20 }).default("success").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ VIP SYSTEM ============
export const vipPlans = pgTable("vip_plans", {
  id: serial("id").primaryKey(),
  level: integer("level").unique().notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  dailyExtraSpins: integer("daily_extra_spins").default(0),
  withdrawMinAmount: decimal("withdraw_min_amount", { precision: 10, scale: 2 }).default("100"),
  withdrawSpeed: varchar("withdraw_speed", { length: 10 }).default("T+1"),
  winMultiplier: decimal("win_multiplier", { precision: 3, scale: 2 }).default("1"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 30 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ WITHDRAWAL ============
export const withdraws = pgTable("withdraws", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("applied").notNull(),
  method: varchar("method", { length: 30 }),
  accountInfo: text("account_info"),
  conditionsSnapshot: text("conditions_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  paidAt: timestamp("paid_at"),
});

// ============ REFERRAL & RANKS ============
export const rankRules = pgTable("rank_rules", {
  id: serial("id").primaryKey(),
  rank: integer("rank").unique().notNull(),
  name: varchar("name", { length: 20 }).notNull(),
  openingFee: decimal("opening_fee", { precision: 10, scale: 2 }).default("0"),
  directRequired: integer("direct_required").default(0),
  team3genRequired: integer("team_3gen_required").default(0),
  directCommissionRate: decimal("direct_commission_rate", { precision: 4, scale: 2 }).default("0.10"),
  indirectCommissionRate: decimal("indirect_commission_rate", { precision: 4, scale: 2 }).default("0.05"),
  cashBonus: decimal("cash_bonus", { precision: 10, scale: 2 }).default("0"),
  dailySpins: integer("daily_spins").default(0),
  withdrawMinAmount: decimal("withdraw_min_amount", { precision: 10, scale: 2 }).default("100"),
  withdrawSpeed: varchar("withdraw_speed", { length: 10 }).default("T+1"),
  winMultiplier: decimal("win_multiplier", { precision: 3, scale: 2 }).default("1.0"),
  hasVipService: boolean("has_vip_service").default(false),
  hasUnlimitedAI: boolean("has_unlimited_ai").default(false),
  hasPromoBonus: boolean("has_promo_bonus").default(false),
  hasPriorityWelfare: boolean("has_priority_welfare").default(false),
});

export const userRanks = pgTable("user_ranks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  currentRank: integer("current_rank").default(0).notNull(),
  directCount: integer("direct_count").default(0).notNull(),
  team3genCount: integer("team_3gen_count").default(0).notNull(),
  reachedAt: timestamp("reached_at").defaultNow(),
});

export const referralRewards = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  level: integer("level").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ ADMIN ============
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).default("admin").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ AGENT APPLICATION ============
export const agentApplications = pgTable("agent_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  realName: varchar("real_name", { length: 50 }).notNull(),
  wechat: varchar("wechat", { length: 50 }),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ CHAT (existing) ============
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ GROUP CHAT ============
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  ownerId: integer("owner_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id),
  userId: integer("user_id").references(() => users.id),
  senderType: varchar("sender_type", { length: 20 }).default("user").notNull(),
  senderName: varchar("sender_name", { length: 100 }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ SYSTEM SETTINGS ============
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============ FEATURE FLAGS ============
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  description: text("description"),
});

// ============ DEPOSITS ============
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  method: varchar("method", { length: 30 }),
  proofImage: text("proof_image"),
  remark: text("remark"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// ============ ADMIN ACTIONS (BALANCE ADJUSTMENTS) ============
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 30 }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ COMMISSION RECORDS ============
export const commissionRecords = pgTable("commission_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  level: integer("level").notNull(),
  rate: decimal("rate", { precision: 4, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("credited").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ CUSTOMER SERVICE CHAT ============
export const serviceChatSessions = pgTable("service_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  adminId: integer("admin_id"),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const serviceChatMessages = pgTable("service_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => serviceChatSessions.id),
  senderType: varchar("sender_type", { length: 20 }).notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ INSERT SCHEMAS ============
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, updatedAt: true });
export const insertLedgerSchema = createInsertSchema(ledger).omit({ id: true, createdAt: true });
export const insertCheckinSchema = createInsertSchema(checkins).omit({ id: true, createdAt: true });
export const insertSpinBalanceSchema = createInsertSchema(spinBalance).omit({ id: true, updatedAt: true });
export const insertWheelSpinSchema = createInsertSchema(wheelSpins).omit({ id: true, createdAt: true });
export const insertWithdrawSchema = createInsertSchema(withdraws).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertChatGroupSchema = createInsertSchema(chatGroups).omit({ id: true, createdAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true, joinedAt: true });
export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({ id: true, createdAt: true });
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });
export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true });
export const insertDepositSchema = createInsertSchema(deposits).omit({ id: true, createdAt: true });
export const insertAdminActionSchema = createInsertSchema(adminActions).omit({ id: true, createdAt: true });
export const insertCommissionRecordSchema = createInsertSchema(commissionRecords).omit({ id: true, createdAt: true });
export const insertServiceChatSessionSchema = createInsertSchema(serviceChatSessions).omit({ id: true, createdAt: true });
export const insertServiceChatMessageSchema = createInsertSchema(serviceChatMessages).omit({ id: true, createdAt: true });

// ============ TYPES ============
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type Ledger = typeof ledger.$inferSelect;
export type Checkin = typeof checkins.$inferSelect;
export type SpinBalance = typeof spinBalance.$inferSelect;
export type WheelPrize = typeof wheelPrizes.$inferSelect;
export type WheelSpin = typeof wheelSpins.$inferSelect;
export type VipPlan = typeof vipPlans.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Withdraw = typeof withdraws.$inferSelect;
export type RankRule = typeof rankRules.$inferSelect;
export type UserRank = typeof userRanks.$inferSelect;
export type ReferralReward = typeof referralRewards.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type AgentApplication = typeof agentApplications.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatGroup = typeof chatGroups.$inferSelect;
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type InsertCommissionRecord = z.infer<typeof insertCommissionRecordSchema>;
export type ServiceChatSession = typeof serviceChatSessions.$inferSelect;
export type InsertServiceChatSession = z.infer<typeof insertServiceChatSessionSchema>;
export type ServiceChatMessage = typeof serviceChatMessages.$inferSelect;
export type InsertServiceChatMessage = z.infer<typeof insertServiceChatMessageSchema>;

// ============ API SCHEMAS ============
export const registerSchema = z.object({
  phone: z.string().min(11).max(11),
  password: z.string().min(6),
  inviteCode: z.string().min(4),
});

export const loginSchema = z.object({
  phone: z.string().min(11).max(11),
  password: z.string().min(6),
});

export const spinRequestSchema = z.object({
  requestId: z.string().min(10),
});

export const withdrawApplySchema = z.object({
  amount: z.number().positive(),
  method: z.string(),
  accountInfo: z.string(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const agentApplySchema = z.object({
  realName: z.string().min(2),
  wechat: z.string().optional(),
  reason: z.string().optional(),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["active", "banned"]),
});

export const adminWithdrawReviewSchema = z.object({
  approved: z.boolean(),
});

export const adminAgentReviewSchema = z.object({
  approved: z.boolean(),
  reviewNote: z.string().optional(),
});

const decimalOrNull = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const str = String(val);
    if (!/^\d+(\.\d+)?$/.test(str)) throw new Error("必须是有效的非负数字");
    return str;
  },
  z.string().optional()
);

const intOrNull = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const num = Number(val);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) throw new Error("必须是非负整数");
    return num;
  },
  z.number().int().min(0).optional()
);

export const adminRankUpdateSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  openingFee: decimalOrNull,
  directRequired: intOrNull,
  team3genRequired: intOrNull,
  directCommissionRate: decimalOrNull,
  indirectCommissionRate: decimalOrNull,
  cashBonus: decimalOrNull,
  dailySpins: intOrNull,
  withdrawMinAmount: decimalOrNull,
  withdrawSpeed: z.preprocess((v) => (v === null ? undefined : v), z.string().max(10).optional()),
  winMultiplier: decimalOrNull,
  hasVipService: z.preprocess((v) => (v === null ? undefined : v), z.boolean().optional()),
  hasUnlimitedAI: z.preprocess((v) => (v === null ? undefined : v), z.boolean().optional()),
  hasPromoBonus: z.preprocess((v) => (v === null ? undefined : v), z.boolean().optional()),
  hasPriorityWelfare: z.preprocess((v) => (v === null ? undefined : v), z.boolean().optional()),
});

export const adminBalanceAdjustSchema = z.object({
  userId: z.number().positive(),
  amount: z.number(),
  currency: z.enum(["cash", "points"]),
  reason: z.string().optional(),
});

export const adminDepositReviewSchema = z.object({
  approved: z.boolean(),
});
