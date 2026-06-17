

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, role, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!token || role !== "admin") router.replace("/admin");
  }, [token, role, initialized, router]);

  // Don't render anything (and don't fire API calls) until:
  // 1. auth has been loaded from localStorage (initialized)
  // 2. user is confirmed as admin
  if (!initialized || !token || role !== "admin") return null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  );
}