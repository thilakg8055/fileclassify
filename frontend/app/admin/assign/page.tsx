// "use client";
// import { useEffect, useState, useRef } from "react";
// import AdminLayout from "@/components/AdminLayout";
// import { api } from "@/lib/api";
// import { Upload, Plus, X, FolderOpen, Users, Tag, CheckCircle } from "lucide-react";

// export default function AdminAssign() {
//   const [users, setUsers] = useState<any[]>([]);
//   const [form, setForm] = useState({
//     employee_id: "",
//     title: "",
//     description: "",
//     classifications: ["High", "Med A", "Med B", "Low"],
//   });
//   const [newClass, setNewClass] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState("");
//   const fileRef = useRef<HTMLInputElement>(null);

//   useEffect(() => { api.getUsers().then(setUsers); }, []);

//   function addClassification() {
//     const v = newClass.trim();
//     if (v && !form.classifications.includes(v)) {
//       setForm({ ...form, classifications: [...form.classifications, v] });
//       setNewClass("");
//     }
//   }

//   function removeClass(c: string) {
//     setForm({ ...form, classifications: form.classifications.filter(x => x !== c) });
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (!file) { setError("Please select a ZIP/folder file"); return; }
//     if (!form.employee_id) { setError("Please select an employee"); return; }
//     setLoading(true);
//     setError("");
//     try {
//       const fd = new FormData();
//       fd.append("employee_id", form.employee_id);
//       fd.append("title", form.title);
//       fd.append("description", form.description);
//       fd.append("classifications", JSON.stringify(form.classifications));
//       fd.append("file", file);
//       await api.createTask(fd);
//       setSuccess(true);
//       setForm({ employee_id: "", title: "", description: "", classifications: ["High", "Med A", "Med B", "Low"] });
//       setFile(null);
//       setTimeout(() => setSuccess(false), 3000);
//     } catch (e: any) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <AdminLayout>
//       <div className="p-8 max-w-3xl">
//         <div className="mb-8">
//           <h1 className="text-2xl font-bold">Assign Task</h1>
//           <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Upload a folder/ZIP and assign it to an employee</p>
//         </div>

//         {success && (
//           <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 bg-green-50 text-green-700 text-sm font-medium">
//             <CheckCircle size={18} /> Task assigned successfully!
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Employee select */}
//           <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
//             <h2 className="font-semibold mb-4 flex items-center gap-2">
//               <Users size={17} style={{ color: "var(--primary)" }} /> Select Employee
//             </h2>
//             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//               {users.map(u => (
//                 <button key={u.id} type="button"
//                   onClick={() => setForm({ ...form, employee_id: u.id })}
//                   className="flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all"
//                   style={{
//                     borderColor: form.employee_id === u.id ? "var(--primary)" : "var(--border)",
//                     background: form.employee_id === u.id ? "var(--primary-light)" : "#f8fafc",
//                     color: form.employee_id === u.id ? "var(--primary-dark)" : "var(--text)"
//                   }}>
//                   <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
//                     style={{ background: form.employee_id === u.id ? "var(--primary)" : "#94a3b8" }}>
//                     {u.name[0]}
//                   </div>
//                   <span className="truncate">{u.name}</span>
//                 </button>
//               ))}
//               {users.length === 0 && <p className="text-sm text-slate-400 col-span-3">No employees. Create one first.</p>}
//             </div>
//           </div>

//           {/* Task details */}
//           <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
//             <h2 className="font-semibold mb-4">Task Details</h2>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1.5">Task Title</label>
//                 <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
//                   className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
//                   style={{ borderColor: "var(--border)", background: "#f8fafc" }}
//                   placeholder="e.g. Q3 Document Classification" required />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
//                 <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
//                   rows={3}
//                   className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
//                   style={{ borderColor: "var(--border)", background: "#f8fafc" }}
//                   placeholder="Any additional instructions..." />
//               </div>
//             </div>
//           </div>

