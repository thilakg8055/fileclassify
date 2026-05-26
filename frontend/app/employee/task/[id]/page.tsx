"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import EmployeeLayout from "@/components/EmployeeLayout";
import { api, WS_BASE } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Download, Bell, Upload, Send, FolderOpen, X, CheckCircle, ArrowRight } from "lucide-react";

export default function EmployeeTaskPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userId } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [updateForm, setUpdateForm] = useState({ files_completed: 0, files_remaining: 0, comments: "" });
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [updateSent, setUpdateSent] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  let classifications: string[] = [];
  try { classifications = JSON.parse(task?.classifications || "[]"); } catch {}

  useEffect(() => {
    Promise.all([api.getMyTask(id as string), api.getNotifications()])
      .then(([t, n]) => {
        setTask(t);
        setNotifications(n.filter((x: any) => x.task_id === id));
      })
      .finally(() => setLoading(false));

    // WebSocket
    if (userId) {
      const ws = new WebSocket(`${WS_BASE}/ws/${userId}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "update_request" && msg.task_id === id) {
          setNotifications(prev => [...prev, { id: Date.now(), message: "Admin has requested a progress update", type: "update_request" }]);
        }
      };
      return () => ws.close();
    }
  }, [id, userId]);

  async function handleSendUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSendingUpdate(true);
    try {
      const classData: Record<string, number> = {};
      classifications.forEach(c => { classData[c] = 0; });
      await api.sendUpdate(id as string, { ...updateForm, classification_data: classData });
      setUpdateSent(true);
      setNotifications([]);
      setTimeout(() => setUpdateSent(false), 3000);
    } finally {
      setSendingUpdate(false);
    }
  }

  async function handleUploadCompleted() {
    if (!uploadFile) return;
    setUploading(true);
    try {
      await api.uploadCompleted(id as string, uploadFile);
      await api.updateTaskStatus(id as string, "completed");
      setTask((prev: any) => ({ ...prev, status: "completed", completed_zip_path: "uploaded" }));
      setUploadDone(true);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return (
    <EmployeeLayout>
      <div className="flex items-center gap-3 text-slate-400 py-20">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> Loading...
      </div>
    </EmployeeLayout>
  );

  return (
    <EmployeeLayout>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push("/employee/dashboard")}
          className="text-sm text-slate-400 hover:text-slate-700">← Back</button>
        <span className="text-slate-300">/</span>
        <h1 className="text-lg font-bold">{task?.title}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          task?.status === "completed" ? "bg-green-100 text-green-700" :
          task?.status === "in_progress" ? "bg-blue-100 text-blue-700" :
          "bg-amber-100 text-amber-700"
        }`}>{task?.status?.replace("_", " ")}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Download & Workspace */}
        <div className="lg:col-span-1 space-y-5">
          {/* Download ZIP */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Download size={17} style={{ color: "var(--primary)" }} /> Task Files
            </h2>
            <p className="text-sm text-slate-500 mb-4">Download the ZIP file, extract it locally, and start classifying.</p>
            <button onClick={() => api.downloadTaskZip(id as string)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium"
              style={{ background: "var(--primary)" }}>
              <Download size={16} /> Download ZIP File
            </button>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => router.push(`/employee/workspace/${id}`)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 transition-all hover:border-amber-400"
                style={{ borderColor: "var(--border)" }}>
                <FolderOpen size={16} style={{ color: "var(--primary)" }} /> Open Workspace
                <ArrowRight size={14} />
              </button>
              <p className="text-xs text-slate-400 mt-2 text-center">Open folder structure & classify files</p>
            </div>
          </div>

          {/* Classifications */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-3">Classification Types</h2>
            <div className="flex flex-wrap gap-2">
              {classifications.map(c => (
                <span key={c} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications + Update + Upload */}
        <div className="lg:col-span-2 space-y-5">
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-amber-800">
                <Bell size={17} /> Update Requests ({notifications.length})
              </h2>
              <div className="space-y-2 mb-4">
                {notifications.map((n, i) => (
                  <div key={n.id || i} className="text-sm text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                    {n.message}
                  </div>
                ))}
              </div>

              {/* Send update form */}
              <form onSubmit={handleSendUpdate} className="bg-white rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold">Send Progress Update</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Files Completed</label>
                    <input type="number" min={0} value={updateForm.files_completed}
                      onChange={e => setUpdateForm({ ...updateForm, files_completed: +e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: "var(--border)" }} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Files Remaining</label>
                    <input type="number" min={0} value={updateForm.files_remaining}
                      onChange={e => setUpdateForm({ ...updateForm, files_remaining: +e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: "var(--border)" }} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Comments (optional)</label>
                  <textarea value={updateForm.comments}
                    onChange={e => setUpdateForm({ ...updateForm, comments: e.target.value })}
                    rows={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                    style={{ borderColor: "var(--border)" }}
                    placeholder="Any notes for admin..." />
                </div>
                <button type="submit" disabled={sendingUpdate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ background: "var(--primary)" }}>
                  <Send size={14} /> {sendingUpdate ? "Sending..." : "Send Update"}
                </button>
              </form>
            </div>
          )}

          {updateSent && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
              <CheckCircle size={16} /> Update sent to admin!
            </div>
          )}

          {/* Upload completed ZIP */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Upload size={17} style={{ color: "var(--primary)" }} /> Submit Completed Work
            </h2>
            <p className="text-sm text-slate-500 mb-4">After classifying all files, zip the folder and upload it here.</p>

            {task?.status === "completed" || uploadDone ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
                <CheckCircle size={18} /> Completed ZIP uploaded successfully!
              </div>
            ) : (
              <>
                <input ref={uploadRef} type="file" accept=".zip,.rar,.tar,.gz" className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                {uploadFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-3"
                    style={{ background: "var(--primary-light)" }}>
                    <FolderOpen size={18} style={{ color: "var(--primary-dark)" }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--primary-dark)" }}>{uploadFile.name}</p>
                      <p className="text-xs text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => setUploadFile(null)} className="text-slate-400 hover:text-red-400">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => uploadRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl p-6 text-center hover:border-amber-400 transition-colors mb-3"
                    style={{ borderColor: "var(--border)" }}>
                    <Upload size={20} className="mx-auto mb-1 text-slate-400" />
                    <p className="text-sm text-slate-500">Click to select completed ZIP</p>
                  </button>
                )}
                <button onClick={handleUploadCompleted} disabled={!uploadFile || uploading}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: "var(--primary)" }}>
                  {uploading ? "Uploading..." : "Upload & Mark Completed"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
