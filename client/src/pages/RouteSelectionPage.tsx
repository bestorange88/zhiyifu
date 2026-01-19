import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Wifi, Globe, Zap, Shield, CheckCircle2, Loader2 } from "lucide-react";

interface RouteNode {
  id: number;
  name: string;
  location: string;
  latency: number;
  status: "testing" | "completed" | "selected" | "waiting";
}

const ROUTE_NODES: Omit<RouteNode, "status">[] = [
  { id: 1, name: "CN-BJ-01", location: "北京", latency: 0 },
  { id: 2, name: "CN-SH-02", location: "上海", latency: 0 },
  { id: 3, name: "CN-GZ-03", location: "广州", latency: 0 },
  { id: 4, name: "CN-SZ-04", location: "深圳", latency: 0 },
  { id: 5, name: "CN-HK-05", location: "香港", latency: 0 },
];

export default function RouteSelectionPage() {
  const [, setLocation] = useLocation();
  const [nodes, setNodes] = useState<RouteNode[]>(
    ROUTE_NODES.map(n => ({ ...n, status: "waiting" as const }))
  );
  const [currentPhase, setCurrentPhase] = useState<"init" | "testing" | "selecting" | "done">("init");
  const [progress, setProgress] = useState(0);
  const [selectedNode, setSelectedNode] = useState<RouteNode | null>(null);

  useEffect(() => {
    const runTest = async () => {
      await new Promise(r => setTimeout(r, 500));
      setCurrentPhase("testing");

      for (let i = 0; i < nodes.length; i++) {
        setNodes(prev => prev.map((n, idx) => 
          idx === i ? { ...n, status: "testing" } : n
        ));
        
        await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
        
        const latency = Math.floor(15 + Math.random() * 45);
        setNodes(prev => prev.map((n, idx) => 
          idx === i ? { ...n, status: "completed", latency } : n
        ));
        setProgress(((i + 1) / nodes.length) * 100);
      }

      await new Promise(r => setTimeout(r, 400));
      setCurrentPhase("selecting");

      setNodes(prev => {
        const sorted = [...prev].sort((a, b) => a.latency - b.latency);
        const bestId = sorted[0].id;
        return prev.map(n => ({
          ...n,
          status: n.id === bestId ? "selected" : "completed"
        }));
      });

      await new Promise(r => setTimeout(r, 300));
      setNodes(prev => {
        const best = prev.find(n => n.status === "selected");
        if (best) setSelectedNode(best);
        return prev;
      });

      await new Promise(r => setTimeout(r, 800));
      setCurrentPhase("done");

      await new Promise(r => setTimeout(r, 600));
      setLocation("/home");
    };

    runTest();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-teal-500/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-cyan-500/10 rounded-full" />
        
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <Globe className="w-12 h-12 text-teal-400" />
            <div className="absolute inset-0 animate-ping">
              <Globe className="w-12 h-12 text-teal-400/30" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            云智医服
          </h1>
        </div>
        <p className="text-blue-200/80 text-sm">智能网络优化系统</p>
      </div>

      <div className="relative z-10 w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Wifi className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">线路检测</h2>
            <p className="text-xs text-blue-300/60">正在为您选择最佳连接节点</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                node.status === "selected"
                  ? "bg-teal-500/20 border-teal-500/50"
                  : node.status === "testing"
                  ? "bg-blue-500/10 border-blue-500/30"
                  : node.status === "completed"
                  ? "bg-slate-700/30 border-slate-600/30"
                  : "bg-slate-800/30 border-slate-700/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  node.status === "selected" ? "bg-teal-400 animate-pulse" :
                  node.status === "testing" ? "bg-blue-400 animate-ping" :
                  node.status === "completed" ? "bg-green-400" :
                  "bg-slate-500"
                }`} />
                <div>
                  <p className={`font-mono text-sm ${
                    node.status === "selected" ? "text-teal-300" : "text-slate-300"
                  }`}>
                    {node.name}
                  </p>
                  <p className="text-xs text-slate-500">{node.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {node.status === "testing" && (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                )}
                {node.status === "completed" && (
                  <span className="text-sm text-slate-400 font-mono">{node.latency}ms</span>
                )}
                {node.status === "selected" && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-teal-400 font-mono">{node.latency}ms</span>
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  </div>
                )}
                {node.status === "waiting" && (
                  <span className="text-xs text-slate-600">等待中</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            {currentPhase === "init" && (
              <>
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-blue-300">初始化网络...</span>
              </>
            )}
            {currentPhase === "testing" && (
              <>
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-blue-300">正在测试节点延迟...</span>
              </>
            )}
            {currentPhase === "selecting" && (
              <>
                <Shield className="w-4 h-4 text-teal-400" />
                <span className="text-teal-300">正在选择最优线路...</span>
              </>
            )}
            {currentPhase === "done" && selectedNode && (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-300">
                  已连接 {selectedNode.location} 节点 ({selectedNode.latency}ms)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8 flex items-center gap-6 text-xs text-blue-300/40">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span>安全加密</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>智能优化</span>
        </div>
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>全球节点</span>
        </div>
      </div>
    </div>
  );
}
