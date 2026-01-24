CREATE TABLE "admin_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"amount" numeric(10, 2),
	"currency" varchar(30),
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "agent_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"real_name" varchar(50) NOT NULL,
	"wechat" varchar(50),
	"reason" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"avatar_url" text,
	"owner_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkin_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_key" varchar(50) NOT NULL,
	"value" integer NOT NULL,
	"description" text,
	CONSTRAINT "checkin_rules_rule_key_unique" UNIQUE("rule_key")
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"check_date" date NOT NULL,
	"streak_count" integer DEFAULT 1 NOT NULL,
	"reward_spin_times" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_user_id" integer NOT NULL,
	"from_user_id" integer NOT NULL,
	"biz_type" varchar(30) NOT NULL,
	"relation_level" integer NOT NULL,
	"base_cents" integer NOT NULL,
	"rate" numeric(6, 4) NOT NULL,
	"amount_cents" integer NOT NULL,
	"ref_id" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"from_user_id" integer NOT NULL,
	"order_id" integer,
	"spin_id" integer,
	"source_type" varchar(20) DEFAULT 'vip' NOT NULL,
	"level" integer NOT NULL,
	"rate" numeric(4, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'credited' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"method" varchar(30),
	"proof_image" text,
	"remark" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer,
	"sender_type" varchar(20) DEFAULT 'user' NOT NULL,
	"sender_name" varchar(100),
	"message_type" varchar(20) DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"media_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_red_packets" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"total_count" integer NOT NULL,
	"remaining_amount" numeric(10, 2) NOT NULL,
	"remaining_count" integer NOT NULL,
	"greeting" varchar(200) DEFAULT '恭喜发财，大吉大利',
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" integer,
	"expire_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"real_name" varchar(50) NOT NULL,
	"id_number" varchar(20) NOT NULL,
	"id_front_image" text NOT NULL,
	"id_back_image" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"currency" varchar(30) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"ref_id" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_commission_rates" (
	"level" integer PRIMARY KEY NOT NULL,
	"direct_rate" numeric(6, 4) DEFAULT '0.10' NOT NULL,
	"indirect_rate" numeric(6, 4) DEFAULT '0.05' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_draws" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"biz_date" date NOT NULL,
	"prize_code" varchar(50) NOT NULL,
	"reward_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_times_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"biz_date" date NOT NULL,
	"delta" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"ref_id" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_qr_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"type" varchar(20) DEFAULT 'alipay' NOT NULL,
	"url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rank_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rank" integer NOT NULL,
	"name" varchar(20) NOT NULL,
	"opening_fee" numeric(10, 2) DEFAULT '0',
	"direct_required" integer DEFAULT 0,
	"team_3gen_required" integer DEFAULT 0,
	"direct_commission_rate" numeric(4, 2) DEFAULT '0.10',
	"indirect_commission_rate" numeric(4, 2) DEFAULT '0.05',
	"cash_bonus" numeric(10, 2) DEFAULT '0',
	"daily_spins" integer DEFAULT 0,
	"withdraw_min_amount" numeric(10, 2) DEFAULT '100',
	"withdraw_speed" varchar(10) DEFAULT 'T+1',
	"win_multiplier" numeric(3, 2) DEFAULT '1.0',
	"has_vip_service" boolean DEFAULT false,
	"has_unlimited_ai" boolean DEFAULT false,
	"has_promo_bonus" boolean DEFAULT false,
	"has_priority_welfare" boolean DEFAULT false,
	CONSTRAINT "rank_rules_rank_unique" UNIQUE("rank")
);
--> statement-breakpoint
CREATE TABLE "rank_upgrade_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"target_rank" integer NOT NULL,
	"current_rank" integer NOT NULL,
	"direct_count" integer DEFAULT 0,
	"team_3gen_count" integer DEFAULT 0,
	"bonus_amount" numeric(10, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"reviewed_by" varchar(50),
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "red_packet_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"red_packet_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_luckiest" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"from_user_id" integer NOT NULL,
	"level" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"sender_type" varchar(20) NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"admin_id" integer,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sign_in_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sign_date" date NOT NULL,
	"continuous_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sign_in_reward_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"continuous_days" integer NOT NULL,
	"reward_type" varchar(20) NOT NULL,
	"reward_amount" integer NOT NULL,
	"reset_after" boolean DEFAULT false,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "spin_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"available_spins" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "spin_balance_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_fingerprint" text,
	"last_ip" varchar(50),
	"last_login_at" timestamp,
	"risk_score" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_ranks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"current_rank" integer DEFAULT 0 NOT NULL,
	"direct_count" integer DEFAULT 0 NOT NULL,
	"team_3gen_count" integer DEFAULT 0 NOT NULL,
	"reached_at" timestamp DEFAULT now(),
	CONSTRAINT "user_ranks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_vip_status" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"vip_level" integer DEFAULT 0 NOT NULL,
	"upgraded_at" timestamp,
	"qualified" boolean DEFAULT false NOT NULL,
	"qualified_at" timestamp,
	"direct_count" integer DEFAULT 0 NOT NULL,
	"team3_count" integer DEFAULT 0 NOT NULL,
	"last_qual_check_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20),
	"password_hash" text NOT NULL,
	"invite_code" varchar(20) NOT NULL,
	"inviter_id" integer,
	"vip_level" integer DEFAULT 0 NOT NULL,
	"vip_expire_at" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"code" varchar(10) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vip_commission_rates" (
	"level" integer PRIMARY KEY NOT NULL,
	"direct_rate" numeric(6, 4) DEFAULT '0.10' NOT NULL,
	"indirect_rate" numeric(6, 4) DEFAULT '0.05' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vip_levels" (
	"level" integer PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL,
	"price_cents" integer NOT NULL,
	"upgrade_reward_cents" integer DEFAULT 0 NOT NULL,
	"daily_lottery" integer DEFAULT 0 NOT NULL,
	"income_multiplier" numeric(6, 2) DEFAULT '1.00' NOT NULL,
	"withdraw_threshold_cents" integer DEFAULT 10000 NOT NULL,
	"settle_type" varchar(10) DEFAULT 'T1' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vip_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"daily_extra_spins" integer DEFAULT 0,
	"withdraw_min_amount" numeric(10, 2) DEFAULT '100',
	"withdraw_speed" varchar(10) DEFAULT 'T+1',
	"win_multiplier" numeric(3, 2) DEFAULT '1',
	CONSTRAINT "vip_plans_level_unique" UNIQUE("level")
);
--> statement-breakpoint
CREATE TABLE "vip_requirements" (
	"level" integer PRIMARY KEY NOT NULL,
	"direct_required" integer DEFAULT 0 NOT NULL,
	"team3_required" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vip_upgrade_txs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"from_level" integer NOT NULL,
	"to_level" integer NOT NULL,
	"pay_amount_cents" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance_cash_available" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_cash_frozen" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "wheel_prizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0',
	"probability" numeric(5, 4) NOT NULL,
	"stock" integer,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "wheel_spins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"request_id" varchar(50) NOT NULL,
	"prize_id" integer,
	"prize_name" varchar(50),
	"status" varchar(20) DEFAULT 'success' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wheel_spins_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "withdraws" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'applied' NOT NULL,
	"method" varchar(30),
	"account_info" text,
	"conditions_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"paid_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_applications" ADD CONSTRAINT "agent_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_logs" ADD CONSTRAINT "commission_logs_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_logs" ADD CONSTRAINT "commission_logs_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_spin_id_wheel_spins_id_fk" FOREIGN KEY ("spin_id") REFERENCES "public"."wheel_spins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_chat_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."chat_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_group_id_chat_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."chat_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_red_packets" ADD CONSTRAINT "group_red_packets_group_id_chat_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."chat_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_red_packets" ADD CONSTRAINT "group_red_packets_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_commission_rates" ADD CONSTRAINT "lottery_commission_rates_level_vip_levels_level_fk" FOREIGN KEY ("level") REFERENCES "public"."vip_levels"("level") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_draws" ADD CONSTRAINT "lottery_draws_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_times_ledger" ADD CONSTRAINT "lottery_times_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_upgrade_requests" ADD CONSTRAINT "rank_upgrade_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_packet_claims" ADD CONSTRAINT "red_packet_claims_red_packet_id_group_red_packets_id_fk" FOREIGN KEY ("red_packet_id") REFERENCES "public"."group_red_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_packet_claims" ADD CONSTRAINT "red_packet_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_chat_messages" ADD CONSTRAINT "service_chat_messages_session_id_service_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_chat_sessions" ADD CONSTRAINT "service_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_in_logs" ADD CONSTRAINT "sign_in_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_balance" ADD CONSTRAINT "spin_balance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ranks" ADD CONSTRAINT "user_ranks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vip_status" ADD CONSTRAINT "user_vip_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_commission_rates" ADD CONSTRAINT "vip_commission_rates_level_vip_levels_level_fk" FOREIGN KEY ("level") REFERENCES "public"."vip_levels"("level") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_requirements" ADD CONSTRAINT "vip_requirements_level_vip_levels_level_fk" FOREIGN KEY ("level") REFERENCES "public"."vip_levels"("level") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_upgrade_txs" ADD CONSTRAINT "vip_upgrade_txs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wheel_spins" ADD CONSTRAINT "wheel_spins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wheel_spins" ADD CONSTRAINT "wheel_spins_prize_id_wheel_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."wheel_prizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdraws" ADD CONSTRAINT "withdraws_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;