import { useState, useEffect } from "react";
import { Gift, Star, Coins, Sparkles, Clock, Crown, CalendarCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";
import { useSpinBalance, useSpin, useLotteryDraws } from "@/hooks/use-api";
import { useAuth } from "@/lib/auth";

interface DisplayPrize {
  id: number;
  name: string;
  color: string;
}

const displayPrizes: DisplayPrize[] = [
  { id: 0, name: "38元", color: "#8b5cf6" }, // Violet
  { id: 1, name: "18元", color: "#ec4899" }, // Pink
  { id: 2, name: "积分\n500", color: "#3b82f6" }, // Blue
  { id: 3, name: "2元", color: "#10b981" }, // Green
  { id: 4, name: "8元", color: "#f59e0b" }, // Amber
  { id: 5, name: "1元", color: "#06b6d4" }, // Cyan
  { id: 6, name: "再来\n一次", color: "#6b7280" }, // Gray
  { id: 7, name: "1元", color: "#06b6d4" },
  { id: 8, name: "8元", color: "#f59e0b" },
  { id: 9, name: "2元", color: "#10b981" },
  { id: 10, name: "积分\n500", color: "#3b82f6" },
  { id: 11, name: "18元", color: "#ec4899" },
];

function getPrizeIndex(prizeName: string): number {
  if (prizeName.includes("38")) return 0;
  if (prizeName.includes("18")) return 1;
  if (prizeName.includes("积分") || prizeName.includes("500")) return 2;
  if (prizeName.includes("8") && !prizeName.includes("18") && !prizeName.includes("38")) return 4;
  if (prizeName.includes("2") && !prizeName.includes("祝你")) return 3;
  if (prizeName.includes("1") && !prizeName.includes("18")) return 5;
  return 6;
}

interface LotteryWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: (prize: string) => void;
}

