const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function req(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res;
}

export const api = {
  async login(email: string, password: string) {
    const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    return r.json();
  },
  async me() {
    const r = await req("/api/auth/me");
    return r.json();
  },
  // Admin
  async getUsers() {
    const r = await req("/api/admin/users");
    return r.json();
  },
  async createUser(data: { email: string; name: string; password: string }) {
    const r = await req("/api/admin/users", { method: "POST", body: JSON.stringify(data) });
    return r.json();
  },
  async deleteUser(id: string) {
    await req(`/api/admin/users/${id}`, { method: "DELETE" });
  },
  async getAllTasks() {
    const r = await req("/api/admin/tasks");
    return r.json();
  },
  async getTask(id: string, role = "admin") {
    const prefix = role === "admin" ? "/api/admin" : "/api/employee";
    const r = await req(`${prefix}/tasks/${id}`);
    return r.json();
  },
  async createTask(fd: FormData) {
    const r = await req("/api/admin/tasks", { method: "POST", body: fd });
    return r.json();
  },
  async requestUpdate(taskId: string) {
    await req(`/api/admin/tasks/${taskId}/request-update`, { method: "POST" });
  },
  async getTaskUpdates(taskId: string) {
    const r = await req(`/api/admin/tasks/${taskId}/updates`);
    return r.json();
  },
  async getAnalytics() {
    const r = await req("/api/admin/analytics");
    return r.json();
  },
  downloadCompletedZip(taskId: string) {
    const token = getToken();
    const url = `${BASE}/api/admin/tasks/${taskId}/download-zip`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `completed_${taskId}.zip`;
    // Need token in URL or use fetch
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const u = URL.createObjectURL(blob);
        a.href = u;
        a.click();
        URL.revokeObjectURL(u);
      });
  },
  // Employee
  async getMyTasks() {
    const r = await req("/api/employee/tasks");
    return r.json();
  },
  async getMyTask(id: string) {
    const r = await req(`/api/employee/tasks/${id}`);
    return r.json();
  },
  downloadTaskZip(taskId: string) {
    const token = getToken();
    fetch(`${BASE}/api/employee/tasks/${taskId}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const u = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = u;
        a.download = `task_${taskId}.zip`;
        a.click();
        URL.revokeObjectURL(u);
      });
  },
  async getNotifications() {
    const r = await req("/api/employee/notifications");
    return r.json();
  },
  async sendUpdate(taskId: string, data: object) {
    const r = await req(`/api/employee/tasks/${taskId}/send-update`, { method: "POST", body: JSON.stringify(data) });
    return r.json();
  },
  async uploadCompleted(taskId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await req(`/api/employee/tasks/${taskId}/upload-completed`, { method: "POST", body: fd });
    return r.json();
  },
  async updateTaskStatus(taskId: string, status: string) {
    const r = await req(`/api/employee/tasks/${taskId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    return r.json();
  },
};

export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
