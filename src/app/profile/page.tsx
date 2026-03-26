/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Activity, Edit2, Save, X, RefreshCw, ImagePlus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { queries } from "@/queries/queries";
import type { User } from "@/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProfilePage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState("");

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

  // Fetch user data
  useEffect(() => {
    if (status !== "authenticated") return;

    const loadUser = async () => {
      try {
        setIsLoading(true);
        const userData = await queries.getMe();
        if (userData) {
          setUser(userData);
          setName(userData.name || "");
          setEmail(userData.email || "");
          setBirthdate(userData.birthdate || "");
          setGender(userData.gender || "male");
          setHeight(userData.height ? String(userData.height) : "");
        }
      } catch (error) {
        console.error("Error loading user:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [status]);

  const handleSave = async () => {
    if (!name || !height) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await queries.updateProfile({
        name,
        birthdate,
        gender,
        height: parseFloat(height),
      });

      if (updatedUser) {
        setUser(updatedUser as User);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAge = () => {
    if (!birthdate) return "";
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age.toString();
  };

  const darkMode = resolvedTheme === "dark";

  if (!mounted || status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F0F0F]" />
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen transition-colors",
        darkMode
          ? "bg-gradient-to-br from-[#0F0F0F] to-[#1a1a1a] text-white"
          : "bg-gradient-to-br from-white to-gray-50 text-gray-900",
      )}
    >
      {/* Navbar */}
      <Navbar onOpenAuth={() => router.push("/?login=true")} />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
              Manage your personal information
            </p>
          </div>

          {/* Profile Card */}
          <div
            className={cn(
              "rounded-2xl border p-8 transition-all",
              darkMode
                ? "bg-white/5 border-white/10"
                : "bg-gray-100 border-gray-200",
            )}
          >
            {/* Profile Picture */}
            <div
              className="flex items-center gap-6 mb-8 pb-8 border-b"
              style={{
                borderColor: darkMode
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              }}
            >
              <div className="relative">
                {user?.profilePic ? (
                  <Image
                    src={user.profilePic}
                    alt="Profile"
                    width={100}
                    height={100}
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                    <Activity size={40} className="text-primary" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl font-bold">{name || "User"}</p>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  {email}
                </p>
              </div>
            </div>

            {!isEditing ? (
              // View Mode
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                      Name
                    </p>
                    <p className="text-lg font-medium">{name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                      Gender
                    </p>
                    <p className="text-lg font-medium capitalize">{gender}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                      Date of Birth
                    </p>
                    <p className="text-lg font-medium">{birthdate || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                      Age
                    </p>
                    <p className="text-lg font-medium">
                      {calculateAge() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                      Height (cm)
                    </p>
                    <p className="text-lg font-medium">{height || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                      Email
                    </p>
                    <p className="text-lg font-medium">{email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              </div>
            ) : (
              // Edit Mode
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-6"
              >
                <div>
                  <label className="text-xs uppercase tracking-wider opacity-60 mb-2 block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border transition-colors",
                      darkMode
                        ? "bg-white/5 border-white/10 focus:border-primary text-white placeholder-gray-500"
                        : "bg-white border-gray-300 focus:border-primary text-gray-900 placeholder-gray-600",
                    )}
                    placeholder="Your name"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider opacity-60 mb-2 block">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) =>
                        setGender(e.target.value as "male" | "female")
                      }
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border transition-colors",
                        darkMode
                          ? "bg-white/5 border-white/10 focus:border-primary text-white"
                          : "bg-white border-gray-300 focus:border-primary text-gray-900",
                      )}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider opacity-60 mb-2 block">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border transition-colors",
                        darkMode
                          ? "bg-white/5 border-white/10 focus:border-primary text-white"
                          : "bg-white border-gray-300 focus:border-primary text-gray-900",
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider opacity-60 mb-2 block">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    step="0.1"
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border transition-colors",
                      darkMode
                        ? "bg-white/5 border-white/10 focus:border-primary text-white placeholder-gray-500"
                        : "bg-white border-gray-300 focus:border-primary text-gray-900 placeholder-gray-600",
                    )}
                    placeholder="175"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors font-medium"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user?.name || "");
                      setBirthdate(user?.birthdate || "");
                      setGender(user?.gender || "male");
                      setHeight(user?.height ? String(user.height) : "");
                    }}
                    className={cn(
                      "flex-1 px-6 py-3 rounded-lg font-medium transition-colors border",
                      darkMode
                        ? "border-white/10 hover:bg-white/5 text-white"
                        : "border-gray-300 hover:bg-gray-100 text-gray-900",
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info Card */}
          <div
            className={cn(
              "rounded-2xl border p-6 transition-all",
              darkMode
                ? "bg-primary/10 border-primary/20"
                : "bg-primary/5 border-primary/20",
            )}
          >
            <p className="text-sm">
              💡 Keep your profile information up to date to get accurate health
              metrics and recommendations.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
