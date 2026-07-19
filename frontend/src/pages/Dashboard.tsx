import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Circle,
  AlertTriangle,
  Search,
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

type MetricCard = {
  id: string;
  label: string;
  value: string;
  delta: number;
  unit: string;
  icon: "servers" | "cpu" | "memory" | "network";
  spark: number[];
};

type Host = {
  id: string;
  name: string;
  ip: string;
  region: string;
  status: "online" | "degraded" | "offline";
  uptime: number;
  cpu: number;
  memory: number;
  disk: number;
};

type ActivityItem = {
  id: string;
  host: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
};

const METRIC_CARDS: MetricCard[] = [
  {
    id: "servers",
    label: "Active Servers",
    value: "24",
    delta: 2,
    unit: "hosts",
    icon: "servers",
    spark: [18, 19, 20, 21, 22, 22, 23, 24, 24, 24],
  },
  {
    id: "cpu",
    label: "Avg CPU Load",
    value: "47",
    delta: -6,
    unit: "%",
    icon: "cpu",
    spark: [62, 58, 55, 53, 50, 49, 48, 47, 47, 47],
  },
  {
    id: "memory",
    label: "Memory Usage",
    value: "68",
    delta: 4,
    unit: "%",
    icon: "memory",
    spark: [60, 61, 63, 65, 66, 67, 67, 68, 68, 68],
  },
  {
    id: "network",
    label: "Network I/O",
    value: "1.2",
    delta: 12,
    unit: "Gb/s",
    icon: "network",
    spark: [0.8, 0.9, 1.0, 0.95, 1.05, 1.1, 1.15, 1.18, 1.2, 1.2],
  },
];

const HOSTS: Host[] = [
  { id: "h1", name: "web-prod-01", ip: "10.0.1.12", region: "us-east-1", status: "online", uptime: 99.99, cpu: 32, memory: 58, disk: 41 },
  { id: "h2", name: "web-prod-02", ip: "10.0.1.13", region: "us-east-1", status: "online", uptime: 99.98, cpu: 28, memory: 61, disk: 44 },
  { id: "h3", name: "db-primary", ip: "10.0.2.5", region: "us-west-2", status: "degraded", uptime: 97.42, cpu: 89, memory: 92, disk: 78 },
  { id: "h4", name: "cache-redis", ip: "10.0.2.9", region: "us-west-2", status: "online", uptime: 99.95, cpu: 22, memory: 74, disk: 19 },
  { id: "h5", name: "queue-worker", ip: "10.0.3.4", region: "eu-central-1", status: "online", uptime: 99.91, cpu: 41, memory: 55, disk: 33 },
  { id: "h6", name: "backup-store", ip: "10.0.4.2", region: "eu-central-1", status: "offline", uptime: 0, cpu: 0, memory: 0, disk: 88 },
];

const ACTIVITY: ActivityItem[] = [
  { id: "a1", host: "db-primary", message: "Memory usage above 90% threshold", severity: "warning", timestamp: "2 min ago" },
  { id: "a2", host: "backup-store", message: "Host unreachable - icmp timeout", severity: "critical", timestamp: "14 min ago" },
  { id: "a3", host: "web-prod-02", message: "Nginx reloaded after config sync", severity: "info", timestamp: "32 min ago" },
  { id: "a4", host: "cache-redis", message: "Automatic failover to replica completed", severity: "info", timestamp: "1 hr ago" },
  { id: "a5", host: "queue-worker", message: "CPU spike detected on worker pool", severity: "warning", timestamp: "2 hr ago" },
];

const ICONS: Record<MetricCard["icon"], typeof Cpu> = {
  servers: Server,
  cpu: Cpu,
  memory: HardDrive,
  network: Network,
};

