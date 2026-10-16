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
      await logout(); // calls POST /auth/logout and clears the user in AuthContext
      toast.success("Logged out");
      router.replace("/login");
    } catch {
      // the user is already cleared locally even if the API call failed
      toast.error("Could not reach the server, but you were logged out here.");
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {name} 👋</h1>
          {user?.isemailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-60"
          >
            {loggingOut ? <Spinner className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
            Logout
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-400"><Link href="/info"></Link></p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {navGroups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-medium">{group.label}</h2>
              </div>
              <ul className="mt-4 space-y-1">
                {group.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      {child.label}
                      <ChevronRight className="h-4 w-4 text-slate-500" />
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