"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Coins, BarChart2 } from "lucide-react";
import { useBasicStats } from "@/lib/hooks/use-user-stats";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface NavbarProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  unreadCount?: number;
}

export function Navbar({ user, unreadCount = 0 }: NavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { level, coins, isLoading: statsLoading } = useBasicStats();

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  }

  const initials = (user.name || user.email)
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="text-xl font-bold dark:text-white">NexList</span>
        </Link>

        {/* Global Search */}
        <GlobalSearch />

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Gamification Stats */}
          {!statsLoading && (
            <div className="flex items-center gap-2 mr-2">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                <Trophy className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  Nv. {level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-700">
                  {coins}
                </span>
              </div>
            </div>
          )}

          {/* Calendar link */}
          <Link
            href="/calendar"
            className="p-2 rounded-lg hover:bg-neutral-100 transition"
            title="Calendário"
          >
            <svg
              className="w-5 h-5 text-neutral-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </Link>

          {/* Notes link */}
          <Link
            href="/notes"
            className="p-2 rounded-lg hover:bg-neutral-100 transition"
            title="Notas"
          >
            <svg
              className="w-5 h-5 text-neutral-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>

          {/* Analytics Link */}
          <Link
            href="/analytics"
            className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            title="Relatórios e Métricas"
          >
            <BarChart2 className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </Link>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
              <svg
                className={`w-4 h-4 text-neutral-600 transition-transform ${showDropdown ? "rotate-180" : ""
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900">
                      {user.name || "Usuário"}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/gamification"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      Progresso
                    </Link>
                    <Link
                      href="/clientes"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      Clientes
                    </Link>
                    <Link
                      href="/performance"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      Minha Performance
                    </Link>
                    <Link
                      href="/inbox"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      Inbox
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>

                  <div className="border-t border-neutral-100 py-1">
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {loading ? "Saindo..." : "Sair"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}