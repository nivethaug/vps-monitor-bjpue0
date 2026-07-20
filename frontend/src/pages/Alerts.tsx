import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  Circle,
  RefreshCw,
  Search,
  CheckCircle2,
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type Severity = "critical" | "warning" | "info";

type AlertItem = {
  id: string;
  host: string;
  hostId: string;
  metric: "cpu" | "memory" | "disk" | "uptime";
  message: string;
  severity: Severity;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
};

type AlertConfig = {
  hostId: string;
  hostName: string;
  ip: string;
  status: "online" | "degraded" | "offline";
  enabled: boolean;
  cpu: number;
  memory: number;
  disk: number;
};

const INITIAL_ALERTS: AlertItem[] = [
  { id: "al1", host: "db-primary", hostId: "h3", metric: "memory", message: "Memory usage above threshold", severity: "critical", value: 94, threshold: 90, timestamp: "2 min ago", acknowledged: false },
  { id: "al2", host: "db-primary", hostId: "h3", metric: "cpu", message: "Sustained CPU load detected", severity: "warning", value: 89, threshold: 85, timestamp: "5 min ago", acknowledged: false },
  { id: "al3", host: "backup-store", hostId: "h6", metric: "uptime", message: "Host unreachable - icmp timeout", severity: "critical", value: 0, threshold: 95, timestamp: "14 min ago", acknowledged: false },
  { id: "al4", host: "backup-store", hostId: "h6", metric: "disk", message: "Disk usage approaching capacity", severity: "warning", value: 88, threshold: 85, timestamp: "18 min ago", acknowledged: false },
  { id: "al5", host: "queue-worker", hostId: "h5", metric: "cpu", message: "CPU spike detected on worker pool", severity: "warning", value: 78, threshold: 75, timestamp: "2 hr ago", acknowledged: true },
  { id: "al6", host: "cache-redis", hostId: "h4", metric: "memory", message: "Memory usage normalized", severity: "info", value: 74, threshold: 80, timestamp: "3 hr ago", acknowledged: true },
];

const INITIAL_CONFIGS: AlertConfig[] = [
  { hostId: "h1", hostName: "web-prod-01", ip: "10.0.1.12", status: "online", enabled: true, cpu: 85, memory: 85, disk: 90 },
  { hostId: "h2", hostName: "web-prod-02", ip: "10.0.1.13", status: "online", enabled: true, cpu: 85, memory: 85, disk: 90 },
  { hostId: "h3", hostName: "db-primary", ip: "10.0.2.5", status: "degraded", enabled: true, cpu: 85, memory: 90, disk: 85 },
  { hostId: "h4", hostName: "cache-redis", ip: "10.0.2.9", status: "online", enabled: true, cpu: 80, memory: 80, disk: 90 },
  { hostId: "h5", hostName: "queue-worker", ip: "10.0.3.4", status: "online", enabled: false, cpu: 75, memory: 80, disk: 90 },
  { hostId: "h6", hostName: "backup-store", ip: "10.0.4.2", status: "offline", enabled: true, cpu: 85, memory: 85, disk: 85 },
];

const SEVERITY_META: Record<Severity, { icon: typeof AlertTriangle; ring: string; chip: string; bar: string; label: string }> = {
  critical: { icon: AlertTriangle, ring: "text-rose-600 bg-rose-500/10 ring-rose-500/20", chip: "border-rose-500/30 bg-rose-500/10 text-rose-600", bar: "bg-rose-500", label: "Critical" },
  warning: { icon: AlertTriangle, ring: "text-amber-600 bg-amber-500/10 ring-amber-500/20", chip: "border-amber-500/30 bg-amber-500/10 text-amber-600", bar: "bg-amber-500", label: "Warning" },
  info: { icon: Circle, ring: "text-blue-600 bg-blue-500/10 ring-blue-500/20", chip: "border-blue-500/30 bg-blue-500/10 text-blue-600", bar: "bg-blue-500", label: "Info" },
};

const METRIC_META: Record<AlertItem["metric"], { icon: typeof Cpu; label: string; suffix: string }> = {
  cpu: { icon: Cpu, label: "CPU", suffix: "%" },
  memory: { icon: MemoryStick, label: "Memory", suffix: "%" },
  disk: { icon: HardDrive, label: "Disk", suffix: "%" },
  uptime: { icon: ShieldCheck, label: "Uptime", suffix: "%" },
};

