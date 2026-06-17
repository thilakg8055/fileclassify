

"use client";
import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import {
  Plus, X, Users, Tag, CheckCircle, Cloud, FolderOpen,
  HardDrive, Link as LinkIcon, AlertCircle, Folder,
  ChevronRight, ChevronDown, RefreshCw, Check, File,
  FileText, Image as ImageIcon, Film, Music, Database,
  Search, FileArchive
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

type SourceMode = "db" | "onedrive" | "upload";

interface DBFolder {
  id: number;
  name: string;
  description: string;
  created_at: string | null;
  file_count: number;
  total_bytes: number;
}

interface DriveNode {
  id: string;
  name: string;
  type: "folder" | "file";
  childCount?: number;
  children?: DriveNode[];
  loaded?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileIcon({ name, size = 13 }: { name: string; size?: number }) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg","jpeg","png","gif","webp","svg","bmp"].includes(ext))
    return <ImageIcon size={size} className="text-purple-400 flex-shrink-0" />;
  if (["mp4","webm","avi","mov"].includes(ext))
    return <Film size={size} className="text-pink-400 flex-shrink-0" />;
  if (["mp3","wav","flac","aac"].includes(ext))
    return <Music size={size} className="text-indigo-400 flex-shrink-0" />;
  if (["pdf","doc","docx","txt","md"].includes(ext))
    return <FileText size={size} className="text-blue-400 flex-shrink-0" />;
  if (["zip","rar","tar","gz"].includes(ext))
    return <FileArchive size={size} className="text-amber-400 flex-shrink-0" />;
  return <File size={size} className="text-slate-400 flex-shrink-0" />;
}

// ── OneDrive Tree Node ────────────────────────────────────────

function DriveTreeNode({
  node,
  depth,
  selectedFolderId,
  onSelect,
  onToggle,
  expandedIds,
  loadingId,
}: {
  node: DriveNode;
  depth: number;
  selectedFolderId: string | null;
  onSelect: (n: DriveNode) => void;
  onToggle: (n: DriveNode) => void;
  expandedIds: Set<string>;
  loadingId: string | null;
}) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedFolderId === node.id;
  const isFolder = node.type === "folder";
  const isLoading = loadingId === node.id;
  const hasChildren = isFolder && (node.childCount ?? 0) > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1 pr-2 rounded-lg cursor-pointer select-none transition-colors"
        style={{
          paddingLeft: `${8 + depth * 14}px`,
          background: isSelected ? "var(--primary-light)" : undefined,
        }}
        onClick={() => {
          if (isFolder) {
            onSelect(isSelected ? { ...node, id: "" } : node);
            onToggle(node);
          }
        }}
      >
        {isFolder ? (
          <span
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400"
            onClick={(e) => { e.stopPropagation(); onToggle(node); }}
          >
            {isLoading
              ? <RefreshCw size={11} className="animate-spin" />
              : hasChildren
                ? isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                : <span className="w-3" />}
          </span>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {isFolder ? (
          isExpanded
            ? <FolderOpen size={14} className="flex-shrink-0" style={{ color: isSelected ? "var(--primary)" : "#F59E0B" }} />
            : <Folder size={14} className="flex-shrink-0" style={{ color: isSelected ? "var(--primary)" : "#F59E0B" }} />
        ) : (
          <FileIcon name={node.name} size={13} />
        )}

        <span
          className="flex-1 text-xs truncate"
          style={{
            fontWeight: isFolder ? 500 : 400,
            color: isSelected ? "var(--primary-dark)" : isFolder ? "var(--text)" : "var(--text-muted)",
          }}
        >
          {node.name}
        </span>

        {isSelected && <Check size={12} className="flex-shrink-0" style={{ color: "var(--primary)" }} />}
      </div>

      {isFolder && isExpanded && node.children !== undefined && (
        <div>
          {node.children.length === 0 ? (
            <div
              className="text-xs italic py-1"
              style={{ paddingLeft: `${8 + (depth + 1) * 14 + 4}px`, color: "var(--text-muted)" }}
            >
              Empty folder
            </div>
          ) : (
            node.children.map((child) => (
              <DriveTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedFolderId={selectedFolderId}
                onSelect={onSelect}
                onToggle={onToggle}
                expandedIds={expandedIds}
                loadingId={loadingId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function AdminAssign() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    employee_id: "",
    title: "",
    description: "",
    classifications: ["High", "Med A", "Med B", "Low"],
  });
  const [newClass, setNewClass] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("db");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // ── DB Folders state ────────────────────────────────────────
  const [dbFolders, setDbFolders] = useState<DBFolder[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");
  const [selectedDbFolder, setSelectedDbFolder] = useState<DBFolder | null>(null);
  const [dbSearch, setDbSearch] = useState("");

  // ── OneDrive state ──────────────────────────────────────────
  const [oneDriveUrl, setOneDriveUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [odLoading, setOdLoading] = useState(false);
  const [odError, setOdError] = useState("");
  const [driveTree, setDriveTree] = useState<DriveNode[]>([]);
  const [resolvedDrive, setResolvedDrive] = useState<{ driveId: string; rootItemId: string } | null>(null);
  const [selectedOdFolder, setSelectedOdFolder] = useState<DriveNode | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);

  // ── ZIP upload state ────────────────────────────────────────
  const [zipFile, setZipFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load ────────────────────────────────────────────────────
  useEffect(() => {
    api.getUsers().then(setUsers);
  }, []);

  useEffect(() => {
    if (sourceMode === "db") loadDbFolders();
  }, [sourceMode]);

  async function loadDbFolders() {
    setDbLoading(true);
    setDbError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/db-folders`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDbFolders(await res.json());
    } catch (e: any) {
      setDbError(e.message || "Failed to load folders");
    } finally {
      setDbLoading(false);
    }
  }

  // ── Classifications ────────────────────────────────────────
  function addClassification() {
    const v = newClass.trim();
    if (v && !form.classifications.includes(v)) {
      setForm({ ...form, classifications: [...form.classifications, v] });
      setNewClass("");
    }
  }
  function removeClass(c: string) {
    setForm({ ...form, classifications: form.classifications.filter((x) => x !== c) });
  }

  // ── OneDrive helpers ────────────────────────────────────────
  function validateUrl(url: string) {
    return url.includes("onedrive.live.com") || url.includes("1drv.ms") || url.includes("sharepoint.com");
  }
  function handleUrlChange(val: string) {
    setOneDriveUrl(val);
    setUrlError(val && !validateUrl(val) ? "Please paste a valid OneDrive or SharePoint URL" : "");
    setDriveTree([]);
    setSelectedOdFolder(null);
    setExpandedIds(new Set());
    setResolvedDrive(null);
    setOdError("");
  }

  async function loadOneDriveFolders() {
    if (!oneDriveUrl || !validateUrl(oneDriveUrl)) return;
    setOdLoading(true);
    setOdError("");
    setDriveTree([]);
    setSelectedOdFolder(null);
    setExpandedIds(new Set());
    setResolvedDrive(null);

    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${BASE}/api/admin/onedrive/list-folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ share_url: oneDriveUrl.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResolvedDrive({ driveId: data.drive_id, rootItemId: data.root_item_id });
      setDriveTree(
        data.children.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          childCount: c.childCount,
          children: undefined,
        }))
      );
    } catch (e: any) {
      setOdError(e.message || "Failed to load OneDrive folders");
    } finally {
      setOdLoading(false);
    }
  }

  async function handleOdToggle(node: DriveNode) {
    if (!resolvedDrive || node.type !== "folder") return;
    const next = new Set(expandedIds);
    if (next.has(node.id)) {
      next.delete(node.id);
      setExpandedIds(next);
      return;
    }
    next.add(node.id);
    setExpandedIds(next);

    if (node.children !== undefined || node.loaded) return;
    setLoadingNodeId(node.id);
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${BASE}/api/admin/onedrive/list-children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ drive_id: resolvedDrive.driveId, item_id: node.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const children: DriveNode[] = data.children.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        childCount: c.childCount,
        children: undefined,
      }));
      function patch(nodes: DriveNode[]): DriveNode[] {
        return nodes.map((n) =>
          n.id === node.id
            ? { ...n, children, loaded: true }
            : { ...n, children: n.children ? patch(n.children) : undefined }
        );
      }
      setDriveTree((prev) => patch(prev));
    } catch {}
    setLoadingNodeId(null);
  }

  function handleOdSelect(node: DriveNode) {
    if (!node.id) { setSelectedOdFolder(null); return; }
    setSelectedOdFolder(node.type === "folder" ? node : null);
  }

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employee_id) { setError("Please select an employee"); return; }
    if (!form.title.trim()) { setError("Please enter a task title"); return; }

    if (sourceMode === "db" && !selectedDbFolder) {
      setError("Please select a folder from the database"); return;
    }
    if (sourceMode === "onedrive" && !selectedOdFolder) {
      setError("Please select a folder from OneDrive"); return;
    }
    if (sourceMode === "upload" && !zipFile) {
      setError("Please select a ZIP file"); return;
    }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("employee_id", form.employee_id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("classifications", JSON.stringify(form.classifications));

      if (sourceMode === "db" && selectedDbFolder) {
        fd.append("source", "db_folder");
        fd.append("db_folder_id", String(selectedDbFolder.id));
        fd.append("db_folder_name", selectedDbFolder.name);
      } else if (sourceMode === "onedrive" && selectedOdFolder && resolvedDrive) {
        fd.append("source", "onedrive");
        fd.append("onedrive_drive_id", resolvedDrive.driveId);
        fd.append("onedrive_item_id", selectedOdFolder.id);
        fd.append("onedrive_folder_name", selectedOdFolder.name);
      } else if (sourceMode === "upload" && zipFile) {
        fd.append("source", "upload");
        fd.append("file", zipFile);
      }

      await api.createTask(fd);
      setSuccess(true);
      setForm({ employee_id: "", title: "", description: "", classifications: ["High", "Med A", "Med B", "Low"] });
      setSelectedDbFolder(null);
      setSelectedOdFolder(null);
      setZipFile(null);
      setOneDriveUrl("");
      setDriveTree([]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredDbFolders = dbFolders.filter(
    (f) =>
      f.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(dbSearch.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="p-8" style={{ maxWidth: "100%" }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Assign Task</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Select a file source, configure the task, and assign it to an employee
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 bg-green-50 text-green-700 text-sm font-medium">
            <CheckCircle size={18} /> Task assigned successfully!
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* ── LEFT: Form ──────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-6" style={{ flex: "0 0 460px", minWidth: 0 }}>

            {/* Employee selector */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users size={17} style={{ color: "var(--primary)" }} /> Select Employee
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {users.map((u) => (
                  <button key={u.id} type="button"
                    onClick={() => setForm({ ...form, employee_id: u.id })}
                    className="flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all"
                    style={{
                      borderColor: form.employee_id === u.id ? "var(--primary)" : "var(--border)",
                      background: form.employee_id === u.id ? "var(--primary-light)" : "#f8fafc",
                      color: form.employee_id === u.id ? "var(--primary-dark)" : "var(--text)",
                    }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: form.employee_id === u.id ? "var(--primary)" : "#94a3b8" }}>
                      {u.name[0]}
                    </div>
                    <span className="truncate">{u.name}</span>
                  </button>
                ))}
                {users.length === 0 && <p className="text-sm text-slate-400 col-span-3">No employees yet.</p>}
              </div>
            </div>

            {/* Task details */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold mb-4">Task Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Task Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                    placeholder="e.g. Q3 Document Classification" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                    placeholder="Any additional instructions..." />
                </div>
              </div>
            </div>

            {/* Classifications */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Tag size={17} style={{ color: "var(--primary)" }} /> Classification Options
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.classifications.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
                    {c}
                    <button type="button" onClick={() => removeClass(c)} className="hover:text-red-500">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newClass} onChange={(e) => setNewClass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addClassification())}
                  className="flex-1 px-4 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                  placeholder="Add custom classification..." />
                <button type="button" onClick={addClassification}
                  className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
                  style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>

            {/* File Source selector */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold mb-4">File Source</h2>

              {/* 3-tab toggle */}
              <div className="flex gap-1.5 mb-5 p-1 rounded-xl" style={{ background: "#f1f5f9" }}>
                {(
                  [
                    { mode: "db",       icon: Database,    label: "DB Folders" },
                    { mode: "onedrive", icon: Cloud,       label: "OneDrive"   },
                    { mode: "upload",   icon: HardDrive,   label: "Upload ZIP" },
                  ] as const
                ).map(({ mode, icon: Icon, label }) => (
                  <button key={mode} type="button"
                    onClick={() => setSourceMode(mode)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      sourceMode === mode ? "bg-white shadow-sm text-slate-800" : "text-slate-500"
                    }`}>
                    <Icon size={13} className={
                      mode === "db" ? "text-green-500" :
                      mode === "onedrive" ? "text-blue-500" : "text-slate-500"
                    } />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── DB Folders mini-summary ─────────────────── */}
              {sourceMode === "db" && (
                <div className="space-y-2">
                  {selectedDbFolder ? (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100">
                      <Database size={15} className="text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-800 truncate">{selectedDbFolder.name}</p>
                        <p className="text-xs text-green-600">
                          {selectedDbFolder.file_count} files · {formatBytes(selectedDbFolder.total_bytes)}
                        </p>
                      </div>
                      <button type="button" onClick={() => setSelectedDbFolder(null)}
                        className="text-green-400 hover:text-red-500 flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 flex items-center gap-1.5">
                      <AlertCircle size={11} /> Select a folder from the panel on the right
                    </p>
                  )}
                  <p className="text-xs text-slate-400">Files are read directly from the PostgreSQL database.</p>
                </div>
              )}

              {/* ── OneDrive ───────────────────────────────── */}
              {sourceMode === "onedrive" && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3.5 text-xs" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                    <p className="font-semibold flex items-center gap-1.5 mb-1.5">
                      <LinkIcon size={11} /> How to get the link:
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-blue-700 ml-1">
                      <li>Open OneDrive → right-click folder → <strong>Share</strong></li>
                      <li>Set to <strong>"Anyone with the link can view"</strong></li>
                      <li>Click <strong>Copy link</strong> and paste below</li>
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Cloud size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                      <input type="url" value={oneDriveUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: urlError ? "#ef4444" : "var(--border)", background: "#f8fafc" }}
                        placeholder="https://onedrive.live.com/share?..." />
                    </div>
                    <button type="button" onClick={loadOneDriveFolders}
                      disabled={!oneDriveUrl || !!urlError || odLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 flex-shrink-0"
                      style={{ background: "var(--primary)" }}>
                      {odLoading
                        ? <><RefreshCw size={13} className="animate-spin" /> Loading</>
                        : <><FolderOpen size={13} /> Load</>}
                    </button>
                  </div>

                  {urlError && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <AlertCircle size={11} /> {urlError}
                    </p>
                  )}
                  {odError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl flex items-start gap-1.5">
                      <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{odError}</span>
                    </div>
                  )}

                  {selectedOdFolder ? (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100">
                      <Folder size={15} className="text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-800 truncate">{selectedOdFolder.name}</p>
                        <p className="text-xs text-green-600">Selected — will be zipped &amp; sent</p>
                      </div>
                      <button type="button" onClick={() => setSelectedOdFolder(null)}
                        className="text-green-400 hover:text-red-500 flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ) : driveTree.length > 0 ? (
                    <p className="text-xs text-amber-600 flex items-center gap-1.5">
                      <AlertCircle size={11} /> Select a folder from the panel on the right
                    </p>
                  ) : null}

                  <p className="text-xs text-slate-400">Original files in OneDrive will not be modified.</p>
                </div>
              )}

              {/* ── Upload ZIP ─────────────────────────────── */}
              {sourceMode === "upload" && (
                <>
                  <input ref={fileRef} type="file" accept=".zip,.rar,.tar,.gz" className="hidden"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)} />
                  {zipFile ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--primary-light)" }}>
                      <FolderOpen size={20} style={{ color: "var(--primary-dark)" }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: "var(--primary-dark)" }}>{zipFile.name}</p>
                        <p className="text-xs text-slate-500">{formatBytes(zipFile.size)}</p>
                      </div>
                      <button type="button" onClick={() => setZipFile(null)} className="text-slate-400 hover:text-red-500">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-amber-400 transition-colors"
                      style={{ borderColor: "var(--border)" }}>
                      <HardDrive size={24} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-medium">Click to select ZIP file</p>
                      <p className="text-xs text-slate-400 mt-1">Supports .zip, .rar, .tar, .gz</p>
                    </button>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: "var(--primary)" }}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {sourceMode === "db" ? "Fetching from DB & Assigning..."
                    : sourceMode === "onedrive" ? "Fetching from OneDrive & Assigning..."
                    : "Assigning..."}
                </>
              ) : "Assign Task to Employee"}
            </button>
          </form>

          {/* ── RIGHT: Context panel ──────────────────────── */}
          <div
            className="flex-1 bg-white rounded-2xl border flex flex-col overflow-hidden"
            style={{
              borderColor: "var(--border)",
              minWidth: 0,
              minHeight: 500,
              position: "sticky",
              top: "1.5rem",
              maxHeight: "calc(100vh - 120px)",
            }}
          >
            {/* ── DB Folders Panel ────────────────────────── */}
            {sourceMode === "db" && (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
                  style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
                  <div>
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <Database size={15} className="text-green-500" /> Database Folders
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {dbFolders.length} folder{dbFolders.length !== 1 ? "s" : ""} in PostgreSQL
                    </p>
                  </div>
                  <button type="button" onClick={loadDbFolders} disabled={dbLoading}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Refresh">
                    <RefreshCw size={14} className={dbLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                      placeholder="Search folders..."
                    />
                  </div>
                </div>

                {/* Folder list */}
                <div className="flex-1 overflow-y-auto p-3">
                  {dbLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-slate-400">
                      <RefreshCw size={22} className="animate-spin" />
                      <p className="text-sm">Loading folders from database...</p>
                    </div>
                  ) : dbError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-red-400">
                      <AlertCircle size={28} />
                      <p className="text-sm font-medium">Connection Error</p>
                      <p className="text-xs text-center text-red-300 max-w-xs">{dbError}</p>
                      <button type="button" onClick={loadDbFolders}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        Retry
                      </button>
                    </div>
                  ) : filteredDbFolders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "#f0fdf4" }}>
                        <Database size={26} className="text-green-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {dbSearch ? "No folders match your search" : "No folders in database"}
                      </p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">
                        {dbSearch
                          ? "Try a different search term"
                          : "Run setup_postgres.sql and upload folders to the database"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDbFolders.map((folder) => {
                        const isSelected = selectedDbFolder?.id === folder.id;
                        return (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => setSelectedDbFolder(isSelected ? null : folder)}
                            className="w-full text-left p-4 rounded-xl border transition-all"
                            style={{
                              borderColor: isSelected ? "var(--primary)" : "var(--border)",
                              background: isSelected ? "var(--primary-light)" : "#f8fafc",
                            }}>
                            <div className="flex items-start gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: isSelected ? "var(--primary)" : "#e2e8f0" }}>
                                <Database size={16} className={isSelected ? "text-white" : "text-green-600"} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate"
                                  style={{ color: isSelected ? "var(--primary-dark)" : "var(--text)" }}>
                                  {folder.name}
                                </p>
                                {folder.description && (
                                  <p className="text-xs text-slate-500 truncate mt-0.5">{folder.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-xs text-slate-400">
                                    {folder.file_count} file{folder.file_count !== 1 ? "s" : ""}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {formatBytes(folder.total_bytes)}
                                  </span>
                                  {folder.created_at && (
                                    <span className="text-xs text-slate-400">
                                      {new Date(folder.created_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <Check size={16} className="flex-shrink-0 mt-1" style={{ color: "var(--primary)" }} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected footer */}
                {selectedDbFolder && (
                  <div className="p-4 border-t flex-shrink-0"
                    style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--primary-light)" }}>
                      <Database size={18} style={{ color: "var(--primary)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--primary-dark)" }}>
                          {selectedDbFolder.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedDbFolder.file_count} files · {formatBytes(selectedDbFolder.total_bytes)} — will be zipped &amp; sent
                        </p>
                      </div>
                      <button type="button" onClick={() => setSelectedDbFolder(null)}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── OneDrive Panel ──────────────────────────── */}
            {sourceMode === "onedrive" && (
              <>
                <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
                  style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
                  <div>
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <Cloud size={15} className="text-blue-500" /> OneDrive Contents
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {driveTree.length > 0
                        ? selectedOdFolder
                          ? <>Selected: <span className="font-medium text-amber-700">{selectedOdFolder.name}</span></>
                          : "Click a folder to select it"
                        : "Paste a link and click Load"}
                    </p>
                  </div>
                  {driveTree.length > 0 && (
                    <button type="button" onClick={loadOneDriveFolders} disabled={odLoading}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Refresh">
                      <RefreshCw size={14} className={odLoading ? "animate-spin" : ""} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {odLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-slate-400">
                      <RefreshCw size={22} className="animate-spin" />
                      <p className="text-sm">Loading OneDrive contents...</p>
                    </div>
                  ) : driveTree.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--primary-light)" }}>
                        <Cloud size={26} className="text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No folder loaded yet</p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">
                        Paste a OneDrive shared folder link and click <strong>Load</strong>
                      </p>
                    </div>
                  ) : (
                    driveTree.map((node) => (
                      <DriveTreeNode
                        key={node.id}
                        node={node}
                        depth={0}
                        selectedFolderId={selectedOdFolder?.id || null}
                        onSelect={handleOdSelect}
                        onToggle={handleOdToggle}
                        expandedIds={expandedIds}
                        loadingId={loadingNodeId}
                      />
                    ))
                  )}
                </div>

                {selectedOdFolder && (
                  <div className="p-4 border-t flex-shrink-0"
                    style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--primary-light)" }}>
                      <Folder size={18} style={{ color: "var(--primary)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--primary-dark)" }}>
                          {selectedOdFolder.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Will be downloaded, zipped &amp; sent to employee
                        </p>
                      </div>
                      <button type="button" onClick={() => setSelectedOdFolder(null)}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Upload ZIP Panel ────────────────────────── */}
            {sourceMode === "upload" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--primary-light)" }}>
                  <HardDrive size={26} style={{ color: "var(--primary)" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600">Upload a ZIP file</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Compress your folder into a .zip file and upload it using the form on the left.
                    The employee will receive it as a downloadable task.
                  </p>
                </div>
                {zipFile && (
                  <div className="w-full max-w-xs px-4 py-3 rounded-xl border flex items-center gap-3"
                    style={{ background: "var(--primary-light)", borderColor: "var(--primary)" }}>
                    <FolderOpen size={18} style={{ color: "var(--primary-dark)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--primary-dark)" }}>
                        {zipFile.name}
                      </p>
                      <p className="text-xs text-slate-500">{formatBytes(zipFile.size)}</p>
                    </div>
                    <Check size={16} style={{ color: "var(--primary)" }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}