//           {/* Classifications */}
//           <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
//             <h2 className="font-semibold mb-4 flex items-center gap-2">
//               <Tag size={17} style={{ color: "var(--primary)" }} /> Classification Options
//             </h2>
//             <div className="flex flex-wrap gap-2 mb-3">
//               {form.classifications.map(c => (
//                 <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
//                   style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
//                   {c}
//                   <button type="button" onClick={() => removeClass(c)} className="hover:text-red-500">
//                     <X size={13} />
//                   </button>
//                 </span>
//               ))}
//             </div>
//             <div className="flex gap-2">
//               <input value={newClass} onChange={e => setNewClass(e.target.value)}
//                 onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addClassification())}
//                 className="flex-1 px-4 py-2 rounded-xl border text-sm outline-none"
//                 style={{ borderColor: "var(--border)", background: "#f8fafc" }}
//                 placeholder="Add custom classification..." />
//               <button type="button" onClick={addClassification}
//                 className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
//                 style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
//                 <Plus size={15} /> Add
//               </button>
//             </div>
//           </div>

//           {/* File upload */}
//           <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
//             <h2 className="font-semibold mb-4 flex items-center gap-2">
//               <FolderOpen size={17} style={{ color: "var(--primary)" }} /> Upload Folder / ZIP
//             </h2>
//             <input ref={fileRef} type="file" accept=".zip,.rar,.tar,.gz" className="hidden"
//               onChange={e => setFile(e.target.files?.[0] || null)} />
//             {file ? (
//               <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--primary-light)" }}>
//                 <FolderOpen size={20} style={{ color: "var(--primary-dark)" }} />
//                 <div className="flex-1">
//                   <p className="text-sm font-medium" style={{ color: "var(--primary-dark)" }}>{file.name}</p>
//                   <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
//                 </div>
//                 <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
//                   <X size={18} />
//                 </button>
//               </div>
//             ) : (
//               <button type="button" onClick={() => fileRef.current?.click()}
//                 className="w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-amber-400 transition-colors"
//                 style={{ borderColor: "var(--border)" }}>
//                 <Upload size={24} className="mx-auto mb-2 text-slate-400" />
//                 <p className="text-sm font-medium">Click to select ZIP file</p>
//                 <p className="text-xs text-slate-400 mt-1">Supports .zip, .rar, .tar, .gz</p>
//               </button>
//             )}
//           </div>

//           {error && <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</div>}

//           <button type="submit" disabled={loading}
//             className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
//             style={{ background: "var(--primary)" }}>
//             {loading ? (
//               <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Assigning...</>
//             ) : "Assign Task to Employee"}
//           </button>
//         </form>
//       </div>
//     </AdminLayout>
//   );
// }


"use client";
import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { Plus, X, Users, Tag, CheckCircle, Cloud, FolderOpen, HardDrive, Link, AlertCircle } from "lucide-react";

type SourceMode = "onedrive" | "upload";

