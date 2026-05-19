"use client";

import React, { useState, useMemo } from "react";
import { Scale, Activity, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const activityOptions = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  { value: "light", label: "Light", desc: "Light exercise 1-3 days/week" },
  {
    value: "moderate",
    label: "Moderate",
    desc: "Moderate exercise 3-5 days/week",
  },
  { value: "active", label: "Active", desc: "Hard exercise 6-7 days/week" },
  {
    value: "very_active",
    label: "Very Active",
    desc: "Very hard exercise/physical work",
  },
];

interface QuickMeasurementFormProps {
  darkMode: boolean;
  /** If provided, height field will be hidden and this value used */
  lockedHeight?: number;
  /** If provided, gender field will be hidden and this value used */
  lockedGender?: Gender;
  /** If provided, age field will be hidden and this value used */
  lockedAge?: number;
  /** Called when user clicks Save — only available when logged in */
  onSave?: (data: {
    weight: number;
    height: number;
    age: number;
    gender: Gender;
    waist: number;
    neck: number;
    hip: number;
    activityLevel: ActivityLevel;
  }) => Promise<void>;
  isSaving?: boolean;
  /** Show profile incomplete banner */
  showProfileBanner?: boolean;
  onGoToProfile?: () => void;
}

export function QuickMeasurementForm({
  darkMode,
  lockedHeight,
  lockedGender,
  lockedAge,
  onSave,
  isSaving,
  showProfileBanner,
  onGoToProfile,
}: QuickMeasurementFormProps) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState(
    lockedHeight ? String(lockedHeight) : "",
  );
  const [gender, setGender] = useState<Gender>(lockedGender ?? "male");
  const [ageInput, setAgeInput] = useState(lockedAge ? String(lockedAge) : "");
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [hip, setHip] = useState("");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("sedentary");
  const [isIdealWeightOpen, setIsIdealWeightOpen] = useState(false);

  const effectiveHeight = lockedHeight ?? parseFloat(height);
  const effectiveGender = lockedGender ?? gender;
  const effectiveAge = lockedAge ?? parseInt(ageInput);

  const metrics = useMemo(() => {
    const data: BodyData = {
      weight: parseFloat(weight) || 0,
      height: effectiveHeight || 0,
      gender: effectiveGender,
      age: effectiveAge || 0,
      waist: parseFloat(waist) || 0,
      neck: parseFloat(neck) || 0,
      hip: parseFloat(hip) || 0,
      activityLevel,
    };

    if (!data.height || !data.weight || !data.age) return null;

    const bmi = calculateBMI(data.weight, data.height);
    const bmr = calculateBMR(data);
    const tdee = calculateTDEE(bmr, data.activityLevel);
    const bodyFat = calculateBodyFat(data);
    const idealWeight = calculateIdealWeight(data.height, data.gender);
    const idealFatRange = getIdealBodyFatRange(data.gender, data.age);

    const weightDiff = {
      kg: Math.abs(data.weight - idealWeight.kg),
      lb: Math.abs(data.weight * 2.20462 - idealWeight.lb),
      type:
        data.weight < idealWeight.kg * 0.95
          ? ("gain" as const)
          : data.weight > idealWeight.kg * 1.05
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
  }, [
    weight,
    effectiveHeight,
    effectiveGender,
    effectiveAge,
    waist,
    neck,
    hip,
    activityLevel,
  ]);

  const handleSave = async () => {
    if (!onSave) return;
    await onSave({
      weight: parseFloat(weight),
      height: effectiveHeight,
      age: effectiveAge,
      gender: effectiveGender,
      waist: parseFloat(waist) || 0,
      neck: parseFloat(neck) || 0,
      hip: parseFloat(hip) || 0,
      activityLevel,
    });
    setWeight("");
    setWaist("");
    setNeck("");
    setHip("");
  };

  return (
    <div
      className={cn(
        "p-6 rounded-3xl border transition-all shadow-2xl",
        darkMode
          ? "bg-white/[3%] backdrop-blur-xl border-white/10 shadow-black/40"
          : "bg-white/60 backdrop-blur-xl border-black/5 shadow-gray-200/80",
      )}
    >
      <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
        <Scale size={20} />
        Quick Measurement
      </h3>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Input form */}
        <div className="flex-1 min-w-0 space-y-4">
          {showProfileBanner && (
            <div className="p-3 mb-2 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary mb-0.5">
                  Complete Your Profile
                </p>
                <p className="opacity-80">
                  Add missing details for accurate health metrics.
                </p>
              </div>
              {onGoToProfile && (
                <button
                  onClick={onGoToProfile}
                  className="text-primary font-medium hover:underline whitespace-nowrap ml-4"
                >
                  Go to Profile
                </button>
              )}
            </div>
          )}

          {/* Weight + Height (if not locked) */}
          <div
            className={cn(
              "grid gap-4",
              !lockedHeight ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <div>
              <label className="text-xs uppercase tracking-wider opacity-60">
                Weight (kg) *
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
                placeholder="70"
              />
            </div>
            {!lockedHeight && (
              <div>
                <label className="text-xs uppercase tracking-wider opacity-60">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={cn(
                    "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                    darkMode
                      ? "bg-white/5 border-primary/50 focus:border-primary"
                      : "bg-white border-primary/50 focus:border-primary",
                  )}
                  placeholder="175"
                />
              </div>
            )}
          </div>

          {/* Age + Gender (if not locked) */}
          {(!lockedAge || !lockedGender) && (
            <div className="grid grid-cols-2 gap-4">
              {!lockedAge && (
                <div>
                  <label className="text-xs uppercase tracking-wider opacity-60">
                    Age *
                  </label>
                  <input
                    type="number"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    className={cn(
                      "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                      darkMode
                        ? "bg-white/5 border-white/10 focus:border-primary"
                        : "bg-white border-gray-300 focus:border-primary",
                    )}
                    placeholder="25"
                  />
                </div>
              )}
              {!lockedGender && (
                <div>
                  <label className="text-xs uppercase tracking-wider opacity-60">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className={cn(
                      "w-full mt-2 px-4 py-2 rounded-lg border transition-colors",
                      darkMode
                        ? "bg-white/5 border-white/10 focus:border-primary"
                        : "bg-white border-gray-300 focus:border-primary",
                    )}
                  >
                    <option
                      value="male"
                      className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    >
                      Male
                    </option>
                    <option
                      value="female"
                      className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    >
                      Female
                    </option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Waist + Neck */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider opacity-60">
                Waist (cm)
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
                Neck (cm)
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

          {/* Hip (female only) */}
          {effectiveGender === "female" && (
            <div>
              <label className="text-xs uppercase tracking-wider opacity-60">
                Hip (cm)
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

          {/* Activity Level */}
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
                  : "bg-white border-gray-300 focus:border-primary",
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

        {/* RIGHT: Health Goal + Ideal Body Weight */}
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
                        <Activity size={14} style={{ color: goalColor }} />
                      </div>
                      <p className="font-bold text-sm">Your Health Goal</p>
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
                        darkMode ? "bg-black/20" : "bg-white/60",
                      )}
                    >
                      {goalMessage}
                    </div>
                  </div>
                );
              })()}

              {/* Ideal Body Weight Accordion */}
              <div
                className={cn(
                  "rounded-xl border overflow-hidden transition-all",
                  darkMode
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-50 border-gray-200",
                )}
              >
                <button
                  onClick={() => setIsIdealWeightOpen(!isIdealWeightOpen)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between transition-colors",
                    darkMode ? "hover:bg-white/5" : "hover:bg-gray-100",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg",
                        darkMode ? "bg-white/10" : "bg-gray-200",
                      )}
                    >
                      <Scale size={13} className="opacity-60" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-wider">
                        Ideal Body Weight
                      </p>
                      <p className="text-[10px] opacity-40">
                        {metrics.idealWeight.kg.toFixed(1)} kg /{" "}
                        {metrics.idealWeight.lb.toFixed(1)} lb
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "opacity-50 transition-transform duration-200",
                      isIdealWeightOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200 ease-in-out",
                    isIdealWeightOpen
                      ? "max-h-40 opacity-100"
                      : "max-h-0 opacity-0",
                  )}
                >
                  <div className="px-4 pb-4">
                    <div
                      className={cn(
                        "h-px mb-3",
                        darkMode ? "bg-white/10" : "bg-gray-200",
                      )}
                    />
                    <p className="text-[10px] opacity-40 mb-2">
                      Devine Formula (
                      {effectiveGender === "male" ? "Male" : "Female"})
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={cn(
                          "p-3 rounded-lg",
                          darkMode
                            ? "bg-white/5"
                            : "bg-white border border-gray-100",
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
                            : "bg-white border border-gray-100",
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
                  : "bg-gray-50 border-gray-200",
              )}
            >
              <Activity size={32} className="mx-auto mb-3 opacity-30" />
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

      {/* Analysis Results */}
      {metrics && (
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-widest opacity-40 font-semibold mb-3">
            Analysis Results
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* BMI */}
            <div
              className={cn(
                "p-4 rounded-xl border",
                darkMode
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1 flex items-center justify-between">
                BMI
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide",
                    darkMode
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/10 text-primary",
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
                  darkMode ? "bg-white/10" : "bg-gray-200",
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

            {/* Body Fat */}
            <div
              className={cn(
                "p-4 rounded-xl border",
                darkMode
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                Body Fat
              </p>
              <p className="text-2xl font-extrabold">
                {metrics.bodyFat.toFixed(1)}
                <span className="text-xs font-normal opacity-50 ml-0.5">%</span>
              </p>
              <p className="text-[10px] text-primary mt-1">
                Ideal: {metrics.idealFatRange.min}-{metrics.idealFatRange.max}%
              </p>
            </div>

            {/* BMR */}
            <div
              className={cn(
                "p-4 rounded-xl border",
                darkMode
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200",
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

            {/* TDEE */}
            <div
              className={cn(
                "p-4 rounded-xl border",
                darkMode
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200",
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

      {/* Save button — only shown when onSave is provided (logged in) */}
      {onSave && (
        <button
          onClick={handleSave}
          disabled={!weight || isSaving}
          className="mt-5 w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold tracking-wide"
        >
          {isSaving ? "Saving..." : "Save Measurement"}
        </button>
      )}
    </div>
  );
}
