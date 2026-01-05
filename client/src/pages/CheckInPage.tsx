import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Gift, Calendar, Star, CheckCircle, Clock, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CheckinStatus {
  checkedToday: boolean;
  currentStreak: number;
  nextReward: { daysNeeded: number; extraSpins: number } | null;
  monthProgress: number;
  monthCashReward: number;
}

interface CheckinRecord {
  id: number;
  checkDate: string;
  streakCount: number;
  rewardSpinTimes: number;
  createdAt: string;
}

const STREAK_REWARDS = [
  { day: 1, reward: "10积分+1次抽奖" },
  { day: 2, reward: "10积分+1次抽奖" },
  { day: 3, reward: "10积分+2次抽奖" },
  { day: 4, reward: "10积分+1次抽奖" },
  { day: 5, reward: "10积分+1次抽奖" },
  { day: 6, reward: "10积分+1次抽奖" },
  { day: 7, reward: "10积分+3次抽奖" },
];

export default function CheckInPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: status, isLoading: statusLoading } = useQuery<CheckinStatus>({
    queryKey: ["/api/checkin/status"],
    enabled: !!user,
  });

  const { data: history, isLoading: historyLoading } = useQuery<CheckinRecord[]>({
    queryKey: ["/api/checkin/history"],
    enabled: !!user,
  });

  const checkinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkin");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wheel/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({
        title: "签到成功",
        description: `获得 ${data.bonusPoints} 积分 + ${data.rewardSpins} 次抽奖机会`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "签到失败",
        description: "请先登录后再签到",
        variant: "destructive",
      });
    },
  });

  const handleCheckin = () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可享受签到奖励",
        variant: "destructive",
      });
      setLocation("/mine");
      return;
    }
    checkinMutation.mutate();
  };

  const currentStreak = status?.currentStreak || 0;
  const currentDay = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2 p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/mine")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">每日签到</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 pb-16">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-center">
          <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {status?.checkedToday ? "今日已签到" : "今日未签到"}
          </h2>
          <p className="text-white/90 text-sm">
            已连续签到 <span className="font-bold text-lg">{status?.currentStreak || 0}</span> 天
          </p>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-10">
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-500" />
              7天连续签到奖励
            </h3>
            <span className="text-xs text-gray-500">第 {currentDay}/7 天</span>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-4">
            {STREAK_REWARDS.map((item, index) => {
              const dayNum = index + 1;
              const isCompleted = status?.checkedToday 
                ? dayNum <= currentDay 
                : dayNum < currentDay;
              const isToday = !status?.checkedToday && dayNum === (currentDay + 1 > 7 ? 1 : currentDay + 1);
              const isPending = !isCompleted && !isToday;
              
              return (
                <div 
                  key={index}
                  className={`relative flex flex-col items-center p-2 rounded-lg transition-all ${
                    isCompleted 
                      ? "bg-orange-100 dark:bg-orange-900/30" 
                      : isToday 
                        ? "bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-400" 
                        : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    isCompleted 
                      ? "bg-orange-500 text-white" 
                      : isToday 
                        ? "bg-orange-400 text-white animate-pulse" 
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{item.day}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">第{item.day}天</span>
                  {(item.day === 3 || item.day === 7) && (
                    <div className="absolute -top-1 -right-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!user ? (
            <Button 
              className="w-full"
              onClick={() => setLocation("/mine")}
              data-testid="button-login-prompt"
            >
              <LogIn className="w-4 h-4 mr-2" />
              登录后签到
            </Button>
          ) : (
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
              disabled={status?.checkedToday || checkinMutation.isPending || statusLoading}
              onClick={handleCheckin}
              data-testid="button-checkin"
            >
              {statusLoading ? (
                "加载中..."
              ) : checkinMutation.isPending ? (
                "签到中..."
              ) : status?.checkedToday ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  今日已签到
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  立即签到
                </>
              )}
            </Button>
          )}
        </Card>

        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            签到奖励说明
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">每日签到</span>
              <span className="font-medium text-orange-600">10积分 + 1次抽奖</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">连续3天签到</span>
              <span className="font-medium text-orange-600">额外 +1次抽奖</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">连续7天签到</span>
              <span className="font-medium text-orange-600">额外 +2次抽奖</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">连续15天签到</span>
              <span className="font-medium text-orange-600">额外 +5次抽奖</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">连续30天签到</span>
              <span className="font-medium text-orange-600">额外 58元现金</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            签到记录
          </h3>
          {historyLoading ? (
            <div className="text-center text-gray-500 py-4">加载中...</div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.slice(0, 10).map((record) => (
                <div 
                  key={record.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {format(new Date(record.checkDate), "MM月dd日", { locale: zhCN })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">连续{record.streakCount}天</span>
                    <span className="text-xs text-orange-600 ml-2">+{record.rewardSpinTimes}次抽奖</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">暂无签到记录</div>
          )}
        </Card>
      </div>
    </div>
  );
}
