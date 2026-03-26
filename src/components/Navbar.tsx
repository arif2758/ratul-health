/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  Sun,
  Moon,
  LogOut,
  User,
  LayoutDashboard,
  ChevronDown,
  Menu,
  LogIn,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onOpenAuth?: () => void;
}

export default function Navbar({
  darkMode,
  setDarkMode,
  onOpenAuth,
}: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
    setIsMenuOpen(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <nav
      className={cn(
        "border-b transition-all sticky top-0 z-40 w-full",
        darkMode
          ? "border-white/5 bg-[#0F0F0F]/60 backdrop-blur-xl"
          : "border-gray-200/50 bg-white/70 backdrop-blur-xl",
      )}
    >
      <div className="w-full px-4 sm:px-6 py-1.5 sm:py-2">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-md flex items-center justify-center text-white flex-shrink-0">
              <Activity size={12} className="sm:w-3.5 sm:h-3.5" />
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tighter inline-block min-w-0">
              RatboD
            </h1>
          </Link>

          {/* Center - Empty space */}
          <div className="flex-1 min-w-0" />

          {/* Right: Theme + Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Theme switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0",
                darkMode
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900",
              )}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={16} className="sm:w-5 sm:h-5" />
              ) : (
                <Moon size={16} className="sm:w-5 sm:h-5" />
              )}
            </button>

            {session?.user ? (
              // Logged in - User menu
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={cn(
                    "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all hover:opacity-80",
                    darkMode
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-gray-100 hover:bg-gray-200",
                  )}
                  aria-label="User menu"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt="User"
                      width={24}
                      height={24}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-primary/20 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User
                        size={12}
                        className="text-primary sm:w-3.5 sm:h-3.5"
                      />
                    </div>
                  )}
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform hidden sm:block",
                      isMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    className={cn(
                      "absolute right-0 mt-2 w-40 sm:w-48 rounded-lg border shadow-lg backdrop-blur-md transition-all z-50",
                      darkMode
                        ? "bg-[#1a1a1a]/95 border-white/10"
                        : "bg-white/95 border-gray-200",
                    )}
                  >
                    {/* User info */}
                    <div
                      className={cn(
                        "p-3 border-b",
                        darkMode ? "border-white/10" : "border-gray-200",
                      )}
                    >
                      <p className="text-sm font-semibold truncate">
                        {session.user.name || "User"}
                      </p>
                      <p
                        className={cn(
                          "text-xs opacity-60 truncate",
                          darkMode ? "text-gray-400" : "text-gray-600",
                        )}
                      >
                        {session.user.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      {menuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/5",
                            darkMode
                              ? "text-gray-300 hover:text-white hover:bg-white/10"
                              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                          )}
                        >
                          <item.icon size={16} />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div
                      className={cn(
                        "border-t pt-2 pb-2",
                        darkMode ? "border-white/10" : "border-gray-200",
                      )}
                    >
                      <button
                        onClick={handleLogout}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-red-500 hover:bg-red-500/10",
                          darkMode ? "hover:bg-red-500/20" : "hover:bg-red-50",
                        )}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Logged out - Login button
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all text-xs sm:text-sm font-medium flex-shrink-0"
              >
                <LogIn size={14} className="sm:w-4 sm:h-4" />
                <span className="inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
