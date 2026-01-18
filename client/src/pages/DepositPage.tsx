import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, QrCode, Upload, CheckCircle, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PaymentQrResponse {
  id?: number;
  name?: string | null;
  url: string | null;
}

export default function DepositPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [amount, setAmount] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: paymentQr, isLoading: qrLoading } = useQuery<PaymentQrResponse>({
    queryKey: ["/api/payment-qr/random"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { amount: string; proofImage: string }) => {
      const res = await apiRequest("POST", "/api/deposit", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({ title: "提交成功", description: "充值申请已提交，请等待审核" });
      setAmount("");
      setProofImage(null);
      setLocation("/mine");
    },
    onError: (error: any) => {
      toast({ title: "提交失败", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "图片大小不能超过5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/proof", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      setProofImage(url);
      toast({ title: "上传成功" });
    } catch (error) {
      toast({ title: "上传失败", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "请输入正确的充值金额", variant: "destructive" });
      return;
    }
    if (!proofImage) {
      toast({ title: "请上传支付截图", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ amount, proofImage });
  };

  const handleCopyAmount = () => {
    if (amount) {
      navigator.clipboard.writeText(amount);
      setCopied(true);
      toast({ title: "金额已复制" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">请先登录</p>
          <Button onClick={() => setLocation("/mine")} data-testid="button-goto-login">去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-4 pt-4 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-10" />
        
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setLocation("/mine")}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">账户充值</h1>
        </div>
        
        <p className="text-white/80 text-sm">
          扫描下方二维码完成支付，上传凭证等待审核
        </p>
      </div>

      <div className="px-4 -mt-2 relative z-20 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-gray-800">支付宝收款码</h3>
          </div>
          
          <div className="flex justify-center mb-4">
            {qrLoading ? (
              <div className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center animate-pulse">
                <QrCode className="w-12 h-12 text-gray-300" />
              </div>
            ) : paymentQr?.url ? (
              <div className="p-3 bg-white border-2 border-teal-200 rounded-xl shadow-md">
                <img 
                  src={paymentQr.url} 
                  alt="支付宝收款码" 
                  className="w-60 h-60 object-contain"
                  data-testid="img-payment-qr"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <AlertCircle className="w-12 h-12 mb-2" />
                <span className="text-sm">收款码未设置</span>
                <span className="text-xs mt-1">请联系客服</span>
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-500 mb-4">
            <p>请使用支付宝扫描上方二维码进行付款</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>充值金额</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入充值金额"
                  className="flex-1"
                  data-testid="input-deposit-amount"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyAmount}
                  disabled={!amount}
                  data-testid="button-copy-amount"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400">请确保转账金额与填写金额一致</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[50, 100, 200, 500].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(val.toString())}
                  className={amount === val.toString() ? "border-teal-500 bg-teal-50 text-teal-600" : ""}
                  data-testid={`button-amount-${val}`}
                >
                  ¥{val}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>上传支付截图</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                {proofImage ? (
                  <div className="relative">
                    <img src={proofImage} alt="支付凭证" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      onClick={() => setProofImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm"
                      data-testid="button-remove-proof"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="py-6">
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 mb-3">点击上传支付截图</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-proof-file"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      data-testid="button-upload-proof"
                    >
                      {uploading ? "上传中..." : "选择图片"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !amount || !proofImage}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
          data-testid="button-submit-deposit"
        >
          {submitMutation.isPending ? "提交中..." : "提交充值申请"}
        </Button>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            温馨提示
          </h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>1. 请确保转账金额与填写金额一致</li>
            <li>2. 转账完成后请上传支付成功截图</li>
            <li>3. 充值审核通常在1-30分钟内完成</li>
            <li>4. 如有问题请联系在线客服</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
