import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeader } from "@/lib/auth";

async function authFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "请求失败" }));
    throw new Error(error.error || "请求失败");
  }
  
  return response.json();
}

export function useWallet() {
  return useQuery({
    queryKey: ["/api/wallet"],
    queryFn: () => authFetch("/api/wallet"),
    enabled: !!localStorage.getItem("token"),
  });
}

export function useCheckinStatus() {
  return useQuery({
    queryKey: ["/api/checkin/status"],
    queryFn: () => authFetch("/api/checkin/status"),
    enabled: !!localStorage.getItem("token"),
  });
}

export function useCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authFetch("/api/checkin", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wheel/balance"] });
    },
  });
}

export function useSpinBalance() {
  return useQuery({
    queryKey: ["/api/wheel/balance"],
    queryFn: () => authFetch("/api/wheel/balance"),
    enabled: !!localStorage.getItem("token"),
  });
}

export function useSpin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => 
      authFetch("/api/wheel/spin", { 
        method: "POST",
        body: JSON.stringify({ requestId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wheel/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
  });
}

export function useVipStatus() {
  return useQuery({
    queryKey: ["/api/vip/status"],
    queryFn: () => authFetch("/api/vip/status"),
    enabled: !!localStorage.getItem("token"),
  });
}

export function useReferralSummary() {
  return useQuery({
    queryKey: ["/api/referral/summary"],
    queryFn: () => authFetch("/api/referral/summary"),
    enabled: !!localStorage.getItem("token"),
  });
}

export function useWithdrawRules() {
  return useQuery({
    queryKey: ["/api/withdraw/rules"],
    queryFn: () => authFetch("/api/withdraw/rules"),
    enabled: !!localStorage.getItem("token"),
  });
}

export function useLedger() {
  return useQuery({
    queryKey: ["/api/ledger"],
    queryFn: () => authFetch("/api/ledger"),
    enabled: !!localStorage.getItem("token"),
  });
}

export function useLotteryDraws() {
  return useQuery({
    queryKey: ["/api/lottery/draws"],
    queryFn: () => authFetch("/api/lottery/draws"),
    enabled: !!localStorage.getItem("token"),
  });
}
