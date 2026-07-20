import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Search,
  RefreshCw,
  Plus,
  Circle,
  MoreVertical,
  ExternalLink,
  Trash2,
  Power,
  Activity,
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
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Status = "online" | "degraded" | "offline";

type VPS = {
  id: string;
  name: string;
  ip: string;
  region: string;
  os: string;
  status: Status;
  uptime: number;
  cpu: number;
  cpuCores: number;
  memory: number;
  memoryTotal: number;
  disk: number;
  diskTotal: number;
  netIn: number;
  netOut: number;
  lastSeen: string;
};

const INITIAL_SERVERS: VPS[] = [
  { id: "h1", name: "web-prod-01", ip: "10.0.1.12", region: "us-east-1", os: "Ubuntu 22.04", status: "online", uptime: 99.99, cpu: 32, cpuCores: 8, memory: 58, memoryTotal: 32, disk: 41, diskTotal: 500, netIn: 142, netOut: 98, lastSeen: "just now" },
  { id: "h2", name: "web-prod-02", ip: "10.0.1.13", region: "us-east-1", os: "Ubuntu 22.04", status: "online", uptime: 99.98, cpu: 28, cpuCores: 8, memory: 61, memoryTotal: 32, disk: 44, diskTotal: 500, netIn: 131, netOut: 102, lastSeen: "just now" },
  { id: "h3", name: "db-primary", ip: "10.0.2.5", region: "us-west-2", os: "Debian 12", status: "degraded", uptime: 97.42, cpu: 89, cpuCores: 16, memory: 92, memoryTotal: 64, disk: 78, diskTotal: 2000, netIn: 412, netOut: 289, lastSeen: "5 sec ago" },
  { id: "h4", name: "cache-redis", ip: "10.0.2.9", region: "us-west-2", os: "Alpine 3.19", status: "online", uptime: 99.95, cpu: 22, cpuCores: 4, memory: 74, memoryTotal: 16, disk: 19, diskTotal: 100, netIn: 88, netOut: 71, lastSeen: "just now" },
  { id: "h5", name: "queue-worker", ip: "10.0.3.4", region: "eu-central-1", os: "Ubuntu 24.04", status: "online", uptime: 99.91, cpu: 41, cpuCores: 4, memory: 55, memoryTotal: 16, disk: 33, diskTotal: 250, netIn: 64, netOut: 52, lastSeen: "just now" },
  { id: "h6", name: "backup-store", ip: "10.0.4.2", region: "eu-central-1", os: "Rocky Linux 9", status: "offline", uptime: 0, cpu: 0, cpuCores: 2, memory: 0, memoryTotal: 8, disk: 88, diskTotal: 4000, netIn: 0, netOut: 0, lastSeen: "14 min ago" },
];

const STATUS_META: Record<Status, { label: string; dot: string; chip: string; ring: string }> = {
  online: { label: "Online", dot: "bg-emerald-500", chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600", ring: "ring-emerald-500/20" },
  degraded: { label: "Degraded", dot: "bg-amber-500", chip: "border-amber-500/30 bg-amber-500/10 text-amber-600", ring: "ring-amber-500/20" },
  offline: { label: "Offline", dot: "bg-rose-500", chip: "border-rose-500/30 bg-rose-500/10 text-rose-600", ring: "ring-rose-500/20" },
};

function ResourceBar({ label, value, total, unit }: { label: string; value: number; total?: number; unit: string }) {
  const color = value > 85 ? "bg-rose-500" : value > 70 ? "bg-amber-500" : "bg-emerald-500";
  const Icon = label === "CPU" ? Cpu : label === "Memory" ? MemoryStick : HardDrive;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Icon aria-hidden="true" className="w-3 h-3" />
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          {value}%{total ? <span className="text-slate-400 font-normal"> · {(total * value / 100).toFixed(0)}{unit}</span> : null}
        </span>
      </div>
      <Progress value={value} className={`h-1.5 [&>div]:${color}`} />
    </div>
  );
}

function Sparkline({ data, online }: { data: number[]; online: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = !online ? "#f43f5e" : "#10b981";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={online ? 0.9 : 0.5} />
    </svg>
  );
}

