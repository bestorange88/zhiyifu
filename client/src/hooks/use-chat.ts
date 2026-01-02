import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useState, useRef } from "react";

// Hook for fetching conversations
export function useConversations() {
  return useQuery({
    queryKey: [api.chat.listConversations.path],
    queryFn: async () => {
      const res = await fetch(api.chat.listConversations.path);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.chat.listConversations.responses[200].parse(await res.json());
    },
  });
}

// Hook for creating a conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(api.chat.createConversation.path, {
        method: api.chat.createConversation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return api.chat.createConversation.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.listConversations.path] });
    },
  });
}

// Hook for fetching messages of a conversation
export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: [api.chat.getMessages.path, conversationId],
    queryFn: async () => {
      const url = buildUrl(api.chat.getMessages.path, { id: conversationId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.chat.getMessages.responses[200].parse(await res.json());
    },
    enabled: !!conversationId,
  });
}

// Custom hook for streaming messages (SSE)
export function useChatStream(conversationId: number, systemPrompt?: string) {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (content: string) => {
    setIsStreaming(true);
    setStreamingContent("");
    abortControllerRef.current = new AbortController();

    try {
      const url = buildUrl(api.chat.sendMessage.path, { id: conversationId });
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, systemPrompt }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Handle SSE Stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              if (data.done) break;
              if (data.content) {
                setStreamingContent((prev) => prev + data.content);
              }
            } catch (e) {
              console.error("Error parsing SSE chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      throw error;
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      // Refresh messages to get the full persisted history
      queryClient.invalidateQueries({ queryKey: [api.chat.getMessages.path, conversationId] });
    }
  };

  return { sendMessage, streamingContent, isStreaming };
}
