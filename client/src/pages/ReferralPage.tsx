import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Users, Gift, Crown, Copy, Check, Share2, Zap, TrendingUp, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReferralSummary {
  directCount: number;
  team3genCount: number;
  currentRank: number;
  currentRankName: string;
  nextRank: any | null;
}

interface AgentStatus {
  hasApplied: boolean;
  status: string | null;
  appliedAt?: string;
  reviewNote?: string;
}

interface RankRule {
  id: number;
  rank: number;
  name: string;
  directRequired: number;
  team3genRequired: number;
  directCommissionRate: string;
  indirectCommissionRate: string;
  cashBonus: string;
}

interface DirectReferral {
  id: number;
  phone: string;
  createdAt: string;
  vipLevel: number;
}

interface ReferralReward {
  id: number;
  userId: number;
  fromUserId: number;
  level: number;
  amount: string;
  status: string;
  createdAt: string;
}

export default function ReferralPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [realName, setRealName] = useState("");
  const [wechat, setWechat] = useState("");
  const [reason, setReason] = useState("");

  const { data: referralSummary } = useQuery<ReferralSummary>({
    queryKey: ["/api/referral/summary"],
    enabled: !!user,
  });

  const { data: directReferrals } = useQuery<DirectReferral[]>({
    queryKey: ["/api/referral/direct"],
    enabled: !!user,
  });

  const { data: referralRewards } = useQuery<ReferralReward[]>({
    queryKey: ["/api/referral/rewards"],
    enabled: !!user,
  });

  const { data: rankRules } = useQuery<RankRule[]>({
    queryKey: ["/api/referral/ranks"],
  });

  const { data: agentStatus } = useQuery<AgentStatus>({
    queryKey: ["/api/agent/status"],
    enabled: !!user,
  });

  const applyAgentMutation = useMutation({
    mutationFn: async (data: { realName: string; wechat: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/agent/apply", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
      toast({ title: "申请已提交", description: "我们会尽快审核您的申请" });
      setShowAgentDialog(false);
      setRealName("");
      setWechat("");
      setReason("");
    },
    onError: (error: any) => {
      toast({ title: "申请失败", description: error.message, variant: "destructive" });
    },
  });

  const inviteCode = user?.inviteCode || "XXXXXX";
  const inviteLink = `https://365zhmz.com/invite?code=${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "复制成功", description: "邀请链接已复制" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyAgent = () => {
    if (!realName) {
      toast({ title: "请填写真实姓名", variant: "destructive" });
      return;
    }
    applyAgentMutation.mutate({ realName, wechat, reason });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">请先登录查看分佣奖励</p>
          <Button onClick={() => setLocation("/mine")}>去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 px-4 pt-4 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-10" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={() => setLocation("/mine")}
            className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
            data-testid="button-back-referral"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">分佣奖励</h1>
        </div>

        <div className="relative z-10 text-center text-white">
          <p className="text-white/80 text-sm mb-2">当前等级</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-300" />
            <span className="text-2xl font-bold">
              {referralSummary?.currentRankName || "普通用户"}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/20 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{referralSummary?.directCount || 0}</p>
              <p className="text-xs text-white/70">直推人数</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{referralSummary?.team3genCount || 0}</p>
              <p className="text-xs text-white/70">团队人数</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-500" />
              我的邀请码
            </h3>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
            <p className="text-3xl font-bold text-center text-purple-600 tracking-widest">
              {inviteCode}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input 
              value={inviteLink} 
              readOnly 
              className="text-sm bg-gray-50"
            />
            <Button
              onClick={handleCopy}
              className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              data-testid="button-copy-referral"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              代理申请
            </h3>
            {agentStatus?.status === "approved" && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                已认证
              </span>
            )}
          </div>

          {agentStatus?.status === "pending" ? (
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-orange-600 font-medium">申请审核中</p>
              <p className="text-xs text-orange-500 mt-1">我们会尽快处理您的申请</p>
            </div>
          ) : agentStatus?.status === "approved" ? (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-green-600 font-medium">您已是认证代理</p>
              <p className="text-xs text-green-500 mt-1">享受更高佣金比例</p>
            </div>
          ) : (
            <Button
              onClick={() => setShowAgentDialog(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
              data-testid="button-apply-agent"
            >
              申请成为代理
            </Button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            等级晋升
          </h3>
          
          <div className="space-y-3">
            {rankRules?.map((rule: any) => {
              const isCurrentOrBelow = rule.rank <= (referralSummary?.currentRank || 0);
              return (
                <div 
                  key={rule.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    isCurrentOrBelow ? "bg-purple-50 border border-purple-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCurrentOrBelow ? "bg-purple-500" : "bg-gray-300"
                    }`}>
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{rule.name}</p>
                      <p className="text-xs text-gray-500">
                        直推{rule.directRequired}人 · 团队{rule.team3genRequired}人
                      </p>
                    </div>
                  </div>
                  {parseFloat(rule.cashBonus) > 0 && (
                    <span className="text-orange-500 font-bold">
                      +¥{rule.cashBonus}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              我的团队
            </h3>
            <span className="text-sm text-gray-400">{directReferrals?.length || 0}人</span>
          </div>
          
          {directReferrals && directReferrals.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {directReferrals.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {ref.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(ref.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  {ref.vipLevel > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                      VIP{ref.vipLevel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无团队成员</p>
              <p className="text-xs mt-1">分享邀请码开始组建团队</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Gift className="w-4 h-4 text-rose-500" />
              佣金记录
            </h3>
          </div>
          
          {referralRewards && referralRewards.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {referralRewards.map((reward: any) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">
                      {reward.level === 1 ? "直推佣金" : "间推佣金"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(reward.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <span className="text-green-600 font-bold">+¥{reward.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无佣金记录</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              申请成为代理
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-amber-700 font-medium">代理专属权益</p>
              <p className="text-xs text-amber-600 mt-1">更高佣金比例 · 专属推广支持 · 优先客服响应</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">真实姓名 *</label>
                <Input
                  placeholder="请输入真实姓名"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  data-testid="input-agent-name"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">微信号</label>
                <Input
                  placeholder="方便联系您"
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                  data-testid="input-agent-wechat"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">申请理由</label>
                <Input
                  placeholder="简述您的推广计划"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="input-agent-reason"
                />
              </div>
            </div>

            <Button
              onClick={handleApplyAgent}
              disabled={applyAgentMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
              data-testid="button-submit-agent"
            >
              {applyAgentMutation.isPending ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
