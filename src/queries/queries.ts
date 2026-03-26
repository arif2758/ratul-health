/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Metrics,
  Goal,
  User,
  RegisterRequest,
  StatusResponse,
} from "@/types";

async function handleResponse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  let data: T | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const errorMessage =
      (data as Record<string, unknown> | null)?.error ||
      text ||
      `Error: ${res.status} ${res.statusText}`;
    console.error("API Error:", errorMessage);
    return null;
  }
  return data;
}

export const queries = {
  async register(data: RegisterRequest): Promise<User | null> {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleResponse<User>(res);
  },

  async login(email: string, password: string): Promise<User | null> {
    // Note: Use signIn from next-auth in client components instead
    // This is for reference only
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    return handleResponse<User>(res);
  },

  async logout(): Promise<void> {
    // Note: Use signOut from next-auth in client components instead
    const res = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    await handleResponse(res);
  },

  async getMe(): Promise<User | null> {
    const res = await fetch("/api/me", {
      credentials: "include",
    });
    if (!res.ok) return null;
    return handleResponse<User>(res);
  },

  async updateProfile(data: {
    name?: string;
    height?: number;
    birthdate?: string;
    gender?: string;
  }): Promise<User | null> {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleResponse<User>(res);
  },

  async saveMetrics(data: Metrics): Promise<Metrics | null> {
    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleResponse<Metrics>(res);
  },

  async getMetricsHistory(): Promise<Metrics[]> {
    const res = await fetch("/api/metrics", {
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await handleResponse<Metrics[]>(res);
    return data || [];
  },

  async deleteMetric(id: number): Promise<void> {
    const res = await fetch(`/api/metrics/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await handleResponse(res);
  },

  async getGoals(): Promise<Goal[] | null> {
    const res = await fetch("/api/goals", {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await handleResponse<Goal[]>(res);
    return data || [];
  },

  async saveGoal(data: Goal): Promise<Goal | null> {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleResponse<Goal>(res);
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch("/api/users", {
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await handleResponse<User[]>(res);
    return data || [];
  },

  async switchUser(id: number): Promise<User | null> {
    const res = await fetch("/api/users/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "include",
    });
    return handleResponse(res);
  },

  async createProfile(name: string) {
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      credentials: "include",
    });
    return handleResponse(res);
  },

  async deleteUser(id: number) {
    const res = await fetch("/api/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "include",
    });
    return handleResponse(res);
  },

  async checkStatus(): Promise<StatusResponse | null> {
    const res = await fetch("/api/status");
    return handleResponse<StatusResponse>(res);
  },
};
