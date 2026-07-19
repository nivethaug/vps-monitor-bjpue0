import { useEffect, useMemo, useState } from "react";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Activity,
  Clock,
  ChevronDown,
  Download,
  Gauge,
  Thermometer,
  Zap,
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
import { Progress } from "@/components/ui/progress";

type Series = { name: string; values: number[]; color: string };

const HOSTS = ["All hosts", "web-prod-01", "web-prod-02", "db-primary", "cache-redis", "queue-worker"];
const WINDOWS = ["Last 15 min", "Last 1 hour", "Last 6 hours", "Last 24 hours", "Last 7 days"];

const SAMPLE = (points: number, base: number, amp: number, seed: number) =>
  Array.from({ length: points }, (_, i) =>
    Math.max(2, Math.min(100, base + Math.sin(i / 2 + seed) * amp + Math.cos(i / 3 + seed) * (amp / 2))),
  );

const NUMIFY = (vals: number[], decimals = 1) =>
  vals.reduce((a, b) => a + b, 0) / vals.length;

const STATS = [
  { id: "cpu", label: "CPU", icon: Cpu, current: 47, peak: 89, avg: 52, unit: "%", series: SAMPLE(48, 50, 25, 1), color: "#3b82f6" },
  { id: "memory", label: "Memory", icon: MemoryStick, current: 68, peak: 94, avg: 71, unit: "%", series: SAMPLE(48, 70, 18, 3), color: "#a855f7" },
  { id: "disk", label: "Disk I/O", icon: HardDrive, current: 34, peak: 76, avg: 41, unit: "%", series: SAMPLE(48, 38, 22, 5), color: "#10b981" },
  { id: "network", label: "Network", icon: Network, current: 58, peak: 92, avg: 55, unit: "%", series: SAMPLE(48, 55, 28, 7), color: "#f59e0b" },
];

