import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download, Smartphone, Apple, Monitor, CheckCircle, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function DownloadPage() {
  const [, setLocation] = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const features = [
    "离线访问，随时使用",
    "原生应用体验",
    "快速启动，无需等待",
    "自动更新，始终最新",
    "节省手机存储空间",
    "安全可靠，数据加密",
  ];

  return (
    <div className="page-container bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => setLocation("/home")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">下载APP</h1>
      </header>

      <main className="px-4 py-6 space-y-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl mb-4">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">云智医服</h2>
          <p className="text-gray-500 mt-2">智能医疗服务平台</p>
        </div>

        {isInstalled ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-green-800 text-lg">已安装</h3>
            <p className="text-green-600 text-sm mt-2">
              您已成功安装云智医服APP，可以在主屏幕找到应用图标
            </p>
          </div>
        ) : (
          <>
            {isIOS && (
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Apple className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">iOS 安装指南</h3>
                    <p className="text-sm text-gray-500">适用于 iPhone / iPad</p>
                  </div>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="text-gray-700">点击浏览器底部的 <Share className="w-4 h-4 inline text-blue-500" /> 分享按钮</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="text-gray-700">向下滑动，点击 <PlusSquare className="w-4 h-4 inline text-blue-500" /> "添加到主屏幕"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">3</span>
                    </div>
                    <div>
                      <p className="text-gray-700">点击右上角的"添加"完成安装</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAndroid && deferredPrompt && (
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Android 安装</h3>
                    <p className="text-sm text-gray-500">一键安装到主屏幕</p>
                  </div>
                </div>
                <Button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg font-bold rounded-xl"
                  data-testid="button-install-android"
                >
                  <Download className="w-5 h-5 mr-2" />
                  立即安装
                </Button>
              </div>
            )}

            {isAndroid && !deferredPrompt && (
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Android 安装</h3>
                    <p className="text-sm text-gray-500">适用于安卓手机</p>
                  </div>
                </div>
                <a
                  href="/downloads/yunzhiyifu-v1.0.apk"
                  download
                  className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 text-lg font-bold rounded-xl text-center mb-4"
                >
                  <Download className="w-5 h-5 inline mr-2" />
                  下载 APK 安装包
                </a>
                <p className="text-xs text-gray-500 text-center mb-4">版本 1.0 | 大小约 5.5MB</p>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">或使用 PWA 方式安装：</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-xs">1</span>
                      </div>
                      <p className="text-gray-700">点击浏览器右上角的菜单按钮</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-xs">2</span>
                      </div>
                      <p className="text-gray-700">选择"添加到主屏幕"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isIOS && !isAndroid && (
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">桌面端安装</h3>
                    <p className="text-sm text-gray-500">适用于电脑浏览器</p>
                  </div>
                </div>
                {deferredPrompt ? (
                  <Button
                    onClick={handleInstall}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg font-bold rounded-xl"
                    data-testid="button-install-desktop"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    安装桌面应用
                  </Button>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">
                    请使用 Chrome、Edge 或其他支持 PWA 的浏览器访问，然后点击地址栏右侧的安装按钮
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">应用特点</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2">什么是 PWA？</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            PWA（渐进式网页应用）是一种新型应用形式，无需从应用商店下载，直接通过浏览器安装即可使用。
            它具有原生应用的体验，同时占用更少的存储空间，并且始终保持最新版本。
          </p>
        </div>
      </main>
    </div>
  );
}
