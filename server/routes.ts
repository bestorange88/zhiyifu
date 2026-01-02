import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Custom routes to match shared/routes.ts if integration differs or for extra convenience

  // Match api.chat.getMessages
  app.get(api.chat.getMessages.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const messages = await storage.getMessagesByConversation(id);
    res.json(messages);
  });

  return httpServer;
}
