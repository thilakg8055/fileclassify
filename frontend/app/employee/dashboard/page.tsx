"use client";
import { useEffect, useState } from "react";
import EmployeeLayout from "@/components/EmployeeLayout";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Folder, Clock, CheckCircle, ArrowRight, Calendar } from "lucide-react";

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.getMyTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  async function toggleStatus(task: any, e: React.MouseEvent) {
    e.stopPropagation();
    const newStatus = task.status === "completed" ? "in_progress" : task.status === "assigned" ? "in_progress" : "completed";
    await api.updateTaskStatus(task.id, newStatus);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  }

  return (
    <EmployeeLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm mt-1 text-slate-500">Click on a task to view details and start working</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--primary-light)" }}>
            <Folder size={28} style={{ color: "var(--primary)" }} />
          </div>
          <p className="font-semibold text-lg">No tasks assigned yet</p>
          <p className="text-sm text-slate-400 mt-1">Your admin will assign tasks to you soon</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map(task => {
            const isDone = task.status === "completed";
            const inProg = task.status === "in_progress";
            let classifications: string[] = [];
            try { classifications = JSON.parse(task.classifications); } catch {}

            return (
              <div key={task.id}
                className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                style={{ borderColor: "var(--border)" }}
                onClick={() => router.push(`/employee/task/${task.id}`)}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-light)" }}>
                      <Folder size={20} style={{ color: "var(--primary-dark)" }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toggle */}
                      <button
                        onClick={(e) => toggleStatus(task, e)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${isDone ? "bg-green-500" : inProg ? "bg-blue-400" : "bg-slate-200"}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                          ${isDone || inProg ? "translate-x-4.5" : "translate-x-0.5"}`}
                          style={{ transform: isDone || inProg ? "translateX(18px)" : "translateX(2px)" }} />
                      </button>
                      <span className={`text-xs font-medium ${isDone ? "text-green-600" : inProg ? "text-blue-600" : "text-slate-400"}`}>
                        {isDone ? "Done" : inProg ? "Active" : "New"}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base mb-1">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {classifications.slice(0, 4).map((c: string) => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={12} />
                    {new Date(task.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all"
                    style={{ color: "var(--primary-dark)" }}>
                    Open <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </EmployeeLayout>
  );
}
