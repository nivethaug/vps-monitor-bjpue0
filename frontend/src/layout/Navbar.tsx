import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Gauge,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  X,
  Activity,
  Bell,
  History,
  Server as ServerIcon,
  ListTree,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTheme } from "@/components/ThemeProvider";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  testId: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testId: "navbar-link-dashboard" },
  { to: "/metrics", label: "Metrics", icon: Gauge, testId: "navbar-link-metrics" },
  { to: "/servers", label: "Servers", icon: ServerIcon, testId: "navbar-link-servers" },
  { to: "/alerts", label: "Alerts", icon: Bell, testId: "navbar-link-alerts" },
  { to: "/processes", label: "Processes", icon: ListTree, testId: "navbar-link-processes" },
  { to: "/activity", label: "Activity Log", icon: History, testId: "navbar-link-activity" },
  { to: "/reports", label: "Reports", icon: BarChart3, testId: "navbar-link-reports" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testId: "navbar-link-settings" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="VPS Monitor home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity aria-hidden="true" className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight text-slate-900 dark:text-white">VPS Monitor</div>
              <div className="text-[10px] text-slate-400 leading-tight">Infrastructure Observability</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === "/"} data-testid={item.testId}>
                  <span className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="w-4 h-4" />
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              data-testid="navbar-theme-toggle"
              onClick={toggleTheme}
            >
              {isDark ? (
                <Sun aria-hidden="true" className="w-4 h-4" />
              ) : (
                <Moon aria-hidden="true" className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex h-10 w-10" aria-label="View notifications" data-testid="navbar-notifications-button">
              <Bell aria-hidden="true" className="w-4 h-4" />
            </Button>
            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10"
                  aria-label="Open navigation menu"
                  data-testid="sidebar-toggle-button"
                >
                  <Menu aria-hidden="true" className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Activity aria-hidden="true" className="w-4 h-4 text-white" />
                      </div>
                      VPS Monitor
                    </SheetTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close menu" onClick={() => setOpen(false)}>
                      <X aria-hidden="true" className="w-4 h-4" />
                    </Button>
                  </div>
                </SheetHeader>
                <nav aria-label="Mobile navigation" className="flex flex-col gap-1 p-3">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                            isActive
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                          }`
                        }
                        data-testid={`mobile-${item.testId}`}
                      >
                        <Icon aria-hidden="true" className="w-4 h-4" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
