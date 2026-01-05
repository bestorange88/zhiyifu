import { useState, useEffect } from "react";
import { Gift, Star, Coins, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpinBalance, useSpin } from "@/hooks/use-api";
import { useAuth } from "@/lib/auth";

interface DisplayPrize {
  id: number;
  name: string;
  color: string;
}

const displayPrizes: DisplayPrize[] = [
  { id: 0, name: "38元", color: "#ef4444" },
  { id: 1, name: "18元", color: "#f97316" },
  { id: 2, name: "积分500", color: "#3b82f6" },
  { id: 3, name: "2元", color: "#22c55e" },
  { id: 4, name: "8元", color: "#a855f7" },
  { id: 5, name: "1元", color: "#06b6d4" },
  { id: 6, name: "再来一次", color: "#6b7280" },
  { id: 7, name: "1元", color: "#06b6d4" },
  { id: 8, name: "8元", color: "#a855f7" },
  { id: 9, name: "2元", color: "#22c55e" },
  { id: 10, name: "积分500", color: "#3b82f6" },
  { id: 11, name: "18元", color: "#f97316" },
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
  const spinMutation = useSpin();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      refetchBalance();
    }
  }, [open, refetchBalance]);

  const spinsLeft = spinBalance?.availableSpins || 0;

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
      const finalRotation = rotation + spins * 360 + (360 - targetAngle);

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
    }
  };

  const sliceCount = 12;
  const sliceAngle = 360 / sliceCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-b from-red-500 via-red-600 to-red-700 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
              <Gift className="w-5 h-5" />
              幸运大转盘
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center mb-4">
            <div className="bg-white/20 rounded-full px-4 py-1.5 text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              剩余 {spinsLeft} 次抽奖机会
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 text-white text-center py-2 px-4 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="relative flex items-center justify-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>

            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 p-2 shadow-2xl">
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
                    
                    const x1 = 100 + 95 * Math.cos(startRad);
                    const y1 = 100 + 95 * Math.sin(startRad);
                    const x2 = 100 + 95 * Math.cos(endRad);
                    const y2 = 100 + 95 * Math.sin(endRad);
                    
                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    
                    const midAngle = startAngle + sliceAngle / 2;
                    const midRad = (midAngle * Math.PI) / 180;
                    const textX = 100 + 60 * Math.cos(midRad);
                    const textY = 100 + 60 * Math.sin(midRad);
                    
                    return (
                      <g key={prize.id}>
                        <path
                          d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={prize.color}
                          stroke="#fbbf24"
                          strokeWidth="1"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill="white"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                        >
                          {prize.name}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="100" cy="100" r="30" fill="url(#centerGradient)" stroke="#fbbf24" strokeWidth="3" />
                  <defs>
                    <linearGradient id="centerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <button
                onClick={spin}
                disabled={isSpinning || spinsLeft <= 0 || !user}
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                  "w-16 h-16 rounded-full",
                  "bg-gradient-to-b from-red-500 to-red-700",
                  "border-4 border-yellow-400",
                  "shadow-lg",
                  "flex flex-col items-center justify-center",
                  "text-white font-bold",
                  "transition-transform",
                  isSpinning ? "scale-95" : "hover:scale-105 active:scale-95",
                  (spinsLeft <= 0 || !user) && "opacity-50 cursor-not-allowed"
                )}
                data-testid="button-spin"
              >
                <Star className="w-4 h-4 mb-0.5" />
                <span className="text-xs">{isSpinning ? "抽奖中" : "抽奖"}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2 text-center text-white/90 text-xs">
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
              38元
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-orange-400 mx-auto mb-1" />
              18元
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 mx-auto mb-1" />
              8元
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1" />
              积分
            </div>
          </div>

          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <h4 className="text-white text-xs font-semibold mb-2 text-center">活动规则</h4>
            <ul className="text-white/80 text-xs space-y-1">
              <li>1. 每日签到可获得抽奖机会</li>
              <li>2. 现金奖励将自动发放至账户余额</li>
              <li>3. 积分奖励可用于兑换会员服务</li>
              <li>4. 每次抽奖消耗1次抽奖机会</li>
              <li>5. 本活动最终解释权归平台所有</li>
            </ul>
          </div>
        </div>

        {showResult && wonPrize && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
            <div className="bg-white rounded-2xl p-6 m-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                {wonPrize.includes("祝你") || wonPrize.includes("再来") ? (
                  <Sparkles className="w-8 h-8 text-white" />
                ) : (
                  <Coins className="w-8 h-8 text-white" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {wonPrize.includes("祝你") || wonPrize.includes("再来") ? "再接再厉" : "恭喜中奖"}
              </h3>
              <p className="text-2xl font-bold text-red-500 mb-4">{wonPrize}</p>
              <Button
                onClick={() => setShowResult(false)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600"
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
