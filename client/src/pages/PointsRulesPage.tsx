import { ArrowLeft, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PointsRulesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/mine")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">积分说明</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">如何获得积分？</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>每日签到：连续签到可获得更多积分奖励。</li>
                  <li>邀请好友：每邀请一位好友注册，可获得积分奖励。</li>
                  <li>参与活动：不定期举办的运营活动。</li>
                  <li>VIP特权：升级VIP会员可获得每日免费抽奖次数（等同于积分消耗）。</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">积分有什么用？</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>大转盘抽奖：消耗积分参与抽奖，有机会赢取现金红包。</li>
                  <li>兑换商品：在积分商城兑换虚拟或实物商品（即将开放）。</li>
                  <li>抵扣现金：在特定场景下可抵扣部分支付金额。</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
