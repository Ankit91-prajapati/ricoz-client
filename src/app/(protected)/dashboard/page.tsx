"use client";

import { BadgeCheck, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { navGroups } from "@/components/layout/nav-config";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const name = user ? user.username || user.email.split("@")[0] : "Guest";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out");
      router.replace("/login");
    } catch {
      toast.error("Could not reach the server, but you were logged out here.");
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 min-h-screen p-6">
      {/* Header Section */}
      <div className="rounded-xl bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className=" rounded-md px-0.5 text-[#d9c0a1]  font-extrabold  text-lg sm:text-xl drop-shadow-md">
            Welcome, {name}
          </h1>

          {/* Verified Badge */}
          {user?.isemailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>

        {/* Logout Button */}
        {user && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loggingOut ? <Spinner className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
            Logout
          </button>
        )}
      </div>

      {/* Subtext */}
      <p className="mt-2 text-sm text-slate-400">Jump into any module to get started.</p>

      {/* Navigation Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {navGroups.map((group) => {
          const Icon = group.icon;
          return (
            <section
              key={group.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:shadow-xl hover:border-blue-500/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-semibold text-slate-200">{group.label}</h2>
              </div>
              <ul className="mt-4 space-y-1">
                {group.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white hover:border-l-4 hover:border-blue-500 transition"
                    >
                      {child.label}
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
