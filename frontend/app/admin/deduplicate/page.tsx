"use client";
import { useState, useRef, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Upload, FileSearch, CheckCircle, AlertTriangle, Download,
  Trash2, RefreshCw, FolderOpen, X, ChevronDown, ChevronRight,
  Files, Copy, Layers, ZapOff, Zap, BarChart3, FileX2
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

interface FileEntry {
  name: string;
  basename: string;
  size: number;
  category: string;
  duplicate_of?: string;
  duplicate_of_basename?: string;
}

interface DedupeStats {
  scanned: number;
  unique: number;
  duplicates: number;
  bytes_saved: number;
}

interface DedupeResult {
  session_id: string;
  stats: DedupeStats;
  unique_files: FileEntry[];
  duplicate_files: FileEntry[];
}

// ── Helpers ───────────────────────────────────────────────────

function fmt(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

function getCatColor(cat: string): string {
  if (cat.includes("PDF")) return "#ef4444";
  if (cat.includes("Word")) return "#3b82f6";
  if (cat.includes("Excel") || cat.includes("CSV")) return "#22c55e";
  if (cat.includes("Image")) return "#a855f7";
  if (cat.includes("Archive")) return "#f59e0b";
  if (cat.includes("Audio")) return "#06b6d4";
  if (cat.includes("Video")) return "#ec4899";
  return "#6b7280";
}

function getCatBg(cat: string): string {
  if (cat.includes("PDF")) return "#fef2f2";
  if (cat.includes("Word")) return "#eff6ff";
  if (cat.includes("Excel") || cat.includes("CSV")) return "#f0fdf4";
  if (cat.includes("Image")) return "#faf5ff";
  if (cat.includes("Archive")) return "#fffbeb";
  if (cat.includes("Audio")) return "#ecfeff";
  if (cat.includes("Video")) return "#fdf4ff";
  return "#f9fafb";
}

// ── Stat Card ─────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex items-start gap-4"
      style={{ borderColor: "var(--border)", background: "#fff" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>
          {value}
        </p>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── File Row ──────────────────────────────────────────────────

function FileRow({ file, isDuplicate }: { file: FileEntry; isDuplicate?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = getCatColor(file.category);
  const bg = getCatBg(file.category);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: isDuplicate ? "#fecaca" : "var(--border)" }}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
        style={{ background: isDuplicate ? "#fff8f8" : undefined }}
        onClick={() => isDuplicate && setExpanded(!expanded)}
      >
        {/* Category badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-md font-semibold flex-shrink-0"
          style={{ color, background: bg }}
        >
          {file.category.split(" ")[0]}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={file.name}>
            {file.basename}
          </p>
          {file.name !== file.basename && (
            <p className="text-xs text-slate-400 truncate" title={file.name}>
              {file.name}
            </p>
          )}
        </div>

        <span className="text-xs text-slate-400 flex-shrink-0">{fmt(file.size)}</span>

        {isDuplicate && (
          <ChevronDown
            size={14}
            className={`text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {isDuplicate && expanded && file.duplicate_of && (
        <div
          className="px-3 pb-3 pt-1 text-xs flex items-center gap-1.5"
          style={{ color: "#9f1239", background: "#fff1f2" }}
        >
          <Copy size={11} />
          <span className="font-medium">Duplicate of:</span>
          <span className="truncate font-mono" title={file.duplicate_of}>
            {file.duplicate_of_basename || file.duplicate_of}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function AdminDeduplicatePage() {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [recursive, setRecursive] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DedupeResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"unique" | "duplicates">("duplicates");
  const [downloading, setDownloading] = useState<"unique" | "duplicates" | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ── Drag & Drop ──────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.add("border-amber-400");
  }, []);
  const onDragLeave = useCallback(() => {
    dropRef.current?.classList.remove("border-amber-400");
  }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.remove("border-amber-400");
    const f = e.dataTransfer.files[0];
    if (f && f.name.toLowerCase().endsWith(".zip")) {
      setZipFile(f);
      setResult(null);
      setError("");
    } else {
      setError("Please drop a .zip file");
    }
  }, []);

  // ── Analyze ──────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!zipFile) return;
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", zipFile);
      fd.append("recursive", recursive ? "true" : "false");

      const res = await fetch(`${BASE}/api/admin/dedup/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }

      const data: DedupeResult = await res.json();
      setResult(data);
      setActiveTab(data.stats.duplicates > 0 ? "duplicates" : "unique");
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Download ─────────────────────────────────────────────────

  async function handleDownload(type: "unique" | "duplicates") {
    if (!result) return;
    setDownloading(type);
    try {
      const res = await fetch(
        `${BASE}/api/admin/dedup/download/${result.session_id}/${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stem = zipFile?.name.replace(".zip", "") || "files";
      a.download = `${stem}_${type}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDownloading(null);
    }
  }

  // ── Reset ────────────────────────────────────────────────────

  async function handleReset() {
    if (result) {
      fetch(`${BASE}/api/admin/dedup/session/${result.session_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setZipFile(null);
    setResult(null);
    setError("");
  }

  const { stats } = result || {};
  const dedupRatio = stats ? Math.round((stats.duplicates / Math.max(stats.scanned, 1)) * 100) : 0;

  // ── Render ───────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--primary)" }}
              >
                <Layers size={18} className="text-white" />
              </div>
              Duplicate File Detector
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Upload a ZIP archive to detect and separate duplicate files using SHA-256 content hashing
            </p>
          </div>
          {(zipFile || result) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border hover:bg-slate-50 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <RefreshCw size={14} /> Start Over
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── LEFT: Upload Panel ─────────────────────────────── */}
          <div className="xl:col-span-1 space-y-5">
            {/* Upload zone */}
            <div
              className="bg-white rounded-2xl border p-6"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Upload size={16} style={{ color: "var(--primary)" }} />
                Upload ZIP File
              </h2>

              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setZipFile(f);
                  setResult(null);
                  setError("");
                }}
              />

              {zipFile ? (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl mb-4"
                  style={{ background: "var(--primary-light)" }}
                >
                  <FolderOpen size={20} style={{ color: "var(--primary-dark)" }} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--primary-dark)" }}
                    >
                      {zipFile.name}
                    </p>
                    <p className="text-xs text-slate-500">{fmt(zipFile.size)}</p>
                  </div>
                  <button
                    onClick={() => { setZipFile(null); setResult(null); }}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  ref={dropRef}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors mb-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Upload size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">
                    Drop a ZIP file here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                </div>
              )}

              {/* Options */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 cursor-pointer"
                style={{ background: "#f8fafc", border: "1px solid var(--border)" }}
                onClick={() => setRecursive(!recursive)}
              >
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${recursive ? "" : "bg-slate-200"}`}
                  style={recursive ? { background: "var(--primary)" } : {}}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ transform: recursive ? "translateX(18px)" : "translateX(2px)" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Scan subdirectories</p>
                  <p className="text-xs text-slate-400">
                    {recursive ? "All nested folders included" : "Root level only"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!zipFile || analyzing}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ background: "var(--primary)" }}
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileSearch size={16} />
                    Detect Duplicates
                  </>
                )}
              </button>

              {error && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl flex items-start gap-1.5">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>

            {/* How it works */}
            {!result && (
              <div
                className="bg-white rounded-2xl border p-6"
                style={{ borderColor: "var(--border)" }}
              >
                <h2 className="font-semibold mb-4 text-sm text-slate-500 uppercase tracking-wider">
                  How it works
                </h2>
                <div className="space-y-3">
                  {[
                    { icon: Upload, text: "Upload a ZIP file containing your documents", color: "#F59E0B" },
                    { icon: FileSearch, text: "Engine computes SHA-256 hash for each file", color: "#3B82F6" },
                    { icon: Layers, text: "Files with identical hashes are identified as duplicates", color: "#8B5CF6" },
                    { icon: Download, text: "Download unique files or duplicate files separately", color: "#10B981" },
                  ].map(({ icon: Icon, text, color }, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: color + "18" }}
                      >
                        <Icon size={13} style={{ color }} />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats cards (shown after analysis) */}
            {result && stats && (
              <div className="space-y-3">
                <StatCard
                  icon={Files}
                  label="Total Scanned"
                  value={stats.scanned}
                  color="#3B82F6"
                  bg="#EFF6FF"
                />
                <StatCard
                  icon={CheckCircle}
                  label="Unique Files"
                  value={stats.unique}
                  color="#10B981"
                  bg="#ECFDF5"
                />
                <StatCard
                  icon={Copy}
                  label="Duplicates Found"
                  value={stats.duplicates}
                  color="#EF4444"
                  bg="#FEF2F2"
                  sub={stats.duplicates > 0 ? `${dedupRatio}% of total files` : "No duplicates 🎉"}
                />
                <StatCard
                  icon={ZapOff}
                  label="Space Wasted"
                  value={fmt(stats.bytes_saved)}
                  color="#F59E0B"
                  bg="#FFFBEB"
                  sub={stats.bytes_saved > 0 ? "Saved by removing duplicates" : ""}
                />
              </div>
            )}
          </div>

          {/* ── RIGHT: Results Panel ───────────────────────────── */}
          <div className="xl:col-span-2">
            {!result ? (
              /* Empty state */
              <div
                className="bg-white rounded-2xl border h-full min-h-80 flex flex-col items-center justify-center gap-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--primary-light)" }}
                >
                  <Layers size={28} style={{ color: "var(--primary)" }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-600">No analysis yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Upload a ZIP file and click "Detect Duplicates"
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Visual progress bar */}
                {stats && (
                  <div
                    className="bg-white rounded-2xl border p-6"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold flex items-center gap-2">
                        <BarChart3 size={16} style={{ color: "var(--primary)" }} />
                        Deduplication Overview
                      </h2>
                      <span className="text-sm font-semibold text-slate-500">
                        {stats.scanned} files analyzed
                      </span>
                    </div>

                    {/* Stacked bar */}
                    <div className="flex h-4 rounded-full overflow-hidden mb-2">
                      {stats.unique > 0 && (
                        <div
                          className="transition-all"
                          style={{
                            width: `${(stats.unique / stats.scanned) * 100}%`,
                            background: "#10B981",
                          }}
                        />
                      )}
                      {stats.duplicates > 0 && (
                        <div
                          className="transition-all"
                          style={{
                            width: `${(stats.duplicates / stats.scanned) * 100}%`,
                            background: "#EF4444",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-5 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                        {stats.unique} unique
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-3 h-3 rounded bg-red-500 inline-block" />
                        {stats.duplicates} duplicates
                      </span>
                    </div>

                    {/* No duplicates banner */}
                    {stats.duplicates === 0 && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">
                            No duplicates found!
                          </p>
                          <p className="text-xs text-emerald-600">
                            All {stats.scanned} files have unique content.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Download buttons */}
                {stats && stats.scanned > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownload("unique")}
                      disabled={downloading !== null || stats.unique === 0}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                      style={{ background: "#10B981" }}
                    >
                      {downloading === "unique" ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={15} />
                      )}
                      Download Unique ({stats.unique})
                    </button>

                    <button
                      onClick={() => handleDownload("duplicates")}
                      disabled={downloading !== null || stats.duplicates === 0}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border disabled:opacity-50 transition-all hover:bg-red-50"
                      style={{
                        borderColor: "#fecaca",
                        color: "#dc2626",
                        background: "#fff8f8",
                      }}
                    >
                      {downloading === "duplicates" ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <FileX2 size={15} />
                      )}
                      Download Duplicates ({stats.duplicates})
                    </button>
                  </div>
                )}

                {/* File list tabs */}
                <div
                  className="bg-white rounded-2xl border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Tabs */}
                  <div
                    className="flex border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {(
                      [
                        {
                          key: "duplicates",
                          label: "Duplicates",
                          count: result.duplicate_files.length,
                          color: "#dc2626",
                          bg: "#fef2f2",
                        },
                        {
                          key: "unique",
                          label: "Unique Files",
                          count: result.unique_files.length,
                          color: "#059669",
                          bg: "#ecfdf5",
                        },
                      ] as const
                    ).map(({ key, label, count, color, bg }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all border-b-2 ${
                          activeTab === key
                            ? "border-current"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                        style={activeTab === key ? { color, borderColor: color } : {}}
                      >
                        {label}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={
                            activeTab === key
                              ? { background: bg, color }
                              : { background: "#f1f5f9", color: "#64748b" }
                          }
                        >
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* File list */}
                  <div className="p-4 max-h-[520px] overflow-y-auto space-y-2">
                    {activeTab === "duplicates" ? (
                      result.duplicate_files.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                          <p className="text-sm font-medium text-emerald-600">
                            No duplicates found!
                          </p>
                        </div>
                      ) : (
                        result.duplicate_files.map((f, i) => (
                          <FileRow key={i} file={f} isDuplicate />
                        ))
                      )
                    ) : result.unique_files.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p className="text-sm">No unique files</p>
                      </div>
                    ) : (
                      result.unique_files.map((f, i) => (
                        <FileRow key={i} file={f} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}