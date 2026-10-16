
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  Info,
  Boxes,
  ShieldCheck,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: Boxes,
    title: "Business Modules",
    description:
      "Manage BOM, inventory, machines, maintenance, production, products, purchase, quality, and suppliers.",
  },
  {
    icon: ShieldCheck,
    title: "Authentication",
    description:
      "Authenticated access with login, logout, and session management.",
  },
  {
    icon: LayoutDashboard,
    title: "Centralized Dashboard",
    description:
      "Access application modules through a single, organized dashboard.",
  },
];

export default function InfoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
              <Info className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Application Information
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Learn more about the application.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      {/* Overview */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">
          About Our Application
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
          Welcome to our application management platform. It provides a
          centralized dashboard for accessing business modules, managing
          operational workflows, and navigating application features.
          The interface is designed to keep information organized and
          make everyday operations easier.
        </p>
      </section>

      {/* Features */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Key Features
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="font-medium text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Technology */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            Technology Stack
          </h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Next.js",
            "React",
            "TypeScript",
            "Tailwind CSS",
            "Lucide Icons",
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-sm text-slate-500">
        Application Information
      </footer>
    </div>
  );
}
