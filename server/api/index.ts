import type { Express } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import * as authService from "../services/auth";
import * as walletService from "../services/wallet";
import * as checkinService from "../services/checkin";
import * as spinService from "../services/spin";
import * as vipService from "../services/vip";
import * as withdrawService from "../services/withdraw";
import * as referralService from "../services/referral";
import { registerSchema, loginSchema, spinRequestSchema, withdrawApplySchema } from "@shared/schema";

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

  // ============ ADMIN ============
  app.get("/api/admin/withdraw/list", async (req, res) => {
    try {
      const { db } = await import("../db");
      const { withdraws } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      const list = await db.select().from(withdraws).orderBy(desc(withdraws.createdAt)).limit(100);
      res.json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/withdraw/review", async (req, res) => {
    try {
      const { withdrawId, approved } = req.body;
      const result = await withdrawService.reviewWithdraw(withdrawId, approved);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
