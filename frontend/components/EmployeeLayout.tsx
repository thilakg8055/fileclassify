

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { Folder, LogOut } from "lucide-react";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { token, role, name, logout, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!token || role !== "employee") router.replace("/login");
  }, [token, role, initialized, router]);

  // Don't render anything (and don't fire API calls) until:
  // 1. auth has been loaded from localStorage (initialized)
  // 2. user is confirmed as employee
  if (!initialized || !token || role !== "employee") return null;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <header
        className="bg-white border-b sticky top-0 z-40"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/employee/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <Folder size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm">FileClassify</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                {name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium">{name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}