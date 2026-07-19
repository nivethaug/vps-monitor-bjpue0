import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  SlidersHorizontal,
  Bell,
  Save,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  Globe,
  Moon,
  Sun,
  Mail,
  Webhook,
  Copy,
  RefreshCw,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type Toast = { id: number; kind: "success" | "error"; message: string } | null;

const REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
];

export default function Settings() {
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Profile
  const [profile, setProfile] = useState({
    name: "Ops Engineer",
    email: "ops@example.com",
    role: "Administrator",
    company: "Acme Infrastructure",
    timezone: "UTC",
  });

  // Security
  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: "60",
    apiKey: "vms_live_8f2c••••••••••••3a91",
    ipAllowlist: "10.0.0.0/8\n192.168.0.0/16",
  });

  // Preferences
  const [prefs, setPrefs] = useState({
    region: "us-east-1",
    refreshInterval: "30",
    theme: "system",
    emailDigest: true,
    slackWebhook: "https://hooks.slack.com/services/T000/B000/XXXX",
    criticalAlerts: true,
    warningAlerts: true,
    dailyDigest: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (kind: "success" | "error", message: string) => {
    setToast({ id: Date.now(), kind, message });
    setTimeout(() => setToast(null), 3500);
  };

  const validate = (section: string): boolean => {
    const e: Record<string, string> = {};
    if (section === "profile") {
      if (!profile.name.trim()) e.name = "Name is required";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) e.email = "Valid email required";
    }
    if (section === "security") {
      if (parseInt(security.sessionTimeout) < 5) e.sessionTimeout = "Minimum 5 minutes";
    }
    if (section === "preferences") {
      if (prefs.slackWebhook && !prefs.slackWebhook.startsWith("https://hooks.slack.com/")) {
        e.slackWebhook = "Must be a valid Slack webhook URL";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = (section: string) => {
    if (!validate(section)) {
      showToast("error", "Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("success", `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
    }, 900);
  };

  return (
    <main data-testid="settings-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto space-y-6" aria-live="polite">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <SettingsIcon aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Workspace configuration</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your profile, security, and monitoring preferences.
            </p>
          </div>
        </header>

        {toast && (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${
              toast.kind === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            }`}
            data-testid="settings-toast"
          >
            {toast.kind === "success" ? <Check aria-hidden="true" className="w-4 h-4" /> : <AlertCircle aria-hidden="true" className="w-4 h-4" />}
            {toast.message}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3" data-testid="settings-tabs">
            <TabsTrigger value="profile" data-testid="settings-tab-profile" className="gap-1.5">
              <User aria-hidden="true" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="settings-tab-security" className="gap-1.5">
              <Shield aria-hidden="true" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" data-testid="settings-tab-preferences" className="gap-1.5">
              <SlidersHorizontal aria-hidden="true" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile" className="mt-4">
            <Card data-testid="settings-profile-section" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User aria-hidden="true" className="w-4 h-4 text-blue-600" /> Profile
                </CardTitle>
                <CardDescription>Personal details shown across the workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full name" error={errors.name} htmlFor="set-name">
                    <Input
                      id="set-name"
                      aria-label="Full name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      data-testid="settings-name-input"
                    />
                  </Field>
                  <Field label="Email" error={errors.email} htmlFor="set-email">
                    <Input
                      id="set-email"
                      type="email"
                      aria-label="Email address"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      data-testid="settings-email-input"
                    />
                  </Field>
                  <Field label="Role" htmlFor="set-role">
                    <Select value={profile.role} onValueChange={(v) => setProfile({ ...profile, role: v })}>
                      <SelectTrigger id="set-role" aria-label="Role" data-testid="settings-role-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrator">Administrator</SelectItem>
                        <SelectItem value="Operator">Operator</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Company" htmlFor="set-company">
                    <Input
                      id="set-company"
                      aria-label="Company"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      data-testid="settings-company-input"
                    />
                  </Field>
                  <Field label="Timezone" htmlFor="set-tz">
                    <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                      <SelectTrigger id="set-tz" aria-label="Timezone" data-testid="settings-timezone-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" data-testid="settings-profile-cancel">Cancel</Button>
                  <Button onClick={() => onSave("profile")} disabled={saving} className="gap-2" data-testid="settings-profile-save">
                    {saving ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Save aria-hidden="true" className="w-4 h-4" />}
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security" className="mt-4 space-y-4">
            <Card data-testid="settings-security-section" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield aria-hidden="true" className="w-4 h-4 text-emerald-600" /> Authentication
                </CardTitle>
                <CardDescription>Control how you sign in and how sessions expire</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToggleRow
                  icon={KeyRound}
                  title="Two-factor authentication"
                  desc="Require a TOTP code in addition to password"
                  checked={security.twoFactor}
                  onChecked={(v) => setSecurity({ ...security, twoFactor: v })}
                  testId="settings-2fa-switch"
                />
                <Separator />
                <Field label="Session timeout (minutes)" error={errors.sessionTimeout} htmlFor="set-session">
                  <Input
                    id="set-session"
                    type="number"
                    min={5}
                    aria-label="Session timeout in minutes"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                    className="max-w-[160px]"
                    data-testid="settings-session-input"
                  />
                </Field>
                <Field label="IP allowlist (CIDR per line)" htmlFor="set-ip">
                  <Textarea
                    id="set-ip"
                    aria-label="IP allowlist"
                    rows={3}
                    value={security.ipAllowlist}
                    onChange={(e) => setSecurity({ ...security, ipAllowlist: e.target.value })}
                    className="font-mono text-xs"
                    data-testid="settings-ipallowlist-input"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button onClick={() => onSave("security")} disabled={saving} className="gap-2" data-testid="settings-security-save">
                    {saving ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Save aria-hidden="true" className="w-4 h-4" />}
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="settings-apikey-section" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">API Key</CardTitle>
                <CardDescription>Used by agents to push metrics to this workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
                  <KeyRound aria-hidden="true" className="w-4 h-4 text-slate-400 shrink-0" />
                  <code className="text-sm font-mono flex-1 truncate" data-testid="settings-apikey-value">{security.apiKey}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Copy API key" data-testid="settings-apikey-copy">
                    <Copy aria-hidden="true" className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Rotate API key" data-testid="settings-apikey-rotate">
                    <RefreshCw aria-hidden="true" className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Treat this key as a secret. Rotate immediately if exposed.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PREFERENCES */}
          <TabsContent value="preferences" className="mt-4 space-y-4">
            <Card data-testid="settings-preferences-section" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SlidersHorizontal aria-hidden="true" className="w-4 h-4 text-purple-600" /> Monitoring
                </CardTitle>
                <CardDescription>Default region and polling cadence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Default region" htmlFor="set-region">
                    <Select value={prefs.region} onValueChange={(v) => setPrefs({ ...prefs, region: v })}>
                      <SelectTrigger id="set-region" aria-label="Default region" data-testid="settings-region-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Refresh interval (seconds)" htmlFor="set-refresh">
                    <Select value={prefs.refreshInterval} onValueChange={(v) => setPrefs({ ...prefs, refreshInterval: v })}>
                      <SelectTrigger id="set-refresh" aria-label="Refresh interval" data-testid="settings-refresh-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2"><Moon aria-hidden="true" className="w-4 h-4 text-slate-400" /> Theme</div>
                  <div className="flex gap-2">
                    {(["system", "light", "dark"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPrefs({ ...prefs, theme: t })}
                        aria-pressed={prefs.theme === t}
                        className={`px-3 py-2 rounded-lg text-sm capitalize border transition-all ${
                          prefs.theme === t
                            ? "border-blue-500 bg-blue-500/10 text-blue-600"
                            : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                        data-testid={`settings-theme-${t}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {t === "light" && <Sun aria-hidden="true" className="w-3.5 h-3.5" />}
                          {t === "dark" && <Moon aria-hidden="true" className="w-3.5 h-3.5" />}
                          {t === "system" && <Globe aria-hidden="true" className="w-3.5 h-3.5" />}
                          {t}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="settings-notifications-section" className="border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell aria-hidden="true" className="w-4 h-4 text-amber-600" /> Notifications
                </CardTitle>
                <CardDescription>Choose what gets sent where</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  icon={AlertCircle}
                  title="Critical alerts"
                  desc="Host down, disk full, agent offline"
                  checked={prefs.criticalAlerts}
                  onChecked={(v) => setPrefs({ ...prefs, criticalAlerts: v })}
                  testId="settings-critical-alerts-switch"
                />
                <ToggleRow
                  icon={Bell}
                  title="Warning alerts"
                  desc="Threshold breaches (CPU, memory, latency)"
                  checked={prefs.warningAlerts}
                  onChecked={(v) => setPrefs({ ...prefs, warningAlerts: v })}
                  testId="settings-warning-alerts-switch"
                />
                <ToggleRow
                  icon={Mail}
                  title="Email digest"
                  desc="Daily summary email at 09:00 local"
                  checked={prefs.emailDigest}
                  onChecked={(v) => setPrefs({ ...prefs, emailDigest: v })}
                  testId="settings-email-digest-switch"
                />
                <Separator />
                <Field label="Slack webhook URL" error={errors.slackWebhook} htmlFor="set-slack">
                  <Input
                    id="set-slack"
                    type="url"
                    aria-label="Slack webhook URL"
                    placeholder="https://hooks.slack.com/services/..."
                    value={prefs.slackWebhook}
                    onChange={(e) => setPrefs({ ...prefs, slackWebhook: e.target.value })}
                    data-testid="settings-slack-input"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button onClick={() => onSave("preferences")} disabled={saving} className="gap-2" data-testid="settings-preferences-save">
                    {saving ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Save aria-hidden="true" className="w-4 h-4" />}
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <AlertCircle aria-hidden="true" className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, title, desc, checked, onChecked, testId }: { icon: typeof Bell; title: string; desc: string; checked: boolean; onChecked: (v: boolean) => void; testId: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon aria-hidden="true" className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-slate-500">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChecked} aria-label={title} data-testid={testId} />
    </div>
  );
}
