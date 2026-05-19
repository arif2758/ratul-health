"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Activity,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Target,
  Flame,
  TrendingUp,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { QuickMeasurementForm } from "@/components/QuickMeasurementForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const features = [
  {
    icon: Activity,
    title: "Real-time Metrics",
    description:
      "Track weight, body fat, BMI, and health indicators in one place",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set and monitor your fitness goals",
  },
  {
    icon: Flame,
    title: "Calorie Management",
    description: "Calculate daily caloric needs automatically",
  },
  {
    icon: TrendingUp,
    title: "Progress Charts",
    description: "Visualize your health journey",
  },
];

export default function Landing() {
  const { resolvedTheme } = useTheme();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [registerGender, setRegisterGender] = useState<"male" | "female">(
    "male",
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "true") {
        setShowAuthModal(true);
      }
    }
  }, []);

  const darkMode = resolvedTheme === "dark";

  if (!mounted) {
    return <div className="w-full min-h-screen bg-white dark:bg-[#0F0F0F]" />;
  }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      if (authMode === "login") {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error(result.error || "Login failed");
          setAuthError(result.error);
        } else {
          toast.success("Login successful!", { duration: 1000 });
          setShowAuthModal(false);
          await sleep(1000);
          router.push("/dashboard");
        }
      } else {
        const birthdate = formData.get("birthdate") as string;
        const gender = registerGender;

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, birthdate, gender }),
        });

        if (res.ok) {
          toast.success("Account created! Logging in...", { duration: 1000 });

          const loginResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (loginResult?.error) {
            toast.error("Login failed");
            setAuthError(loginResult.error);
          } else {
            toast.success("Login successful!", { duration: 1000 });
            setShowAuthModal(false);
            await sleep(1000);
            router.push("/dashboard");
          }
        } else {
          const error = await res.json();
          toast.error(error.message || "Registration failed");
          setAuthError(error.message || "Registration failed");
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "An error occurred";
      toast.error(error);
      setAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const modalSelectTriggerClass = cn(
    "w-full mt-2 !h-auto px-4 py-3 rounded-lg border transition-colors",
    darkMode
      ? "bg-white/5 border-white/10 focus:border-primary text-white"
      : "bg-gray-50 border-gray-200 focus:border-primary text-gray-900",
  );

  return (
    <div
      className={cn(
        "w-full min-h-screen transition-colors duration-300 overflow-x-clip",
        darkMode
          ? "bg-[#0A0A0A] text-white"
          : "bg-linear-to-br from-white via-gray-50 to-gray-100 text-gray-900",
      )}
    >
      <Navbar onOpenAuth={() => setShowAuthModal(true)} />

      <main className="w-full">
        {/* Hero Section */}
        <section className="relative w-full px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 md:pt-24 pb-16 sm:pb-24 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div
              className={cn(
                "absolute top-1/4 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30",
                darkMode ? "bg-primary/20" : "bg-primary/15",
              )}
            />
            <div
              className={cn(
                "absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20",
                darkMode ? "bg-blue-600/20" : "bg-blue-400/15",
              )}
            />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="space-y-6 sm:space-y-8">
                <h1 className="text-4xl xs:text-5xl sm:text-6xl font-black tracking-tighter leading-tight">
                  Track Your
                  <span className="block text-primary">Health Better</span>
                </h1>

                <p
                  className={cn(
                    "text-base xs:text-lg sm:text-lg md:text-xl max-w-lg leading-relaxed",
                    darkMode ? "text-gray-300" : "text-gray-600",
                  )}
                >
                  Advanced health metrics and insights to help you take control
                  of your wellness journey.
                </p>

                <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-semibold flex items-center justify-center gap-2 w-full xs:flex-1"
                  >
                    Get Started
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className={cn(
                      "px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-all border w-full xs:flex-1",
                      darkMode
                        ? "border-white/20 hover:border-white/40 hover:bg-white/5"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                    )}
                  >
                    Learn More
                  </button>
                </div>

                <div className="text-sm opacity-70">
                  <CheckCircle2
                    size={16}
                    className="inline mr-2 text-primary"
                  />
                  Join 10,000+ users tracking their health
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-6">
                <div
                  className={cn(
                    "p-8 rounded-2xl border backdrop-blur-sm transition-all",
                    darkMode
                      ? "bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/15 hover:border-primary/30"
                      : "bg-gradient-to-br from-white/40 via-white/30 to-white/20 border-white/30 hover:border-primary/30",
                  )}
                >
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-6">
                    Dashboard Preview
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Weight</span>
                      <span className="font-bold text-lg">72 kg</span>
                    </div>
                    <div
                      className={cn(
                        "h-2 rounded-full overflow-hidden",
                        darkMode ? "bg-white/10" : "bg-white/40",
                      )}
                    >
                      <div className="h-full w-3/4 bg-gradient-to-r from-primary to-blue-500 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">BMI</span>
                      <span className="font-bold text-lg">24.5</span>
                    </div>
                    <div
                      className={cn(
                        "h-2 rounded-full overflow-hidden",
                        darkMode ? "bg-white/10" : "bg-white/40",
                      )}
                    >
                      <div className="h-full w-2/3 bg-gradient-to-r from-primary to-green-500 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Daily Intake</span>
                      <span className="font-bold text-lg">2,100 kcal</span>
                    </div>
                    <div
                      className={cn(
                        "h-2 rounded-full overflow-hidden",
                        darkMode ? "bg-white/10" : "bg-white/40",
                      )}
                    >
                      <div className="h-full w-4/5 bg-gradient-to-r from-primary to-orange-500 rounded-full" />
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-6 pt-6 border-t flex items-center justify-between",
                      darkMode ? "border-white/10" : "border-white/20",
                    )}
                  >
                    <span className="text-sm opacity-70">This Month</span>
                    <span className="font-bold text-primary text-lg">
                      ↑ 5.2%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={cn(
                      "p-4 rounded-lg border transition-all text-center",
                      darkMode
                        ? "bg-white/5 border-white/10 hover:bg-white/10"
                        : "bg-white/30 border-white/20 hover:bg-white/40",
                    )}
                  >
                    <p className="text-xs opacity-60 mb-1">Streaks</p>
                    <p className="font-bold text-lg">12 days</p>
                  </div>
                  <div
                    className={cn(
                      "p-4 rounded-lg border transition-all text-center",
                      darkMode
                        ? "bg-white/5 border-white/10 hover:bg-white/10"
                        : "bg-white/30 border-white/20 hover:bg-white/40",
                    )}
                  >
                    <p className="text-xs opacity-60 mb-1">Goal</p>
                    <p className="font-bold text-lg">68 kg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Measurement Form */}
        <section
          className={cn(
            "w-full py-12 sm:py-16 px-4 sm:px-6 md:px-8 border-t",
            darkMode ? "border-white/10" : "border-gray-200",
          )}
        >
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-3">
                Try It Now
              </h2>
              <p
                className={cn(
                  "text-base sm:text-lg",
                  darkMode ? "text-gray-400" : "text-gray-600",
                )}
              >
                Calculate your health metrics instantly — no account needed.
              </p>
            </div>
            <QuickMeasurementForm darkMode={darkMode} />
          </div>
        </section>

        {/* Features Section */}
        <section
          className={cn(
            "w-full py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 border-t border-b",
            darkMode ? "border-white/10" : "border-gray-200",
          )}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 md:mb-16">
              Why Choose RatboD?
            </h2>

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1",
                    darkMode
                      ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      : "bg-gray-100/50 border-gray-200 hover:bg-gray-100 hover:border-gray-300",
                  )}
                >
                  <feature.icon className="text-primary mb-3" size={24} />
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      darkMode ? "text-gray-400" : "text-gray-600",
                    )}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div
              className={cn(
                "p-8 sm:p-12 rounded-2xl border text-center space-y-6",
                darkMode
                  ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  : "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
              )}
            >
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold">
                Ready to Start?
              </h2>
              <p
                className={cn(
                  "text-base sm:text-lg max-w-2xl mx-auto",
                  darkMode ? "text-gray-300" : "text-gray-700",
                )}
              >
                Join thousands tracking their health with RatboD. Start your
                free account today.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-semibold inline-flex items-center gap-2 text-base"
              >
                Create Free Account
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 w-screen overflow-x-hidden animate-in fade-in duration-200"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200",
              darkMode
                ? "bg-[#1a1a1a] border-white/10"
                : "bg-white border-gray-200",
            )}
          >
            {/* Modal Header */}
            <div
              className={cn(
                "flex items-center justify-between px-6 py-4 border-b",
                darkMode ? "border-white/10" : "border-gray-200",
              )}
            >
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {authMode === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    darkMode ? "text-gray-400" : "text-gray-500",
                  )}
                >
                  {authMode === "login"
                    ? "Sign in to continue your journey"
                    : "Start tracking your health today"}
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className={cn(
                  "shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                  darkMode
                    ? "hover:bg-white/10 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600",
                )}
                aria-label="Close"
              >
                <span className="text-lg leading-none">✕</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div
                className={cn(
                  "flex gap-1 p-1 rounded-lg",
                  darkMode ? "bg-white/5" : "bg-gray-100",
                )}
              >
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all",
                    authMode === "login"
                      ? "bg-primary text-white shadow-sm"
                      : darkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                  }}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all",
                    authMode === "register"
                      ? "bg-primary text-white shadow-sm"
                      : darkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === "register" && (
                  <div>
                    <label className="text-xs uppercase tracking-wider opacity-70">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      required
                      className={cn(
                        "w-full mt-2 px-4 py-3 rounded-lg border transition-colors",
                        darkMode
                          ? "bg-white/5 border-white/10 focus:border-primary text-white placeholder-gray-500"
                          : "bg-gray-50 border-gray-200 focus:border-primary text-gray-900 placeholder-gray-600",
                      )}
                    />
                  </div>
                )}

                {authMode === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <label className="text-xs uppercase tracking-wider opacity-70">
                        Birthdate
                      </label>
                      <input
                        type="date"
                        name="birthdate"
                        required
                        className={cn(
                          "w-full mt-2 px-4 py-3 rounded-lg border transition-colors",
                          darkMode
                            ? "bg-white/5 border-white/10 focus:border-primary text-white"
                            : "bg-gray-50 border-gray-200 focus:border-primary text-gray-900",
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="text-xs uppercase tracking-wider opacity-70">
                        Gender
                      </label>
                      <Select
                        value={registerGender}
                        onValueChange={(val) =>
                          setRegisterGender(val as "male" | "female")
                        }
                      >
                        <SelectTrigger className={modalSelectTriggerClass}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs uppercase tracking-wider opacity-70">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    required
                    className={cn(
                      "w-full mt-2 px-4 py-3 rounded-lg border transition-colors",
                      darkMode
                        ? "bg-white/5 border-white/10 focus:border-primary text-white placeholder-gray-500"
                        : "bg-gray-50 border-gray-200 focus:border-primary text-gray-900 placeholder-gray-600",
                    )}
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider opacity-70">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      required
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border transition-colors pr-10",
                        darkMode
                          ? "bg-white/5 border-white/10 focus:border-primary text-white placeholder-gray-500"
                          : "bg-gray-50 border-gray-200 focus:border-primary text-gray-900 placeholder-gray-600",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2",
                        darkMode
                          ? "text-gray-400 hover:text-gray-300"
                          : "text-gray-500 hover:text-gray-700",
                      )}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-500">{authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all disabled:opacity-50 font-semibold shadow-sm"
                >
                  {isLoading
                    ? "Processing..."
                    : authMode === "login"
                      ? "Login"
                      : "Create Account"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}