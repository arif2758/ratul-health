/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  profilePic?: string;
  emailVerified?: boolean;
  birthdate?: string;
  gender?: "male" | "female";
  height?: number;
  username?: string;
}

export interface Metrics {
  id?: number;
  userId?: string;
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
  activityLevel:
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extra_active";
  bmi: number;
  bmr: number;
  tdee: number;
  bodyFat?: number;
  bodyFatPercentage?: number;
  idealWeight?: number;
  waist?: number;
  neck?: number;
  hip?: number;
  createdAt?: string;
}

export interface Goal {
  id?: number;
  userId?: string;
  targetWeight: number;
  targetBodyFat: number;
  dailyCalorieGoal: number;
  targetDate?: string | null;
  completed?: boolean;
  createdAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StatusResponse {
  supabaseConfigured?: boolean;
  status?: string;
  message?: string;
}
