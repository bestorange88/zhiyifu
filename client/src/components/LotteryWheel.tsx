import { useState, useRef } from "react";
import { Gift, Star, Coins, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Prize {
  id: number;
  name: string;
  probability: number;
  color: string;
  textColor: string;
}

const prizes: Prize[] = [
  { id: 0, name: "38元", probability: 1, color: "bg-red-500", textColor: "text-white" },
  { id: 1, name: "18元", probability: 1, color: "bg-orange-400", textColor: "text-white" },
  { id: 2, name: "AI积分500", probability: 30, color: "bg-blue-500", textColor: "text-white" },
  { id: 3, name: "2元", probability: 33, color: "bg-green-500", textColor: "text-white" },
  { id: 4, name: "8元", probability: 3, color: "bg-purple-500", textColor: "text-white" },
  { id: 5, name: "1元", probability: 22, color: "bg-cyan-500", textColor: "text-white" },
  { id: 6, name: "祝你下次好运", probability: 10, color: "bg-gray-400", textColor: "text-white" },
  { id: 7, name: "1元", probability: 22, color: "bg-cyan-500", textColor: "text-white" },
  { id: 8, name: "8元", probability: 3, color: "bg-purple-500", textColor: "text-white" },
  { id: 9, name: "2元", probability: 33, color: "bg-green-500", textColor: "text-white" },
  { id: 10, name: "AI积分500", probability: 30, color: "bg-blue-500", textColor: "text-white" },
  { id: 11, name: "18元", probability: 1, color: "bg-orange-400", textColor: "text-white" },
];

const weightedPrizes = [
  { index: 0, weight: 1 },
  { index: 1, weight: 1 },
  { index: 2, weight: 30 },
  { index: 3, weight: 33 },
  { index: 4, weight: 3 },
  { index: 5, weight: 22 },
  { index: 6, weight: 10 },
];

function getRandomPrizeIndex(): number {
  const totalWeight = weightedPrizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const prize of weightedPrizes) {
    random -= prize.weight;
    if (random <= 0) {
      if (prize.index === 1) return Math.random() > 0.5 ? 1 : 11;
      if (prize.index === 2) return Math.random() > 0.5 ? 2 : 10;
      if (prize.index === 3) return Math.random() > 0.5 ? 3 : 9;
      if (prize.index === 4) return Math.random() > 0.5 ? 4 : 8;
      if (prize.index === 5) return Math.random() > 0.5 ? 5 : 7;
      return prize.index;
    }
  }
  return 6;
}

interface LotteryWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: (prize: string) => void;
}

export default function LotteryWheel({ open, onOpenChange, onWin }: LotteryWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setShowResult(false);
    setSpinsLeft((prev) => prev - 1);

    const prizeIndex = getRandomPrizeIndex();
    const prize = prizes[prizeIndex];

    const sliceAngle = 360 / 12;
    const targetAngle = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + spins * 360 + targetAngle - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize.name);
      setShowResult(true);
      onWin?.(prize.name);
    }, 4000);
  };

  const handleClose = () => {
    if (!isSpinning) {
      onOpenChange(false);
      setShowResult(false);
      setWonPrize(null);
    }
  };

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
              今日剩余 {spinsLeft} 次抽奖机会
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>

            <div className="relative w-72 h-72">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 p-2 shadow-2xl">
                <div
                  ref={wheelRef}
                  className="w-full h-full rounded-full overflow-hidden relative"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                  }}
                >
                  {prizes.map((prize, index) => {
                    const angle = (360 / 12) * index;
                    const skewAngle = 90 - 360 / 12;
                    return (
                      <div
                        key={prize.id}
                        className={cn(
                          "absolute w-1/2 h-1/2 origin-bottom-right",
                          prize.color
                        )}
                        style={{
                          transform: `rotate(${angle}deg) skewY(-${skewAngle}deg)`,
                          left: 0,
                          top: 0,
                        }}
                      >
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            transform: `skewY(${skewAngle}deg) rotate(${360 / 24}deg)`,
                          }}
                        >
                          <span
                            className={cn(
                              "text-[10px] font-bold text-center leading-tight px-1 whitespace-nowrap",
                              prize.textColor
                            )}
                            style={{
                              transform: "translateY(-30px) rotate(-5deg)",
                              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            }}
                          >
                            {prize.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={spin}
                disabled={isSpinning || spinsLeft <= 0}
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                  "w-20 h-20 rounded-full",
                  "bg-gradient-to-b from-red-500 to-red-700",
                  "border-4 border-yellow-400",
                  "shadow-lg",
                  "flex flex-col items-center justify-center",
                  "text-white font-bold",
                  "transition-transform",
                  isSpinning ? "scale-95" : "hover:scale-105 active:scale-95",
                  spinsLeft <= 0 && "opacity-50 cursor-not-allowed"
                )}
                data-testid="button-spin"
              >
                <Star className="w-5 h-5 mb-0.5" />
                <span className="text-sm">{isSpinning ? "抽奖中" : "抽奖"}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2 text-center text-white/80 text-[10px]">
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-1" />
              38元
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-4 h-4 rounded-full bg-orange-400 mx-auto mb-1" />
              18元
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-4 h-4 rounded-full bg-purple-500 mx-auto mb-1" />
              8元
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 mx-auto mb-1" />
              积分
            </div>
          </div>
        </div>

        {showResult && wonPrize && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
            <div className="bg-white rounded-2xl p-6 m-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                {wonPrize === "祝你下次好运" ? (
                  <Sparkles className="w-8 h-8 text-white" />
                ) : (
                  <Coins className="w-8 h-8 text-white" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {wonPrize === "祝你下次好运" ? "再接再厉" : "恭喜中奖"}
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
