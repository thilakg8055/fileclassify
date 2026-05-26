"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { Users, ClipboardList, CheckCircle, Clock, TrendingUp, Folder } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAnalytics(), api.getAllTasks(), api.getUsers()])
      .then(([a, t, u]) => { setAnalytics(a); setTasks(t); setUsers(u); })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Employees", value: analytics?.total_employees ?? 0, icon: Users, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Total Tasks", value: analytics?.total_tasks ?? 0, icon: ClipboardList, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Completed", value: analytics?.completed_tasks ?? 0, icon: CheckCircle, color: "#10B981", bg: "#ECFDF5" },
    { label: "In Progress", value: (analytics?.total_tasks ?? 0) - (analytics?.completed_tasks ?? 0), icon: Clock, color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  const recentTasks = tasks.slice(0, 6);
  const userMap: Record<string, string> = {};
  users.forEach(u => { userMap[u.id] = u.name; });

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Overview of all activities</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl p-6 border" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-base">Recent Tasks</h2>
                  <Link href="/admin/tracking" className="text-xs font-medium" style={{ color: "var(--primary-dark)" }}>View all →</Link>
                </div>
                <div className="space-y-3">
                  {recentTasks.length === 0 && <p className="text-sm text-slate-400">No tasks yet</p>}
                  {recentTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f8fafc" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-light)" }}>
                        <Folder size={15} style={{ color: "var(--primary-dark)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {userMap[task.employee_id] || "Unknown"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === "completed" ? "bg-green-100 text-green-700" :
                        task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-base">Employee Overview</h2>
                  <Link href="/admin/users" className="text-xs font-medium" style={{ color: "var(--primary-dark)" }}>Manage →</Link>
                </div>
                <div className="space-y-3">
                  {users.length === 0 && <p className="text-sm text-slate-400">No employees yet</p>}
                  {users.map(user => {
                    const empTasks = tasks.filter(t => t.employee_id === user.id);
                    const done = empTasks.filter(t => t.status === "completed").length;
                    const pct = empTasks.length ? Math.round((done / empTasks.length) * 100) : 0;
                    return (
                      <div key={user.id} className="p-3 rounded-xl" style={{ background: "#f8fafc" }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: "var(--primary)" }}>
                              {user.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-slate-400">{empTasks.length} tasks</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: "var(--primary-dark)" }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--primary)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
