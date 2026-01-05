import type { Express } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { AdminRequest, adminAuthMiddleware } from "../middleware/adminAuth";
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
}