export default function Metrics() {
  const [host, setHost] = useState(HOSTS[0]);
  const [window_, setWindow] = useState(WINDOWS[1]);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(i);
  }, []);

  const detail = useMemo<Series[]>(() => {
    return [
      { name: "user", values: SAMPLE(60, 30, 18, tick), color: "#3b82f6" },
      { name: "system", values: SAMPLE(60, 15, 10, tick + 1), color: "#a855f7" },
      { name: "iowait", values: SAMPLE(60, 5, 6, tick + 2), color: "#10b981" },
    ];
  }, [tick]);

  const latency = useMemo(
    () => SAMPLE(60, 22, 12, tick).map((v) => Math.round(v)),
    [tick],
  );

  return (
    <main data-testid="metrics-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6" aria-live="polite">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Gauge aria-hidden="true" className="w-3.5 h-3.5" />
              <span>High-resolution metrics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Metrics Explorer
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Drill into per-host CPU, memory, I/O, network, and latency series.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={host} onValueChange={setHost}>
              <SelectTrigger className="w-[180px]" aria-label="Select host" data-testid="metrics-host-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOSTS.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={window_} onValueChange={setWindow}>
              <SelectTrigger className="w-[170px]" aria-label="Select time window" data-testid="metrics-window-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOWS.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" aria-label="Export metrics as CSV" data-testid="metrics-export-button" className="gap-2">
              <Download aria-hidden="true" className="w-4 h-4" />
              Export
            </Button>
          </div>
        </header>

        <section data-testid="metrics-stat-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            const trend = s.current >= s.avg;
            return (
              <Card key={s.id} data-testid={`metrics-stat-${s.id}`} className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase tracking-wider">{s.label}</CardDescription>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}1f` }}>
                      <Icon aria-hidden="true" className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="flex items-end gap-1 mt-1">
                    {loading ? (
                      <span className="inline-block w-14 h-6 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ) : (
                      <CardTitle className="text-2xl font-bold tabular-nums">{s.current}<span className="text-sm text-slate-400 ml-1">{s.unit}</span></CardTitle>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <MiniSpark data={s.series} color={s.color} />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={trend ? "text-emerald-600" : "text-rose-600"}>
                      {trend ? "▲" : "▼"} {Math.abs(s.current - s.avg).toFixed(0)}{s.unit}
                    </span>
                    <span className="text-slate-400">peak {s.peak}{s.unit}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card data-testid="metrics-detail-chart" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg">CPU Breakdown</CardTitle>
                <CardDescription>User · System · I/O wait for {host}</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {detail.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-1.5 capitalize">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} aria-hidden="true" />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StackedArea series={detail} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card data-testid="metrics-latency" className="lg:col-span-2 border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Request Latency</CardTitle>
                  <CardDescription>p50 / p95 / p99 percentiles (ms)</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Clock aria-hidden="true" className="w-3 h-3" /> avg {Math.round(NUMIFY(latency))}ms
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <BarChartSeries values={latency} color="#3b82f6" />
            </CardContent>
          </Card>

          <Card data-testid="metrics-summary" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Live Sensors</CardTitle>
              <CardDescription>Hardware and process sensors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SensorRow icon={Thermometer} label="CPU Temp" value="62°C" sub="threshold 85°C" pct={73} color="bg-amber-500" />
              <SensorRow icon={Zap} label="Power Draw" value="184W" sub="budget 220W" pct={84} color="bg-blue-500" />
              <SensorRow icon={Activity} label="Fan Speed" value="3,200 RPM" sub="nominal" pct={58} color="bg-emerald-500" />
              <SensorRow icon={MemoryStick} label="Swap Usage" value="512 MB" sub="of 4 GB" pct={13} color="bg-purple-500" />
            </CardContent>
          </Card>
        </div>

        <Card data-testid="metrics-per-host" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Per-Host Comparison</CardTitle>
            <CardDescription>Side-by-side utilization for {window_.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cpu">
              <TabsList className="mb-4" data-testid="metrics-tabs">
                <TabsTrigger value="cpu" data-testid="metrics-tab-cpu">CPU</TabsTrigger>
                <TabsTrigger value="memory" data-testid="metrics-tab-memory">Memory</TabsTrigger>
                <TabsTrigger value="disk" data-testid="metrics-tab-disk">Disk</TabsTrigger>
                <TabsTrigger value="network" data-testid="metrics-tab-network">Network</TabsTrigger>
              </TabsList>
              {(["cpu", "memory", "disk", "network"] as const).map((metric) => {
                const stat = STATS.find((s) => s.id === metric)!;
                return (
                  <TabsContent key={metric} value={metric} className="space-y-3">
                    {HOSTS.slice(1).map((h, idx) => {
                      const v = Math.max(8, Math.min(96, stat.series[idx % stat.series.length] + (idx - 2) * 6));
                      return (
                        <div key={h} className="flex items-center gap-4">
                          <div className="w-32 shrink-0 text-sm font-mono text-slate-600 dark:text-slate-300">{h}</div>
                          <div className="flex-1">
                            <Progress value={v} className="h-2.5" />
                          </div>
                          <div className="w-12 text-right text-sm tabular-nums font-semibold" style={{ color: stat.color }}>{v.toFixed(0)}%</div>
                        </div>
                      );
                    })}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SensorRow({ icon: Icon, label, value, sub, pct, color }: { icon: typeof Cpu; label: string; value: string; sub: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Icon aria-hidden="true" className="w-4 h-4 text-slate-400" />
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
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

function StackedArea({ series }: { series: Series[] }) {
  const W = 900;
  const H = 280;
  const pad = 28;
  const n = series[0].values.length;
  const xStep = (W - pad * 2) / (n - 1);
  const stacked = series.reduce<number[][]>((acc, s, si) => {
    return s.values.map((v, i) => [v, (acc[si - 1]?.[i]?.[1] ?? 0) + v]);
  }, []);
  const maxY = Math.max(...series.reduce<number[]>((a, s) => s.values.map((v, i) => v + (a[i] ?? 0)), [])) * 1.15;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[280px]" aria-label="Stacked area chart" role="img">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`sa-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.1" />
          </linearGradient>
        ))}
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <line key={p} x1={pad} x2={W - pad} y1={pad + p * (H - pad * 2)} y2={pad + p * (H - pad * 2)} stroke="currentColor" strokeOpacity="0.08" />
      ))}
      {series.map((s, si) => {
        const top = stacked[si].map(([_, high], i) => ({ x: pad + i * xStep, y: H - pad - (high / maxY) * (H - pad * 2) }));
        const lowArr = si === 0 ? s.values.map(() => 0) : stacked[si - 1].map(([_, high]) => high);
        const bottom = lowArr.map((low, i) => ({ x: pad + i * xStep, y: H - pad - (low / maxY) * (H - pad * 2) }));
        const d = `M ${top[0].x} ${top[0].y} ${top.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${bottom[bottom.length - 1].x} ${bottom[bottom.length - 1].y} ${bottom.slice(0, -1).reverse().map((p) => `L ${p.x} ${p.y}`).join(" ")} Z`;
        return (
          <g key={si}>
            <path d={d} fill={`url(#sa-${si})`} />
            <path d={`M ${top[0].x} ${top[0].y} ${top.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")}`} fill="none" stroke={s.color} strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

function BarChartSeries({ values, color }: { values: number[]; color: string }) {
  const W = 720;
  const H = 200;
  const pad = 24;
  const max = Math.max(...values) * 1.15 || 1;
  const bw = (W - pad * 2) / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px]" aria-label="Latency bar chart" role="img">
      <defs>
        <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((p) => (
        <line key={p} x1={pad} x2={W - pad} y1={pad + p * (H - pad * 2)} y2={pad + p * (H - pad * 2)} stroke="currentColor" strokeOpacity="0.08" />
      ))}
      {values.map((v, i) => {
        const h = (v / max) * (H - pad * 2);
        const x = pad + i * bw;
        return <rect key={i} x={x + 1} y={H - pad - h} width={Math.max(2, bw - 2)} height={h} rx="2" fill="url(#bar-grad)" />;
      })}
    </svg>
  );
}
