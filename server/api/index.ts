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
import * as smsService from "../services/sms";
import * as redPacketService from "../services/redPacket";
import { registerSchema, loginSchema, spinRequestSchema, withdrawApplySchema, adminLoginSchema, agentApplySchema, adminUserStatusSchema, adminWithdrawReviewSchema, adminAgentReviewSchema, adminRankUpdateSchema, requestCodeSchema, registerWithSmsSchema, identityVerificationSubmitSchema, adminIdentityReviewSchema, adminIdentityBatchReviewSchema } from "@shared/schema";
import * as identityService from "../services/identity";
import * as sellerOnboardingService from "../services/sellerOnboarding";
import * as orderService from "../services/orderService";
import * as cartService from "../services/cartService";

export function registerApiRoutes(app: Express): void {
  // ============ SHOP / E-COMMERCE ============
  
  // Cart
  app.get("/api/cart", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const cart = await cartService.getCart(req.userId!);
      res.json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/cart", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const item = await cartService.addToCart(req.userId!, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await cartService.updateCartItem(req.userId!, id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await cartService.removeFromCart(req.userId!, id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/cart", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await cartService.clearCart(req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Orders
  app.post("/api/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const order = await orderService.createOrder(req.userId!, req.body);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const status = req.query.status as any;
      const orders = await orderService.getOrderList(req.userId!, status);
      res.json(orders);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await orderService.getOrderDetail(id);
      if (order.user_id !== req.userId) {
        return res.status(403).json({ error: "无权访问此订单" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders/:id/tracking", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      // 验证权限
      const order = await orderService.getOrderDetail(id);
      if (order.user_id !== req.userId) {
        return res.status(403).json({ error: "无权访问此订单" });
      }
      const tracking = await logisticsService.getTracking(id);
      res.json(tracking);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/pay", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await orderService.payOrder(req.userId!, id);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/cancel", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await orderService.cancelOrder(req.userId!, id);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/confirm", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await orderService.confirmReceipt(req.userId!, id);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Virtual Buyer Simulation
  app.post("/api/admin/simulate/shopping", adminAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const order = await virtualBuyerService.simulateVirtualOrder();
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 
  // Admin / Seller Operations
  app.post("/api/admin/orders/:id/ship", adminAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { trackingNo, carrier } = req.body;
      const order = await orderService.shipOrder(id, { company: carrier, trackingNo });
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ AUTH ============
  app.post("/api/auth/request-code", async (req, res) => {
    try {
      const { phone } = requestCodeSchema.parse(req.body);
      const result = await smsService.sendVerificationCode(phone);
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerWithSmsSchema.parse(req.body);
      const deviceFingerprint = req.body.deviceFingerprint || req.headers["x-device-fingerprint"] as string;
      const ip = req.ip || req.headers["x-forwarded-for"] as string || req.socket.remoteAddress;
      const result = await authService.registerWithSms(data.phone, data.code, data.password, data.inviteCode, deviceFingerprint, ip);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = loginSchema.parse(req.body);
      const deviceFingerprint = req.body.deviceFingerprint || req.headers["x-device-fingerprint"] as string;
      const ip = req.ip || req.headers["x-forwarded-for"] as string || req.socket.remoteAddress;
      const result = await authService.loginUser(phone, password, deviceFingerprint, ip);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/wallet/history", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const history = await walletService.getLedgerHistory(req.userId!, limit, offset);
      res.json(history);
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

  // ============ DEPOSIT ============
  app.post("/api/deposit", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { amount, proofImage } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "请输入有效金额" });
      }
      const deposit = await adminService.createDeposit(req.userId!, amount, proofImage);
      res.status(201).json(deposit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/upload/proof", authMiddleware, upload.single("file"), async (req: AuthRequest, res) => {
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

  app.get("/api/lottery/times", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const times = await spinService.getLotteryTimesBreakdown(req.userId!);
      res.json(times);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/lottery/draws", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const draws = await spinService.getLotteryDrawHistory(req.userId!, limit);
      res.json(draws);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/signin/calendar", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const calendar = await checkinService.getSignInCalendar(req.userId!, year, month);
      res.json(calendar);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/signin/lottery-times", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const times = await spinService.getLotteryTimesBreakdown(req.userId!);
      res.json(times);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ VIP (Enhanced) ============
  app.get("/api/vip/plans", async (req, res) => {
    try {
      const plans = await vipService.getVipPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/vip/levels", async (req, res) => {
    try {
      const levels = await vipService.getAllVipLevelsWithDetails();
      res.json(levels);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/vip/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const status = await vipService.getUserVipStatus(req.userId!);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/vip/upgrade", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { level } = req.body;
      const result = await vipService.createVipUpgradeOrder(req.userId!, level);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/vip/upgrade/confirm", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { orderId } = req.body;
      const result = await vipService.confirmVipUpgrade(req.userId!, orderId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/vip/check-qualification", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await vipService.recalcQualification(req.userId!);
      res.json(result);
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

  app.get("/api/referral/commissions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const records = await referralService.getDetailedCommissionHistory(req.userId!);
      res.json(records);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 获取直推下级详细信息列表（包括实名认证状态和充值记录）
  app.get("/api/referral/direct/details", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const referrals = await referralService.getTeamMembersWithDetails(req.userId!);
      res.json(referrals);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/referral/team-stats", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const stats = await referralService.getTeamStats(req.userId!);
      res.json(stats);
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



  // ============ IDENTITY VERIFICATION ============
  app.get("/api/identity/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const status = await identityService.getIdentityVerificationStatus(req.userId!);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/identity/submit", authMiddleware, upload.fields([
    { name: "idFrontImage", maxCount: 1 },
    { name: "idBackImage", maxCount: 1 }
  ]), async (req: AuthRequest, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.idFrontImage || !files.idBackImage) {
        return res.status(400).json({ error: "请上传身份证正反面照片" });
      }

      const idFrontImage = `/uploads/${files.idFrontImage[0].filename}`;
      const idBackImage = `/uploads/${files.idBackImage[0].filename}`;
      
      const { realName, idNumber } = identityVerificationSubmitSchema.parse({
        ...req.body,
        idFrontImage,
        idBackImage,
      });

      const result = await identityService.submitIdentityVerification(
        req.userId!,
        realName,
        idNumber,
        idFrontImage,
        idBackImage
      );
      res.json(result);
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

  // ============ SELLER ONBOARDING ============
  app.get("/api/seller/onboarding", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const progress = await sellerOnboardingService.getOnboardingProgress(req.userId!);
      res.json(progress || { currentStep: 1 }); // Default to step 1 if no record
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/seller/onboarding/step/:step", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const step = parseInt(req.params.step);
      const data = req.body;
      const result = await sellerOnboardingService.updateOnboardingStep(req.userId!, step, data);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/seller/onboarding/vip-pay", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await sellerOnboardingService.completeVipPayment(req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ CART ============
  app.get("/api/cart", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const cart = await cartService.getCart(req.userId!);
      res.json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/cart", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await cartService.addToCart(req.userId!, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await cartService.updateCartItem(req.userId!, id, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await cartService.removeFromCart(req.userId!, id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/cart", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await cartService.clearCart(req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ORDERS ============
  app.post("/api/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await orderService.createOrder(req.userId!, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const status = req.query.status as string;
      const result = await orderService.getOrderList(req.userId!, status);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await orderService.getOrderDetail(req.userId!, id);
      if (!result) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/cancel", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await orderService.cancelOrder(req.userId!, id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/pay", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await orderService.payOrder(req.userId!, id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/receive", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await orderService.confirmReceipt(req.userId!, id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/orders/:id/ship", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { company, trackingNo } = req.body;
      const result = await orderService.shipOrder(id, { company, trackingNo });
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

  app.get("/api/admin/points-history", adminAuthMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const result = await adminService.getPointsHistory(page, limit, search);
      res.json(result);
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
      const search = req.query.search as string | undefined;
      const vipLevel = req.query.vipLevel as string | undefined;
      const result = await adminService.getUserList(page, limit, search, vipLevel);
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

  app.post("/api/admin/users", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const { phone, password, vipLevel, inviterCode } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ error: "手机号和密码不能为空" });
      }
      const result = await adminService.adminCreateUser(phone, password, vipLevel || 0, inviterCode);
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
      const search = req.query.search as string | undefined;
      const result = await adminService.getOrderList(status, page, limit, search);
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

  app.put("/api/admin/groups/:groupId/members/:userId", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const userId = parseInt(req.params.userId);
      const { role, isMuted } = req.body;
      const result = await groupService.updateGroupMember(groupId, userId, { role, isMuted });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/groups/:groupId/members/:userId", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const userId = parseInt(req.params.userId);
      const result = await groupService.removeGroupMember(groupId, userId);
      res.json(result);
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
      const { content, messageType, mediaUrl } = req.body;
      const message = await groupService.sendAdminGroupMessage(groupId, req.adminId!, content, messageType || "text", mediaUrl);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ USER GROUP ENDPOINTS ============
  // 获取系统群组（公共接口，不需要登录）
  app.get("/api/groups/system", async (req, res) => {
    try {
      const groups = await groupService.getSystemGroups();
      res.json(groups);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

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

  // ============ GROUP RED PACKETS (拼手气红包) ============
  // 获取群组红包列表
  app.get("/api/groups/:id/red-packets", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const packets = await redPacketService.getGroupRedPackets(groupId);
      res.json(packets);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 获取红包详情
  app.get("/api/red-packets/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const redPacketId = parseInt(req.params.id);
      const detail = await redPacketService.getRedPacketDetail(redPacketId);
      if (!detail) {
        return res.status(404).json({ error: "红包不存在" });
      }
      // 添加当前用户是否已领取的信息
      const hasClaimed = await redPacketService.hasUserClaimedRedPacket(redPacketId, req.userId!);
      const userClaim = hasClaimed ? await redPacketService.getUserRedPacketClaim(redPacketId, req.userId!) : null;
      res.json({ ...detail, hasClaimed, userClaim });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 领取红包
  app.post("/api/red-packets/:id/claim", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const redPacketId = parseInt(req.params.id);
      const result = await redPacketService.claimRedPacket(redPacketId, req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 管理员发送红包
  app.post("/api/admin/groups/:id/red-packets", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const { totalAmount, totalCount, packetCount, greeting } = req.body;
      
      if (!totalAmount || totalAmount <= 0) {
        return res.status(400).json({ error: "请输入有效的红包金额" });
      }
      if (!totalCount || totalCount <= 0) {
        return res.status(400).json({ error: "请输入有效的红包份数" });
      }
      
      // 如果指定了packetCount，则批量创建多个红包
      if (packetCount && packetCount > 1) {
        const packets = await redPacketService.createMultipleRedPackets(
          groupId,
          parseFloat(totalAmount),
          parseInt(totalCount),
          parseInt(packetCount),
          greeting || "恭喜发财，大吉大利",
          req.adminId!
        );
        res.status(201).json({ packets, count: packets.length });
      } else {
        const packet = await redPacketService.createRedPacket(
          groupId,
          parseFloat(totalAmount),
          parseInt(totalCount),
          greeting || "恭喜发财，大吉大利",
          req.adminId!
        );
        res.status(201).json(packet);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 管理员获取所有红包列表
  app.get("/api/admin/red-packets", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await redPacketService.getAllRedPackets(page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 管理员获取红包详情
  app.get("/api/admin/red-packets/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const redPacketId = parseInt(req.params.id);
      const detail = await redPacketService.getRedPacketDetail(redPacketId);
      if (!detail) {
        return res.status(404).json({ error: "红包不存在" });
      }
      res.json(detail);
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

  // ============ PUBLIC SETTINGS ============
  app.get("/api/settings/poster", async (req, res) => {
    try {
      const setting = await adminService.getSystemSettingByKey("welcome_poster_url");
      res.json({ url: setting?.value || null });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/settings/payment-qr", async (req, res) => {
    try {
      const setting = await adminService.getSystemSettingByKey("payment_qr_url");
      res.json({ url: setting?.value || null });
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

  // ============ PAYMENT QR CODES ============
  app.get("/api/admin/payment-qr", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const qrCodes = await adminService.getPaymentQrCodes();
      res.json(qrCodes);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/payment-qr", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const { url, name, type } = req.body;
      if (!url) {
        return res.status(400).json({ error: "请提供二维码URL" });
      }
      const qrCode = await adminService.addPaymentQrCode(url, name, type);
      res.json(qrCode);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/payment-qr/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "无效的ID参数" });
      }
      const { name, url, isActive, sortOrder, type } = req.body;
      await adminService.updatePaymentQrCode(id, { name, url, isActive, sortOrder, type });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/payment-qr/:id", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "无效的ID参数" });
      }
      await adminService.deletePaymentQrCode(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Public API to get random QR code for frontend display
  app.get("/api/payment-qr/random", async (req, res) => {
    try {
      const qrCode = await adminService.getRandomPaymentQrCode();
      res.json(qrCode);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Public API to get random QR code by type (alipay or wechat)
  app.get("/api/payment-qr/:type", async (req, res) => {
    try {
      const type = req.params.type;
      if (type !== "alipay" && type !== "wechat") {
        return res.status(400).json({ error: "无效的支付类型" });
      }
      const qrCode = await adminService.getRandomPaymentQrCodeByType(type);
      res.json(qrCode);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN RANK RULES ============
  app.get("/api/admin/ranks", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const ranks = await referralService.getAllRankRulesAdmin();
      res.json(ranks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/ranks/:rank", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const rankNum = parseInt(req.params.rank);
      if (isNaN(rankNum) || rankNum < 1 || rankNum > 10) {
        return res.status(400).json({ error: "无效的等级参数" });
      }
      const updates = adminRankUpdateSchema.parse(req.body);
      const result = await referralService.updateRankRule(rankNum, updates);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============ ADMIN IDENTITY VERIFICATION ============
  app.get("/api/admin/identity-verifications", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const verifications = await identityService.getAllIdentityVerifications();
      res.json(verifications);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/identity-verifications/:id/review", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const verificationId = parseInt(req.params.id);
      const { approved, reviewNote } = adminIdentityReviewSchema.parse(req.body);
      const result = await identityService.reviewIdentityVerification(
        verificationId,
        req.adminId!,
        approved,
        reviewNote
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/identity-verifications/batch-review", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      console.log("[Batch Review] Request body:", JSON.stringify(req.body));
      const { ids, approved, reviewNote } = adminIdentityBatchReviewSchema.parse(req.body);
      console.log("[Batch Review] Parsed - ids:", ids, "approved:", approved, "adminId:", req.adminId);
      const results = await identityService.batchReviewIdentityVerifications(
        ids,
        req.adminId!,
        approved,
        reviewNote
      );
      console.log("[Batch Review] Results:", JSON.stringify(results));
      res.json(results);
    } catch (error: any) {
      console.error("[Batch Review] Error:", error.message, error.stack);
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

  // ============ ADMIN RANK UPGRADE REQUESTS ============
  app.get("/api/admin/rank-upgrade-requests", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await referralService.getRankUpgradeRequests(status);
      res.json(requests);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/rank-upgrade-requests/:id/approve", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { adminNote } = req.body;
      const result = await referralService.approveRankUpgradeRequest(requestId, req.adminId, adminNote);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/rank-upgrade-requests/:id/reject", adminAuthMiddleware, async (req: AdminRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { adminNote } = req.body;
      const result = await referralService.rejectRankUpgradeRequest(requestId, req.adminId, adminNote);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
