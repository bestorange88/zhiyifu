import { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../services/admin";

export interface AdminRequest extends Request {
  adminId?: number;
  adminRole?: string;
}

export function adminAuthMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登录" });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyAdminToken(token);
    req.adminId = decoded.adminId;
    req.adminRole = decoded.role;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
}
