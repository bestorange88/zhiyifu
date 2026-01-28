import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, uuid, jsonb } from "drizzle-orm/pg-core";
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
  totalUnfrozen: decimal("total_unfrozen", { precision: 10, scale: 2 }).default("0").notNull(),
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

// ============ CHECK-IN SYSTEM (Enhanced) ============
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

// 签到记录表(新版 - 支持断签惩罚)
// 唯一约束: (user_id, sign_date) 防止重复签到
export const signInLogs = pgTable("sign_in_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  signDate: date("sign_date").notNull(),  // 签到日期
  continuousDays: integer("continuous_days").default(1).notNull(),  // 连续签到天数
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userDateUnique: { unique: true, columns: [table.userId, table.signDate] },
}));

export const rankUpgradeRequests = pgTable("rank_upgrade_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetRank: integer("target_rank").notNull(),
  currentRank: integer("current_rank").notNull(),
  directCount: integer("direct_count").default(0),
  team3genCount: integer("team_3gen_count").default(0),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  adminNote: text("admin_note"),
  reviewedBy: varchar("reviewed_by", { length: 50 }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRankUpgradeRequestSchema = createInsertSchema(rankUpgradeRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});
export type InsertRankUpgradeRequest = z.infer<typeof insertRankUpgradeRequestSchema>;
export type RankUpgradeRequest = typeof rankUpgradeRequests.$inferSelect;

// 签到连续奖励规则
export const signInRewardRules = pgTable("sign_in_reward_rules", {
  id: serial("id").primaryKey(),
  continuousDays: integer("continuous_days").notNull(),  // 连续天数: 3, 7, 15, 30
  rewardType: varchar("reward_type", { length: 20 }).notNull(),  // lottery_times, cash_cents
  rewardAmount: integer("reward_amount").notNull(),  // 奖励数量
  resetAfter: boolean("reset_after").default(false),  // 是否在奖励后重置连续天数
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

// 抽奖次数账本(账本式记录)
// 唯一约束: (user_id, biz_date, refId) 防止重复记录
export const lotteryTimesLedger = pgTable("lottery_times_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bizDate: date("biz_date").notNull(),  // 业务日期
  delta: integer("delta").notNull(),  // +增加 / -消耗
  reason: varchar("reason", { length: 50 }).notNull(),  // base|signin|signin_bonus|vip_daily|draw_consume|admin_adjust
  refId: varchar("ref_id", { length: 50 }).notNull(),  // 关联记录
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ledgerEntryUnique: { unique: true, columns: [table.userId, table.bizDate, table.refId] },
}));

// 抽奖开奖记录
export const lotteryDraws = pgTable("lottery_draws", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bizDate: date("biz_date").notNull(),
  prizeCode: varchar("prize_code", { length: 50 }).notNull(),  // 奖项标识
  rewardCents: integer("reward_cents").default(0).notNull(),  // 中奖金额(分)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ VIP SYSTEM (Enhanced) ============
export const vipLevels = pgTable("vip_levels", {
  level: integer("level").primaryKey(),  // 1..5
  name: varchar("name", { length: 20 }).notNull(),
  priceCents: integer("price_cents").notNull(),  // 开通费(分)
  upgradeRewardCents: integer("upgrade_reward_cents").default(0).notNull(),  // 升级奖励(分)
  dailyLottery: integer("daily_lottery").default(0).notNull(),  // VIP每日赠送抽奖次数
  incomeMultiplier: decimal("income_multiplier", { precision: 6, scale: 2 }).default("1.00").notNull(),  // 收益倍率
  withdrawThresholdCents: integer("withdraw_threshold_cents").default(10000).notNull(),  // 提现门槛(分)
  settleType: varchar("settle_type", { length: 10 }).default("T1").notNull(),  // 'T0'|'T1'
  benefits: text("benefits"), // JSON string of benefits list
  bonusRules: text("bonus_rules"), // JSON: {"minProgress":0.8, "probability":[{"range":[0.8,0.9],"p":0.05},{"range":[0.9,1.0],"p":0.12},{"range":[1.0,1.0],"p":0.2}]}
});

// VIP推广达标要求
export const vipRequirements = pgTable("vip_requirements", {
  level: integer("level").primaryKey().references(() => vipLevels.level),
  directRequired: integer("direct_required").default(0).notNull(),
  team3Required: integer("team3_required").default(0).notNull(),  // 三代内人数
  downlineLevelRequirements: text("downline_level_requirements"), // JSON string: {"1": 10, "2": 10} means need 10 V1s, 10 V2s
});

// VIP升级分佣比例
export const vipCommissionRates = pgTable("vip_commission_rates", {
  level: integer("level").primaryKey().references(() => vipLevels.level),
  directRate: decimal("direct_rate", { precision: 6, scale: 4 }).default("0.10").notNull(),
  indirectRate: decimal("indirect_rate", { precision: 6, scale: 4 }).default("0.05").notNull(),
});

// 抽奖分佣比例
export const lotteryCommissionRates = pgTable("lottery_commission_rates", {
  level: integer("level").primaryKey().references(() => vipLevels.level),
  directRate: decimal("direct_rate", { precision: 6, scale: 4 }).default("0.10").notNull(),
  indirectRate: decimal("indirect_rate", { precision: 6, scale: 4 }).default("0.05").notNull(),
});

// ============ SELLER ONBOARDING ============
export const sellerOnboarding = pgTable("seller_onboarding", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  currentStep: integer("current_step").default(1).notNull(),
  vipStatus: varchar("vip_status", { length: 20 }).default("pending"), // pending, paid
  questionnaire: text("questionnaire"), // JSON string
  agreements: text("agreements"), // JSON string
  storeData: text("store_data"), // JSON string
  decorationData: text("decoration_data"), // JSON string
  productsData: text("products_data"), // JSON string
  managedService: boolean("managed_service"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSellerOnboardingSchema = createInsertSchema(sellerOnboarding).omit({
  id: true,
  updatedAt: true,
});

export type InsertSellerOnboarding = z.infer<typeof insertSellerOnboardingSchema>;
export type SellerOnboarding = typeof sellerOnboarding.$inferSelect;

// 用户VIP状态表
export const userVipStatus = pgTable("user_vip_status", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  vipLevel: integer("vip_level").default(0).notNull(),  // 0=普通用户
  upgradedAt: timestamp("upgraded_at"),
  qualified: boolean("qualified").default(false).notNull(),  // 是否达标
  qualifiedAt: timestamp("qualified_at"),  // 达标时间(用于分佣追溯判断)
  directCount: integer("direct_count").default(0).notNull(),
  team3Count: integer("team3_count").default(0).notNull(),
  lastQualCheckAt: timestamp("last_qual_check_at"),
  // 升级奖励状态: locked(未达标,奖励锁定) / granted(已达标,奖励已发放)
  rewardStatus: varchar("reward_status", { length: 20 }).default("locked").notNull(),
  rewardGrantedAt: timestamp("reward_granted_at"),  // 奖励发放时间
});

// VIP解锁状态表（防重复解冻）
export const vipUnlockState = pgTable("vip_unlock_state", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  vipLevel: integer("vip_level").notNull(),
  unlockedBaseAmount: decimal("unlocked_base_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  lastUnlockAt: timestamp("last_unlock_at"),
});

// VIP升级交易表
export const vipUpgradeTxs = pgTable("vip_upgrade_txs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fromLevel: integer("from_level").notNull(),
  toLevel: integer("to_level").notNull(),
  payAmountCents: integer("pay_amount_cents").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),  // pending|paid|failed|refunded
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

// Legacy VIP plans table (for backward compatibility)
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

// ============ E-COMMERCE (Added) ============
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  mainImage: text("main_image"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  categoryId: integer("category_id"),
  stock: integer("stock").default(0),
  sales: integer("sales").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  name: varchar("name", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0"),
  stock: integer("stock").default(0),
  image: text("image"),
  attributes: text("attributes"), // JSON string
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").references(() => stores.id),
  productId: integer("product_id").notNull().references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").default(1).notNull(),
  checked: boolean("checked").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  province: varchar("province", { length: 50 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  district: varchar("district", { length: 50 }).notNull(),
  detail: text("detail").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  applicableRegions: text("applicable_regions"), // JSON array
  applicableStoreIds: text("applicable_store_ids"), // JSON array
  applicableCategoryIds: text("applicable_category_ids"), // JSON array
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  perUserLimit: integer("per_user_limit").default(1),
  startsAt: timestamp("starts_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userCoupons = pgTable("user_coupons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  usedAt: timestamp("used_at"),
  orderId: integer("order_id"), // References orders.id, but since defined before orders, we might skip direct reference or use raw integer.
  // Actually, orders is defined AFTER. Circular dependency if I reference orders.id here and orders reference coupon.id.
  // I'll just use integer for orderId here.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const virtualBuyers = pgTable("virtual_buyers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  email: text("email"),
  regionCode: text("region_code").default("CN"),
  isActive: boolean("is_active").default(true),
  behaviorProfile: jsonb("behavior_profile").default({}),
  orderCount: integer("order_count").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  lastOrderAt: timestamp("last_order_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").references(() => stores.id),
  orderNo: varchar("order_no", { length: 50 }).unique().notNull(),
  type: varchar("type", { length: 30 }).default("shop").notNull(), // shop, vip, recharge, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Total amount to pay
  subtotalAmount: decimal("subtotal_amount", { precision: 10, scale: 2 }),
  shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { length: 20 }).default("pending_payment").notNull(), // pending_payment, pending_shipment, shipped, completed, cancelled, refunded
  paymentMethod: varchar("payment_method", { length: 30 }),
  shippingAddress: text("shipping_address"), // JSON string or text
  logisticsCompany: varchar("logistics_company", { length: 50 }),
  logisticsTrackingNo: varchar("logistics_tracking_no", { length: 100 }),
  // New fields from migration
  carrier: varchar("carrier", { length: 50 }),
  trackingNo: varchar("tracking_no", { length: 100 }),
  isVirtualOrder: boolean("is_virtual_order").default(false),
  virtualBuyerId: integer("virtual_buyer_id"), // Will reference virtual_buyers.id
  notes: text("notes"),
  couponId: integer("coupon_id"),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  storeId: integer("store_id").references(() => stores.id),
  productId: integer("product_id").notNull().references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  productSnapshot: text("product_snapshot"), // JSON snapshot of product info at time of purchase
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ WITHDRAWAL ============
export const withdraws = pgTable("withdraws", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  realName: varchar("real_name", { length: 50 }),
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
  announcement: text("announcement"),
  openHours: varchar("open_hours", { length: 50 }), // e.g. "09:00-22:00"
  avatarUrl: text("avatar_url"),
  ownerId: integer("owner_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).default("member").notNull(), // member | admin
  isMuted: boolean("is_muted").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id),
  userId: integer("user_id").references(() => users.id),
  senderType: varchar("sender_type", { length: 20 }).default("user").notNull(),
  senderName: varchar("sender_name", { length: 100 }),
  messageType: varchar("message_type", { length: 20 }).default("text").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
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

// ============ PAYMENT QR CODES ============
export const paymentQrCodes = pgTable("payment_qr_codes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  type: varchar("type", { length: 20 }).default("alipay").notNull(), // alipay | wechat
  url: text("url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentQrCodeSchema = createInsertSchema(paymentQrCodes).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentQrCode = z.infer<typeof insertPaymentQrCodeSchema>;
export type PaymentQrCode = typeof paymentQrCodes.$inferSelect;

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

// ============ COMMISSION RECORDS (Enhanced) ============
export const commissionRecords = pgTable("commission_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  spinId: integer("spin_id").references(() => wheelSpins.id),
  sourceType: varchar("source_type", { length: 20 }).default("vip").notNull(),
  level: integer("level").notNull(),
  rate: decimal("rate", { precision: 4, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("credited").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 分佣记录(新版-支持VIP升级和抽奖分佣)
// 唯一约束: (biz_type, to_user_id, ref_id, relation_level) 防止重复分佣
export const commissionLogs = pgTable("commission_logs", {
  id: serial("id").primaryKey(),
  toUserId: integer("to_user_id").notNull().references(() => users.id),  // 得佣人(上级)
  fromUserId: integer("from_user_id").notNull().references(() => users.id),  // 贡献人(下级)
  bizType: varchar("biz_type", { length: 30 }).notNull(),  // vip_upgrade | lottery_reward | signin_cash
  relationLevel: integer("relation_level").notNull(),  // 1=直推 2/3=间推
  baseCents: integer("base_cents").notNull(),  // 计算基数(分)
  rate: decimal("rate", { precision: 6, scale: 4 }).notNull(),
  amountCents: integer("amount_cents").notNull(),  // 分佣金额(分)
  refId: varchar("ref_id", { length: 50 }).notNull(),  // 关联ID
  status: varchar("status", { length: 20 }).default("pending").notNull(),  // pending|credited|frozen
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  commissionUnique: { unique: true, columns: [table.bizType, table.toUserId, table.refId, table.relationLevel] },
}));

// ============ AI CHAT LOGS ============
export const aiChatLogs = pgTable("ai_chat_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Can be null if guest? But mostly users
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  source: varchar("source", { length: 20 }).default("private"), // private | group
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
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, sales: true });
export const insertProductVariantSchema = createInsertSchema(productVariants).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true, createdAt: true });
export const insertAddressSchema = createInsertSchema(addresses).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, usedCount: true });
export const insertUserCouponSchema = createInsertSchema(userCoupons).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, createdAt: true });

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
export const insertVipLevelSchema = createInsertSchema(vipLevels);
export const insertVipRequirementSchema = createInsertSchema(vipRequirements);
export const insertVipUnlockStateSchema = createInsertSchema(vipUnlockState);
export const insertVipCommissionRateSchema = createInsertSchema(vipCommissionRates);
export const insertLotteryCommissionRateSchema = createInsertSchema(lotteryCommissionRates);
export const insertUserVipStatusSchema = createInsertSchema(userVipStatus);
export const insertVipUpgradeTxSchema = createInsertSchema(vipUpgradeTxs).omit({ id: true, createdAt: true });
export const insertSignInLogSchema = createInsertSchema(signInLogs).omit({ id: true, createdAt: true });
export const insertSignInRewardRuleSchema = createInsertSchema(signInRewardRules).omit({ id: true });
export const insertLotteryTimesLedgerSchema = createInsertSchema(lotteryTimesLedger).omit({ id: true, createdAt: true });
export const insertLotteryDrawSchema = createInsertSchema(lotteryDraws).omit({ id: true, createdAt: true });
export const insertCommissionLogSchema = createInsertSchema(commissionLogs).omit({ id: true, createdAt: true });
export const insertAiChatLogSchema = createInsertSchema(aiChatLogs).omit({ id: true, createdAt: true });

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
export type VipLevel = typeof vipLevels.$inferSelect;
export type InsertVipLevel = z.infer<typeof insertVipLevelSchema>;
export type VipRequirement = typeof vipRequirements.$inferSelect;
export type InsertVipRequirement = z.infer<typeof insertVipRequirementSchema>;
export type VipUnlockState = typeof vipUnlockState.$inferSelect;
export type InsertVipUnlockState = z.infer<typeof insertVipUnlockStateSchema>;
export type VipCommissionRate = typeof vipCommissionRates.$inferSelect;
export type LotteryCommissionRate = typeof lotteryCommissionRates.$inferSelect;
export type UserVipStatus = typeof userVipStatus.$inferSelect;
export type InsertUserVipStatus = z.infer<typeof insertUserVipStatusSchema>;
export type VipUpgradeTx = typeof vipUpgradeTxs.$inferSelect;
export type InsertVipUpgradeTx = z.infer<typeof insertVipUpgradeTxSchema>;
export type SignInLog = typeof signInLogs.$inferSelect;
export type InsertSignInLog = z.infer<typeof insertSignInLogSchema>;
export type SignInRewardRule = typeof signInRewardRules.$inferSelect;
export type LotteryTimesLedger = typeof lotteryTimesLedger.$inferSelect;
export type InsertLotteryTimesLedger = z.infer<typeof insertLotteryTimesLedgerSchema>;
export type LotteryDraw = typeof lotteryDraws.$inferSelect;
export type InsertLotteryDraw = z.infer<typeof insertLotteryDrawSchema>;
export type CommissionLog = typeof commissionLogs.$inferSelect;
export type InsertCommissionLog = z.infer<typeof insertCommissionLogSchema>;
export type AiChatLog = typeof aiChatLogs.$inferSelect;
export type InsertAiChatLog = z.infer<typeof insertAiChatLogSchema>;

export type VirtualBuyer = typeof virtualBuyers.$inferSelect;

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

export const identityVerificationSubmitSchema = z.object({
  realName: z.string().min(2, "请输入真实姓名"),
  idNumber: z.string().regex(/^\d{17}[\dXx]$/, "请输入有效的身份证号码"),
  idFrontImage: z.string().min(1, "请上传身份证正面照片"),
  idBackImage: z.string().min(1, "请上传身份证背面照片"),
});

export const adminIdentityReviewSchema = z.object({
  approved: z.boolean(),
  reviewNote: z.string().optional(),
});

export const adminIdentityBatchReviewSchema = z.object({
  ids: z.array(z.any()),
  approved: z.boolean(),
  reviewNote: z.string().optional(),
});

// ============ IDENTITY VERIFICATION ============
export const identityVerifications = pgTable("identity_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  realName: varchar("real_name", { length: 50 }).notNull(),
  idNumber: varchar("id_number", { length: 20 }).notNull(),
  idFrontImage: text("id_front_image").notNull(),
  idBackImage: text("id_back_image").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),  // pending|approved|rejected
  reviewNote: text("review_note"),
  reviewedBy: integer("reviewed_by").references(() => admins.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIdentityVerificationSchema = createInsertSchema(identityVerifications).omit({ id: true, createdAt: true });

export type IdentityVerification = typeof identityVerifications.$inferSelect;
export type InsertIdentityVerification = z.infer<typeof insertIdentityVerificationSchema>;

// ============ SMS VERIFICATION ============
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const requestCodeSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
});

export const registerWithSmsSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  code: z.string().length(6, "验证码为6位数字"),
  password: z.string().min(6, "密码至少6位"),
  confirmPassword: z.string().min(6, "确认密码至少6位"),
  inviteCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

// ============ GROUP RED PACKETS (拼手气红包) ============
export const groupRedPackets = pgTable("group_red_packets", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),  // 红包总金额
  totalCount: integer("total_count").notNull(),  // 红包总份数
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),  // 剩余金额
  remainingCount: integer("remaining_count").notNull(),  // 剩余份数
  greeting: varchar("greeting", { length: 200 }).default("恭喜发财，大吉大利"),  // 红包祝福语
  status: varchar("status", { length: 20 }).default("active").notNull(),  // active|finished|expired
  createdBy: integer("created_by").references(() => admins.id),  // 管理员发送
  expireAt: timestamp("expire_at"),  // 过期时间
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const redPacketClaims = pgTable("red_packet_claims", {
  id: serial("id").primaryKey(),
  redPacketId: integer("red_packet_id").notNull().references(() => groupRedPackets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),  // 领取金额
  isLuckiest: boolean("is_luckiest").default(false).notNull(),  // 是否手气最佳
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

export const insertGroupRedPacketSchema = createInsertSchema(groupRedPackets).omit({
  id: true,
  remainingAmount: true,
  remainingCount: true,
  status: true,
  createdAt: true,
});

export type GroupRedPacket = typeof groupRedPackets.$inferSelect;
export type InsertGroupRedPacket = z.infer<typeof insertGroupRedPacketSchema>;
export type RedPacketClaim = typeof redPacketClaims.$inferSelect;

// ============ E-COMMERCE TYPES ============
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type UserCoupon = typeof userCoupons.$inferSelect;
export type InsertUserCoupon = z.infer<typeof insertUserCouponSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