const STATUS_META: Record<Host["status"], { color: string; label: string; dot: string }> = {
  online: { color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "Online", dot: "bg-emerald-500" },
  degraded: { color: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "Degraded", dot: "bg-amber-500" },
  offline: { color: "bg-rose-500/15 text-rose-600 border-rose-500/30", label: "Offline", dot: "bg-rose-500" },
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const stroke = positive ? "#10b981" : "#f43f5e";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`grad-${positive ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#grad-${positive ? "up" : "down"})`} />
    </svg>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(i);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const filteredHosts = useMemo(
    () =>
      HOSTS.filter(
        (h) =>
          h.name.toLowerCase().includes(query.toLowerCase()) ||
          h.ip.includes(query) ||
          h.region.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <main data-testid="dashboard-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6" aria-live="polite">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Activity aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Real-time cluster telemetry</span>
              <span className="inline-flex items-center gap-1 ml-1">
                <Circle aria-hidden="true" className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
                live
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              VPS Monitor Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Aggregate health, utilization, and incident activity across your fleet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                aria-label="Search hosts"
                placeholder="Search hosts, IPs, regions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 w-full md:w-72"
                data-testid="dashboard-search-input"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh dashboard metrics"
              onClick={onRefresh}
              data-testid="dashboard-refresh-button"
              className="h-10 w-10"
            >
              <RefreshCw aria-hidden="true" className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        <section data-testid="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {METRIC_CARDS.map((m) => {
            const Icon = ICONS[m.icon];
            const positive = m.delta >= 0;
            return (
              <Card
                key={m.id}
                data-testid={`dashboard-kpi-${m.id}`}
                className="relative overflow-hidden border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30 hover:scale-[1.01] transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {m.label}
                    </CardDescription>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 flex items-center justify-center ring-1 ring-slate-200/60 dark:ring-slate-800">
                      <Icon aria-hidden="true" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 mt-1">
                    <CardTitle className="text-3xl font-bold tabular-nums">
                      {loading ? <span className="inline-block w-16 h-7 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" /> : m.value}
                    </CardTitle>
                    <span className="text-sm text-slate-400 mb-1">{m.unit}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`gap-1 font-medium ${positive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-rose-500/30 bg-rose-500/10 text-rose-600"}`}>
                      {positive ? <TrendingUp aria-hidden="true" className="w-3 h-3" /> : <TrendingDown aria-hidden="true" className="w-3 h-3" />}
                      {positive ? "+" : ""}{m.delta}%
                    </Badge>
                    <span className="text-[10px] text-slate-400">vs last hour</span>
                  </div>
                  <div className="mt-3">
                    <Sparkline data={m.spark} positive={positive} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card data-testid="dashboard-traffic-chart" className="xl:col-span-2 border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Cluster Traffic</CardTitle>
                  <CardDescription>Aggregate inbound / outbound throughput (last 60 min)</CardDescription>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" /> Inbound</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" aria-hidden="true" /> Outbound</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LineChartCanvas loading={loading} tick={tick} />
            </CardContent>
          </Card>

          <Card data-testid="dashboard-fleet-health" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Fleet Health</CardTitle>
              <CardDescription>24 hosts across 3 regions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Online", value: 21, color: "bg-emerald-500" },
                { label: "Degraded", value: 2, color: "bg-amber-500" },
                { label: "Offline", value: 1, color: "bg-rose-500" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                    <span className="font-semibold tabular-nums">{row.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${(row.value / 24) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Avg uptime (30d)</span>
                  <span className="font-semibold text-emerald-600">99.94%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="dashboard-hosts-table" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Host Status</CardTitle>
                <CardDescription>Live resource utilization per host</CardDescription>
              </div>
              <Badge variant="secondary" className="tabular-nums">{filteredHosts.length} of {HOSTS.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Host</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40">CPU</TableHead>
                    <TableHead className="w-40">Memory</TableHead>
                    <TableHead className="w-40">Disk</TableHead>
                    <TableHead className="text-right">Uptime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHosts.map((h) => {
                    const meta = STATUS_META[h.status];
                    return (
                      <TableRow key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                              <Server aria-hidden="true" className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{h.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{h.ip} · {h.region}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1.5 ${meta.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ResourceBar label="CPU" value={h.cpu} />
                        </TableCell>
                        <TableCell>
                          <ResourceBar label="Memory" value={h.memory} />
                        </TableCell>
                        <TableCell>
                          <ResourceBar label="Disk" value={h.disk} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">
                          {h.uptime > 0 ? `${h.uptime.toFixed(2)}%` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredHosts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-slate-500">
                        No hosts match "{query}"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="dashboard-activity-feed" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest events from monitoring agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {ACTIVITY.map((a) => {
              const sev = a.severity === "critical"
                ? { icon: AlertTriangle, cls: "text-rose-600 bg-rose-500/10" }
                : a.severity === "warning"
                  ? { icon: AlertTriangle, cls: "text-amber-600 bg-amber-500/10" }
                  : { icon: Circle, cls: "text-blue-600 bg-blue-500/10" };
              const Icon = sev.icon;
              return (
                <div key={a.id} className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${sev.cls}`}>
                    <Icon aria-hidden="true" className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      <span className="font-mono text-xs font-semibold text-slate-500">{a.host}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {a.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ResourceBar({ label, value }: { label: string; value: number }) {
  const color = value > 85 ? "bg-rose-500" : value > 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="sr-only">{label}</span>
        <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300">{value}%</span>
      </div>
      <Progress value={value} className={`h-1.5 [&>div]:${color}`} />
    </div>
  );
}

function LineChartCanvas({ loading, tick }: { loading: boolean; tick: number }) {
  const points = 24;
  const inbound = Array.from({ length: points }, (_, i) => 30 + Math.sin((i + tick) / 2.4) * 18 + Math.cos(i / 3) * 8 + (i / points) * 18);
  const outbound = Array.from({ length: points }, (_, i) => 18 + Math.cos((i + tick) / 3) * 12 + (i / points) * 10);
  const W = 720;
  const H = 220;
  const pad = 24;
  const maxY = 80;
  const xStep = (W - pad * 2) / (points - 1);
  const toPath = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${(pad + i * xStep).toFixed(1)} ${(H - pad - (v / maxY) * (H - pad * 2)).toFixed(1)}`).join(" ");

  if (loading) {
    return <div className="h-[220px] w-full rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]" aria-label="Cluster traffic line chart" role="img">
      <defs>
        <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <line key={p} x1={pad} x2={W - pad} y1={pad + p * (H - pad * 2)} y2={pad + p * (H - pad * 2)} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
      ))}
      <path d={`${toPath(inbound)} L ${W - pad} ${H - pad} L ${pad} ${H - pad} Z`} fill="url(#inGrad)" />
      <path d={`${toPath(outbound)} L ${W - pad} ${H - pad} L ${pad} ${H - pad} Z`} fill="url(#outGrad)" />
      <path d={toPath(inbound)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(outbound)} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
    </svg>
  );
}
