import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RightsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/help")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">权利及奖励说明</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600 leading-relaxed space-y-4">
            <h3 className="font-bold text-gray-900 text-base">VIP会员权益</h3>
            <p>
              1. **每日抽奖**：不同等级VIP享有每日免费抽奖次数。
              <br/>2. **更高收益**：升级VIP可获得更高的推广佣金比例。
              <br/>3. **专属客服**：高等级VIP享有1对1专属客服服务。
            </p>

            <h3 className="font-bold text-gray-900 text-base mt-4">推广奖励</h3>
            <p>
              1. **直推奖励**：直接邀请好友注册并升级，可获得高额现金奖励。
              <br/>2. **团队奖励**：团队成员升级或消费，您也能获得相应比例的分红。
              <br/>3. **活动奖励**：参与平台不定期举办的推广活动，赢取额外奖金。
            </p>

            <h3 className="font-bold text-gray-900 text-base mt-4">资金安全</h3>
            <p>
              平台承诺保障用户资金安全，提现申请将在24小时内处理。如遇问题，请联系在线客服。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
