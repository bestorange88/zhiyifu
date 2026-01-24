import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Crown, Wallet, ChevronRight, Phone, Calendar, Search, Network } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Member {
  id: number;
  phone: string;
  realName: string | null;
  vipLevel: number;
  createdAt: string;
  balance: string;
  totalDeposit: string;
  totalWithdraw: string;
  level: number;
  inviterId: number | null;
}

// Tree Node Component for recursion
const TreeNode = ({ member, allMembers, depth = 0 }: { member: Member, allMembers: Member[], depth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Find direct children of this member
  const children = useMemo(() => {
    return allMembers.filter(m => m.inviterId === member.id);
  }, [member.id, allMembers]);

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${depth > 0 ? 'ml-6' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {children.length > 0 && (
          <div className="w-4 h-4 flex items-center justify-center">
             <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        )}
        {children.length === 0 && <div className="w-4" />} {/* Spacer */}
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
          member.vipLevel > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          {member.level}级
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-700 truncate">
              {member.realName || `用户${member.phone.slice(-4)}`}
            </span>
            {member.vipLevel > 0 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-50 text-amber-600 border-amber-200">
                V{member.vipLevel}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-gray-400">ID: {member.id}</p>
        </div>
      </div>
      
      {isExpanded && children.length > 0 && (
        <div className="relative">
          {/* Vertical line connecting children */}
          <div className={`absolute left-[19px] top-0 bottom-2 w-px bg-gray-200 ${depth > 0 ? 'ml-6' : ''}`} />
          {children.map(child => (
            <TreeNode key={child.id} member={child} allMembers={allMembers} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TeamPage() {
  const [, setLocation] = useLocation();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/referral/team-stats"],
  });

  // Reconstruct the tree roots (Level 1 members)
  const treeRoots = useMemo(() => {
    if (!stats?.members) return [];
    // Level 1 members are the roots of our view
    return (stats.members as Member[]).filter(m => m.level === 1);
  }, [stats?.members]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-4 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-10" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={() => setLocation("/mine")}
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
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/50 backdrop-blur p-1 rounded-xl">
            <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">成员列表</TabsTrigger>
            <TabsTrigger value="tree" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">层级关系图</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
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
                    {(stats.members as Member[]).map((member) => (
                      <div 
                        key={member.id} 
                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                        onClick={() => setSelectedMember(member)}
                      >
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
                              {new Date(member.createdAt).toLocaleDateString()} 加入 · {member.level}级成员
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tree">
            <Card className="shadow-md border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-500" />
                  会员层级关系
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">加载中...</div>
                ) : !treeRoots.length ? (
                  <div className="text-center py-8 text-gray-400">
                    <Network className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>暂无层级数据</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {treeRoots.map(root => (
                      <TreeNode key={root.id} member={root} allMembers={stats.members} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">成员详情</DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-2xl mx-auto mb-3 border-4 border-white shadow-sm">
                  {selectedMember.realName ? selectedMember.realName[0] : selectedMember.phone.slice(-2)}
                </div>
                <h3 className="font-bold text-lg text-gray-800">
                  {selectedMember.realName || `用户${selectedMember.phone.slice(-4)}`}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                    ID: {selectedMember.id}
                  </Badge>
                  <Badge variant="secondary" className={selectedMember.vipLevel > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}>
                    {selectedMember.vipLevel > 0 ? `VIP ${selectedMember.vipLevel}` : '普通会员'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">累计充值</p>
                  <p className="font-bold text-gray-800">¥{parseFloat(selectedMember.totalDeposit).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">累计提现</p>
                  <p className="font-bold text-gray-800">¥{parseFloat(selectedMember.totalWithdraw).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-600">手机号码</span>
                  </div>
                  <span className="font-medium text-gray-800">{selectedMember.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-sm text-gray-600">账户余额</span>
                  </div>
                  <span className="font-medium text-gray-800">¥{parseFloat(selectedMember.balance).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-sm text-gray-600">加入时间</span>
                  </div>
                  <span className="font-medium text-gray-800">{new Date(selectedMember.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