export default function AdminAssign() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    employee_id: "",
    title: "",
    description: "",
    classifications: ["High", "Med A", "Med B", "Low"],
  });
  const [newClass, setNewClass] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("onedrive");
  const [oneDriveUrl, setOneDriveUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { api.getUsers().then(setUsers); }, []);

  function addClassification() {
    const v = newClass.trim();
    if (v && !form.classifications.includes(v)) {
      setForm({ ...form, classifications: [...form.classifications, v] });
      setNewClass("");
    }
  }

  function removeClass(c: string) {
    setForm({ ...form, classifications: form.classifications.filter(x => x !== c) });
  }

  function validateOneDriveUrl(url: string): boolean {
    // Accept any onedrive.live.com or sharepoint.com sharing URL
    return (
      url.includes("onedrive.live.com") ||
      url.includes("1drv.ms") ||
      url.includes("sharepoint.com")
    );
  }

  function handleUrlChange(val: string) {
    setOneDriveUrl(val);
    if (val && !validateOneDriveUrl(val)) {
      setUrlError("Please paste a valid OneDrive or SharePoint shared folder URL");
    } else {
      setUrlError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employee_id) { setError("Please select an employee"); return; }

    if (sourceMode === "onedrive") {
      if (!oneDriveUrl.trim()) { setError("Please paste a OneDrive shared folder URL"); return; }
      if (!validateOneDriveUrl(oneDriveUrl)) { setError("Invalid OneDrive URL"); return; }
    } else {
      if (!file) { setError("Please select a ZIP file to upload"); return; }
    }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("employee_id", form.employee_id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("classifications", JSON.stringify(form.classifications));

      if (sourceMode === "onedrive") {
        fd.append("onedrive_url", oneDriveUrl.trim());
      } else {
        fd.append("file", file!);
      }

      await api.createTask(fd);
      setSuccess(true);
      setForm({ employee_id: "", title: "", description: "", classifications: ["High", "Med A", "Med B", "Low"] });
      setFile(null);
      setOneDriveUrl("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Assign Task</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Paste a OneDrive shared folder link or upload a ZIP, then assign to an employee
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 bg-green-50 text-green-700 text-sm font-medium">
            <CheckCircle size={18} /> Task assigned successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Employee select */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users size={17} style={{ color: "var(--primary)" }} /> Select Employee
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {users.map(u => (
                <button key={u.id} type="button"
                  onClick={() => setForm({ ...form, employee_id: u.id })}
                  className="flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: form.employee_id === u.id ? "var(--primary)" : "var(--border)",
                    background: form.employee_id === u.id ? "var(--primary-light)" : "#f8fafc",
                    color: form.employee_id === u.id ? "var(--primary-dark)" : "var(--text)"
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: form.employee_id === u.id ? "var(--primary)" : "#94a3b8" }}>
                    {u.name[0]}
                  </div>
                  <span className="truncate">{u.name}</span>
                </button>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-slate-400 col-span-3">No employees. Create one first.</p>
              )}
            </div>
          </div>

          {/* Task details */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4">Task Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Task Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                  placeholder="e.g. Q3 Document Classification" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
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
              {form.classifications.map(c => (
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
              <input value={newClass} onChange={e => setNewClass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addClassification())}
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

          {/* File Source */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4">File Source</h2>

            {/* Toggle */}
            <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "#f1f5f9" }}>
              <button
                type="button"
                onClick={() => setSourceMode("onedrive")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  sourceMode === "onedrive" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Cloud size={15} className="text-blue-500" /> OneDrive Link
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("upload")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  sourceMode === "upload" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <HardDrive size={15} className="text-slate-500" /> Upload ZIP
              </button>
            </div>

            {/* OneDrive URL paste */}
            {sourceMode === "onedrive" && (
              <div className="space-y-3">
                {/* How-to hint */}
                <div className="rounded-xl p-4 text-xs space-y-1.5" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                  <p className="font-semibold flex items-center gap-1.5"><Link size={12} /> How to get the link:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 ml-1">
                    <li>Open OneDrive in your browser</li>
                    <li>Right-click the folder → <strong>Share</strong></li>
                    <li>Set link to <strong>"Anyone with the link can view"</strong></li>
                    <li>Click <strong>Copy link</strong> and paste it below</li>
                  </ol>
                </div>

                <div className="relative">
                  <Cloud size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="url"
                    value={oneDriveUrl}
                    onChange={e => handleUrlChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none"
                    style={{
                      borderColor: urlError ? "#ef4444" : "var(--border)",
                      background: "#f8fafc"
                    }}
                    placeholder="https://onedrive.live.com/share?..."
                  />
                </div>

                {urlError && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle size={12} /> {urlError}
                  </p>
                )}

                {oneDriveUrl && !urlError && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle size={13} />
                    Valid OneDrive URL — backend will download &amp; zip the folder contents
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  The original files in OneDrive will not be modified.
                </p>
              </div>
            )}

            {/* Local ZIP upload */}
            {sourceMode === "upload" && (
              <>
                <input ref={fileRef} type="file" accept=".zip,.rar,.tar,.gz" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
                {file ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--primary-light)" }}>
                    <FolderOpen size={20} style={{ color: "var(--primary-dark)" }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--primary-dark)" }}>{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
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
                {sourceMode === "onedrive" ? "Fetching from OneDrive & Assigning..." : "Assigning..."}
              </>
            ) : "Assign Task to Employee"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}