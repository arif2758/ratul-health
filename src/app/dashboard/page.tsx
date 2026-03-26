// src/app/dashboard/page.tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Scale, Activity, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

import {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateBodyFat,
  calculateIdealWeight,
  getBMICategory,
  getIdealBodyFatRange,
  type Gender,
  type ActivityLevel,
  type BodyData,
} from "@/lib/calculations";
import { queries } from "@/queries/queries";
import type { User, Metrics, Goal } from "@/types";
import Goals from "@/components/Goals";
import HistoryComponent from "@/components/History";
import { QuickStats } from "@/components/QuickStats";
import { ProgressChart } from "@/components/ProgressChart";
import { ChartSkeleton, CardSkeleton } from "@/components/Skeleton";
import { validateMetricsForm } from "@/lib/validation";
import Navbar from "@/components/Navbar";
import { useTheme } from "next-themes";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const activityOptions = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  {
    value: "light",
    label: "Light",
    desc: "Light exercise 1-3 days/week",
  },
  {
    value: "moderate",
    label: "Moderate",
    desc: "Moderate exercise 3-5 days/week",
  },
  {
    value: "active",
    label: "Active",
    desc: "Hard exercise 6-7 days/week",
  },
  {
    value: "very_active",
    label: "Very Active",
    desc: "Very hard exercise/physical work",
  },
];

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [unit] = useState<"metric" | "imperial">("metric");

  // Profile editing
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<Gender>("male");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editHeight, setEditHeight] = useState("");

  // Quick measurement
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [hip, setHip] = useState("");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("sedentary");

  const [metricsHistory, setMetricsHistory] = useState<Metrics[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Accordion state
  const [isIdealWeightOpen, setIsIdealWeightOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user and metrics
  useEffect(() => {
    if (status !== "authenticated") return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [userData, metricsData, goalsData] = await Promise.all([
          queries.getMe(),
          queries.getMetricsHistory(),
          queries.getGoals(),
        ]);

        if (userData) {
          setUser(userData);
          setEditName(userData.name || "");
          setEditGender(userData.gender || "male");
          setEditBirthdate(userData.birthdate || "");
          setEditHeight(userData.height ? String(userData.height) : "");
        }

        if (metricsData) {
          setMetricsHistory(Array.isArray(metricsData) ? metricsData : []);
        }

        if (goalsData) {
          setGoals(Array.isArray(goalsData) ? goalsData : []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
        setIsLoadingHistory(false);
      }
    };

    loadData();
  }, [status]);

  // Calculate age from birthdate
  const age = useMemo(() => {
    if (!editBirthdate) return "";
    const birthDate = new Date(editBirthdate);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge--;
    }
    return calculatedAge.toString();
  }, [editBirthdate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const internalMetricData: BodyData = {
      weight: parseFloat(weight) || 0,
      height: parseFloat(editHeight) || 0,
      gender: editGender,
      age: parseInt(age) || 0,
      waist: parseFloat(waist) || 0,
      neck: parseFloat(neck) || 0,
      hip: parseFloat(hip) || 0,
      activityLevel,
    };

    if (
      !internalMetricData.height ||
      !internalMetricData.weight ||
      !internalMetricData.age
    )
      return null;

    const bmi = calculateBMI(
      internalMetricData.weight,
      internalMetricData.height
    );
    const bmr = calculateBMR(internalMetricData);
    const tdee = calculateTDEE(bmr, internalMetricData.activityLevel);
    const bodyFat = calculateBodyFat(internalMetricData);
    const idealWeight = calculateIdealWeight(
      internalMetricData.height,
      internalMetricData.gender
    );
    const idealFatRange = getIdealBodyFatRange(
      internalMetricData.gender,
      internalMetricData.age
    );

    const weightDiff = {
      kg: Math.abs(internalMetricData.weight - idealWeight.kg),
      lb: Math.abs(internalMetricData.weight * 2.20462 - idealWeight.lb),
      type:
        internalMetricData.weight < idealWeight.kg * 0.95
          ? ("gain" as const)
          : internalMetricData.weight > idealWeight.kg * 1.05
            ? ("lose" as const)
            : ("maintain" as const),
    };

    return {
      bmi,
      bmr,
      tdee,
      bodyFat,
      idealWeight,
      idealFatRange,
      category: getBMICategory(bmi),
      weightDiff,
    };
  }, [weight, editHeight, editGender, age, waist, neck, hip, activityLevel]);

  const handleSaveMeasurement = async () => {
    try {
      const validationErrors = validateMetricsForm({
        weight,
        height: editHeight,
        age,
        gender: editGender,
        waist,
        neck,
        hip,
      });

      if (validationErrors.length > 0) {
        validationErrors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`);
        });
        return;
      }

      if (!user?.height && editHeight) {
        await queries.updateProfile({ height: parseFloat(editHeight) });
        const updatedUser = await queries.getMe();
        if (updatedUser) setUser(updatedUser);
      }

      await queries.saveMetrics({
        weight: parseFloat(weight),
        height: parseFloat(editHeight),
        age: parseInt(age),
        gender: editGender,
        waist: parseFloat(waist),
        neck: parseFloat(neck),
        hip: parseFloat(hip),
        activityLevel,
        bmi: metrics ? metrics.bmi : 0,
        bmr: metrics ? metrics.bmr : 0,
        tdee: metrics ? metrics.tdee : 0,
        bodyFat: metrics ? metrics.bodyFat : 0,
        bodyFatPercentage: metrics ? metrics.bodyFat : 0,
      });

      setWeight("");
      setWaist("");
      setNeck("");
      setHip("");
      setHistoryRefreshTrigger((prev) => prev + 1);
      toast.success("Measurement saved successfully!");

      const metricsData = await queries.getMetricsHistory();
      if (metricsData) {
        setMetricsHistory(Array.isArray(metricsData) ? metricsData : []);
      }
    } catch (error) {
      console.error("Error saving measurement:", error);
      toast.error("Failed to save measurement");
    }
  };

  const darkMode = resolvedTheme === "dark";

  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-[#0F0F0F]" />;
  }

  return (
    <div
      className={cn(
        "min-h-screen w-full transition-colors overflow-x-clip",
        darkMode
          ? "bg-gradient-to-br from-[#0F0F0F] to-[#1a1a1a] text-white"
          : "bg-white text-gray-900"
      )}
    >
      <Navbar onOpenAuth={() => router.push("/?login=true")} />

      <main className="w-full px-4 sm:px-6 md:px-8 max-w-5xl mx-auto pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12">
        {!user && !isLoading ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-xl">Please log in to view your profile</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Quick Stats */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : metricsHistory.length > 0 ? (
              <>
                <QuickStats
                  darkMode={darkMode}
                  latestMetrics={metricsHistory?.[0]}
                  initialWeight={
                    metricsHistory[metricsHistory.length - 1]?.weight
                  }
                  goals={goals}
                />

                {isLoadingHistory ? (
                  <ChartSkeleton />
                ) : (
                  <ProgressChart
                    darkMode={darkMode}
                    metrics={metricsHistory}
                    chartType="weight"
                  />
                )}
              </>
            ) : null}

            {/* Quick Measurement Form */}
            <div
              className={cn(
                "p-6 rounded-3xl border transition-all shadow-2xl",
                darkMode
                  ? "bg-white/[3%] backdrop-blur-xl border-white/10 shadow-black/40"
                  : "bg-white/60 backdrop-blur-xl border-black/5 shadow-gray-200/80"
              )}
            >
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Scale size={20} />
                Quick Measurement
              </h3>

              {/* ROW 1: Form (left) + Your Health Goal (right) */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: Input form */}
                <div className="flex-1 min-w-0 space-y-4">
                  {(!user?.birthdate || !user?.gender || !user?.height) && (
                    <div className="p-3 mb-2 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary mb-0.5">
                          Complete Your Profile
                        </p>
                        <p className="opacity-80">
                          Add missing details for accurate health metrics.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/profile")}
                        className="text-primary font-medium hover:underline whitespace-nowrap ml-4"
                      >
                        Go to Profile
                      </button>
                    </div>
                  )}

                  <div
                    className={cn(
                      "grid gap-4",
                      !user?.height ? "grid-cols-2" : "grid-cols-1"
                    )}
                  >
                    <div>
                      <label className="text-xs uppercase tracking-wider opacity-60">
                        Weight ({unit === "metric" ? "kg" : "lb"}) *
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        className={cn(
                          "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                          darkMode
                            ? "bg-white/5 border-white/10 focus:border-primary"
                            : "bg-white border-gray-300 focus:border-primary"
                        )}
                        placeholder={unit === "metric" ? "70" : "154"}
                      />
                    </div>
                    {!user?.height && (
                      <div>
                        <label className="text-xs uppercase tracking-wider opacity-60">
                          Height ({unit === "metric" ? "cm" : "in"}) *
                        </label>
                        <input
                          type="number"
                          value={editHeight}
                          onChange={(e) => setEditHeight(e.target.value)}
                          required
                          className={cn(
                            "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                            darkMode
                              ? "bg-white/5 border-primary/50 focus:border-primary"
                              : "bg-white border-primary/50 focus:border-primary"
                          )}
                          placeholder={unit === "metric" ? "175" : "69"}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider opacity-60">
                        Waist ({unit === "metric" ? "cm" : "in"})
                      </label>
                      <input
                        type="number"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        className={cn(
                          "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                          darkMode
                            ? "bg-white/5 border-white/10 focus:border-primary"
                            : "bg-white border-gray-300 focus:border-primary"
                        )}
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider opacity-60">
                        Neck ({unit === "metric" ? "cm" : "in"})
                      </label>
                      <input
                        type="number"
                        value={neck}
                        onChange={(e) => setNeck(e.target.value)}
                        className={cn(
                          "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                          darkMode
                            ? "bg-white/5 border-white/10 focus:border-primary"
                            : "bg-white border-gray-300 focus:border-primary"
                        )}
                        placeholder="38"
                      />
                    </div>
                  </div>

                  {editGender === "female" && (
                    <div>
                      <label className="text-xs uppercase tracking-wider opacity-60">
                        Hip ({unit === "metric" ? "cm" : "in"})
                      </label>
                      <input
                        type="number"
                        value={hip}
                        onChange={(e) => setHip(e.target.value)}
                        className={cn(
                          "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                          darkMode
                            ? "bg-white/5 border-white/10 focus:border-primary"
                            : "bg-white border-gray-300 focus:border-primary"
                        )}
                        placeholder="95"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs uppercase tracking-wider opacity-60 flex items-center gap-2">
                      <Activity size={14} /> Activity Level *
                    </label>
                    <select
                      value={activityLevel}
                      onChange={(e) =>
                        setActivityLevel(e.target.value as ActivityLevel)
                      }
                      className={cn(
                        "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                        darkMode
                          ? "bg-white/5 border-white/10 focus:border-primary"
                          : "bg-white border-gray-300 focus:border-primary"
                      )}
                    >
                      {activityOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        >
                          {opt.label} {opt.desc && `- ${opt.desc}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* RIGHT: Your Health Goal + Ideal Body Weight Accordion */}
                <div className="flex-1 min-w-0 space-y-4">
                  {metrics ? (
                    <>
                      {/* Your Health Goal */}
                      {(() => {
                        const { type, kg, lb } = metrics.weightDiff;
                        const isMaintain = type === "maintain";
                        const isGain = type === "gain";
                        const goalColor = isMaintain
                          ? "#32CD32"
                          : isGain
                            ? "#3B82F6"
                            : "#EF4444";
                        const goalLabel = isMaintain
                          ? "MAINTAIN"
                          : isGain
                            ? "GAIN WEIGHT"
                            : "LOSE WEIGHT";
                        const goalBg = isMaintain
                          ? darkMode
                            ? "bg-green-900/30 border-green-500/30"
                            : "bg-green-50 border-green-200"
                          : isGain
                            ? darkMode
                              ? "bg-blue-900/30 border-blue-500/30"
                              : "bg-blue-50 border-blue-200"
                            : darkMode
                              ? "bg-red-900/30 border-red-500/30"
                              : "bg-red-50 border-red-200";
                        const iconBg = isMaintain
                          ? darkMode
                            ? "bg-green-500/20"
                            : "bg-green-100"
                          : isGain
                            ? darkMode
                              ? "bg-blue-500/20"
                              : "bg-blue-100"
                            : darkMode
                              ? "bg-red-500/20"
                              : "bg-red-100";
                        const goalMessage = isMaintain
                          ? "Excellent! You are currently at your ideal body weight. Focus on maintaining your healthy habits."
                          : isGain
                            ? `To reach your ideal body weight of ${metrics.idealWeight.kg.toFixed(1)}kg, you should aim to gain ${kg.toFixed(1)}kg.`
                            : `To reach your ideal body weight of ${metrics.idealWeight.kg.toFixed(1)}kg, you should aim to lose ${kg.toFixed(1)}kg.`;
                        return (
                          <div className={cn("p-5 rounded-2xl border", goalBg)}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className={cn("p-1.5 rounded-lg", iconBg)}>
                                <Activity
                                  size={14}
                                  style={{ color: goalColor }}
                                />
                              </div>
                              <p className="font-bold text-sm">
                                Your Health Goal
                              </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-x-6 gap-y-1 mb-3">
                              <div>
                                <p className="text-[9px] uppercase tracking-widest opacity-50 mb-0.5">
                                  Target Action
                                </p>
                                <p
                                  className="text-2xl font-extrabold tracking-tight"
                                  style={{ color: goalColor }}
                                >
                                  {goalLabel}
                                </p>
                              </div>
                              {!isMaintain && (
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest opacity-50 mb-0.5">
                                    Weight Difference
                                  </p>
                                  <p className="text-xl font-extrabold">
                                    {kg.toFixed(1)}
                                    <span className="text-sm font-normal opacity-60 ml-1">
                                      kg
                                    </span>
                                    <span className="text-sm font-normal opacity-40 ml-2">
                                      / {lb.toFixed(1)} lb
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                            <div
                              className={cn(
                                "p-3 rounded-xl text-sm font-medium",
                                darkMode ? "bg-black/20" : "bg-white/60"
                              )}
                            >
                              {goalMessage}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Ideal Body Weight - Accordion */}
                      <div
                        className={cn(
                          "rounded-xl border overflow-hidden transition-all",
                          darkMode
                            ? "bg-white/5 border-white/10"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        {/* Accordion Header */}
                        <button
                          onClick={() => setIsIdealWeightOpen(!isIdealWeightOpen)}
                          className={cn(
                            "w-full px-4 py-3 flex items-center justify-between transition-colors",
                            darkMode
                              ? "hover:bg-white/5"
                              : "hover:bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "p-1.5 rounded-lg",
                                darkMode ? "bg-white/10" : "bg-gray-200"
                              )}
                            >
                              <Scale size={13} className="opacity-60" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold uppercase tracking-wider">
                                Ideal Body Weight
                              </p>
                              <p className="text-[10px] opacity-40">
                                {metrics.idealWeight.kg.toFixed(1)} kg / {metrics.idealWeight.lb.toFixed(1)} lb
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            size={18}
                            className={cn(
                              "opacity-50 transition-transform duration-200",
                              isIdealWeightOpen && "rotate-180"
                            )}
                          />
                        </button>

                        {/* Accordion Content */}
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-200 ease-in-out",
                            isIdealWeightOpen
                              ? "max-h-40 opacity-100"
                              : "max-h-0 opacity-0"
                          )}
                        >
                          <div className="px-4 pb-4">
                            <div
                              className={cn(
                                "h-px mb-3",
                                darkMode ? "bg-white/10" : "bg-gray-200"
                              )}
                            />
                            <p className="text-[10px] opacity-40 mb-2">
                              Devine Formula ({editGender === "male" ? "Male" : "Female"})
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div
                                className={cn(
                                  "p-3 rounded-lg",
                                  darkMode
                                    ? "bg-white/5"
                                    : "bg-white border border-gray-100"
                                )}
                              >
                                <p className="text-[9px] uppercase tracking-wider opacity-40 mb-1">
                                  Metric
                                </p>
                                <p className="text-xl font-bold">
                                  {metrics.idealWeight.kg.toFixed(1)}
                                  <span className="text-xs font-normal opacity-50 ml-1">
                                    kg
                                  </span>
                                </p>
                              </div>
                              <div
                                className={cn(
                                  "p-3 rounded-lg",
                                  darkMode
                                    ? "bg-white/5"
                                    : "bg-white border border-gray-100"
                                )}
                              >
                                <p className="text-[9px] uppercase tracking-wider opacity-40 mb-1">
                                  Imperial
                                </p>
                                <p className="text-xl font-bold">
                                  {metrics.idealWeight.lb.toFixed(1)}
                                  <span className="text-xs font-normal opacity-50 ml-1">
                                    lb
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      className={cn(
                        "p-6 rounded-2xl border text-center",
                        darkMode
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <Activity
                        size={32}
                        className="mx-auto mb-3 opacity-30"
                      />
                      <p className="text-sm font-medium opacity-60">
                        Enter your measurements to see health analysis
                      </p>
                      <p className="text-xs opacity-40 mt-1">
                        Weight, height, and age are required
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 2: Analysis Results - 4 cards in one row (desktop) / 2x2 (mobile) */}
              {metrics && (
                <div className="mt-6">
                  <p className="text-[10px] uppercase tracking-widest opacity-40 font-semibold mb-3">
                    Analysis Results
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* BMI Card */}
                    <div
                      className={cn(
                        "p-4 rounded-xl border",
                        darkMode
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1 flex items-center justify-between">
                        BMI
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide",
                            darkMode
                              ? "bg-primary/20 text-primary"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {metrics.category}
                        </span>
                      </p>
                      <p className="text-2xl font-extrabold">
                        {metrics.bmi.toFixed(1)}
                        <span className="text-xs font-normal opacity-50 ml-1">
                          kg/m<sup>2</sup>
                        </span>
                      </p>
                      <div
                        className={cn(
                          "mt-2 h-1 rounded-full overflow-hidden",
                          darkMode ? "bg-white/10" : "bg-gray-200"
                        )}
                      >
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.min((metrics.bmi / 40) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Body Fat Card */}
                    <div
                      className={cn(
                        "p-4 rounded-xl border",
                        darkMode
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                        Body Fat
                      </p>
                      <p className="text-2xl font-extrabold">
                        {metrics.bodyFat.toFixed(1)}
                        <span className="text-xs font-normal opacity-50 ml-0.5">
                          %
                        </span>
                      </p>
                      <p className="text-[10px] text-primary mt-1">
                        Ideal: {metrics.idealFatRange.min}-
                        {metrics.idealFatRange.max}%
                      </p>
                    </div>

                    {/* BMR Card */}
                    <div
                      className={cn(
                        "p-4 rounded-xl border",
                        darkMode
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                        Basal Metabolic Rate
                      </p>
                      <p className="text-2xl font-extrabold">
                        {Math.round(metrics.bmr)}
                        <span className="text-xs font-normal opacity-50 ml-1">
                          kcal/day
                        </span>
                      </p>
                      <p className="text-[10px] opacity-40 mt-1">
                        Calories burned at rest
                      </p>
                    </div>

                    {/* TDEE Card */}
                    <div
                      className={cn(
                        "p-4 rounded-xl border",
                        darkMode
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                        Total Daily Energy
                      </p>
                      <p className="text-2xl font-extrabold text-primary">
                        {Math.round(metrics.tdee)}
                        <span className="text-xs font-normal opacity-50 ml-1">
                          kcal/day
                        </span>
                      </p>
                      <p className="text-[10px] opacity-40 mt-1">
                        To maintain current weight
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveMeasurement}
                disabled={!weight}
                className="mt-5 w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold tracking-wide"
              >
                Save Measurement
              </button>
            </div>

            {/* Goals Section */}
            {user && (
              <div className="mt-12">
                <Goals
                  darkMode={darkMode}
                  unit={unit}
                  currentWeight={parseFloat(weight) || 0}
                  currentBodyFat={metrics?.bodyFat}
                />
              </div>
            )}

            {/* History Section */}
            {user && (
              <div className="mt-12">
                <HistoryComponent
                  darkMode={darkMode}
                  unit={unit}
                  refreshTrigger={historyRefreshTrigger}
                  isLoggedIn={true}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}