import { useMemo, useState } from "react";
import {
  History,
  LogIn,
  LogOut,
  UserPlus,
  Settings as SettingsIcon,
  Bell,
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  Server,
  KeyRound,
  Save,
  Power,
  Database,
  CloudUpload,
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  ChevronRight,
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
import { Separator } from "@/components/ui/separator";

type EventCategory = "login" | "change" | "alert" | "system";
type EventStatus = "success" | "failed" | "info";

type ActivityEvent = {
  id: string;
  category: EventCategory;
  actor: string;
  action: string;
  target: string;
  status: EventStatus;
  ip: string;
  timestamp: string;
  group: "Today" | "Yesterday" | "Earlier this week";
};

const EVENTS: ActivityEvent[] = [
  // Today
  { id: "e1", category: "login", actor: "ops-engineer@team.io", action: "Signed in to dashboard", target: "Web Console", status: "success", ip: "203.0.113.42", timestamp: "10:42 AM", group: "Today" },
  { id: "e2", category: "change", actor: "ops-engineer@team.io", action: "Lowered memory threshold from 90% to 85%", target: "db-primary", status: "success", ip: "203.0.113.42", timestamp: "10:48 AM", group: "Today" },
  { id: "e3", category: "alert", actor: "monitoring-engine", action: "Triggered critical alert: memory above threshold", target: "db-primary", status: "info", ip: "internal", timestamp: "11:02 AM", group: "Today" },
  { id: "e4", category: "login", actor: "unknown@192.168.1.55", action: "Failed login attempt (invalid credentials)", target: "Web Console", status: "failed", ip: "192.168.1.55", timestamp: "11:15 AM", group: "Today" },
  { id: "e5", category: "system", actor: "scheduler", action: "Rolled out config update to 6 hosts", target: "All Servers", status: "success", ip: "internal", timestamp: "11:30 AM", group: "Today" },
  { id: "e6", category: "change", actor: "admin@company.com", action: "Added new team member", target: "dev-lead@team.io", status: "success", ip: "198.51.100.7", timestamp: "12:05 PM", group: "Today" },
  { id: "e7", category: "alert", actor: "monitoring-engine", action: "Resolved alert: CPU spike on queue-worker", target: "queue-worker", status: "info", ip: "internal", timestamp: "12:20 PM", group: "Today" },
  { id: "e8", category: "system", actor: "backup-service", action: "Completed scheduled backup snapshot", target: "backup-store", status: "success", ip: "internal", timestamp: "01:00 PM", group: "Today" },

  // Yesterday
  { id: "e9", category: "login", actor: "admin@company.com", action: "Signed in to dashboard", target: "Web Console", status: "success", ip: "198.51.100.7", timestamp: "5:30 PM", group: "Yesterday" },
  { id: "e10", category: "change", actor: "admin@company.com", action: "Enabled alerting for queue-worker", target: "queue-worker", status: "success", ip: "198.51.100.7", timestamp: "5:42 PM", group: "Yesterday" },
  { id: "e11", category: "system", actor: "deploy-bot", action: "Restarted monitoring agent", target: "web-prod-02", status: "success", ip: "internal", timestamp: "6:10 PM", group: "Yesterday" },
  { id: "e12", category: "login", actor: "dev-lead@team.io", action: "Signed out of dashboard", target: "Web Console", status: "info", ip: "203.0.113.91", timestamp: "7:55 PM", group: "Yesterday" },
  { id: "e13", category: "alert", actor: "monitoring-engine", action: "Host unreachable - icmp timeout", target: "backup-store", status: "failed", ip: "internal", timestamp: "9:14 PM", group: "Yesterday" },

  // Earlier this week
  { id: "e14", category: "change", actor: "admin@company.com", action: "Rotated API access key", target: "monitoring-service", status: "success", ip: "198.51.100.7", timestamp: "Mon 9:12 AM", group: "Earlier this week" },
  { id: "e15", category: "system", actor: "upgrade-runner", action: "Applied security patch", target: "All Servers", status: "success", ip: "internal", timestamp: "Mon 2:40 PM", group: "Earlier this week" },
  { id: "e16", category: "login", actor: "contractor@ext.io", action: "Failed login attempt (account locked)", target: "Web Console", status: "failed", ip: "45.77.221.130", timestamp: "Tue 8:03 AM", group: "Earlier this week" },
  { id: "e17", category: "change", actor: "ops-engineer@team.io", action: "Updated disk threshold to 85%", target: "backup-store", status: "success", ip: "203.0.113.42", timestamp: "Wed 11:25 AM", group: "Earlier this week" },
];

const CATEGORY_META: Record<
  EventCategory,
  { icon: typeof LogIn; tone: string; chip: string; label: string }
> = {
  login: { icon: LogIn, tone: "text-blue-600 bg-blue-500/10 ring-blue-500/20", chip: "border-blue-500/30 bg-blue-500/10 text-blue-600", label: "Login" },
  change: { icon: SettingsIcon, tone: "text-purple-600 bg-purple-500/10 ring-purple-500/20", chip: "border-purple-500/30 bg-purple-500/10 text-purple-600", label: "Change" },
  alert: { icon: Bell, tone: "text-amber-600 bg-amber-500/10 ring-amber-500/20", chip: "border-amber-500/30 bg-amber-500/10 text-amber-600", label: "Alert" },
  system: { icon: RefreshCw, tone: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20", chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600", label: "System" },
};

const STATUS_META: Record<EventStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  success: { icon: CheckCircle2, color: "text-emerald-500", label: "Success" },
  failed: { icon: XCircle, color: "text-rose-500", label: "Failed" },
  info: { icon: CircleDollarSign, color: "text-slate-400", label: "Info" },
};

