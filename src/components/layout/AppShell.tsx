"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-72">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
            <button
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute -right-12 top-4 rounded-lg bg-slate-900 p-2 text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-800 bg-slate-900/60 px-4 backdrop-blur sm:px-6 lg:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}