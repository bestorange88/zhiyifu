import type { Express } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { AdminRequest, adminAuthMiddleware } from "../middleware/adminAuth";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "attached_assets", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件"));
    }
  },
});
import * as authService from "../services/auth";
import * as walletService from "../services/wallet";
import * as checkinService from "../services/checkin";
import * as spinService from "../services/spin";
import * as vipService from "../services/vip";
import * as withdrawService from "../services/withdraw";
import * as referralService from "../services/referral";
import * as adminService from "../services/admin";
import * as agentService from "../services/agent";
import * as groupService from "../services/group";
import { registerSchema, loginSchema, spinRequestSchema, withdrawApplySchema, adminLoginSchema, agentApplySchema, adminUserStatusSchema, adminWithdrawReviewSchema, adminAgentReviewSchema } from "@shared/schema";

export function registerApiRoutes(app: Express): void {
  // ============ AUTH ============
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phone, password, inviteCode } = registerSchema.parse(req.body);
      const result = await authService.registerUser(phone, password, inviteCode);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = loginSchema.parse(req.body);
      const result = await authService.loginUser(phone, password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await authService.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "用户不存在" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ CHECKIN ============
  app.get("/api/checkin/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const status = await checkinService.getCheckinStatus(req.userId!);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/checkin", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await checkinService.performCheckin(req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/checkin/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const history = await checkinService.getCheckinHistory(req.userId!);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ WALLET ============
  app.get("/api/wallet", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const wallet = await walletService.getWallet(req.userId!);
      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/ledger", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const history = await walletService.getLedgerHistory(req.userId!, limit, offset);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ WHEEL / SPIN ============
  app.get("/api/wheel/config", async (req, res) => {
    try {
      const config = await spinService.getWheelConfig();
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/wheel/balance", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const balance = await spinService.getSpinBalance(req.userId!);
      res.json(balance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/wheel/spin", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { requestId } = spinRequestSchema.parse(req.body);
      const result = await spinService.performSpin(req.userId!, requestId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/wheel/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const history = await spinService.getSpinHistory(req.userId!);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ VIP ============
  app.get("/api/vip/plans", async (req, res) => {
    try {
      const plans = await vipService.getVipPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/vip/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const status = await vipService.getVipStatus(req.userId!);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/vip/buy", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { level } = req.body;
      const result = await vipService.buyVip(req.userId!, level);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/vip/confirm", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { orderId } = req.body;
      const result = await vipService.confirmVipPurchase(req.userId!, orderId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ WITHDRAW ============
  app.get("/api/withdraw/rules", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const rules = await withdrawService.getWithdrawRules(req.userId!);
      res.json(rules);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/withdraw/apply", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { amount, method, accountInfo } = withdrawApplySchema.parse(req.body);
      const result = await withdrawService.applyWithdraw(req.userId!, amount, method, accountInfo);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/withdraw/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const history = await withdrawService.getWithdrawHistory(req.userId!);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ REFERRAL ============
  app.get("/api/referral/summary", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const summary = await referralService.getReferralSummary(req.userId!);
      res.json(summary);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/referral/direct", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const referrals = await referralService.getDirectReferrals(req.userId!);
      res.json(referrals);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/referral/rewards", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const rewards = await referralService.getReferralRewards(req.userId!);
      res.json(rewards);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/referral/ranks", async (req, res) => {
    try {
      const ranks = await referralService.getRankRules();
      res.json(ranks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ AGENT ============
  app.get("/api/agent/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const status = await agentService.getAgentStatus(req.userId!);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/agent/apply", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { realName, wechat, reason } = agentApplySchema.parse(req.body);
      const result = await agentService.applyAgent(req.userId!, realName, wechat, reason);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN AUTH ============
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      const result = await adminService.adminLogin(username, password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/me", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      res.json({ adminId: req.adminId, role: req.adminRole });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN DASHBOARD ============
  app.get("/api/admin/dashboard", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await adminService.getUserList(page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const result = await adminService.getUserDetail(userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/users/:id/status", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status } = adminUserStatusSchema.parse(req.body);
      const result = await adminService.updateUserStatus(userId, status);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/withdraws", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const result = await adminService.getWithdrawList(status, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/withdraws/:id/review", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const withdrawId = parseInt(req.params.id);
      const { approved } = adminWithdrawReviewSchema.parse(req.body);
      const result = await withdrawService.reviewWithdraw(withdrawId, approved);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/agents", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const result = await adminService.getAgentApplicationList(status, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/agents/:id/review", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const appId = parseInt(req.params.id);
      const { approved, reviewNote } = adminAgentReviewSchema.parse(req.body);
      const result = await adminService.reviewAgentApplication(appId, approved, reviewNote);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/orders", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const result = await adminService.getOrderList(status, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const result = await adminService.getSystemStats();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN GROUP MANAGEMENT ============
  app.get("/api/admin/groups", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groups = await groupService.getGroupList();
      res.json(groups);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/groups", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const { name, description, memberIds } = req.body;
      const group = await groupService.createGroup(name, description);
      if (memberIds && memberIds.length > 0) {
        await groupService.setGroupMembers(group.id, memberIds);
      }
      const fullGroup = await groupService.getGroupById(group.id);
      res.status(201).json(fullGroup);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/groups/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ error: "群组不存在" });
      }
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/groups/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const { name, description, isActive, memberIds } = req.body;
      await groupService.updateGroup(groupId, { name, description, isActive });
      if (memberIds !== undefined) {
        await groupService.setGroupMembers(groupId, memberIds);
      }
      const fullGroup = await groupService.getGroupById(groupId);
      res.json(fullGroup);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/groups/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      await groupService.deleteGroup(groupId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/users-for-group", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const users = await groupService.getAllUsersForGroupSelection();
      res.json(users);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/groups/:id/messages", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await groupService.getAdminGroupMessages(groupId, limit);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/groups/:id/messages", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const { content } = req.body;
      const message = await groupService.sendAdminGroupMessage(groupId, req.adminId!, content);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ USER GROUP ENDPOINTS ============
  app.get("/api/groups", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const groups = await groupService.getUserGroups(req.userId!);
      res.json(groups);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/groups/:id/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await groupService.getGroupMessages(groupId, req.userId!, limit);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/groups/:id/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const { content } = req.body;
      const message = await groupService.sendGroupMessage(groupId, req.userId!, content);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ USER SERVICE CHAT ============
  app.get("/api/service/session", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const session = await adminService.getUserServiceSession(req.userId!);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/service/session", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const session = await adminService.createUserServiceSession(req.userId!);
      res.status(201).json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/service/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const messages = await adminService.getUserServiceMessages(req.userId!);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/service/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { content } = req.body;
      const message = await adminService.sendUserServiceMessage(req.userId!, content);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN SYSTEM SETTINGS ============
  app.get("/api/admin/settings", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const settings = await adminService.getSystemSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/settings", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const { key, value } = req.body;
      const setting = await adminService.setSystemSetting(key, value);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/upload", adminAuthMiddleware, upload.single("file"), async (req: AdminRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "请选择文件" });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN DEPOSITS ============
  app.get("/api/admin/deposits", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const deposits = await adminService.getDepositList();
      res.json(deposits);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/review", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const depositId = parseInt(req.params.id);
      const { approved } = req.body;
      const result = await adminService.reviewDeposit(depositId, approved);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN LOTTERY ============
  app.get("/api/admin/lottery/prizes", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const prizes = await adminService.getLotteryPrizes();
      res.json(prizes);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/lottery/prizes/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const prizeId = parseInt(req.params.id);
      const result = await adminService.updateLotteryPrize(prizeId, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/lottery/spins", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const spins = await adminService.getLotterySpins();
      res.json(spins);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN DISTRIBUTION ============
  app.get("/api/admin/distribution/users", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const users = await adminService.getDistributionUsers();
      res.json(users);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/distribution/referrals", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const referrals = await adminService.getReferralRecords();
      res.json(referrals);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN COMMISSIONS ============
  app.get("/api/admin/commissions", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const commissions = await adminService.getCommissionRecords();
      res.json(commissions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN VIP PLANS ============
  app.get("/api/admin/vip-plans", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const plans = await adminService.getVipPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/vip-plans/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const planId = parseInt(req.params.id);
      const result = await adminService.updateVipPlan(planId, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN FEATURE FLAGS ============
  app.get("/api/admin/features", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const features = await adminService.getFeatureFlags();
      res.json(features);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/features", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const { key, enabled } = req.body;
      const result = await adminService.setFeatureFlag(key, enabled);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN CUSTOMER SERVICE ============
  app.get("/api/admin/service/sessions", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const sessions = await adminService.getServiceSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/service/sessions/:id/messages", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await adminService.getServiceMessages(sessionId);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/service/sessions/:id/messages", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { content } = req.body;
      const message = await adminService.sendServiceMessage(sessionId, req.adminId!, content);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN USER BALANCE ADJUSTMENT ============
  app.post("/api/admin/users/:id/balance", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, currency = "cny", reason = "" } = req.body;
      
      if (amount === undefined || amount === null) {
        return res.status(400).json({ error: "请输入金额" });
      }
      
      const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) {
        return res.status(400).json({ error: "金额格式无效" });
      }
      
      const result = await adminService.adjustUserBalance(req.adminId!, userId, numAmount, currency, reason);
      res.json(result);
    } catch (error: any) {
      console.error("Balance adjustment error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/:id/detail", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const detail = await adminService.getUserDetail(userId);
      res.json(detail);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/:id/relationship", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const tree = await adminService.getUserRelationshipTree(userId);
      res.json(tree);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
