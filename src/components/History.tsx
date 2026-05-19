"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Scale,
  Activity,
  TrendingDown,
  TrendingUp,
  Minus,
  Trash2,
  History as HistoryIcon,
  ArrowRight,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { queries } from "@/queries/queries";
import type { Metrics } from "@/types";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryProps {
  darkMode: boolean;
  unit: "metric" | "imperial";
  refreshTrigger?: number;
  isLoggedIn: boolean;
  limit?: number;
  filterDays?: number | null;
  hideHeader?: boolean;
}

export default function History({
  darkMode,
  unit,
  refreshTrigger,
  isLoggedIn,
  limit,
  filterDays,
  hideHeader,
}: HistoryProps) {
  const [history, setHistory] = useState<Metrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger, isLoggedIn]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      let data: Metrics[] = [];

      const localData = JSON.parse(
        localStorage.getItem("ratbod_history") || "[]",
      ) as Metrics[];

      if (isLoggedIn) {
        const cloudData = await queries.getMetricsHistory();
        const safeCloudData = Array.isArray(cloudData) ? cloudData : [];

        data = [...safeCloudData, ...localData].sort(
          (a: Metrics, b: Metrics) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          },
        );
      } else {
        data = [...localData].sort((a: Metrics, b: Metrics) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }

      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      const localData = JSON.parse(
        localStorage.getItem("ratbod_history") || "[]",
      ) as Metrics[];
      setHistory(localData);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (id: number | string) => {
    toast("Delete Measurement?", {
      description:
        "Are you sure you want to delete this? This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => deleteEntry(id),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
      className: darkMode
        ? "border-red-500/20 bg-red-500/10 text-white"
        : "border-red-500/20 bg-red-50 text-red-900",
    });
  };

  const deleteEntry = async (id: number | string) => {
    try {
      if (isLoggedIn) {
        try {
          await queries.deleteMetric(id as number);
        } catch (err) {
          console.error("Failed to delete from cloud:", err);
        }
      }

      const localData = JSON.parse(
        localStorage.getItem("ratbod_history") || "[]",
      ) as Metrics[];

      const filteredLocal = localData.filter(
        (entry: Metrics) => entry.id !== id && entry._id !== id,
      );

      localStorage.setItem("ratbod_history", JSON.stringify(filteredLocal));
      fetchHistory();
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast.error("Failed to delete measurement.");
    }
  };

  const formatWeight = (kg: number | undefined | null): string => {
    if (kg == null) return "N/A";
    if (unit === "metric") return `${kg.toFixed(1)} kg`;
    return `${(kg * 2.20462).toFixed(1)} lb`;
  };

  const displayHistory = useMemo(() => {
    let filtered = history;

    if (filterDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filterDays);
      filtered = history.filter((entry) => {
        if (!entry.createdAt) return false;
        return new Date(entry.createdAt) >= cutoffDate;
      });
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [history, limit, filterDays]);

  const SectionHeader = () => (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            "w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border",
            darkMode
              ? "bg-white/5 border-white/10"
              : "bg-gray-100 border-gray-200",
          )}
        >
          <HistoryIcon size={18} className="text-primary" />
        </div>

        <h2
          className={cn(
            "text-xl sm:text-2xl font-bold tracking-tight shrink-0",
            darkMode ? "text-white" : "text-gray-900",
          )}
        >
          History
        </h2>

        <div
          className={cn(
            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0",
            darkMode
              ? "bg-white/5 text-gray-300 border border-white/10"
              : "bg-gray-100 text-gray-700 border border-gray-200",
          )}
        >
          {history.length} {history.length === 1 ? "Entry" : "Entries"}
        </div>
      </div>

      {limit && history.length > limit && (
        <button
          onClick={() => router.push("/history")}
          className="flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors shrink-0"
        >
          View All
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-5">
        {!hideHeader && <SectionHeader />}
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (displayHistory.length === 0) {
    return (
      <div className="space-y-5">
        {!hideHeader && <SectionHeader />}

        <div
          className={cn(
            "p-8 rounded-3xl border border-dashed text-center space-y-3",
            darkMode
              ? "border-white/10 bg-white/[3%]"
              : "border-gray-300 bg-gray-50",
          )}
        >
          <Calendar
            className={cn(
              "mx-auto",
              darkMode ? "text-white/40" : "text-gray-400",
            )}
            size={32}
          />
          <p
            className={cn(
              "text-sm font-medium",
              darkMode ? "text-gray-300" : "text-gray-600",
            )}
          >
            {filterDays
              ? "No history found for this period."
              : "No history entries found. Save your first measurement!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!hideHeader && <SectionHeader />}

      {/* Desktop Table */}
      <div
        className={cn(
          "hidden md:block rounded-3xl border overflow-hidden shadow-sm",
          darkMode ? "bg-[#0F0F0F] border-white/5" : "bg-white border-black/5",
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={cn(
                  "border-b text-[10px] font-black uppercase tracking-[0.2em]",
                  darkMode
                    ? "border-white/5 text-gray-500"
                    : "border-gray-100 text-gray-400",
                )}
              >
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Weight</th>
                <th className="px-6 py-4 text-center">BMI</th>
                <th className="px-6 py-4 text-center">Body Fat</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody
              className={cn(
                "divide-y",
                darkMode ? "divide-white/5" : "divide-gray-100",
              )}
            >
              {displayHistory.map((entry, index) => {
                const prevEntry = displayHistory[index + 1];
                const weightDiff = prevEntry
                  ? entry.weight - prevEntry.weight
                  : 0;
                const displayDiff =
                  unit === "metric" ? weightDiff : weightDiff * 2.20462;

                return (
                  <tr
                    key={
                      entry.id || entry._id
                        ? `${entry.id || entry._id}`
                        : `local-${index}`
                    }
                    className={cn(
                      "group transition-colors",
                      darkMode ? "hover:bg-white/5" : "hover:bg-gray-50",
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            darkMode ? "text-white" : "text-gray-900",
                          )}
                        >
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <span className="text-[10px] font-medium opacity-40">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-primary/60" />
                        <span
                          className={cn(
                            "text-sm font-bold",
                            darkMode ? "text-white" : "text-gray-900",
                          )}
                        >
                          {formatWeight(entry.weight)}
                        </span>

                        {prevEntry && (
                          <div
                            className={cn(
                              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                              weightDiff < 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : weightDiff > 0
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-gray-500/10 text-gray-400",
                            )}
                          >
                            {weightDiff < 0 ? (
                              <TrendingDown size={10} />
                            ) : weightDiff > 0 ? (
                              <TrendingUp size={10} />
                            ) : (
                              <Minus size={10} />
                            )}
                            {weightDiff !== 0 &&
                              Math.abs(displayDiff).toFixed(1)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold",
                          darkMode
                            ? "bg-white/5 text-gray-300"
                            : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {entry.bmi.toFixed(1)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Activity size={12} className="text-primary/60" />
                        <span
                          className={cn(
                            "text-sm font-bold",
                            darkMode ? "text-white" : "text-gray-900",
                          )}
                        >
                          {(
                            entry.bodyFat ??
                            entry.bodyFatPercentage ??
                            0
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {(entry.id || entry._id) && (
                        <button
                          onClick={() =>
                            confirmDelete(
                              (entry.id || entry._id) as string | number,
                            )
                          }
                          className={cn(
                            "p-2 rounded-lg transition-all cursor-pointer",
                            darkMode
                              ? "hover:bg-red-500/10 text-red-400 hover:text-red-300"
                              : "hover:bg-red-50 text-red-500 hover:text-red-600",
                          )}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {displayHistory.map((entry, index) => {
          const prevEntry = displayHistory[index + 1];
          const weightDiff = prevEntry ? entry.weight - prevEntry.weight : 0;
          const displayDiff =
            unit === "metric" ? weightDiff : weightDiff * 2.20462;

          return (
            <div
              key={
                entry.id || entry._id
                  ? `mobile-${entry.id || entry._id}`
                  : `mobile-local-${index}`
              }
              className={cn(
                "p-3 rounded-2xl border transition-colors",
                darkMode
                  ? "bg-[#0F0F0F] border-white/5"
                  : "bg-white border-black/5",
              )}
            >
              {/* Top row: Date left, Diff center, Delete right */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-2.5 gap-2">
                <div className="flex items-center gap-2 min-w-0 justify-self-start">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg shrink-0",
                      darkMode ? "bg-white/5" : "bg-gray-100",
                    )}
                  >
                    <Calendar size={12} className="text-primary/60" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs font-bold leading-tight truncate",
                        darkMode ? "text-white" : "text-gray-900",
                      )}
                    >
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "N/A"}
                    </p>
                    <p className="text-[9px] opacity-40 leading-tight">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="justify-self-center">
                  {prevEntry && (
                    <div
                      className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black",
                        weightDiff < 0
                          ? "bg-emerald-500/10 text-emerald-500"
                          : weightDiff > 0
                            ? "bg-red-500/10 text-red-500"
                            : "bg-gray-500/10 text-gray-400",
                      )}
                    >
                      {weightDiff < 0 ? (
                        <TrendingDown size={9} />
                      ) : weightDiff > 0 ? (
                        <TrendingUp size={9} />
                      ) : (
                        <Minus size={9} />
                      )}
                      {weightDiff !== 0 && Math.abs(displayDiff).toFixed(1)}
                    </div>
                  )}
                </div>

                <div className="justify-self-end">
                  {(entry.id || entry._id) && (
                    <button
                      onClick={() =>
                        confirmDelete(
                          (entry.id || entry._id) as string | number,
                        )
                      }
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        darkMode
                          ? "hover:bg-red-500/10 text-red-400 hover:text-red-300"
                          : "hover:bg-red-50 text-red-500 hover:text-red-600",
                      )}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    darkMode ? "bg-white/5" : "bg-gray-50",
                  )}
                >
                  <p className="text-[9px] uppercase tracking-wider opacity-40 mb-0.5 flex items-center gap-1">
                    <Scale size={9} />
                    Weight
                  </p>
                  <p
                    className={cn(
                      "text-sm font-extrabold leading-tight",
                      darkMode ? "text-white" : "text-gray-900",
                    )}
                  >
                    {formatWeight(entry.weight)}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    darkMode ? "bg-white/5" : "bg-gray-50",
                  )}
                >
                  <p className="text-[9px] uppercase tracking-wider opacity-40 mb-0.5">
                    BMI
                  </p>
                  <p
                    className={cn(
                      "text-sm font-extrabold leading-tight whitespace-nowrap",
                      darkMode ? "text-white" : "text-gray-900",
                    )}
                  >
                    {entry.bmi.toFixed(1)}
                    <span className="text-[9px] font-normal opacity-50 ml-1">
                      kg/m²
                    </span>
                  </p>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    darkMode ? "bg-white/5" : "bg-gray-50",
                  )}
                >
                  <p className="text-[9px] uppercase tracking-wider opacity-40 mb-0.5 flex items-center gap-1">
                    <Activity size={9} />
                    Body Fat
                  </p>
                  <p
                    className={cn(
                      "text-sm font-extrabold leading-tight",
                      darkMode ? "text-white" : "text-gray-900",
                    )}
                  >
                    {(entry.bodyFat ?? entry.bodyFatPercentage ?? 0).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
