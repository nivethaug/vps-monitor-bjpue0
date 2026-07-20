import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/services/database";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    // 1. Login → get token
    const loginRes = await api.post<{ token: string }>("/api/auth/login", {
      email: email.trim(),
      password,
    });

    if (!loginRes.success || !loginRes.data?.token) {
      setLoading(false);
      setError(
        loginRes.error === "Invalid credentials"
          ? "Wrong email or password."
          : loginRes.error || "Unable to sign in. Please try again."
      );
      return;
    }

    localStorage.setItem("auth_token", loginRes.data.token);

    // 2. Fetch current user
    const meRes = await api.get<{ id: number; email: string }>("/api/auth/me");
    setLoading(false);

    if (meRes.success && meRes.data) {
      localStorage.setItem(
        "auth_user",
        JSON.stringify({ id: meRes.data.id, email: meRes.data.email })
      );
    }

    if (!remember) {
      // session-only: token already in localStorage but don't persist user obj
      localStorage.removeItem("auth_user");
    }

    navigate("/");
  };

  return (
    <main
      data-testid="login-page"
      className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4"
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Activity className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to your VPS Monitor account
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div
                  data-testid="login-error"
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email-input"
                  aria-label="Email address"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-slate-200">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    data-testid="login-password-toggle"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="login-password-input"
                    aria-label="Password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="login-remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    data-testid="login-remember-checkbox"
                    aria-label="Remember me"
                  />
                  <Label
                    htmlFor="login-remember"
                    className="text-sm text-slate-300"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/login"
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                  data-testid="login-forgot-link"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-emerald-400 hover:text-emerald-300"
                data-testid="login-signup-link"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Login;