const FILTERS: { key: EventCategory | "all"; label: string }[] = [
  { key: "all", label: "All Events" },
  { key: "login", label: "Logins" },
  { key: "change", label: "Changes" },
  { key: "alert", label: "Alerts" },
  { key: "system", label: "System" },
];

const GROUP_ORDER: ActivityEvent["group"][] = ["Today", "Yesterday", "Earlier this week"];

const STAT_CARDS = [
  { key: "total", label: "Events Today", icon: History, tone: "from-blue-500 to-purple-600", testId: "activity-stat-total" },
  { key: "logins", label: "Logins", icon: LogIn, tone: "from-blue-500 to-cyan-500", testId: "activity-stat-logins" },
  { key: "changes", label: "Changes", icon: SettingsIcon, tone: "from-purple-500 to-fuchsia-500", testId: "activity-stat-changes" },
  { key: "alerts", label: "Alerts Triggered", icon: ShieldAlert, tone: "from-amber-500 to-rose-500", testId: "activity-stat-alerts" },
] as const;

const ACTION_ICON: Record<string, typeof Server> = {
  login: LogIn,
  logout: LogOut,
  user: UserPlus,
  threshold: Save,
  alert: Bell,
  key: KeyRound,
  power: Power,
  backup: CloudUpload,
  db: Database,
};

function actionHintIcon(action: string): typeof Server | null {
  const a = action.toLowerCase();
  if (a.includes("signed out")) return ACTION_ICON.logout;
  if (a.includes("member") || a.includes("user")) return ACTION_ICON.user;
  if (a.includes("threshold")) return ACTION_ICON.threshold;
  if (a.includes("key")) return ACTION_ICON.key;
  if (a.includes("restart") || a.includes("power")) return ACTION_ICON.power;
  if (a.includes("backup") || a.includes("snapshot")) return ACTION_ICON.backup;
  if (a.includes("patch") || a.includes("database")) return ACTION_ICON.db;
  return null;
}

