"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Coins } from "lucide-react";
import { useBasicStats } from "@/lib/hooks/use-user-stats";
// TODO: Habilitar quando modelo Label, Attachment e campo 'order' existirem no banco
// import { GlobalSearch } from "@/components/search/GlobalSearch";

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
    <nav className="bg-white border-b border-neutral-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="text-xl font-bold">NexList</span>
        </Link>

        {/* Global Search - TODO: Habilitar quando modelo Label, Attachment e campo 'order' existirem */}
        {/* <GlobalSearch /> */}

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

          {/* Inbox link */}
          <Link
            href="/inbox"
            className="relative p-2 rounded-lg hover:bg-neutral-100 transition"
            title="Notificações"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

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
                className={`w-4 h-4 text-neutral-600 transition-transform ${
                  showDropdown ? "rotate-180" : ""
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