export default function Servers() {
  const navigate = useNavigate();
  const [servers, setServers] = useState<VPS[]>(INITIAL_SERVERS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = "Servers · VPS Monitor";
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const filtered = useMemo(() => {
    return servers.filter((s) => {
      const q = query.toLowerCase();
      const matchesQuery =
        s.name.toLowerCase().includes(q) ||
        s.ip.includes(query) ||
        s.region.toLowerCase().includes(q) ||
        s.os.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [servers, query, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: servers.length,
      online: servers.filter((s) => s.status === "online").length,
      degraded: servers.filter((s) => s.status === "degraded").length,
      offline: servers.filter((s) => s.status === "offline").length,
    };
  }, [servers]);

  const removeServer = (id: string) => {
    setServers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <main data-testid="servers-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6" aria-live="polite">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Server aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Fleet inventory</span>
              <span className="inline-flex items-center gap-1 ml-1">
                <Circle aria-hidden="true" className={`w-2 h-2 fill-emerald-500 text-emerald-500 ${stats.offline === 0 ? "animate-pulse" : ""}`} />
                {stats.online}/{stats.total} reachable
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Servers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Every VPS in your fleet with live status, resources, and quick actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" data-testid="servers-add-button" className="h-10">
              <Plus aria-hidden="true" className="w-4 h-4 mr-2" />
              Add Server
            </Button>
            <Button variant="outline" size="icon" aria-label="Refresh servers" onClick={onRefresh} data-testid="servers-refresh-button" className="h-10 w-10">
              <RefreshCw aria-hidden="true" className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {/* Status summary */}
        <section data-testid="servers-status-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "total", label: "Total Servers", value: stats.total, icon: Server, color: "text-blue-600 bg-blue-500/15 ring-blue-500/20" },
            { key: "online", label: "Online", value: stats.online, icon: Circle, color: "text-emerald-600 bg-emerald-500/15 ring-emerald-500/20" },
            { key: "degraded", label: "Degraded", value: stats.degraded, icon: Activity, color: "text-amber-600 bg-amber-500/15 ring-amber-500/20" },
            { key: "offline", label: "Offline", value: stats.offline, icon: Power, color: "text-rose-600 bg-rose-500/15 ring-rose-500/20" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.key} data-testid={`servers-kpi-${s.key}`} className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase tracking-wider">{s.label}</CardDescription>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-1 ${s.color}`}>
                      <Icon aria-hidden="true" className="w-4 h-4" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums">{s.value}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              aria-label="Search servers"
              placeholder="Search by name, IP, region, or OS..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              data-testid="servers-search-input"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800" role="tablist" aria-label="Filter by status">
            {(["all", "online", "degraded", "offline"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={statusFilter === f}
                onClick={() => setStatusFilter(f)}
                data-testid={`servers-filter-${f}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  statusFilter === f
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Server cards grid */}
        <section data-testid="servers-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const meta = STATUS_META[s.status];
            const sparkData = Array.from({ length: 16 }, (_, i) =>
              s.status === "offline" ? 0 : Math.max(5, Math.min(95, s.cpu + Math.sin(i / 1.8) * 12 + Math.cos(i / 2.4) * 8)),
            );
            return (
              <Card
                key={s.id}
                data-testid={`servers-card-${s.id}`}
                className={`relative overflow-hidden border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30 hover:scale-[1.01] transition-all duration-300 ring-1 ${meta.ring}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
                        <Server aria-hidden="true" className="w-5 h-5 text-slate-500" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${meta.dot} ring-2 ring-white dark:ring-slate-900`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold truncate">{s.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{s.ip}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${s.name}`} data-testid={`servers-menu-${s.id}`} className="h-8 w-8">
                          <MoreVertical aria-hidden="true" className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate("/metrics")} data-testid={`servers-view-metrics-${s.id}`}>
                          <Activity aria-hidden="true" className="w-4 h-4 mr-2" />
                          View metrics
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid={`servers-view-alerts-${s.id}`}>
                          <ExternalLink aria-hidden="true" className="w-4 h-4 mr-2" />
                          View alerts
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600"
                          onClick={() => removeServer(s.id)}
                          data-testid={`servers-remove-${s.id}`}
                        >
                          <Trash2 aria-hidden="true" className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className={`gap-1.5 ${meta.chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                      {meta.label}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{s.region}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{s.os}</Badge>
                    {s.cpuCores > 0 && <Badge variant="secondary" className="text-[10px]">{s.cpuCores} vCPU</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div data-testid={`servers-sparkline-${s.id}`} className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1"><Activity aria-hidden="true" className="w-3 h-3" />CPU (15 min)</span>
                      <span className="font-mono">last seen {s.lastSeen}</span>
                    </div>
                    <Sparkline data={sparkData} online={s.status !== "offline"} />
                  </div>

                  <ResourceBar label="CPU" value={s.cpu} />
                  <ResourceBar label="Memory" value={s.memory} total={s.memoryTotal} unit="GB" />
                  <ResourceBar label="Disk" value={s.disk} total={s.diskTotal} unit="GB" />

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-slate-400 mb-0.5">
                        <Network aria-hidden="true" className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] text-slate-400">Net In</div>
                      <div className="text-sm font-semibold tabular-nums">{s.netIn}<span className="text-[10px] text-slate-400"> Mb/s</span></div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-slate-400 mb-0.5">
                        <Network aria-hidden="true" className="w-3.5 h-3.5 rotate-180" />
                      </div>
                      <div className="text-[10px] text-slate-400">Net Out</div>
                      <div className="text-sm font-semibold tabular-nums">{s.netOut}<span className="text-[10px] text-slate-400"> Mb/s</span></div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-slate-400 mb-0.5">
                        <Circle aria-hidden="true" className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] text-slate-400">Uptime</div>
                      <div className="text-sm font-semibold tabular-nums">{s.uptime > 0 ? `${s.uptime.toFixed(1)}%` : "—"}</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/metrics")}
                    data-testid={`servers-open-metrics-${s.id}`}
                  >
                    <Activity aria-hidden="true" className="w-4 h-4 mr-2" />
                    Open metrics
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {filtered.length === 0 && (
          <Card data-testid="servers-empty-state" className="border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Server aria-hidden="true" className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No servers found</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                {query || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Add your first VPS to start monitoring."}
              </p>
              <Button variant="default" data-testid="servers-empty-add-button">
                <Plus aria-hidden="true" className="w-4 h-4 mr-2" />
                Add Server
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
