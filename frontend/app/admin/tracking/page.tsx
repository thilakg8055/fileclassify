"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { ChevronRight, Bell, Download, MessageSquare, RefreshCw, CheckCircle, Clock, Folder, User } from "lucide-react";

export default function AdminTracking() {
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Promise.all([api.getUsers(), api.getAllTasks()])
      .then(([u, t]) => { setUsers(u); setTasks(t); });
  }, []);

  async function selectTask(task: any) {
    setSelectedTask(task);
    setLoadingUpdates(true);
    const upds = await api.getTaskUpdates(task.id);
    setUpdates(upds);
    setLoadingUpdates(false);
  }

  async function handleRequestUpdate() {
    if (!selectedTask) return;
    setRequesting(true);
    await api.requestUpdate(selectedTask.id);
    setRequesting(false);
    alert("Update request sent to employee!");
  }

  const filteredTasks = tasks.filter(t => !selectedUser || t.employee_id === selectedUser);
  const userMap: Record<string, string> = {};
  users.forEach(u => { userMap[u.id] = u.name; });

  const statusColor = (s: string) =>
    s === "completed" ? { bg: "bg-green-100", text: "text-green-700" } :
    s === "in_progress" ? { bg: "bg-blue-100", text: "text-blue-700" } :
    { bg: "bg-amber-100", text: "text-amber-700" };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Task Tracking</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Monitor and manage employee task progress</p>
        </div>

        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Left: employee filter + task list */}
          <div className="w-72 flex flex-col gap-4">
            {/* Employee filter */}
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Filter by Employee</h3>
              <div className="space-y-1">
                <button onClick={() => setSelectedUser(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left
                    ${!selectedUser ? "text-white font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                  style={!selectedUser ? { background: "var(--primary)" } : {}}>
                  <User size={15} /> All Employees
                </button>
                {users.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left
                      ${selectedUser === u.id ? "text-white font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                    style={selectedUser === u.id ? { background: "var(--primary)" } : {}}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: selectedUser === u.id ? "rgba(255,255,255,0.3)" : "var(--primary)" }}>
                      {u.name[0]}
                    </div>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks list */}
            <div className="bg-white rounded-2xl border flex-1 overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks ({filteredTasks.length})</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {filteredTasks.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No tasks found</p>
                )}
                {filteredTasks.map(task => {
                  const sc = statusColor(task.status);
                  const active = selectedTask?.id === task.id;
                  return (
                    <button key={task.id} onClick={() => selectTask(task)}
                      className={`w-full text-left p-3 rounded-xl mb-1 transition-all border
                        ${active ? "border-amber-300" : "border-transparent hover:bg-slate-50"}`}
                      style={active ? { background: "var(--primary-light)" } : {}}>
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0"
                          style={{ background: "var(--primary-light)" }}>
                          <Folder size={14} style={{ color: "var(--primary-dark)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-slate-400 truncate">{userMap[task.employee_id]}</p>
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                        <ChevronRight size={15} className="text-slate-300 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: task detail */}
          <div className="flex-1">
            {!selectedTask ? (
              <div className="bg-white rounded-2xl border h-full flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--primary-light)" }}>
                    <Folder size={24} style={{ color: "var(--primary)" }} />
                  </div>
                  <p className="font-medium text-slate-600">Select a task to view details</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border h-full flex flex-col overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {/* Task header */}
                <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{selectedTask.title}</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Assigned to: <span className="font-medium">{userMap[selectedTask.employee_id]}</span>
                        {" · "}{new Date(selectedTask.created_at).toLocaleDateString()}
                      </p>
                      {selectedTask.description && (
                        <p className="text-sm text-slate-500 mt-2">{selectedTask.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedTask.completed_zip_path && (
                        <button onClick={() => api.downloadCompletedZip(selectedTask.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                          <Download size={15} /> Download ZIP
                        </button>
                      )}
                      <button onClick={handleRequestUpdate} disabled={requesting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                        style={{ background: "var(--primary)" }}>
                        <Bell size={15} /> {requesting ? "Sending..." : "Request Update"}
                      </button>
                    </div>
                  </div>

                  {/* Classifications */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(() => {
                      try {
                        const cls = JSON.parse(selectedTask.classifications);
                        return cls.map((c: string) => (
                          <span key={c} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
                            {c}
                          </span>
                        ));
                      } catch { return null; }
                    })()}
                  </div>
                </div>

                {/* Updates */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare size={16} style={{ color: "var(--primary)" }} /> Progress Updates
                  </h3>
                  {loadingUpdates ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <RefreshCw size={15} className="animate-spin" /> Loading updates...
                    </div>
                  ) : updates.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock size={24} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">No updates yet. Request one from the employee.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {updates.map(u => (
                        <div key={u.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-slate-400">
                              {new Date(u.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="rounded-lg p-3 text-center" style={{ background: "#f0fdf4" }}>
                              <p className="text-2xl font-bold text-green-600">{u.files_completed}</p>
                              <p className="text-xs text-green-600 mt-0.5">Files Completed</p>
                            </div>
                            <div className="rounded-lg p-3 text-center" style={{ background: "#fff7ed" }}>
                              <p className="text-2xl font-bold text-amber-600">{u.files_remaining}</p>
                              <p className="text-xs text-amber-600 mt-0.5">Files Remaining</p>
                            </div>
                          </div>
                          {u.comments && (
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{u.comments}</p>
                          )}
                          {u.classification_data && (() => {
                            try {
                              const d = JSON.parse(u.classification_data);
                              return (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {Object.entries(d).map(([k, v]) => (
                                    <span key={k} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700">
                                      {k}: {String(v)}
                                    </span>
                                  ))}
                                </div>
                              );
                            } catch { return null; }
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
