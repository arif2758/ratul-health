"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

import { type Gender, type ActivityLevel } from "@/lib/calculations";
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
import { QuickMeasurementForm } from "@/components/QuickMeasurementForm";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [unit] = useState<"metric" | "imperial">("metric");

  // Profile editing
  const [editGender, setEditGender] = useState<Gender>("male");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editHeight, setEditHeight] = useState("");

  const [metricsHistory, setMetricsHistory] = useState<Metrics[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleSaveMeasurement = async (data: {
    weight: number;
    height: number;
    age: number;
    gender: Gender;
    waist: number;
    neck: number;
    hip: number;
    activityLevel: ActivityLevel;
  }) => {
    try {
      setIsSaving(true);

      const validationErrors = validateMetricsForm({
        weight: String(data.weight),
        height: String(data.height),
        age: String(data.age),
        gender: data.gender,
        waist: String(data.waist),
        neck: String(data.neck),
        hip: String(data.hip),
      });

      if (validationErrors.length > 0) {
        validationErrors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`);
        });
        return;
      }

      if (!user?.height && data.height) {
        await queries.updateProfile({ height: data.height });
        const updatedUser = await queries.getMe();
        if (updatedUser) setUser(updatedUser);
      }

      // Recalculate metrics for saving
      const { calculateBMI, calculateBMR, calculateTDEE, calculateBodyFat } =
        await import("@/lib/calculations");
      const bmi = calculateBMI(data.weight, data.height);
      const bmr = calculateBMR(data);
      const tdee = calculateTDEE(bmr, data.activityLevel);
      const bodyFat = calculateBodyFat(data);

      await queries.saveMetrics({
        weight: data.weight,
        height: data.height,
        age: data.age,
        gender: data.gender,
        waist: data.waist,
        neck: data.neck,
        hip: data.hip,
        activityLevel: data.activityLevel,
        bmi,
        bmr,
        tdee,
        bodyFat,
        bodyFatPercentage: bodyFat,
      });

      setHistoryRefreshTrigger((prev) => prev + 1);
      toast.success("Measurement saved successfully!");

      const metricsData = await queries.getMetricsHistory();
      if (metricsData) {
        setMetricsHistory(Array.isArray(metricsData) ? metricsData : []);
      }
    } catch (error) {
      console.error("Error saving measurement:", error);
      toast.error("Failed to save measurement");
    } finally {
      setIsSaving(false);
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
        darkMode ? "bg-[#0A0A0A] text-white" : "bg-white text-gray-900",
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
              <QuickStats
                darkMode={darkMode}
                latestMetrics={metricsHistory?.[0]}
                initialWeight={
                  metricsHistory[metricsHistory.length - 1]?.weight
                }
                goals={goals}
              />
            ) : null}

            {/* Quick Measurement Form */}
            <QuickMeasurementForm
              darkMode={darkMode}
              lockedHeight={user?.height ? user.height : undefined}
              lockedGender={editGender}
              lockedAge={age ? parseInt(age) : undefined}
              onSave={handleSaveMeasurement}
              isSaving={isSaving}
              showProfileBanner={
                !user?.birthdate || !user?.gender || !user?.height
              }
              onGoToProfile={() => router.push("/profile")}
            />

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

            {/* Goals Section */}
            {user && (
              <div className="mt-12">
                <Goals
                  darkMode={darkMode}
                  unit={unit}
                  currentWeight={metricsHistory?.[0]?.weight}
                  currentBodyFat={metricsHistory?.[0]?.bodyFat}
                />
              </div>
            )}

            {/* Progress Chart — after History */}
            {metricsHistory.length > 0 && (
              <div className="mt-8">
                {isLoadingHistory ? (
                  <ChartSkeleton />
                ) : (
                  <ProgressChart
                    darkMode={darkMode}
                    metrics={metricsHistory}
                    chartType="weight"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