const STATUS_DOT: Record<AlertConfig["status"], string> = {
  online: "bg-emerald-500",
  degraded: "bg-amber-500",
  offline: "bg-rose-500",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [configs, setConfigs] = useState<AlertConfig[]>(INITIAL_CONFIGS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Severity | "active">("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = "Alerts · VPS Monitor";
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchesQuery =
        a.host.toLowerCase().includes(query.toLowerCase()) ||
        a.message.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !a.acknowledged) ||
        a.severity === filter;
      return matchesQuery && matchesFilter;
    });
  }, [alerts, query, filter]);

  const stats = useMemo(() => {
    const active = alerts.filter((a) => !a.acknowledged);
    return {
      critical: active.filter((a) => a.severity === "critical").length,
      warning: active.filter((a) => a.severity === "warning").length,
      info: active.filter((a) => a.severity === "info").length,
      active: active.length,
      acknowledged: alerts.filter((a) => a.acknowledged).length,
      monitored: configs.filter((c) => c.enabled).length,
    };
  }, [alerts, configs]);

  const acknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  };

  const acknowledgeAll = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  };

  const toggleHost = (hostId: string) => {
    setConfigs((prev) => prev.map((c) => (c.hostId === hostId ? { ...c, enabled: !c.enabled } : c)));
  };

  const updateThreshold = (hostId: string, metric: "cpu" | "memory" | "disk", value: number) => {
    setConfigs((prev) => prev.map((c) => (c.hostId === hostId ? { ...c, [metric]: value } : c)));
  };

  const filteredConfigs = useMemo(
    () => configs.filter((c) => c.hostName.toLowerCase().includes(query.toLowerCase()) || c.ip.includes(query)),
    [configs, query],
  );

  return (
    <main data-testid="alerts-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6" aria-live="polite">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Bell aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Threshold-triggered notifications</span>
              <span className="inline-flex items-center gap-1 ml-1">
                <Circle aria-hidden="true" className="w-2 h-2 fill-rose-500 text-rose-500 animate-pulse" />
                {stats.active} active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Alerts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live warnings, per-server toggles, and custom thresholds across your fleet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={acknowledgeAll} data-testid="alerts-ack-all-button" className="h-10">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 mr-2" />
              Acknowledge all
            </Button>
            <Button variant="outline" size="icon" aria-label="Refresh alerts" onClick={onRefresh} data-testid="alerts-refresh-button" className="h-10 w-10">
              <RefreshCw aria-hidden="true" className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {/* KPI strip */}
        <section data-testid="alerts-kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="alerts-kpi-critical" className="relative overflow-hidden border-rose-200/70 dark:border-rose-900/40 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase tracking-wider">Critical</CardDescription>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center ring-1 ring-rose-500/20">
                  <AlertTriangle aria-hidden="true" className="w-4 h-4 text-rose-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tabular-nums text-rose-600">{stats.critical}</CardTitle>
            </CardHeader>
          </Card>
          <Card data-testid="alerts-kpi-warning" className="relative overflow-hidden border-amber-200/70 dark:border-amber-900/40 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase tracking-wider">Warnings</CardDescription>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center ring-1 ring-amber-500/20">
                  <AlertTriangle aria-hidden="true" className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tabular-nums text-amber-600">{stats.warning}</CardTitle>
            </CardHeader>
          </Card>
          <Card data-testid="alerts-kpi-active" className="relative overflow-hidden border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase tracking-wider">Active Alerts</CardDescription>
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center ring-1 ring-blue-500/20">
                  <Bell aria-hidden="true" className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tabular-nums">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card data-testid="alerts-kpi-monitored" className="relative overflow-hidden border-emerald-200/70 dark:border-emerald-900/40 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase tracking-wider">Hosts Monitored</CardDescription>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/20">
                  <Server aria-hidden="true" className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tabular-nums">{stats.monitored}<span className="text-base text-slate-400">/{configs.length}</span></CardTitle>
            </CardHeader>
          </Card>
        </section>

        {/* Alerts list */}
        <Card data-testid="alerts-list-section" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Live Warnings</CardTitle>
                <CardDescription>Sorted by severity — newest first</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    aria-label="Search alerts"
                    placeholder="Search host or message..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 w-full md:w-64"
                    data-testid="alerts-search-input"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800" role="tablist" aria-label="Filter alerts">
                  {(["all", "critical", "warning", "active"] as const).map((f) => (
                    <button
                      key={f}
                      role="tab"
                      aria-selected={filter === f}
                      onClick={() => setFilter(f)}
                      data-testid={`alerts-filter-${f}`}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                        filter === f
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="alerts-empty-state">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 aria-hidden="true" className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">All clear</p>
                <p className="text-xs text-slate-400 mt-1">No alerts match the current filter.</p>
              </div>
            )}
            {filteredAlerts.map((a) => {
              const sev = SEVERITY_META[a.severity];
              const metric = METRIC_META[a.metric];
              const SevIcon = sev.icon;
              const MetricIcon = metric.icon;
              return (
                <div
                  key={a.id}
                  data-testid={`alerts-item-${a.id}`}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    a.acknowledged
                      ? "border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/20 opacity-70"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm"
                  }`}
                >
                  <div className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ${sev.ring}`}>
                    <SevIcon aria-hidden="true" className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`gap-1 text-[10px] ${sev.chip}`}>
                        {sev.label}
                      </Badge>
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{a.host}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <MetricIcon aria-hidden="true" className="w-3 h-3" />
                        {metric.label}
                      </span>
                      {a.acknowledged && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <CheckCircle2 aria-hidden="true" className="w-3 h-3" />
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{a.message}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 max-w-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>current {a.value}{metric.suffix}</span>
                          <span>threshold {a.threshold}{metric.suffix}</span>
                        </div>
                        <Progress value={Math.min(a.value, 100)} className={`h-1.5 [&>div]:${sev.bar}`} />
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{a.timestamp}</span>
                    </div>
                  </div>
                  {!a.acknowledged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => acknowledge(a.id)}
                      data-testid={`alerts-ack-${a.id}`}
                      className="shrink-0 h-8"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Per-server thresholds */}
        <Card data-testid="alerts-config-section" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Per-Server Configuration</CardTitle>
                <CardDescription>Toggle monitoring and tune thresholds per host</CardDescription>
              </div>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  aria-label="Search hosts"
                  placeholder="Filter hosts..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 w-full md:w-56"
                  data-testid="alerts-host-search-input"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredConfigs.map((c) => (
              <div
                key={c.hostId}
                data-testid={`alerts-config-${c.hostId}`}
                className={`rounded-xl border p-4 transition-all ${
                  c.enabled
                    ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    : "border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 opacity-75"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
                      <Server aria-hidden="true" className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[c.status]}`} aria-hidden="true" />
                        <span className="font-medium text-sm truncate">{c.hostName}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{c.ip}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500">{c.enabled ? "Monitoring on" : "Monitoring off"}</span>
                    <Switch
                      checked={c.enabled}
                      onCheckedChange={() => toggleHost(c.hostId)}
                      aria-label={`Toggle alerts for ${c.hostName}`}
                      data-testid={`alerts-toggle-${c.hostId}`}
                    />
                  </div>
                </div>

                {c.enabled && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {(["cpu", "memory", "disk"] as const).map((metric) => {
                        const Icon = METRIC_META[metric].icon;
                        const val = c[metric];
                        return (
                          <div key={metric} data-testid={`alerts-threshold-${c.hostId}-${metric}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                <Icon aria-hidden="true" className="w-3.5 h-3.5" />
                                {METRIC_META[metric].label} threshold
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{val}%</span>
                            </div>
                            <Slider
                              value={[val]}
                              onValueChange={(v) => updateThreshold(c.hostId, metric, v[0])}
                              min={50}
                              max={99}
                              step={1}
                              aria-label={`${METRIC_META[metric].label} threshold for ${c.hostName}`}
                              data-testid={`alerts-slider-${c.hostId}-${metric}`}
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                              <span>50%</span>
                              <span>99%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
            {filteredConfigs.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500">No hosts match "{query}".</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
