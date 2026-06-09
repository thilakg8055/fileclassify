"use client";
import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Upload, FolderOpen, X, CheckCircle, AlertCircle,
  Database, File, FileText, Image as ImageIcon, Film, Music, FileArchive
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileIcon({ name, size = 14 }: { name: string; size?: number }) {
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

// ── Page ──────────────────────────────────────────────────────

export default function AdminUploadFolderPage() {
  const [folderName, setFolderName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<{ folder_id: number; folder_name: string } | null>(null);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── File picking ────────────────────────────────────────────

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...arr.filter((f) => !existing.has(f.name + f.size))];
    });
    // Auto-fill folder name from the webkitRelativePath if available
    if (!folderName && arr[0]) {
      const rel = (arr[0] as any).webkitRelativePath as string | undefined;
      if (rel) setFolderName(rel.split("/")[0]);
    }
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // Drag-and-drop
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    dropRef.current?.classList.add("border-amber-400");
  }
  function onDragLeave() {
    dropRef.current?.classList.remove("border-amber-400");
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dropRef.current?.classList.remove("border-amber-400");
    handleFiles(e.dataTransfer.files);
  }

  // ── Upload ──────────────────────────────────────────────────

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!folderName.trim()) { setError("Please enter a folder name"); return; }
    if (files.length === 0) { setError("Please select at least one file"); return; }

    setUploading(true);
    setError("");
    setSuccess(null);

    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const fd = new FormData();
      fd.append("folder_name", folderName.trim());
      fd.append("description", description.trim());
      for (const f of files) {
        fd.append("files", f, f.name);
      }

      const res = await fetch(`${BASE}/api/admin/db-folders/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Upload failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      setSuccess({ folder_id: data.folder_id, folder_name: data.folder_name });
      setFolderName("");
      setDescription("");
      setFiles([]);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Database size={22} className="text-green-500" />
            Upload Folder to Database
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Store a folder's files in PostgreSQL so they appear in the Assign Task page
          </p>
        </div>

        {success && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl mb-6 bg-green-50 border border-green-100">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                Folder uploaded successfully!
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                <strong>{success.folder_name}</strong> (ID: {success.folder_id}) is now available
                in the <strong>Assign Task → DB Folders</strong> tab.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">

          {/* Folder info */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4">Folder Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                  placeholder="e.g. Q3_Documents_2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                  placeholder="Short description of this folder's contents"
                />
              </div>
            </div>
          </div>

          {/* File picker */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FolderOpen size={17} style={{ color: "var(--primary)" }} />
                Select Files
              </span>
              {files.length > 0 && (
                <span className="text-xs text-slate-500 font-normal">
                  {files.length} file{files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)}
                </span>
              )}
            </h2>

            {/* Drop zone */}
            <div
              ref={dropRef}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer mb-4"
              style={{ borderColor: "var(--border)" }}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={28} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                Drag &amp; drop files here, or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Select multiple files (Ctrl/Cmd+A to select all). All file types supported.
              </p>

              {/* Hidden inputs — one for individual files, one for folder */}
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Folder picker button (uses webkitdirectory) */}
            <button
              type="button"
              className="w-full py-2.5 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 mb-4 hover:bg-slate-50 transition-colors"
              style={{ borderColor: "var(--border)" }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                (input as any).webkitdirectory = true;
                input.multiple = true;
                input.onchange = (e) => {
                  handleFiles((e.target as HTMLInputElement).files);
                };
                input.click();
              }}
            >
              <FolderOpen size={16} style={{ color: "var(--primary)" }} />
              Select Entire Folder (browser picks all files inside)
            </button>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "#f8fafc" }}
                  >
                    <FileIcon name={f.name} size={14} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">{formatBytes(f.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-slate-300 hover:text-red-500 flex-shrink-0 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || files.length === 0 || !folderName.trim()}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Uploading {files.length} file{files.length !== 1 ? "s" : ""} to Database…
              </>
            ) : (
              <>
                <Database size={16} />
                Save Folder to Database ({files.length} file{files.length !== 1 ? "s" : ""})
              </>
            )}
          </button>

          <p className="text-xs text-center text-slate-400">
            Files are stored as binary data in PostgreSQL and can be assigned to employees
            from the <strong>Assign Task → DB Folders</strong> tab.
          </p>
        </form>
      </div>
    </AdminLayout>
  );
}