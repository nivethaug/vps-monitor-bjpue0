import { useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  Calendar,
  Filter,
  Download,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  FileSpreadsheet,
  FileDown,
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
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ReportType = "uptime" | "utilization" | "incidents" | "billing";
type ReportStatus = "ready" | "generating" | "failed";

type Report = {
  id: string;
  name: string;
  type: ReportType;
  period: string;
  range: string;
  generatedAt: string;
  size: string;
  status: ReportStatus;
  rows: number;
};

const TYPE_META: Record<ReportType, { label: string; color: string }> = {
  uptime: { label: "Uptime", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  utilization: { label: "Utilization", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  incidents: { label: "Incidents", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  billing: { label: "Billing", color: "bg-purple-500/15 text-purple-600 border-purple-500/30" },
};

const INITIAL_REPORTS: Report[] = [
  { id: "rpt-1024", name: "Monthly Uptime Summary", type: "uptime", period: "June 2026", range: "Jun 1 – Jun 30", generatedAt: "2026-07-01 02:14", size: "284 KB", status: "ready", rows: 720 },
  { id: "rpt-1023", name: "Q2 Utilization Breakdown", type: "utilization", period: "Q2 2026", range: "Apr 1 – Jun 30", generatedAt: "2026-07-01 01:48", size: "1.2 MB", status: "ready", rows: 4320 },
  { id: "rpt-1022", name: "Incident Root Cause – db-primary", type: "incidents", period: "Jun 28 outage", range: "Jun 28 09:00 – 12:00", generatedAt: "2026-06-28 14:02", size: "96 KB", status: "ready", rows: 38 },
  { id: "rpt-1021", name: "May Billing Reconciliation", type: "billing", period: "May 2026", range: "May 1 – May 31", generatedAt: "2026-06-01 03:00", size: "512 KB", status: "ready", rows: 864 },
  { id: "rpt-1020", name: "Weekly Utilization – week 26", type: "utilization", period: "Week 26", range: "Jun 23 – Jun 29", generatedAt: "2026-06-30 02:00", size: "412 KB", status: "failed", rows: 0 },
];

const TYPE_OPTIONS: { value: ReportType; label: string; desc: string }[] = [
  { value: "uptime", label: "Uptime Report", desc: "Per-host availability, SLA coverage, downtime windows" },
  { value: "utilization", label: "Utilization Report", desc: "CPU / memory / disk / network aggregated by host & window" },
  { value: "incidents", label: "Incident Report", desc: "Alerts, severity, MTTR, root-cause annotations" },
  { value: "billing", label: "Billing Report", desc: "Cost allocation per region, instance tier, project tag" },
];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [type, setType] = useState<ReportType>("uptime");
  const [name, setName] = useState("");
  const [from, setFrom] = useState("2026-06-01");
  const [to, setTo] = useState("2026-06-30");
  const [filter, setFilter] = useState<"all" | ReportType>("all");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? reports : reports.filter((r) => r.type === filter)),
    [reports, filter],
  );

  const onGenerate = () => {
    setError(null);
    setSuccess(null);
    if (!name.trim()) {
      setError("Report name is required");
      return;
    }
    if (from > to) {
      setError("Start date must be before end date");
      return;
    }
    setGenerating(true);
    const id = `rpt-${1025 + reports.length - INITIAL_REPORTS.length}`;
    const draft: Report = {
      id,
      name: name.trim(),
      type,
      period: `${from} → ${to}`,
      range: `${from} – ${to}`,
      generatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      size: "—",
      status: "generating",
      rows: 0,
    };
    setReports((prev) => [draft, ...prev]);
    setName("");
    setTimeout(() => {
      setGenerating(false);
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "ready", size: `${(Math.random() * 800 + 80).toFixed(0)} KB`, rows: Math.floor(Math.random() * 4000 + 200) }
            : r,
        ),
      );
      setSuccess(`Report "${draft.name}" is ready`);
      setTimeout(() => setSuccess(null), 4000);
    }, 1800);
  };

  const onDelete = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const onExport = (r: Report, fmt: "csv" | "pdf" | "xlsx") => {
    setSuccess(`Exported ${r.name} as ${fmt.toUpperCase()}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <main data-testid="reports-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6" aria-live="polite">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <BarChart3 aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Scheduled & on-demand reporting</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Reports
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Generate uptime, utilization, incident, and billing reports. Export to CSV, PDF, or Excel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[160px]" aria-label="Filter reports by type" data-testid="reports-filter-select">
                <Filter aria-hidden="true" className="w-3.5 h-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card data-testid="reports-generator" className="lg:col-span-1 border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play aria-hidden="true" className="w-4 h-4 text-blue-600" />
                Generate Report
              </CardTitle>
              <CardDescription>Define type, scope, and date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rpt-name" className="text-xs">Report name</Label>
                <Input
                  id="rpt-name"
                  aria-label="Report name"
                  placeholder="e.g. July uptime summary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="reports-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpt-type" className="text-xs">Report type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
                  <SelectTrigger id="rpt-type" aria-label="Report type" data-testid="reports-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">{TYPE_OPTIONS.find((t) => t.value === type)?.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rpt-from" className="text-xs flex items-center gap-1"><Calendar aria-hidden="true" className="w-3 h-3" /> From</Label>
                  <Input id="rpt-from" type="date" aria-label="Start date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="reports-from-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rpt-to" className="text-xs flex items-center gap-1"><Calendar aria-hidden="true" className="w-3 h-3" /> To</Label>
                  <Input id="rpt-to" type="date" aria-label="End date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="reports-to-input" />
                </div>
              </div>
              <Button
                onClick={onGenerate}
                disabled={generating}
                className="w-full gap-2"
                data-testid="reports-generate-button"
              >
                {generating ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Play aria-hidden="true" className="w-4 h-4" />}
                {generating ? "Generating…" : "Generate Report"}
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="reports-list" className="lg:col-span-2 border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Reports</CardTitle>
                  <CardDescription>{filtered.length} report{filtered.length !== 1 ? "s" : ""} · sorted by most recent</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1"><Clock aria-hidden="true" className="w-3 h-3" /> auto-archive 90d</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Range</TableHead>
                      <TableHead className="hidden lg:table-cell">Generated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const meta = TYPE_META[r.type];
                      return (
                        <TableRow key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
                                <FileText aria-hidden="true" className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{r.name}</div>
                                <div className="text-xs text-slate-400 font-mono">{r.id} · {r.size} · {r.rows.toLocaleString()} rows</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-slate-500">{r.range}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-slate-500 tabular-nums">{r.generatedAt}</TableCell>
                          <TableCell>
                            {r.status === "ready" && (
                              <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                                <CheckCircle2 aria-hidden="true" className="w-3 h-3" /> Ready
                              </Badge>
                            )}
                            {r.status === "generating" && (
                              <Badge variant="outline" className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600">
                                <Loader2 aria-hidden="true" className="w-3 h-3 animate-spin" /> Generating
                              </Badge>
                            )}
                            {r.status === "failed" && (
                              <Badge variant="outline" className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600">
                                <AlertCircle aria-hidden="true" className="w-3 h-3" /> Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={`Preview report ${r.name}`}
                                    disabled={r.status !== "ready"}
                                    onClick={() => setPreview(r)}
                                    data-testid={`reports-preview-trigger-${r.id}`}
                                  >
                                    <Eye aria-hidden="true" className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl" data-testid={`reports-preview-dialog-${r.id}`}>
                                  <DialogHeader>
                                    <DialogTitle>{preview?.name ?? r.name}</DialogTitle>
                                    <DialogDescription>{preview?.range ?? r.range} · {preview?.rows ?? r.rows} rows</DialogDescription>
                                  </DialogHeader>
                                  <PreviewBody report={preview ?? r} />
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Export ${r.name} as CSV`}
                                disabled={r.status !== "ready"}
                                onClick={() => onExport(r, "csv")}
                                data-testid={`reports-export-csv-${r.id}`}
                              >
                                <FileSpreadsheet aria-hidden="true" className="w-4 h-4 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Export ${r.name} as PDF`}
                                disabled={r.status !== "ready"}
                                onClick={() => onExport(r, "pdf")}
                                data-testid={`reports-export-pdf-${r.id}`}
                              >
                                <FileDown aria-hidden="true" className="w-4 h-4 text-rose-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Delete report ${r.name}`}
                                onClick={() => onDelete(r.id)}
                                data-testid={`reports-delete-${r.id}`}
                              >
                                <Trash2 aria-hidden="true" className="w-4 h-4 text-slate-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-sm text-slate-500">
                          <FileText aria-hidden="true" className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No reports yet. Generate one to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="reports-templates" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Quick Templates</CardTitle>
            <CardDescription>One-click report generation from saved templates</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setType(t.value); setName(`${t.label} – ${new Date().toLocaleDateString()}`); }}
                className="text-left rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 hover:shadow-md hover:border-blue-500/40 hover:scale-[1.02] transition-all duration-300"
                data-testid={`reports-template-${t.value}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={TYPE_META[t.value].color}>{t.label}</Badge>
                  <Download aria-hidden="true" className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PreviewBody({ report }: { report: Report }) {
  const previewRows = useMemo(() => {
    const seed = report.id.split("-").pop() ?? "0";
    const n = parseInt(seed, 10) || 1;
    return Array.from({ length: 6 }, (_, i) => ({
      host: `host-${((n + i) % 24) + 1}`.padStart(8, "0"),
      metric: report.type === "billing" ? "cost" : report.type === "incidents" ? "events" : report.type === "uptime" ? "availability" : "avg_load",
      value: report.type === "billing" ? `$${(120 + i * 37).toFixed(2)}` : report.type === "uptime" ? `${(99 + Math.random()).toFixed(2)}%` : `${(40 + i * 9).toFixed(1)}`,
      unit: report.type === "billing" ? "USD" : report.type === "uptime" ? "" : "%",
    }));
  }, [report]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="text-xs text-slate-400 uppercase">Rows</div>
          <div className="text-lg font-bold tabular-nums">{report.rows.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="text-xs text-slate-400 uppercase">Size</div>
          <div className="text-lg font-bold">{report.size}</div>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="text-xs text-slate-400 uppercase">Type</div>
          <div className="text-lg font-bold capitalize">{report.type}</div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Host</TableHead>
              <TableHead className="capitalize">Metric</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{row.host}</TableCell>
                <TableCell className="text-xs text-slate-500">{row.metric}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{row.value}{row.unit && <span className="text-xs text-slate-400 ml-1">{row.unit}</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-slate-400">Showing 6 of {report.rows.toLocaleString()} rows. Export for full dataset.</p>
    </div>
  );
}
