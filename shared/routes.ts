import { z } from 'zod';
import { insertMessageSchema, conversations, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  chat: {
    listConversations: {
      method: 'GET' as const,
      path: '/api/conversations',
      responses: {
        200: z.array(z.custom<typeof conversations.$inferSelect>()),
      },
    },
    createConversation: {
      method: 'POST' as const,
      path: '/api/conversations',
      input: z.object({ title: z.string() }),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
      },
    },
    getMessages: {
      method: 'GET' as const,
      path: '/api/conversations/:id/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages',
      input: z.object({ content: z.string() }),
      responses: {
        200: z.custom<typeof messages.$inferSelect>(), // The user message
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
