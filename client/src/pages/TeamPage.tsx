import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, CreditCard, Coins, Crown, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TeamPage() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/referral/team-stats"],
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-4 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-10" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={() => setLocation("/home")}
            className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">我的团队</h1>
        </div>

        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium">团队总人数</span>
          </div>
          <div className="text-4xl font-bold mb-4">{stats?.memberCount || 0}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs text-white/80 mb-1">团队总充值</div>
              <div className="text-lg font-bold">¥{stats?.totalDeposit || "0.00"}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs text-white/80 mb-1">团队总提现</div>
              <div className="text-lg font-bold">¥{stats?.totalWithdraw || "0.00"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20 space-y-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 divide-x">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  VIP佣金总额
                </div>
                <div className="text-xl font-bold text-amber-500">¥{stats?.totalVipCommission || "0.00"}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3 text-green-500" />
                  其他返佣总额
                </div>
                <div className="text-xl font-bold text-green-500">¥{stats?.totalOtherCommission || "0.00"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              团队成员列表
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">加载中...</div>
            ) : !stats?.members?.length ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>暂无团队成员</p>
                <p className="text-xs mt-1">快去邀请好友加入吧</p>
              </div>
            ) : (
              <div className="divide-y">
                {stats.members.map((member: any) => (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                        {member.realName ? member.realName[0] : member.phone.slice(-2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {member.realName || `用户${member.phone.slice(-4)}`}
                          </span>
                          <Badge variant="outline" className={`text-[10px] h-5 px-1 ${
                            member.vipLevel > 0 
                              ? "bg-amber-50 text-amber-600 border-amber-200" 
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}>
                            V{member.vipLevel}
                          </Badge>
                          <span className="text-[10px] text-gray-400">ID:{member.id}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(member.createdAt).toLocaleDateString()} 加入
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-sm font-medium text-gray-700">
                        <Wallet className="w-3 h-3 text-gray-400" />
                        ¥{parseFloat(member.balance).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        充:¥{parseFloat(member.totalDeposit).toFixed(0)} / 提:¥{parseFloat(member.totalWithdraw).toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
