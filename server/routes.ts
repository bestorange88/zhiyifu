import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerApiRoutes } from "./api";
import { initDefaultAdmin } from "./services/admin";
import { initializeVipLevels } from "./services/vip";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize default admin
  await initDefaultAdmin();
  
  // Initialize VIP levels (ensures data exists in production)
  await initializeVipLevels();
  
  // Register new API routes
  registerApiRoutes(app);
  
  // Register integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Match api.chat.getMessages
  app.get(api.chat.getMessages.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const messages = await storage.getMessagesByConversation(id);
    res.json(messages);
  });

  return httpServer;
}
