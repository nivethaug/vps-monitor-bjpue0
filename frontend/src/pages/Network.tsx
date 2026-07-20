import { useEffect, useMemo, useState } from "react";
import {
  Network as NetworkIcon,
  ArrowUp,
  ArrowDown,
  Gauge,
  Activity,
  Server as ServerIcon,
  Download,
  RefreshCw,
  Wifi,
  Cable,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

type ServerTraffic = {
  id: string;
  name: string;
  region: string;
  interface_: string;
  upMbps: number;
  downMbps: number;
  upPeak: number;
  downPeak: number;
  upTotalGb: number;
  downTotalGb: number;
  status: "online" | "degraded" | "offline";
  color: string;
};

const SERVERS: ServerTraffic[] = [
  { id: "web-prod-01", name: "web-prod-01", region: "us-east-1", interface_: "eth0", upMbps: 124, downMbps: 348, upPeak: 512, downPeak: 940, upTotalGb: 184.2, downTotalGb: 612.7, status: "online", color: "#3b82f6" },
  { id: "web-prod-02", name: "web-prod-02", region: "us-east-1", interface_: "eth0", upMbps: 98, downMbps: 284, upPeak: 480, downPeak: 880, upTotalGb: 142.8, downTotalGb: 498.3, status: "online", color: "#a855f7" },
  { id: "db-primary", name: "db-primary", region: "us-west-2", interface_: "eno1", upMbps: 56, downMbps: 412, upPeak: 220, downPeak: 980, upTotalGb: 88.4, downTotalGb: 724.1, status: "online", color: "#10b981" },
  { id: "cache-redis", name: "cache-redis", region: "us-west-2", interface_: "eno1", upMbps: 234, downMbps: 89, upPeak: 720, downPeak: 340, upTotalGb: 312.5, downTotalGb: 142.9, status: "online", color: "#f59e0b" },
  { id: "queue-worker", name: "queue-worker", region: "eu-central-1", interface_: "eth0", upMbps: 42, downMbps: 156, upPeak: 180, downPeak: 520, upTotalGb: 58.1, downTotalGb: 234.6, status: "degraded", color: "#ec4899" },
  { id: "edge-cdn-01", name: "edge-cdn-01", region: "eu-west-1", interface_: "eth0", upMbps: 612, downMbps: 48, upPeak: 1240, downPeak: 220, upTotalGb: 894.3, downTotalGb: 76.2, status: "online", color: "#06b6d4" },
];

const WINDOWS = ["Last 15 min", "Last 1 hour", "Last 6 hours", "Last 24 hours", "Last 7 days"];

// Seeded pseudo-random series generator
const SAMPLE = (points: number, base: number, amp: number, seed: number, jitter = 0.25) =>
  Array.from({ length: points }, (_, i) => {
    const wave = Math.sin(i / 2.3 + seed) * amp + Math.cos(i / 4.1 + seed * 1.7) * (amp * 0.6);
    const noise = (Math.sin(i * 7.3 + seed * 3.1) * jitter * amp);
    return Math.max(0, base + wave + noise);
  });

const fmtMbps = (v: number) => `${v.toFixed(0)} Mb/s`;
const fmtGb = (v: number) => (v >= 1024 ? `${(v / 1024).toFixed(2)} TB` : `${v.toFixed(1)} GB`);

const STATUS_STYLE: Record<ServerTraffic["status"], { label: string; cls: string }> = {
  online: { label: "Online", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20" },
  degraded: { label: "Degraded", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20" },
  offline: { label: "Offline", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/20" },
};

export default function Network() {
  const [host, setHost] = useState("All servers");
  const [window_, setWindow] = useState(WINDOWS[1]);
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState(SERVERS[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 3500);
    return () => clearInterval(i);
  }, []);

  const POINTS = 60;

  // Aggregate series across all servers
  const aggregate = useMemo(() => {
    const up = SAMPLE(POINTS, 0, 0, tick);
    const down = SAMPLE(POINTS, 0, 0, tick + 99);
    SERVERS.forEach((s, idx) => {
      const su = SAMPLE(POINTS, s.upMbps, s.upMbps * 0.4, tick + idx, 0.2);
      const sd = SAMPLE(POINTS, s.downMbps, s.downMbps * 0.4, tick + idx + 50, 0.2);
      su.forEach((v, i) => (up[i] += v));
      sd.forEach((v, i) => (down[i] += v));
    });
    return { up, down };
  }, [tick]);

  const totalUpNow = aggregate.up[aggregate.up.length - 1];
  const totalDownNow = aggregate.down[aggregate.down.length - 1];
  const peakUp = Math.max(...aggregate.up);
  const peakDown = Math.max(...aggregate.down);
  const avgUp = aggregate.up.reduce((a, b) => a + b, 0) / aggregate.up.length;
  const avgDown = aggregate.down.reduce((a, b) => a + b, 0) / aggregate.down.length;
  const totalTransferredGb = SERVERS.reduce((a, s) => a + s.upTotalGb + s.downTotalGb, 0);

  const selectedServer = SERVERS.find((s) => s.id === selected)!;
  const selUp = useMemo(() => SAMPLE(POINTS, selectedServer.upMbps, selectedServer.upMbps * 0.45, tick + SERVERS.indexOf(selectedServer), 0.3), [tick, selected]);
  const selDown = useMemo(() => SAMPLE(POINTS, selectedServer.downMbps, selectedServer.downMbps * 0.45, tick + SERVERS.indexOf(selectedServer) + 50, 0.3), [tick, selected]);

  const KPIS = [
    { id: "upload", label: "Upload (now)", icon: ArrowUp, value: fmtMbps(totalUpNow), sub: `peak ${fmtMbps(peakUp)}`, color: "#3b82f6", series: aggregate.up },
    { id: "download", label: "Download (now)", icon: ArrowDown, value: fmtMbps(totalDownNow), sub: `peak ${fmtMbps(peakDown)}`, color: "#a855f7", series: aggregate.down },
    { id: "avg", label: "Avg Throughput", icon: Activity, value: fmtMbps(avgUp + avgDown), sub: "up + down combined", color: "#10b981", series: aggregate.up.map((u, i) => u + aggregate.down[i]) },
    { id: "transferred", label: "Transferred (24h)", icon: Download, value: fmtGb(totalTransferredGb), sub: `${SERVERS.length} servers`, color: "#f59e0b", series: SAMPLE(POINTS, 0, 0, 0) },
  ];

  return (
    <main data-testid="network-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6" aria-live="polite">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <NetworkIcon aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Bandwidth monitoring</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Network Traffic
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload and download throughput per server, updated in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={host} onValueChange={setHost}>
              <SelectTrigger className="w-[180px]" aria-label="Filter servers" data-testid="network-host-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All servers">All servers</SelectItem>
                {SERVERS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={window_} onValueChange={setWindow}>
              <SelectTrigger className="w-[170px]" aria-label="Select time window" data-testid="network-window-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOWS.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" aria-label="Refresh network data" data-testid="network-refresh-button" className="gap-2" onClick={() => setTick((t) => t + 1)}>
              <RefreshCw aria-hidden="true" className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </header>

        {/* KPI summary */}
        <section data-testid="network-kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.id} data-testid={`network-kpi-${k.id}`} className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase tracking-wider">{k.label}</CardDescription>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${k.color}1f` }}>
                      <Icon aria-hidden="true" className="w-4 h-4" style={{ color: k.color }} />
                    </div>
                  </div>
                  <div className="flex items-end gap-1 mt-1">
                    {loading ? (
                      <span className="inline-block w-20 h-7 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ) : (
                      <CardTitle className="text-2xl font-bold tabular-nums">{k.value}</CardTitle>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {k.id !== "transferred" ? (
                    <MiniSpark data={k.series} color={k.color} />
                  ) : (
                    <div className="h-9 flex items-center">
                      <div className="flex items-end gap-1 h-full w-full">
                        {SAMPLE(18, 40, 30, 4).map((v, i) => (
                          <div key={i} className="flex-1 rounded-sm" style={{ height: `${v}%`, backgroundColor: k.color, opacity: 0.35 + (i / 18) * 0.65 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-slate-400">{k.sub}</div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Aggregate bandwidth chart */}
        <Card data-testid="network-aggregate-chart" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gauge aria-hidden="true" className="w-5 h-5 text-blue-500" />
                  Aggregate Bandwidth
                </CardTitle>
                <CardDescription>Total upload / download across all servers · {window_.toLowerCase()}</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden="true" />
                  <span className="text-slate-600 dark:text-slate-300">Upload</span>
                  <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">{fmtMbps(totalUpNow)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" aria-hidden="true" />
                  <span className="text-slate-600 dark:text-slate-300">Download</span>
                  <span className="font-semibold tabular-nums text-purple-600 dark:text-purple-400">{fmtMbps(totalDownNow)}</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DualLineArea up={aggregate.up} down={aggregate.down} upColor="#3b82f6" downColor="#a855f7" />
          </CardContent>
        </Card>

        {/* Per-server breakdown */}
        <Card data-testid="network-per-server" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ServerIcon aria-hidden="true" className="w-5 h-5 text-emerald-500" />
                  Per-Server Throughput
                </CardTitle>
                <CardDescription>Click a server to view detailed bandwidth</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <Wifi aria-hidden="true" className="w-3 h-3" />
                {SERVERS.filter((s) => s.status === "online").length}/{SERVERS.length} healthy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="grid">
              <TabsList className="mb-4" data-testid="network-tabs">
                <TabsTrigger value="grid" data-testid="network-tab-grid">Cards</TabsTrigger>
                <TabsTrigger value="table" data-testid="network-tab-table">Table</TabsTrigger>
              </TabsList>
              <TabsContent value="grid">
                <div data-testid="network-server-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {SERVERS.map((s, idx) => {
                    const upS = SAMPLE(28, s.upMbps, s.upMbps * 0.4, tick + idx, 0.25);
                    const downS = SAMPLE(28, s.downMbps, s.downMbps * 0.4, tick + idx + 50, 0.25);
                    const st = STATUS_STYLE[s.status];
                    const isSelected = s.id === selected;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        data-testid={`network-server-card-${s.id}`}
                        onClick={() => setSelected(s.id)}
                        className={`text-left rounded-xl border p-4 transition-all duration-200 bg-white dark:bg-slate-900/60 hover:shadow-lg hover:scale-[1.01] ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/30"
                            : "border-slate-200/70 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{s.name}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${st.cls}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                          <span className="inline-flex items-center gap-1">
                            <Cable aria-hidden="true" className="w-3 h-3" />
                            {s.interface_}
                          </span>
                          <span>{s.region}</span>
                        </div>
                        <DualSpark up={upS} down={downS} upColor={s.color} downColor="#94a3b8" height={48} />
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <ArrowUp aria-hidden="true" className="w-3 h-3" style={{ color: s.color }} />
                            <span className="text-slate-400">Up</span>
                            <span className="font-semibold tabular-nums ml-auto" style={{ color: s.color }}>{s.upMbps} Mb/s</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ArrowDown aria-hidden="true" className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-400">Down</span>
                            <span className="font-semibold tabular-nums ml-auto text-slate-600 dark:text-slate-300">{s.downMbps} Mb/s</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="table">
                <div data-testid="network-server-table" className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Server</th>
                        <th className="text-left px-4 py-3 font-medium">Interface</th>
                        <th className="text-right px-4 py-3 font-medium">Upload</th>
                        <th className="text-right px-4 py-3 font-medium">Download</th>
                        <th className="text-right px-4 py-3 font-medium">Peak Up</th>
                        <th className="text-right px-4 py-3 font-medium">Peak Down</th>
                        <th className="text-right px-4 py-3 font-medium">Sent</th>
                        <th className="text-right px-4 py-3 font-medium">Received</th>
                        <th className="text-center px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {SERVERS.map((s) => {
                        const st = STATUS_STYLE[s.status];
                        return (
                          <tr key={s.id} data-testid={`network-server-row-${s.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => setSelected(s.id)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                                <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                                <span className="text-xs text-slate-400">{s.region}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.interface_}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: s.color }}>{s.upMbps} Mb/s</td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700 dark:text-slate-200">{s.downMbps} Mb/s</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-500">{s.upPeak} Mb/s</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-500">{s.downPeak} Mb/s</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{fmtGb(s.upTotalGb)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{fmtGb(s.downTotalGb)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${st.cls}`}>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Selected server detail */}
        <Card data-testid="network-detail" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedServer.color }} aria-hidden="true" />
                  {selectedServer.name}
                  <span className="text-xs font-normal text-slate-400 font-mono">· {selectedServer.interface_} · {selectedServer.region}</span>
                </CardTitle>
                <CardDescription>Detailed upload / download bandwidth over {window_.toLowerCase()}</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowUp aria-hidden="true" className="w-3.5 h-3.5" style={{ color: selectedServer.color }} />
                  <span className="text-slate-600 dark:text-slate-300">Up</span>
                  <span className="font-semibold tabular-nums" style={{ color: selectedServer.color }}>{fmtMbps(selectedServer.upMbps)}</span>
                  <span className="text-slate-400">/ peak {selectedServer.upPeak}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ArrowDown aria-hidden="true" className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">Down</span>
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{fmtMbps(selectedServer.downMbps)}</span>
                  <span className="text-slate-400">/ peak {selectedServer.downPeak}</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DualLineArea up={selUp} down={selDown} upColor={selectedServer.color} downColor="#94a3b8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <DetailStat label="Avg upload" value={fmtMbps(selUp.reduce((a, b) => a + b, 0) / selUp.length)} color={selectedServer.color} />
              <DetailStat label="Avg download" value={fmtMbps(selDown.reduce((a, b) => a + b, 0) / selDown.length)} color="#64748b" />
              <DetailStat label="Data sent" value={fmtGb(selectedServer.upTotalGb)} color={selectedServer.color} />
              <DetailStat label="Data received" value={fmtGb(selectedServer.downTotalGb)} color="#64748b" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function DetailStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 140;
  const H = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
  const id = `ms-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-9" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DualSpark({ up, down, upColor, downColor, height = 40 }: { up: number[]; down: number[]; upColor: string; downColor: string; height?: number }) {
  const W = 240;
  const H = height;
  const max = Math.max(...up, ...down, 1);
  const mkPts = (vals: number[]) =>
    vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - (v / max) * (H - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={mkPts(down)} fill="none" stroke={downColor} strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={mkPts(up)} fill="none" stroke={upColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DualLineArea({ up, down, upColor, downColor }: { up: number[]; down: number[]; upColor: string; downColor: string }) {
  const W = 900;
  const H = 300;
  const pad = 32;
  const n = Math.max(up.length, down.length);
  const xStep = (W - pad * 2) / (n - 1);
  const maxY = Math.max(...up, ...down) * 1.15 || 1;

  const buildArea = (vals: number[], color: string, idx: string) => {
    const pts = vals.map((v, i) => ({ x: pad + i * xStep, y: H - pad - (v / maxY) * (H - pad * 2) }));
    const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const area = `M ${pts[0].x} ${H - pad} ${pts.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${pts[pts.length - 1].x} ${H - pad} Z`;
    return (
      <g key={idx}>
        <defs>
          <linearGradient id={`da-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#da-${idx})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };

  const yTicks = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[300px]" role="img" aria-label="Bandwidth chart showing upload and download over time">
      {[...Array(yTicks + 1)].map((_, i) => {
        const p = i / yTicks;
        const y = pad + p * (H - pad * 2);
        const val = maxY * (1 - p);
        return (
          <g key={i}>
            <line x1={pad} x2={W - pad} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" />
            <text x={pad - 6} y={y + 3} textAnchor="end" className="fill-slate-400" style={{ fontSize: 10 }}>
              {val >= 1000 ? `${(val / 1000).toFixed(1)}G` : `${val.toFixed(0)}`}
            </text>
          </g>
        );
      })}
      {buildArea(down, downColor, "down")}
      {buildArea(up, upColor, "up")}
      <text x={pad} y={H - pad + 18} className="fill-slate-400" style={{ fontSize: 10 }}>-now</text>
      <text x={W - pad} y={H - pad + 18} textAnchor="end" className="fill-slate-400" style={{ fontSize: 10 }}>live</text>
    </svg>
  );
}