export default function ActivityLog() {
  const [filter, setFilter] = useState<EventCategory | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const today = EVENTS.filter((e) => e.group === "Today");
    return {
      total: today.length,
      logins: today.filter((e) => e.category === "login").length,
      changes: today.filter((e) => e.category === "change").length,
      alerts: today.filter((e) => e.category === "alert").length,
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENTS.filter((e) => {
      if (filter !== "all" && e.category !== filter) return false;
      if (!q) return true;
      return (
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.ip.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  const grouped = useMemo(() => {
    const map: Record<string, ActivityEvent[]> = {};
    for (const g of GROUP_ORDER) map[g] = [];
    for (const e of filtered) {
      if (map[e.group]) map[e.group].push(e);
    }
    return map;
  }, [filtered]);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div data-testid="activity-page" className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <History aria-hidden="true" className="w-7 h-7 text-blue-500" />
              Activity Log
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              A timeline of logins, configuration changes, and alerts across your infrastructure.
            </p>
          </div>
          <Button variant="outline" data-testid="activity-export-button" className="w-fit">
            <CloudUpload aria-hidden="true" className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => {
            const Icon = s.icon;
            const value = counts[s.key as keyof typeof counts];
            return (
              <Card key={s.key} data-testid={s.testId} className="relative overflow-hidden border-slate-200 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center shadow-lg`}>
                      <Icon aria-hidden="true" className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Controls */}
        <Card data-testid="activity-filters-section" className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                aria-label="Search activity log"
                placeholder="Search by user, action, server, or IP..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                data-testid="activity-search-input"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by event category">
              <Filter aria-hidden="true" className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    aria-pressed={active}
                    onClick={() => setFilter(f.key)}
                    data-testid={`activity-filter-${f.key}`}
                    className={active ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                  >
                    {f.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card data-testid="activity-timeline" className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History aria-hidden="true" className="w-5 h-5 text-slate-400" />
              Event Timeline
            </CardTitle>
            <CardDescription>
              {filtered.length} event{filtered.length === 1 ? "" : "s"} shown
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="py-16 text-center" data-testid="activity-empty-state">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                  <Search aria-hidden="true" className="w-6 h-6 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">No matching events</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try a different search or filter.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {GROUP_ORDER.map((group) => {
                  const items = grouped[group];
                  if (!items || items.length === 0) return null;
                  return (
                    <section key={group} data-testid={`activity-group-${group.toLowerCase().replace(/\s+/g, "-")}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{group}</h3>
                        <Separator className="flex-1" />
                        <Badge variant="outline" className="text-[10px] text-slate-500">{items.length}</Badge>
                      </div>
                      <ol className="relative space-y-3">
                        {items.map((e, idx) => {
                          const cat = CATEGORY_META[e.category];
                          const st = STATUS_META[e.status];
                          const CatIcon = cat.icon;
                          const StatusIcon = st.icon;
                          const HintIcon = actionHintIcon(e.action);
                          const isLast = idx === items.length - 1;
                          return (
                            <li
                              key={e.id}
                              data-testid={`activity-event-${e.id}`}
                              className="relative pl-12"
                            >
                              {!isLast && (
                                <span
                                  aria-hidden="true"
                                  className="absolute left-[18px] top-9 bottom-[-12px] w-px bg-slate-200 dark:bg-slate-800"
                                />
                              )}
                              <div className="absolute left-0 top-1">
                                <div className={`w-9 h-9 rounded-full ring-1 flex items-center justify-center ${cat.tone}`}>
                                  <CatIcon aria-hidden="true" className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className={`text-[10px] ${cat.chip}`}>
                                        {cat.label}
                                      </Badge>
                                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${st.color}`}>
                                        <StatusIcon aria-hidden="true" className="w-3.5 h-3.5" />
                                        {st.label}
                                      </span>
                                      <span className="text-xs text-slate-400">{e.timestamp}</span>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white flex items-start gap-2">
                                      {HintIcon && <HintIcon aria-hidden="true" className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />}
                                      <span>{e.action}</span>
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                      <span className="inline-flex items-center gap-1">
                                        <UserPlus aria-hidden="true" className="w-3.5 h-3.5" />
                                        {e.actor}
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        <Server aria-hidden="true" className="w-3.5 h-3.5" />
                                        {e.target}
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        <KeyRound aria-hidden="true" className="w-3.5 h-3.5" />
                                        {e.ip}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight aria-hidden="true" className="w-4 h-4 text-slate-300 dark:text-slate-600 hidden sm:block mt-1 shrink-0" />
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
