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
  directRequired: integer("direct_required").default(0),
  team3genRequired: integer("team_3gen_required").default(0),
  directCommissionRate: decimal("direct_commission_rate", { precision: 4, scale: 2 }).default("0.10"),
  indirectCommissionRate: decimal("indirect_commission_rate", { precision: 4, scale: 2 }).default("0.05"),
  cashBonus: decimal("cash_bonus", { precision: 10, scale: 2 }).default("0"),
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
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

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
