"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Navbar from "@/components/Navbar";
import { queries } from "@/queries/queries";
import type { Metrics } from "@/types";
import { ProgressChart } from "@/components/ProgressChart";
import HistoryComponent from "@/components/History";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TimeRange = 7 | 30 | 90 | 180 | 365 | null;

const RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "1W", value: 7 },
  { label: "1M", value: 30 },
  { label: "3M", value: 90 },
  { label: "6M", value: 180 },
  { label: "1Y", value: 365 },
  { label: "ALL", value: null },
];

export default function DetailedHistoryPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  
  const [timeRange, setTimeRange] = useState<TimeRange>(30); // Default to 1 Month
  const [allMetrics, setAllMetrics] = useState<Metrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await queries.getMetricsHistory();
        if (data && Array.isArray(data)) {
          setAllMetrics(data);
        }
      } catch (error) {
        console.error("Failed to load history data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [status]);

  const darkMode = resolvedTheme === "dark";

  // Filter metrics for the CHART based on selected time range
  const filteredMetricsForChart = useMemo(() => {
    if (!timeRange) return allMetrics;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    return allMetrics.filter((entry) => {
      if (!entry.createdAt) return false;
      return new Date(entry.createdAt) >= cutoffDate;
    });
  }, [allMetrics, timeRange]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (filteredMetricsForChart.length < 2) return null;
    
    // metrics are sorted newest first
    const newest = filteredMetricsForChart[0];
    const oldest = filteredMetricsForChart[filteredMetricsForChart.length - 1];
    
    const weightDiff = newest.weight - oldest.weight;
    
    return {
      weightDiff,
      startWeight: oldest.weight,
      currentWeight: newest.weight,
    };
  }, [filteredMetricsForChart]);

  if (!mounted) return <div className="min-h-screen bg-white dark:bg-[#0F0F0F]" />;

  return (
    <div
      className={cn(
        "min-h-screen w-full transition-colors overflow-x-clip pb-20",
        darkMode ? "bg-[#0A0A0A] text-white" : "bg-white text-gray-900",
      )}
    >
      <Navbar onOpenAuth={() => router.push("/?login=true")} />

      <main className="w-full px-4 sm:px-6 md:px-8 max-w-5xl mx-auto pt-6 sm:pt-8 md:pt-10">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className={cn(
                "p-2 rounded-xl border transition-colors",
                darkMode 
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300" 
                  : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
              )}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Detailed Analytics</h1>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                In-depth view of your health journey
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className={cn(
            "flex p-1 rounded-xl w-full sm:w-auto overflow-x-auto border",
            darkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-black/5"
          )}>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setTimeRange(opt.value)}
                className={cn(
                  "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  timeRange === opt.value
                    ? darkMode
                      ? "bg-[#1a1a1a] text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                    : darkMode
                      ? "text-gray-400 hover:text-white hover:bg-white/5"
                      : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center py-20">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Top Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className={cn("p-5 rounded-2xl border", darkMode ? "bg-white/[2%] border-white/10" : "bg-gray-50 border-gray-200")}>
                    <p className="text-xs uppercase tracking-wider font-bold opacity-50 mb-1">Period Progress</p>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "text-3xl font-extrabold tracking-tight", 
                         stats.weightDiff < 0 ? "text-primary" : stats.weightDiff > 0 ? "text-red-500" : ""
                       )}>
                         {Math.abs(stats.weightDiff).toFixed(1)} <span className="text-lg text-gray-500 ml-0.5">kg</span>
                       </span>
                       <div className={cn(
                         "flex items-center justify-center w-8 h-8 rounded-full",
                         stats.weightDiff < 0 ? "bg-primary/20 text-primary" : stats.weightDiff > 0 ? "bg-red-500/20 text-red-500" : "bg-gray-500/20 text-gray-400"
                       )}>
                         {stats.weightDiff < 0 ? <TrendingDown size={18} /> : stats.weightDiff > 0 ? <TrendingUp size={18} /> : <Minus size={18} />}
                       </div>
                    </div>
                    <p className="text-xs opacity-50 mt-1">
                      {stats.weightDiff < 0 ? "Lost" : stats.weightDiff > 0 ? "Gained" : "Maintained"} in selected period
                    </p>
                 </div>
                 
                 <div className={cn("p-5 rounded-2xl border", darkMode ? "bg-white/[2%] border-white/10" : "bg-gray-50 border-gray-200")}>
                    <p className="text-xs uppercase tracking-wider font-bold opacity-50 mb-1">Start Weight</p>
                    <p className="text-3xl font-extrabold tracking-tight">{stats.startWeight.toFixed(1)} <span className="text-lg text-gray-500 ml-0.5">kg</span></p>
                 </div>

                 <div className={cn("p-5 rounded-2xl border", darkMode ? "bg-white/[2%] border-white/10" : "bg-gray-50 border-gray-200")}>
                    <p className="text-xs uppercase tracking-wider font-bold opacity-50 mb-1">Current Weight</p>
                    <p className="text-3xl font-extrabold tracking-tight">{stats.currentWeight.toFixed(1)} <span className="text-lg text-gray-500 ml-0.5">kg</span></p>
                 </div>
              </div>
            )}

            {/* Chart Area */}
            {filteredMetricsForChart.length > 0 ? (
              <div className="mt-8">
                <ProgressChart 
                  darkMode={darkMode} 
                  metrics={filteredMetricsForChart} 
                  chartType="weight" 
                />
              </div>
            ) : (
               <div className={cn(
                 "p-12 rounded-3xl border text-center border-dashed",
                 darkMode ? "border-white/10 bg-white/5" : "border-gray-300 bg-gray-50"
               )}>
                 <p className="opacity-60 font-medium">Not enough data to generate chart for this period.</p>
               </div>
            )}

            {/* History Table Area */}
            <div className="mt-12">
               <HistoryComponent
                  darkMode={darkMode}
                  unit="metric"
                  isLoggedIn={true}
                  filterDays={timeRange}
                  hideHeader={true} // Hides default header to blend smoothly
               />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}