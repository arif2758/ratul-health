/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Download,
  Scale,
  Activity,
  RefreshCw,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  const { status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(true);
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Dark mode persistence
  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") !== "false";
    setDarkMode(isDark);
  }, []);

  const handleDarkModeChange = (value: boolean) => {
    setDarkMode(value);
    localStorage.setItem("darkMode", String(value));
  };

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
    // Calculate metrics internally or ensure dependencies are stable
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

    if (!internalMetricData.height || !internalMetricData.weight || !internalMetricData.age)
      return null;

    const bmi = calculateBMI(internalMetricData.weight, internalMetricData.height);
    const bmr = calculateBMR(internalMetricData);
    const tdee = calculateTDEE(bmr, internalMetricData.activityLevel);
    const bodyFat = calculateBodyFat(internalMetricData);
    const idealWeight = calculateIdealWeight(
      internalMetricData.height,
      internalMetricData.gender,
    );
    const idealFatRange = getIdealBodyFatRange(
      internalMetricData.gender,
      internalMetricData.age,
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

      await queries.saveMetrics({
        weight: parseFloat(weight),
        height: parseFloat(editHeight),
        age: parseInt(age),
        gender: editGender,
        waist: parseFloat(waist),
        neck: parseFloat(neck),
        hip: parseFloat(hip),
        activityLevel,
        bmi: 0,
        bmr: 0,
        tdee: 0,
      });

      setWeight("");
      setWaist("");
      setNeck("");
      setHip("");
      setHistoryRefreshTrigger((prev) => prev + 1);
      toast.success("Measurement saved successfully!");

      // Reload metrics
      const metricsData = await queries.getMetricsHistory();
      if (metricsData) {
        setMetricsHistory(Array.isArray(metricsData) ? metricsData : []);
      }
    } catch (error) {
      console.error("Error saving measurement:", error);
      toast.error("Failed to save measurement");
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;

    try {
      setIsGeneratingPdf(true);

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

      while (heightLeft >= 297) {
        position = heightLeft - 297;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`health-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download report");
    } finally {
      setIsGeneratingPdf(false);
    }
  };



  return (
    <div
      className={cn(
        "min-h-screen w-full transition-colors overflow-x-clip",
        darkMode
          ? "bg-gradient-to-br from-[#0F0F0F] to-[#1a1a1a] text-white"
          : "bg-white text-gray-900",
      )}
    >
      {/* Navbar */}
      <Navbar darkMode={darkMode} setDarkMode={handleDarkModeChange} />

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
                  goals={goals}
                />

                {/* Progress Chart */}
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
              "p-6 rounded-2xl border transition-all",
              darkMode
                ? "bg-white/5 border-white/10"
                : "bg-gray-50 border-gray-200",
            )}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Scale size={20} />
              Quick Measurement
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider opacity-60">
                  Weight ({unit === "metric" ? "kg" : "lb"})
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={cn(
                    "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                    darkMode
                      ? "bg-white/5 border-white/10 focus:border-primary"
                      : "bg-white border-gray-300 focus:border-primary",
                  )}
                  placeholder={unit === "metric" ? "70" : "154"}
                />
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
                        : "bg-white border-gray-300 focus:border-primary",
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
                        : "bg-white border-gray-300 focus:border-primary",
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
                        : "bg-white border-gray-300 focus:border-primary",
                    )}
                    placeholder="95"
                  />
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-wider opacity-60 flex items-center gap-2">
                  <Activity size={14} /> Activity Level
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
                      : "bg-white border-gray-300 focus:border-primary",
                  )}
                >
                  {activityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {opt.desc && `- ${opt.desc}`}
                    </option>
                  ))}
                </select>
              </div>

              {metrics && (
                <div
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    darkMode
                      ? "bg-primary/10 border-primary/20"
                      : "bg-primary-light border-primary/20",
                  )}
                >
                  <p className="text-sm font-semibold mb-2">Quick Preview:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      BMI:{" "}
                      <span className="font-bold">
                        {metrics.bmi.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      Body Fat:{" "}
                      <span className="font-bold">
                        {metrics.bodyFat.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      TDEE:{" "}
                      <span className="font-bold">
                        {Math.round(metrics.tdee)}
                      </span>{" "}
                      kcal
                    </div>
                    <div>
                      Category:{" "}
                      <span className="font-bold">{metrics.category}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveMeasurement}
                disabled={!weight}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Save Measurement
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {metrics && (
            <div
              className={cn(
                "p-6 rounded-2xl border transition-all space-y-4",
                darkMode
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Detailed Analysis</h3>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  {isGeneratingPdf ? "Generating..." : "Download PDF"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase opacity-60 mb-1">BMI</p>
                  <p className="text-2xl font-bold">{metrics.bmi.toFixed(1)}</p>
                  <p className="text-xs text-primary">{metrics.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase opacity-60 mb-1">
                    Body Fat %
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics.bodyFat.toFixed(1)}%
                  </p>
                  <p className="text-xs opacity-60">
                    Ideal: {metrics.idealFatRange.min}-
                    {metrics.idealFatRange.max}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase opacity-60 mb-1">BMR</p>
                  <p className="text-2xl font-bold">
                    {Math.round(metrics.bmr)}
                  </p>
                  <p className="text-xs opacity-60">kcal/day</p>
                </div>
                <div>
                  <p className="text-xs uppercase opacity-60 mb-1">TDEE</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(metrics.tdee)}
                  </p>
                  <p className="text-xs opacity-60">kcal/day</p>
                </div>
              </div>
            </div>
          )}

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

        {/* Hidden PDF Report */}
        <div className="fixed -left-2499.75 top-0 pointer-events-none">
          <div
            ref={reportRef}
            style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}
            className="p-12 w-200 space-y-12"
          >
            <div
              style={{ borderBottom: "1px solid #e5e7eb" }}
              className="flex justify-between items-start pb-8"
            >
              <div>
                <h1
                  style={{ color: "#32CD32" }}
                  className="text-4xl font-black tracking-tighter"
                >
                  RatboD
                </h1>
                <p style={{ color: "#6b7280" }}>
                  Health Analysis for {editName || "User"}
                </p>
              </div>
              <div style={{ color: "#9ca3af" }} className="text-right text-sm">
                <p>Generated on {new Date().toLocaleDateString()}</p>
                <p>
                  Report ID:{" "}
                  {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
              </div>
            </div>

            {metrics && (
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h2
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      color: "#1f2937",
                    }}
                    className="text-xl font-semibold pb-2"
                  >
                    Profile
                  </h2>
                  <div className="grid grid-cols-2 gap-y-4 text-sm space-y-2">
                    <span style={{ color: "#6b7280" }}>Gender:</span>
                    <span
                      style={{ color: "#111827" }}
                      className="font-medium capitalize"
                    >
                      {editGender}
                    </span>
                    <span style={{ color: "#6b7280" }}>Age:</span>
                    <span style={{ color: "#111827" }} className="font-medium">
                      {age} years
                    </span>
                    <span style={{ color: "#6b7280" }}>Height:</span>
                    <span style={{ color: "#111827" }} className="font-medium">
                      {editHeight} {unit === "metric" ? "cm" : "in"}
                    </span>
                    <span style={{ color: "#6b7280" }}>Weight:</span>
                    <span style={{ color: "#111827" }} className="font-medium">
                      {weight} {unit === "metric" ? "kg" : "lb"}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      color: "#1f2937",
                    }}
                    className="text-xl font-semibold pb-2"
                  >
                    Key Metrics
                  </h2>
                  <div className="grid grid-cols-2 gap-y-4 text-sm space-y-2">
                    <span style={{ color: "#6b7280" }}>BMI:</span>
                    <span style={{ color: "#111827" }} className="font-bold">
                      {metrics.bmi.toFixed(1)} ({metrics.category})
                    </span>
                    <span style={{ color: "#6b7280" }}>Body Fat:</span>
                    <span style={{ color: "#111827" }} className="font-bold">
                      {metrics.bodyFat.toFixed(1)}%
                    </span>
                    <span style={{ color: "#6b7280" }}>BMR:</span>
                    <span style={{ color: "#111827" }} className="font-bold">
                      {Math.round(metrics.bmr)} kcal/day
                    </span>
                    <span style={{ color: "#6b7280" }}>TDEE:</span>
                    <span style={{ color: "#32CD32" }} className="font-bold">
                      {Math.round(metrics.tdee)} kcal/day
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div
              style={{ backgroundColor: "#f0fdf4", borderRadius: "1rem" }}
              className="p-8 space-y-4"
            >
              <h3 style={{ color: "#111827" }} className="font-semibold">
                Health Recommendations
              </h3>
              <p
                style={{ color: "#4b5563" }}
                className="text-sm leading-relaxed"
              >
                Based on your health metrics, maintain a balanced diet and
                regular exercise routine. Always consult with a healthcare
                professional before making significant changes to your
                lifestyle.
              </p>
            </div>

            <div
              style={{ borderTop: "1px solid #e5e7eb", color: "#9ca3af" }}
              className="pt-12 text-center text-[10px]"
            >
              <p>© {new Date().getFullYear()} RatboD. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </main>
  </div>
);
}
