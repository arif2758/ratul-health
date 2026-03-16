import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Metrics } from "@/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProgressChartProps {
  darkMode: boolean;
  metrics: Metrics[];
  chartType?: "weight" | "bmi" | "all";
}

export function ProgressChart({
  darkMode,
  metrics,
  chartType = "weight",
}: ProgressChartProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div
        className={cn(
          "p-8 rounded-2xl border text-center",
          darkMode
            ? "bg-gradient-to-br from-white/[8%] to-white/[3%] border-white/10"
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200",
        )}
      >
        <p className="text-gray-500">
          No data available. Save metrics to see the progress chart.
        </p>
      </div>
    );
  }

  const chartData = metrics
    .slice()
    .reverse()
    .map((m) => ({
      date: m.createdAt
        ? new Date(m.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "N/A",
      weight: Math.round(m.weight * 10) / 10,
      bmi: Math.round(m.bmi * 10) / 10,
      tdee: m.tdee,
    }));

  const textColor = darkMode ? "#e0e0e0" : "#666666";
  const gridColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border shadow-md",
        darkMode
          ? "bg-gradient-to-br from-white/[8%] to-white/[3%] border-white/10"
          : "bg-gradient-to-br from-white to-gray-50 border-gray-200",
      )}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-500">
        Progress Over Time
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            opacity={0.5}
          />
          <XAxis
            dataKey="date"
            stroke={textColor}
            style={{ fontSize: "12px" }}
          />
          <YAxis stroke={textColor} style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#1a1a1a" : "#ffffff",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
              borderRadius: "8px",
              color: textColor,
            }}
            formatter={(value) => {
              if (typeof value === "number") {
                return value.toFixed(1);
              }
              return value;
            }}
          />
          <Legend wrapperStyle={{ color: textColor }} iconType="line" />
          {(chartType === "weight" || chartType === "all") && (
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#32cd32"
              dot={{ fill: "#32cd32", r: 4 }}
              activeDot={{ r: 6 }}
              name="Weight (kg)"
              strokeWidth={2}
            />
          )}
          {(chartType === "bmi" || chartType === "all") && (
            <Line
              type="monotone"
              dataKey="bmi"
              stroke="#fbbf24"
              dot={{ fill: "#fbbf24", r: 4 }}
              activeDot={{ r: 6 }}
              name="BMI"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
