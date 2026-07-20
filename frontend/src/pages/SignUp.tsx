import { useState, useMemo, type FormEvent } from "react";
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

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live password strength
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0..4
  }, [password]);

  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][
    strength
  ];
  const strengthColor = [
    "bg-slate-700",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ][strength];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password || !name.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agree) {
      setError("Please accept the terms to continue.");
      return;
    }

    setLoading(true);

    // 1. Register
    const regRes = await api.post<{ message: string }>(
      "/api/auth/register",
      { email: email.trim(), password }
    );

    if (!regRes.success) {
      setLoading(false);
      const msg = String(regRes.error || "");
      setError(
        /already exists/i.test(msg)
          ? "An account with this email already exists. Try signing in."
          : msg || "Unable to create account. Please try again."
      );
      return;
    }

    // 2. Auto-login
    const loginRes = await api.post<{ token: string }>("/api/auth/login", {
      email: email.trim(),
      password,
    });

    if (!loginRes.success || !loginRes.data?.token) {
      setLoading(false);
      // Account was created but auto-login failed — send to login page
      navigate("/login");
      return;
    }

    localStorage.setItem("auth_token", loginRes.data.token);

    // 3. Fetch user
    const meRes = await api.get<{ id: number; email: string }>("/api/auth/me");
    setLoading(false);

    if (meRes.success && meRes.data) {
      localStorage.setItem(
        "auth_user",
        JSON.stringify({ id: meRes.data.id, email: meRes.data.email, name: name.trim() })
      );
    }

    navigate("/");
  };

  return (
    <main
      data-testid="signup-page"
      className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4"
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Activity className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Start monitoring your servers in minutes
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Sign up</CardTitle>
            <CardDescription>
              It&apos;s free — no credit card required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div
                  data-testid="signup-error"
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
                <Label htmlFor="signup-name" className="text-slate-200">
                  Full name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="signup-name-input"
                  aria-label="Full name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="signup-email-input"
                  aria-label="Email address"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signup-password" className="text-slate-200">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    data-testid="signup-password-toggle"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="signup-password-input"
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

                {/* Live strength meter */}
                {password.length > 0 && (
                  <div
                    data-testid="signup-password-strength"
                    className="space-y-1"
                  >
                    <div className="flex gap-1" aria-hidden="true">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < strength ? strengthColor : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      Password strength:{" "}
                      <span className="text-slate-200">{strengthLabel}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="signup-terms"
                  checked={agree}
                  onCheckedChange={(v) => setAgree(v === true)}
                  data-testid="signup-terms-checkbox"
                  aria-label="Agree to terms"
                  className="mt-0.5"
                />
                <Label
                  htmlFor="signup-terms"
                  className="text-sm leading-snug text-slate-300"
                >
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                disabled={loading}
                data-testid="signup-submit-button"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-emerald-400 hover:text-emerald-300"
                data-testid="signup-login-link"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default SignUp;
