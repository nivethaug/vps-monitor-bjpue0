import { useMemo, useState } from "react";
import {
  Cpu,
  MemoryStick,
  Activity,
  AlertTriangle,
  Search,
  RefreshCw,
  Server as ServerIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CircleDot,
  Pause,
  Square,
  Ghost,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProcessStatus = "running" | "sleeping" | "stopped" | "zombie";

type Proc = {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  memMb: number;
  memPercent: number;
  status: ProcessStatus;
  uptimeHours: number;
  command: string;
};

type ServerOption = {
  id: string;
  name: string;
};

const SERVERS: ServerOption[] = [
  { id: "web-01", name: "web-01.prod" },
  { id: "web-02", name: "web-02.prod" },
  { id: "db-01", name: "db-01.prod" },
  { id: "cache-01", name: "cache-01.prod" },
];

const PROCESS_DATA: Record<string, Proc[]> = {
  "web-01": [
    { pid: 1, name: "systemd", user: "root", cpu: 0.0, memMb: 4.2, memPercent: 0.1, status: "sleeping", uptimeHours: 742.5, command: "/sbin/init" },
    { pid: 412, name: "nginx", user: "www-data", cpu: 2.4, memMb: 86.3, memPercent: 2.1, status: "running", uptimeHours: 512.0, command: "nginx: worker process" },
    { pid: 413, name: "nginx", user: "www-data", cpu: 1.9, memMb: 82.1, memPercent: 2.0, status: "running", uptimeHours: 512.0, command: "nginx: worker process" },
    { pid: 880, name: "node", user: "deploy", cpu: 14.7, memMb: 312.4, memPercent: 7.6, status: "running", uptimeHours: 96.2, command: "node /var/www/api/dist/server.js" },
    { pid: 1247, name: "redis-server", user: "redis", cpu: 0.8, memMb: 24.0, memPercent: 0.6, status: "running", uptimeHours: 512.0, command: "redis-server *:6379" },
    { pid: 2310, name: "pm2", user: "deploy", cpu: 0.3, memMb: 41.2, memPercent: 1.0, status: "sleeping", uptimeHours: 96.1, command: "PM2 v5 God Daemon" },
    { pid: 5532, name: "sshd", user: "root", cpu: 0.0, memMb: 2.1, memPercent: 0.05, status: "sleeping", uptimeHours: 12.4, command: "sshd: deploy@pts/0" },
    { pid: 9999, name: "defunct-cron", user: "root", cpu: 0.0, memMb: 0.0, memPercent: 0.0, status: "zombie", uptimeHours: 0.2, command: "[cron] <defunct>" },
  ],
  "web-02": [
    { pid: 1, name: "systemd", user: "root", cpu: 0.0, memMb: 3.9, memPercent: 0.1, status: "sleeping", uptimeHours: 510.0, command: "/sbin/init" },
    { pid: 388, name: "nginx", user: "www-data", cpu: 3.1, memMb: 74.5, memPercent: 1.8, status: "running", uptimeHours: 410.0, command: "nginx: worker process" },
    { pid: 901, name: "node", user: "deploy", cpu: 22.8, memMb: 410.7, memPercent: 10.1, status: "running", uptimeHours: 48.3, command: "node /var/www/api/dist/server.js" },
    { pid: 1410, name: "logrotate", user: "root", cpu: 0.0, memMb: 1.2, memPercent: 0.03, status: "stopped", uptimeHours: 0.0, command: "/usr/sbin/logrotate /etc/logrotate.conf" },
  ],
  "db-01": [
    { pid: 1, name: "systemd", user: "root", cpu: 0.0, memMb: 5.0, memPercent: 0.1, status: "sleeping", uptimeHours: 1002.0, command: "/sbin/init" },
    { pid: 620, name: "postgres", user: "postgres", cpu: 8.2, memMb: 1240.5, memPercent: 30.5, status: "running", uptimeHours: 1000.4, command: "postgres: main writer process" },
    { pid: 621, name: "postgres", user: "postgres", cpu: 5.1, memMb: 612.0, memPercent: 15.0, status: "running", uptimeHours: 1000.4, command: "postgres: walwriter" },
    { pid: 733, name: "pgbouncer", user: "postgres", cpu: 1.2, memMb: 32.0, memPercent: 0.8, status: "running", uptimeHours: 1000.0, command: "pgbouncer -d /etc/pgbouncer/pgbouncer.ini" },
    { pid: 880, name: "node", user: "deploy", cpu: 0.4, memMb: 58.0, memPercent: 1.4, status: "sleeping", uptimeHours: 33.2, command: "node exporter --port=9100" },
  ],
  "cache-01": [
    { pid: 1, name: "systemd", user: "root", cpu: 0.0, memMb: 3.5, memPercent: 0.1, status: "sleeping", uptimeHours: 320.0, command: "/sbin/init" },
    { pid: 442, name: "redis-server", user: "redis", cpu: 6.8, memMb: 1820.0, memPercent: 44.7, status: "running", uptimeHours: 318.0, command: "redis-server *:6379" },
    { pid: 510, name: "memcached", user: "memcache", cpu: 0.4, memMb: 256.0, memPercent: 6.3, status: "running", uptimeHours: 318.0, command: "memcached -m 256 -p 11211" },
  ],
};

type SortKey = "pid" | "cpu" | "memMb" | "uptimeHours" | "name";
type SortDir = "asc" | "desc";

const STATUS_META: Record<ProcessStatus, { label: string; icon: typeof CircleDot; className: string; iconClass: string }> = {
  running: { label: "Running", icon: CircleDot, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", iconClass: "text-emerald-500" },
  sleeping: { label: "Sleeping", icon: Pause, className: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300", iconClass: "text-slate-400" },
  stopped: { label: "Stopped", icon: Square, className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", iconClass: "text-amber-500" },
  zombie: { label: "Zombie", icon: Ghost, className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400", iconClass: "text-rose-500" },
};

function KpiCard({
  testId,
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
}: {
  testId: string;
  icon: typeof Cpu;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card data-testid={testId} className="overflow-hidden border-slate-200 dark:border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
          </div>
          <div className={`shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon aria-hidden="true" className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Processes() {
  const [serverId, setServerId] = useState<string>("web-01");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("cpu");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [lastRefresh, setLastRefresh] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  );

  const all = useMemo(() => PROCESS_DATA[serverId] ?? [], [serverId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = all.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.user.toLowerCase().includes(q) ||
        p.command.toLowerCase().includes(q) ||
        String(p.pid).includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [all, query, statusFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const total = all.length;
    const running = all.filter((p) => p.status === "running").length;
    const highCpu = all.filter((p) => p.cpu >= 10).length;
    const highMem = all.filter((p) => p.memPercent >= 10).length;
    const totalCpu = all.reduce((s, p) => s + p.cpu, 0);
    const totalMem = all.reduce((s, p) => s + p.memMb, 0);
    return { total, running, highCpu, highMem, totalCpu, totalMem };
  }, [all]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown aria-hidden="true" className="w-3.5 h-3.5 text-slate-400" />;
    return sortDir === "asc" ? (
      <ArrowUp aria-hidden="true" className="w-3.5 h-3.5 text-blue-500" />
    ) : (
      <ArrowDown aria-hidden="true" className="w-3.5 h-3.5 text-blue-500" />
    );
  };

  const handleRefresh = () => {
    setLastRefresh(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  };

  const SortableHead = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        data-testid={`processes-sort-${k}`}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {sortIcon(k)}
      </button>
    </TableHead>
  );

  return (
    <main data-testid="processes-page" className="mx-auto max-w-[1400px] px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Processes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Live process list per server — spot runaway apps, high CPU or memory hogs at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-slate-400" aria-live="polite">Updated {lastRefresh}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh} data-testid="processes-refresh-button">
            <RefreshCw aria-hidden="true" className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard testId="processes-kpi-total" icon={Activity} iconBg="bg-blue-500" label="Total processes" value={stats.total} sub={`${stats.running} active`} />
        <KpiCard testId="processes-kpi-cpu" icon={Cpu} iconBg="bg-purple-500" label="Aggregate CPU" value={`${stats.totalCpu.toFixed(1)}%`} sub={`${stats.highCpu} high usage`} />
        <KpiCard testId="processes-kpi-memory" icon={MemoryStick} iconBg="bg-emerald-500" label="Memory used" value={`${(stats.totalMem / 1024).toFixed(2)} GB`} sub={`${stats.highMem} heavy`} />
        <KpiCard testId="processes-kpi-alerts" icon={AlertTriangle} iconBg="bg-rose-500" label="Needs attention" value={stats.highCpu + stats.highMem} sub="cpu ≥ 10% or mem ≥ 10%" />
      </div>

      {/* Filters */}
      <Card className="mb-4 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-2">
              <ServerIcon aria-hidden="true" className="w-4 h-4 text-slate-400 shrink-0" />
              <Select value={serverId} onValueChange={setServerId}>
                <SelectTrigger className="w-[180px]" data-testid="processes-server-select" aria-label="Select server">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVERS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, user, PID, or command…"
                className="pl-9"
                aria-label="Search processes"
                data-testid="processes-search-input"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {(["all", "running", "sleeping", "stopped", "zombie"] as const).map((s) => {
                const active = statusFilter === s;
                const label = s === "all" ? "All" : STATUS_META[s as ProcessStatus].label;
                return (
                  <Button
                    key={s}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    data-testid={`processes-filter-${s}`}
                    aria-pressed={active}
                    className="shrink-0"
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                  <SortableHead label="PID" k="pid" />
                  <SortableHead label="Name" k="name" />
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">User</TableHead>
                  <SortableHead label="CPU" k="cpu" className="text-right" />
                  <SortableHead label="Memory" k="memMb" className="text-right" />
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</TableHead>
                  <SortableHead label="Uptime" k="uptimeHours" className="text-right" />
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 min-w-[260px]">Command</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-slate-400 py-12">
                      No processes match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => {
                  const meta = STATUS_META[p.status];
                  const StatusIcon = meta.icon;
                  const cpuHot = p.cpu >= 10;
                  const memHot = p.memPercent >= 10;
                  return (
                    <TableRow
                      key={`${serverId}-${p.pid}`}
                      data-testid={`processes-row-${p.pid}`}
                      className="border-slate-100 dark:border-slate-800"
                    >
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.pid}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">{p.name}</TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">{p.user}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-sm ${cpuHot ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-slate-700 dark:text-slate-200"}`}>
                          {p.cpu.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono text-sm ${memHot ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-slate-700 dark:text-slate-200"}`}>
                            {p.memMb >= 1024 ? `${(p.memMb / 1024).toFixed(2)} GB` : `${p.memMb.toFixed(1)} MB`}
                          </span>
                          <span className="text-[10px] text-slate-400">{p.memPercent.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`gap-1 ${meta.className}`} data-testid={`processes-status-${p.pid}`}>
                          <StatusIcon aria-hidden="true" className={`w-3 h-3 ${meta.iconClass}`} />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-500 dark:text-slate-400">
                        {p.uptimeHours >= 24 ? `${(p.uptimeHours / 24).toFixed(1)}d` : `${p.uptimeHours.toFixed(1)}h`}
                      </TableCell>
                      <TableCell className="max-w-[420px]">
                        <code className="text-xs text-slate-500 dark:text-slate-400 break-all">{p.command}</code>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-3 text-xs text-slate-400">
        Showing {filtered.length} of {all.length} processes on{" "}
        <span className="font-medium text-slate-500 dark:text-slate-300">{SERVERS.find((s) => s.id === serverId)?.name}</span>.
      </p>
    </main>
  );
}
