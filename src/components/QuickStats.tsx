"use client";
import React, { useMemo } from "react";
import { TrendingDown, TrendingUp, Target, Calendar } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Metrics, Goal } from "@/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuickStatsProps {
  darkMode: boolean;
  latestMetrics?: Metrics;
  goals?: Goal[];
}

export function QuickStats({
  darkMode,
  latestMetrics,
  goals,
}: QuickStatsProps) {
  const calculateGoalProgress = () => {
    if (!latestMetrics || !goals || goals.length === 0) return 0;

    const weightGoal = goals.find((g) => g.targetWeight);
    if (!weightGoal || !weightGoal.targetWeight) return 0;

    const currentWeight = latestMetrics.weight;
    const targetWeight = weightGoal.targetWeight;
    const initialWeight = currentWeight; // Would need historical data for actual initial

    if (currentWeight === targetWeight) return 100;

    const progress =
      ((initialWeight - currentWeight) / (initialWeight - targetWeight)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const daysSinceLastEntry = useMemo(() => {
    if (!latestMetrics) return null;

    const now = new Date();
    const entryDate = new Date(latestMetrics.createdAt || "");
    const diffTime = now.getTime() - entryDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }, [latestMetrics]);

  const goalProgress = calculateGoalProgress();
  const targetWeight = goals?.find((g) => g.targetWeight)?.targetWeight;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Latest Entry */}
      <div
        className={cn(
          "p-4 rounded-2xl border shadow-md transition-all duration-200",
          darkMode
            ? "bg-gradient-to-br from-white/[8%] to-white/[3%] border-white/10"
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Latest Entry
          </span>
          <Calendar size={16} className="text-primary/60" />
        </div>
        <div className="space-y-2">
          <p
            className={cn(
              "text-2xl font-light tracking-tight",
              darkMode ? "text-white" : "text-gray-900",
            )}
          >
            {latestMetrics
              ? `${latestMetrics.weight.toFixed(1)} ${
                  latestMetrics.height > 200 ? "lb" : "kg"
                }`
              : "No data"}
          </p>
          {daysSinceLastEntry !== null && (
            <p className="text-xs text-gray-500">
              {daysSinceLastEntry === 0
                ? "Today"
                : daysSinceLastEntry === 1
                  ? "Yesterday"
                  : `${daysSinceLastEntry} days ago`}
            </p>
          )}
        </div>
      </div>

      {/* Goal Progress */}
      <div
        className={cn(
          "p-4 rounded-2xl border shadow-md transition-all duration-200",
          darkMode
            ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
            : "bg-gradient-to-br from-primary-light to-primary-light/50 border-primary/20",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Goal Progress
          </span>
          <Target size={16} className="text-primary" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-2xl font-light tracking-tight",
                darkMode ? "text-white" : "text-gray-900",
              )}
            >
              {goalProgress.toFixed(0)}%
            </p>
            {goalProgress > 0 && (
              <TrendingDown size={16} className="text-primary" />
            )}
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          {targetWeight && (
            <p className="text-xs text-gray-500">
              Target: {targetWeight.toFixed(1)} kg
            </p>
          )}
        </div>
      </div>

      {/* Health Status */}
      <div
        className={cn(
          "p-4 rounded-2xl border shadow-md transition-all duration-200",
          darkMode
            ? "bg-gradient-to-br from-white/[8%] to-white/[3%] border-white/10"
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Health Status
          </span>
          {latestMetrics && latestMetrics.bmi && (
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                latestMetrics.bmi < 18.5
                  ? "bg-blue-500"
                  : latestMetrics.bmi < 25
                    ? "bg-primary"
                    : latestMetrics.bmi < 30
                      ? "bg-yellow-500"
                      : "bg-red-500",
              )}
            />
          )}
        </div>
        <div className="space-y-1">
          {latestMetrics && latestMetrics.bmi ? (
            <>
              <p
                className={cn(
                  "text-sm font-bold",
                  darkMode ? "text-white" : "text-gray-900",
                )}
              >
                {latestMetrics.bmi < 18.5
                  ? "Underweight"
                  : latestMetrics.bmi < 25
                    ? "Normal weight"
                    : latestMetrics.bmi < 30
                      ? "Overweight"
                      : "Obese"}
              </p>
              <p className="text-xs text-gray-500">
                BMI: {latestMetrics.bmi.toFixed(1)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
