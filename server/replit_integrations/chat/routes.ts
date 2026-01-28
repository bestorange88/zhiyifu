import type { Express, Request, Response } from "express";
import { chatStorage } from "./storage";
import OpenAI from "openai";

// Configure OpenAI Client for Free/Community Instances
// Support both naming conventions for environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "sk-free-proxy";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
});

// Use GPT-3.5-turbo model (free tier compatible)
const AI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

console.log(`[AI Chat] Configured with baseURL: ${OPENAI_BASE_URL}, model: ${AI_MODEL}`);

async function callOpenAIAPI(messages: Array<{ role: string; content: string }>) {
  try {
    const completion = await openai.chat.completions.create({
      messages: messages.map(m => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content
      })),
      model: AI_MODEL,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("AI API Error:", error);
    throw new Error(`AI API Error: ${error.message || "Unknown error"}`);
  }
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, systemPrompt } = req.body;

      // Check sensitive words
      const { sensitiveWords } = await getAiSettings();
      if (sensitiveWords) {
        const words = sensitiveWords.split(/[,，]/).map(w => w.trim()).filter(Boolean);
        for (const word of words) {
          if (content.includes(word)) {
            return res.status(400).json({ error: "内容包含敏感词，无法发送" });
          }
        }
      }

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      
      // Build chat messages with optional system prompt
      const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        chatMessages.push({
          role: "system",
          content: systemPrompt,
        });
      }
      
      // Add conversation history
      chatMessages.push(...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // 调用AI API获取回复
      const fullResponse = await callOpenAIAPI(chatMessages);

      // 发送完整回复（非流式）
      res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