export default function LotteryWheel({ open, onOpenChange, onWin }: LotteryWheelProps) {
  const { user } = useAuth();
  const { data: spinBalance, refetch: refetchBalance } = useSpinBalance();
  const { data: history, refetch: refetchHistory } = useLotteryDraws();
  const spinMutation = useSpin();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (open) {
      refetchBalance();
      if (showHistory) {
        refetchHistory();
      }
      
      const timer = setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [open, refetchBalance, showHistory, refetchHistory]);

  const spinsLeft = spinBalance?.availableSpins || 0;
  const breakdown = spinBalance?.breakdown || {};
  const vipSpins = breakdown.vip_daily || 0;
  const baseSpins = breakdown.base || 0;
  const signinSpins = breakdown.signin || 0;
  const usedSpins = Math.abs(breakdown.draw_consume || 0);

  const spin = async () => {
    if (isSpinning || spinsLeft <= 0) return;
    if (!user) {
      setError("请先登录");
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setError(null);

    const requestId = `spin_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      const result = await spinMutation.mutateAsync(requestId);
      
      const prizeIndex = getPrizeIndex(result.prize);
      const sliceAngle = 360 / 12;
      const targetAngle = prizeIndex * sliceAngle + sliceAngle / 2;
      const spins = 5 + Math.random() * 3;
      const baseSpins = Math.floor(rotation / 360) + Math.floor(spins) + 1;
      const finalRotation = baseSpins * 360 + (360 - targetAngle);

      setRotation(finalRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setWonPrize(result.prize);
        setShowResult(true);
        onWin?.(result.prize);
        refetchBalance();
      }, 4000);
    } catch (err: any) {
      setIsSpinning(false);
      setError(err.message || "抽奖失败");
    }
  };

  const handleClose = () => {
    if (!isSpinning) {
      onOpenChange(false);
      setShowResult(false);
      setWonPrize(null);
      setError(null);
      setShowHistory(false);
    }
  };

  const sliceCount = 12;
  const sliceAngle = 360 / sliceCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-transparent">
        <div className="bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 pb-8 min-h-[500px] border border-white/10 rounded-2xl">
          <DialogHeader className="mb-4 relative">
            <DialogTitle className="text-center text-white flex items-center justify-center gap-2 text-lg tracking-wider">
              <Gift className="w-5 h-5 text-purple-400" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200 font-bold">
                {showHistory ? "中奖记录" : "幸运大转盘"}
              </span>
            </DialogTitle>
            <button 
              onClick={() => {
                if (isSpinning) return;
                setShowHistory(!showHistory);
                if (!showHistory) refetchHistory();
              }} 
              className="absolute right-0 top-0 text-white/60 hover:text-white text-[10px] px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all"
            >
              {showHistory ? "返回抽奖" : "记录"}
            </button>
          </DialogHeader>
          
          {showHistory ? (
            <div className="h-[450px] overflow-y-auto px-1 pb-4 custom-scrollbar">
              <div className="space-y-2">
                {history?.map((item: any) => (
                  <div key={item.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm">
                    <div>
                      <div className="font-bold text-purple-200">{item.prizeCode}</div>
                      <div className="text-[10px] text-white/40 mt-1">{formatDateTime(item.createdAt)}</div>
                    </div>
                    {item.rewardCents > 0 ? (
                      <div className="font-bold text-pink-400">+{item.rewardCents / 100}元</div>
                    ) : (
                      <div className="text-xs text-white/30">已发放到账</div>
                    )}
                  </div>
                ))}
                {(!history || history.length === 0) && (
                  <div className="text-center text-white/30 py-20 flex flex-col items-center">
                    <Gift className="w-12 h-12 mb-2 opacity-20" />
                    <p>暂无中奖记录</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="text-center text-purple-200/60 text-xs mb-6 flex items-center justify-center gap-1.5 bg-white/5 py-1.5 rounded-full w-fit mx-auto px-4 border border-white/5">
                 <Clock className="w-3 h-3" />
                 <span>重置倒计时</span>
                 <span className="font-mono text-purple-200">{countdown}</span>
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm w-full max-w-[280px] backdrop-blur-md shadow-inner">
                  <div className="flex items-center justify-center gap-2 font-bold mb-3 text-base">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-white/90">今日剩余次数</span>
                    <span className="text-2xl text-purple-400">{spinsLeft}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-white/60 border-t border-white/5 pt-3">
                     <div className="flex flex-col items-center gap-1">
                        <span className="text-purple-300 font-bold text-xs">{vipSpins}</span>
                        <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-500/80"/>VIP</span>
                     </div>
                     <div className="flex flex-col items-center gap-1 border-x border-white/5">
                        <span className="text-white/90 font-bold text-xs">{baseSpins}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-blue-400/80"/>基础</span>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="text-green-400 font-bold text-xs">{signinSpins}</span>
                        <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3 text-green-500/80"/>签到</span>
                     </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-center py-2 px-4 rounded-lg mb-4 text-xs">
                  {error}
                </div>
              )}

              <div className="relative flex items-center justify-center mb-8 scale-105">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 -mt-2">
                  <div className="w-8 h-10 bg-gradient-to-b from-yellow-300 to-yellow-600 [clip-path:polygon(50%_100%,_0%_0%,_100%_0%)] shadow-lg drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
                </div>

                {/* Outer Ring */}
                <div className="relative w-64 h-64 p-2 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 shadow-[0_0_40px_rgba(139,92,246,0.3)] border-4 border-purple-400/30">
                  {/* Inner Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/20 animate-spin-slow pointer-events-none z-10" style={{ animationDuration: '20s' }}></div>
                  
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-900">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                      }}
                    >
                      {displayPrizes.map((prize, index) => {
                        const startAngle = index * sliceAngle - 90;
                        const endAngle = startAngle + sliceAngle;
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        
                        const x1 = 100 + 100 * Math.cos(startRad);
                        const y1 = 100 + 100 * Math.sin(startRad);
                        const x2 = 100 + 100 * Math.cos(endRad);
                        const y2 = 100 + 100 * Math.sin(endRad);
                        
                        const largeArc = sliceAngle > 180 ? 1 : 0;
                        
                        const midAngle = startAngle + sliceAngle / 2;
                        const midRad = (midAngle * Math.PI) / 180;
                        // Move text slightly closer to center for better fit
                        const textX = 100 + 65 * Math.cos(midRad);
                        const textY = 100 + 65 * Math.sin(midRad);
                        
                        // Split text by \n
                        const lines = prize.name.split('\n');
                        
                        return (
                          <g key={prize.id}>
                            <path
                              d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={prize.color}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="1"
                            />
                            <text
                              x={textX}
                              y={textY}
                              fill="white"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                            >
                              {lines.map((line, i) => (
                                <tspan 
                                  key={i} 
                                  x={textX} 
                                  dy={i === 0 ? (lines.length > 1 ? "-0.4em" : "0") : "1.1em"}
                                >
                                  {line}
                                </tspan>
                              ))}
                            </text>
                          </g>
                        );
                      })}
                      <circle cx="100" cy="100" r="28" fill="url(#centerGradient)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                      <defs>
                        <linearGradient id="centerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#7e22ce" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <button
                    onClick={spin}
                    disabled={isSpinning || spinsLeft <= 0 || !user}
                    className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20",
                      "w-14 h-14 rounded-full",
                      "bg-gradient-to-b from-purple-500 to-indigo-600",
                      "border-2 border-white/30",
                      "shadow-[0_0_15px_rgba(168,85,247,0.5)]",
                      "flex flex-col items-center justify-center",
                      "text-white font-bold tracking-wider",
                      "transition-all duration-200",
                      isSpinning ? "scale-95 brightness-90" : "hover:scale-105 active:scale-95 hover:shadow-[0_0_25px_rgba(168,85,247,0.8)]",
                      (spinsLeft <= 0 || !user) && "opacity-50 cursor-not-allowed grayscale"
                    )}
                    data-testid="button-spin"
                  >
                    <span className="text-xs drop-shadow-md">{isSpinning ? "..." : "GO"}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-4 mx-2 backdrop-blur-sm">
                <h4 className="text-purple-200 text-xs font-semibold mb-3 text-center flex items-center justify-center gap-1.5">
                   <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-purple-500/50"></div>
                   <span>活动规则</span>
                   <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-purple-500/50"></div>
                </h4>
                <ul className="text-white/50 text-[10px] space-y-1.5 leading-relaxed text-center">
                  <li>每日0点自动重置抽奖次数</li>
                  <li>VIP等级越高，每日获赠次数越多</li>
                  <li>抽中现金自动存入余额，支持提现</li>
                  <li>系统自动监控，严禁任何作弊行为</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {showResult && wonPrize && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-6">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-xs text-center animate-in zoom-in-95 duration-300 shadow-2xl">
              <div className="w-20 h-20 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                {wonPrize.includes("祝你") || wonPrize.includes("再来") ? (
                  <Sparkles className="w-10 h-10 text-white" />
                ) : (
                  <Coins className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {wonPrize.includes("祝你") || wonPrize.includes("再来") ? "再接再厉" : "恭喜中奖"}
              </h3>
              <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-8 font-mono">{wonPrize}</p>
              <Button
                onClick={() => setShowResult(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none h-12 text-base shadow-lg shadow-purple-900/20"
                data-testid="button-close-result"
              >
                {spinsLeft > 0 ? "继续抽奖" : "确定"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
