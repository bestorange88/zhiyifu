import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Coins } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PointsHistoryPage() {
  const [, setLocation] = useLocation();
  const { data: history, isLoading, error } = useQuery({
    queryKey: ["/api/wallet/history", "points"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/history?currency=points");
      if (res.status === 401) {
        // 未登录，跳转到登录页
        setLocation("/");
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    retry: false
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/mine")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">积分记录</h1>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : history?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-3">
            <Coins className="h-12 w-12 text-gray-300" />
            <p>暂无积分记录</p>
          </div>
        ) : (
          history?.map((item: any) => (
            <Card key={item.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}
                </p>
              </div>
              <div className={`font-bold text-lg ${item.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                {item.amount > 0 ? "+" : ""}{item.amount}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
