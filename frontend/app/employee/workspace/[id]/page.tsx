// "use client";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { useAuthStore } from "@/lib/store";
// import { api } from "@/lib/api";
// import {
//   Folder, FolderOpen, File, FileText, FileImage, FileVideo, Film,
//   ChevronRight, ChevronDown, Tag, ArrowLeft, Check, Move,
//   AlertCircle, Eye
// } from "lucide-react";

// // ─── TYPES ────────────────────────────────────────────────────────────────────

// interface FSNode {
//   name: string;
//   type: "file" | "dir";
//   path: string;
//   children?: FSNode[];
//   handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
//   fileObj?: File;
// }

// // ─── HELPERS ─────────────────────────────────────────────────────────────────

// function getFileIcon(name: string) {
//   const ext = name.split(".").pop()?.toLowerCase();
//   if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext || "")) return FileImage;
//   if (["mp4", "webm", "avi", "mov"].includes(ext || "")) return Film;
//   if (["pdf", "doc", "docx", "txt", "rtf", "md"].includes(ext || "")) return FileText;
//   return File;
// }

// function canPreview(name: string) {
//   const ext = name.split(".").pop()?.toLowerCase();
//   return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "pdf", "txt", "md", "csv", "html", "htm",
//     "mp4", "webm", "mp3", "wav", "json", "xml", "js", "ts", "py", "css"].includes(ext || "");
// }

// function getMimeType(name: string) {
//   const ext = name.split(".").pop()?.toLowerCase();
//   const map: Record<string, string> = {
//     jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
//     webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp",
//     pdf: "application/pdf",
//     mp4: "video/mp4", webm: "video/webm",
//     mp3: "audio/mpeg", wav: "audio/wav",
//     txt: "text/plain", md: "text/plain", csv: "text/plain",
//     html: "text/html", htm: "text/html",
//     json: "application/json", xml: "text/xml",
//     js: "text/javascript", ts: "text/typescript",
//     py: "text/x-python", css: "text/css",
//     doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   };
//   return map[ext || ""] || "application/octet-stream";
// }

// // ─── FOLDER TREE ITEM ────────────────────────────────────────────────────────

// function TreeNode({
//   node, depth, selectedPath, onSelect, classifiedPaths
// }: {
//   node: FSNode, depth: number, selectedPath: string | null,
//   onSelect: (n: FSNode) => void, classifiedPaths: Set<string>
// }) {
//   const [open, setOpen] = useState(depth < 2);
//   const isDir = node.type === "dir";
//   const isSelected = node.path === selectedPath;
//   const isClassified = classifiedPaths.has(node.path);
//   const Icon = isDir ? (open ? FolderOpen : Folder) : getFileIcon(node.name);

//   return (
//     <div>
//       <div
//         onClick={() => { if (isDir) setOpen(!open); else onSelect(node); }}
//         className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-all group
//           ${isSelected ? "text-white font-medium" : "hover:bg-slate-100 text-slate-700"}`}
//         style={{
//           paddingLeft: `${8 + depth * 16}px`,
//           background: isSelected ? "var(--primary)" : undefined
//         }}>
//         {isDir && (open ? <ChevronDown size={13} className="flex-shrink-0 text-slate-400" /> : <ChevronRight size={13} className="flex-shrink-0 text-slate-400" />)}
//         {!isDir && <span className="w-3.5 flex-shrink-0" />}
//         <Icon size={14} className="flex-shrink-0"
//           style={{ color: isSelected ? "white" : isDir ? "var(--primary)" : "var(--text-muted)" }} />
//         <span className="truncate flex-1">{node.name}</span>
//         {isClassified && !isDir && (
//           <Check size={12} className="flex-shrink-0" style={{ color: isSelected ? "white" : "#10b981" }} />
//         )}
//       </div>
//       {isDir && open && node.children?.map(child => (
//         <TreeNode key={child.path} node={child} depth={depth + 1}
//           selectedPath={selectedPath} onSelect={onSelect} classifiedPaths={classifiedPaths} />
//       ))}
//     </div>
//   );
// }

// // ─── MAIN PAGE ────────────────────────────────────────────────────────────────

// export default function WorkspacePage() {
//   const { id } = useParams();
//   const router = useRouter();
//   const [task, setTask] = useState<any>(null);
//   const [rootNodes, setRootNodes] = useState<FSNode[]>([]);
//   const [allFiles, setAllFiles] = useState<FSNode[]>([]);
//   const [selectedFile, setSelectedFile] = useState<FSNode | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [previewText, setPreviewText] = useState<string | null>(null);
//   const [previewType, setPreviewType] = useState<string>("");
//   const [selectedClass, setSelectedClass] = useState<string>("");
//   const [classifying, setClassifying] = useState(false);
//   const [classifiedPaths, setClassifiedPaths] = useState<Set<string>>(new Set());
//   const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
//   const [classifiedFolders, setClassifiedFolders] = useState<Record<string, FileSystemDirectoryHandle>>({});
//   const [toast, setToast] = useState<string | null>(null);
//   const [noFSAPI, setNoFSAPI] = useState(false);

//   let classifications: string[] = [];
//   try { classifications = JSON.parse(task?.classifications || "[]"); } catch {}

//   useEffect(() => {
//     api.getMyTask(id as string).then(setTask);
//   }, [id]);

//   function showToast(msg: string) {
//     setToast(msg);
//     setTimeout(() => setToast(null), 3000);
//   }

//   // Collect all files recursively
//   function collectFiles(nodes: FSNode[]): FSNode[] {
//     const result: FSNode[] = [];
//     for (const n of nodes) {
//       if (n.type === "file") result.push(n);
//       if (n.type === "dir" && n.children) result.push(...collectFiles(n.children));
//     }
//     return result;
//   }

//   async function buildTree(dirHandle: FileSystemDirectoryHandle, path = ""): Promise<FSNode[]> {
//     const nodes: FSNode[] = [];
//     for await (const [name, handle] of (dirHandle as any).entries()) {
//       const nodePath = path ? `${path}/${name}` : name;
//       if (handle.kind === "directory") {
//         const children = await buildTree(handle as FileSystemDirectoryHandle, nodePath);
//         nodes.push({ name, type: "dir", path: nodePath, children, handle });
//       } else {
//         nodes.push({ name, type: "file", path: nodePath, handle });
//       }
//     }
//     return nodes.sort((a, b) => {
//       if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
//       return a.name.localeCompare(b.name);
//     });
//   }

//   async function handleSelectFolder() {
//     if (!(window as any).showDirectoryPicker) {
//       setNoFSAPI(true);
//       return;
//     }
//     try {
//       const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
//       setFolderHandle(dirHandle);
//       const tree = await buildTree(dirHandle);
//       setRootNodes(tree);
//       setAllFiles(collectFiles(tree));
//     } catch (e) {
//       // user cancelled
//     }
//   }

//   async function onSelectFile(node: FSNode) {
//     setSelectedFile(node);
//     setPreviewUrl(null);
//     setPreviewText(null);
//     setPreviewType("");

//     if (node.handle && (node.handle as FileSystemFileHandle).getFile) {
//       const fileObj = await (node.handle as FileSystemFileHandle).getFile();
//       const mimeType = getMimeType(node.name);
//       const ext = node.name.split(".").pop()?.toLowerCase() || "";

//       if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
//         const url = URL.createObjectURL(fileObj);
//         setPreviewUrl(url);
//         setPreviewType("image");
//       } else if (ext === "pdf") {
//         const url = URL.createObjectURL(fileObj);
//         setPreviewUrl(url);
//         setPreviewType("pdf");
//       } else if (["mp4", "webm"].includes(ext)) {
//         const url = URL.createObjectURL(fileObj);
//         setPreviewUrl(url);
//         setPreviewType("video");
//       } else if (["mp3", "wav"].includes(ext)) {
//         const url = URL.createObjectURL(fileObj);
//         setPreviewUrl(url);
//         setPreviewType("audio");
//       } else if (["txt", "md", "csv", "json", "xml", "js", "ts", "py", "css", "html", "htm"].includes(ext)) {
//         const text = await fileObj.text();
//         setPreviewText(text);
//         setPreviewType("text");
//       } else {
//         setPreviewType("unsupported");
//       }
//     }
//   }

//   async function handleClassify() {
//     if (!selectedFile || !selectedClass || !folderHandle) return;
//     setClassifying(true);
//     try {
//       // Get or create classification folder
//       let classDir = classifiedFolders[selectedClass];
//       if (!classDir) {
//         classDir = await folderHandle.getDirectoryHandle(selectedClass, { create: true });
//         setClassifiedFolders(prev => ({ ...prev, [selectedClass]: classDir }));
//       }

//       // Get source file
//       const fileHandle = selectedFile.handle as FileSystemFileHandle;
//       const fileObj = await fileHandle.getFile();

//       // Write to classification folder
//       const newFileHandle = await classDir.getFileHandle(selectedFile.name, { create: true });
//       const writable = await (newFileHandle as any).createWritable();
//       await writable.write(fileObj);
//       await writable.close();

//       // Remove from original location (if in root)
//       // Just mark as classified
//       setClassifiedPaths(prev => new Set([...prev, selectedFile.path]));
//       showToast(`"${selectedFile.name}" moved to "${selectedClass}" folder`);
//       setSelectedClass("");

//       // Refresh tree
//       const tree = await buildTree(folderHandle);
//       setRootNodes(tree);
//       setAllFiles(collectFiles(tree));
//     } catch (e: any) {
//       showToast(`Error: ${e.message}`);
//     } finally {
//       setClassifying(false);
//     }
//   }

//   const totalFiles = allFiles.length;
//   const doneFiles = classifiedPaths.size;
//   const progress = totalFiles ? Math.round((doneFiles / totalFiles) * 100) : 0;

//   return (
//     <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f8fafc" }}>
//       {/* Topbar */}
//       <header className="bg-white border-b flex-shrink-0 px-5 h-14 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
//         <div className="flex items-center gap-3">
//           <button onClick={() => router.push(`/employee/task/${id}`)}
//             className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
//             <ArrowLeft size={16} /> Back
//           </button>
//           <span className="text-slate-300">|</span>
//           <div className="flex items-center gap-2">
//             <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--primary)" }}>
//               <FolderOpen size={13} className="text-white" />
//             </div>
//             <span className="font-semibold text-sm">{task?.title || "Workspace"}</span>
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//           {totalFiles > 0 && (
//             <div className="flex items-center gap-3">
//               <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                 <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--primary)" }} />
//               </div>
//               <span className="text-xs text-slate-500">{doneFiles}/{totalFiles} classified</span>
//             </div>
//           )}
//           {!folderHandle && (
//             <button onClick={handleSelectFolder}
//               className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-medium"
//               style={{ background: "var(--primary)" }}>
//               <FolderOpen size={15} /> Select Folder
//             </button>
//           )}
//         </div>
//       </header>

//       {toast && (
//         <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
//           <Check size={15} className="text-green-400" /> {toast}
//         </div>
//       )}

//       {noFSAPI && (
//         <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2 text-sm text-amber-800">
//           <AlertCircle size={15} /> File System Access API not supported. Please use Chrome or Edge browser.
//         </div>
//       )}

//       {!folderHandle ? (
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center max-w-sm">
//             <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--primary-light)" }}>
//               <FolderOpen size={28} style={{ color: "var(--primary)" }} />
//             </div>
//             <h2 className="text-lg font-bold mb-2">Select Your Work Folder</h2>
//             <p className="text-sm text-slate-500 mb-6">
//               After downloading and unzipping the task ZIP, select that folder to start classifying files.
//             </p>
//             <button onClick={handleSelectFolder}
//               className="px-6 py-3 rounded-xl text-white font-medium"
//               style={{ background: "var(--primary)" }}>
//               Select Folder from Computer
//             </button>
//             <p className="text-xs text-slate-400 mt-3">Requires Chrome/Edge browser for full functionality</p>
//           </div>
//         </div>
//       ) : (
//         <div className="flex-1 flex overflow-hidden">
//           {/* Section 1: Folder Structure */}
//           <div className="w-64 bg-white border-r flex flex-col flex-shrink-0 overflow-hidden" style={{ borderColor: "var(--border)" }}>
//             <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Section 1 — Folder Structure</p>
//             </div>
//             <div className="flex-1 overflow-y-auto p-2">
//               {rootNodes.length === 0 ? (
//                 <p className="text-xs text-slate-400 text-center py-8">Empty folder</p>
//               ) : (
//                 rootNodes.map(node => (
//                   <TreeNode key={node.path} node={node} depth={0}
//                     selectedPath={selectedFile?.path || null}
//                     onSelect={onSelectFile}
//                     classifiedPaths={classifiedPaths}
//                   />
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Section 2: File Viewer */}
//           <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: "1px solid var(--border)" }}>
//             <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Section 2 — File Viewer</p>
//               {selectedFile && (
//                 <span className="text-xs text-slate-500 font-mono">{selectedFile.name}</span>
//               )}
//             </div>
//             <div className="flex-1 overflow-auto bg-white">
//               {!selectedFile ? (
//                 <div className="h-full flex items-center justify-center">
//                   <div className="text-center">
//                     <Eye size={32} className="mx-auto mb-3 text-slate-200" />
//                     <p className="text-sm text-slate-400">Select a file to preview</p>
//                   </div>
//                 </div>
//               ) : previewType === "image" && previewUrl ? (
//                 <div className="flex items-center justify-center h-full p-4">
//                   <img src={previewUrl} alt={selectedFile.name} className="max-w-full max-h-full object-contain rounded-lg" />
//                 </div>
//               ) : previewType === "pdf" && previewUrl ? (
//                 <iframe src={previewUrl} className="w-full h-full border-0" title={selectedFile.name} />
//               ) : previewType === "video" && previewUrl ? (
//                 <div className="flex items-center justify-center h-full p-4">
//                   <video src={previewUrl} controls className="max-w-full max-h-full rounded-lg" />
//                 </div>
//               ) : previewType === "audio" && previewUrl ? (
//                 <div className="flex items-center justify-center h-full">
//                   <audio src={previewUrl} controls />
//                 </div>
//               ) : previewType === "text" && previewText !== null ? (
//                 <pre className="p-5 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
//                   {previewText}
//                 </pre>
//               ) : previewType === "unsupported" ? (
//                 <div className="h-full flex items-center justify-center">
//                   <div className="text-center">
//                     {(() => { const I = getFileIcon(selectedFile.name); return <I size={40} className="mx-auto mb-3 text-slate-200" />; })()}
//                     <p className="text-sm font-medium text-slate-600">{selectedFile.name}</p>
//                     <p className="text-xs text-slate-400 mt-1">Preview not available for this file type</p>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="h-full flex items-center justify-center">
//                   <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Section 3: Classifier */}
//           <div className="w-64 bg-white flex flex-col flex-shrink-0 overflow-hidden">
//             <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Section 3 — Classify</p>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4">
//               {!selectedFile ? (
//                 <p className="text-xs text-slate-400 text-center py-8">Select a file first</p>
//               ) : (
//                 <>
//                   <div className="mb-4 p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
//                     <p className="text-xs text-slate-500 mb-1">Selected file</p>
//                     <p className="text-sm font-medium truncate">{selectedFile.name}</p>
//                     {classifiedPaths.has(selectedFile.path) && (
//                       <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
//                         <Check size={12} /> Already classified
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
//                     <Tag size={11} className="inline mr-1" /> Choose Classification
//                   </p>
//                   <div className="space-y-2 mb-5">
//                     {classifications.map(c => (
//                       <button key={c} onClick={() => setSelectedClass(c)}
//                         className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all border
//                           ${selectedClass === c ? "text-white border-transparent" : "border-transparent hover:border-amber-200"}`}
//                         style={{
//                           background: selectedClass === c ? "var(--primary)" : "var(--primary-light)",
//                           color: selectedClass === c ? "white" : "var(--primary-dark)"
//                         }}>
//                         {c}
//                       </button>
//                     ))}
//                   </div>

//                   <button
//                     onClick={handleClassify}
//                     disabled={!selectedClass || classifying}
//                     className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
//                     style={{ background: "var(--primary)" }}>
//                     {classifying ? (
//                       <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Moving...</>
//                     ) : (
//                       <><Move size={15} /> Classify & Move</>
//                     )}
//                   </button>

//                   <p className="text-xs text-slate-400 text-center mt-3">
//                     File will be copied to the selected folder
//                   </p>
//                 </>
//               )}
//             </div>

//             {/* Progress */}
//             <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
//               <div className="flex items-center justify-between mb-2">
//                 <p className="text-xs font-medium text-slate-600">Progress</p>
//                 <span className="text-xs font-semibold" style={{ color: "var(--primary-dark)" }}>{progress}%</span>
//               </div>
//               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
//                 <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--primary)" }} />
//               </div>
//               <p className="text-xs text-slate-400 mt-1.5">{doneFiles} / {totalFiles} files</p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EmployeeLayout from "@/components/EmployeeLayout";
import { api } from "@/lib/api";
import {
  Folder, FolderOpen, File, FileText, Image as ImageIcon, Film,
  Music, ChevronRight, ChevronDown, Tag, ArrowLeft, Check, Move,
  AlertCircle, Eye, FileSpreadsheet, Presentation
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface FSNode {
  name: string;
  type: "file" | "dir";
  path: string; // relative path from root folder
  children?: FSNode[];
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  parentDirHandle?: FileSystemDirectoryHandle; // direct parent directory handle
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getFileIcon(name: string, size = 15) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg","jpeg","png","gif","webp","svg","bmp","ico"].includes(ext))
    return <ImageIcon size={size} className="text-purple-400 flex-shrink-0" />;
  if (["mp4","webm","ogg","avi","mov"].includes(ext))
    return <Film size={size} className="text-pink-400 flex-shrink-0" />;
  if (["mp3","wav","flac","aac","m4a"].includes(ext))
    return <Music size={size} className="text-indigo-400 flex-shrink-0" />;
  if (["pdf"].includes(ext))
    return <FileText size={size} className="text-red-400 flex-shrink-0" />;
  if (["docx","doc","odt"].includes(ext))
    return <FileText size={size} className="text-blue-500 flex-shrink-0" />;
  if (["xlsx","xls","ods","csv"].includes(ext))
    return <FileSpreadsheet size={size} className="text-green-500 flex-shrink-0" />;
  if (["pptx","ppt","odp"].includes(ext))
    return <Presentation size={size} className="text-orange-400 flex-shrink-0" />;
  if (["txt","md","json","xml","html","htm","js","ts","py","css"].includes(ext))
    return <FileText size={size} className="text-amber-400 flex-shrink-0" />;
  return <File size={size} className="text-slate-400 flex-shrink-0" />;
}

function getMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string,string> = {
    jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", gif:"image/gif",
    webp:"image/webp", svg:"image/svg+xml", bmp:"image/bmp",
    pdf:"application/pdf",
    mp4:"video/mp4", webm:"video/webm", ogg:"video/ogg", mov:"video/quicktime",
    mp3:"audio/mpeg", wav:"audio/wav", flac:"audio/flac", aac:"audio/aac",
    txt:"text/plain", md:"text/plain", csv:"text/plain",
    html:"text/html", htm:"text/html",
    json:"application/json", xml:"text/xml",
    js:"text/javascript", ts:"text/typescript",
    py:"text/x-python", css:"text/css",
  };
  return map[ext] || "application/octet-stream";
}

function isTextFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["txt","md","csv","json","xml","js","ts","py","css","html","htm"].includes(ext);
}

// ─── TREE NODE COMPONENT ─────────────────────────────────────────────────────

function TreeNode({
  node, depth, selectedPath, onSelect, classifiedPaths,
}: {
  node: FSNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (n: FSNode) => void;
  classifiedPaths: Map<string, string>; // path -> classification label
}) {
  const [open, setOpen] = useState(depth < 2);
  const isDir = node.type === "dir";
  const isSelected = node.path === selectedPath;
  const classification = classifiedPaths.get(node.path);

  return (
    <div>
      <div
        onClick={() => { if (isDir) setOpen(!open); else onSelect(node); }}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-all
          ${isSelected ? "text-white font-medium" : "hover:bg-slate-100 text-slate-700"}`}
        style={{
          paddingLeft: `${8 + depth * 16}px`,
          background: isSelected ? "var(--primary)" : undefined,
        }}
      >
        {isDir ? (
          open
            ? <ChevronDown size={13} className="flex-shrink-0 text-slate-400" />
            : <ChevronRight size={13} className="flex-shrink-0 text-slate-400" />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        {isDir ? (
          open
            ? <FolderOpen size={14} className="flex-shrink-0" style={{ color: isSelected ? "white" : "var(--primary)" }} />
            : <Folder size={14} className="flex-shrink-0" style={{ color: isSelected ? "white" : "var(--primary)" }} />
        ) : (
          getFileIcon(node.name, 14)
        )}

        <span className="truncate flex-1 text-xs">{node.name}</span>

        {classification && !isDir && (
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-1"
            style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "var(--primary-light)", color: isSelected ? "white" : "var(--primary-dark)" }}
          >
            {classification}
          </span>
        )}
      </div>

      {isDir && open && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
          classifiedPaths={classifiedPaths}
        />
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { id } = useParams();
  const router = useRouter();

  const [task, setTask] = useState<any>(null);
  const [rootNodes, setRootNodes] = useState<FSNode[]>([]);
  const [allFiles, setAllFiles] = useState<FSNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FSNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classifying, setClassifying] = useState(false);
  // Map: file path -> classification label (for display only)
  const [classifiedPaths, setClassifiedPaths] = useState<Map<string, string>>(new Map());
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [noFSAPI, setNoFSAPI] = useState(false);
  const [loading, setLoading] = useState(true);

  let classifications: string[] = [];
  try { classifications = JSON.parse(task?.classifications || "[]"); } catch {}

  useEffect(() => {
    api.getMyTask(id as string).then(setTask).finally(() => setLoading(false));
  }, [id]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function collectFiles(nodes: FSNode[]): FSNode[] {
    const result: FSNode[] = [];
    for (const n of nodes) {
      if (n.type === "file") result.push(n);
      if (n.type === "dir" && n.children) result.push(...collectFiles(n.children));
    }
    return result;
  }

  /**
   * Recursively build a tree. We store the PARENT directory handle on each
   * file node so we know exactly which directory to create the classification
   * subfolder in later.
   */
  async function buildTree(
    dirHandle: FileSystemDirectoryHandle,
    path = "",
    parentDirHandle?: FileSystemDirectoryHandle
  ): Promise<FSNode[]> {
    const nodes: FSNode[] = [];
    for await (const [name, handle] of (dirHandle as any).entries()) {
      // Skip classification folders we already created (they start showing up
      // after the first classify action if the user refreshes the tree)
      const nodePath = path ? `${path}/${name}` : name;
      if (handle.kind === "directory") {
        const children = await buildTree(handle as FileSystemDirectoryHandle, nodePath, dirHandle);
        nodes.push({ name, type: "dir", path: nodePath, children, handle, parentDirHandle: dirHandle });
      } else {
        nodes.push({ name, type: "file", path: nodePath, handle, parentDirHandle: dirHandle });
      }
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async function handleSelectFolder() {
    if (!(window as any).showDirectoryPicker) {
      setNoFSAPI(true);
      return;
    }
    try {
      const dirHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      setFolderHandle(dirHandle);
      const tree = await buildTree(dirHandle);
      setRootNodes(tree);
      setAllFiles(collectFiles(tree));
    } catch {
      // user cancelled
    }
  }

  async function refreshTree() {
    if (!folderHandle) return;
    const tree = await buildTree(folderHandle);
    setRootNodes(tree);
    setAllFiles(collectFiles(tree));
  }

  async function onSelectFile(node: FSNode) {
    setSelectedFile(node);
    setPreviewUrl(null);
    setPreviewText(null);
    setPreviewType("");
    setSelectedClass(classifiedPaths.get(node.path) || "");

    if (!node.handle || node.type !== "file") return;
    const fileHandle = node.handle as FileSystemFileHandle;
    const fileObj = await fileHandle.getFile();
    const ext = node.name.split(".").pop()?.toLowerCase() || "";

    if (["jpg","jpeg","png","gif","webp","svg","bmp","ico"].includes(ext)) {
      setPreviewUrl(URL.createObjectURL(fileObj));
      setPreviewType("image");
    } else if (ext === "pdf") {
      setPreviewUrl(URL.createObjectURL(fileObj));
      setPreviewType("pdf");
    } else if (["mp4","webm","ogg","mov"].includes(ext)) {
      setPreviewUrl(URL.createObjectURL(fileObj));
      setPreviewType("video");
    } else if (["mp3","wav","flac","aac","m4a"].includes(ext)) {
      setPreviewUrl(URL.createObjectURL(fileObj));
      setPreviewType("audio");
    } else if (isTextFile(node.name)) {
      const text = await fileObj.text();
      setPreviewText(text);
      setPreviewType("text");
    } else {
      setPreviewType("unsupported");
    }
  }

  /**
   * KEY LOGIC:
   * The classification folder is created inside the SAME directory that
   * contains the file — NOT at the root of the opened folder.
   *
   * Example structure:
   *   RootFolder/
   *     SubfolderA/
   *       file1.pdf        ← classify as "High"
   *       file2.docx       ← classify as "Low"
   *     SubfolderB/
   *       file3.png        ← classify as "Med A"
   *
   * Result after classify:
   *   RootFolder/
   *     SubfolderA/
   *       High/
   *         file1.pdf      ← moved here
   *       Low/
   *         file2.docx     ← moved here
   *       file1.pdf        (original — browser FS API copies, not moves)
   *       file2.docx
   *     SubfolderB/
   *       Med A/
   *         file3.png      ← moved here
   *       file3.png
   */
  async function handleClassify() {
    if (!selectedFile || !selectedClass) return;
    if (!selectedFile.parentDirHandle) {
      showToast("Cannot determine parent folder", false);
      return;
    }
    setClassifying(true);
    try {
      // Get (or create) the classification subfolder INSIDE the file's own parent folder
      const classDir = await (selectedFile.parentDirHandle as any).getDirectoryHandle(
        selectedClass,
        { create: true }
      );

      // Copy the file into that classification folder
      const srcHandle = selectedFile.handle as FileSystemFileHandle;
      const srcFile = await srcHandle.getFile();

      const destHandle = await classDir.getFileHandle(selectedFile.name, { create: true });
      const writable = await (destHandle as any).createWritable();
      await writable.write(srcFile);
      await writable.close();

      // Mark as classified (path -> label)
      setClassifiedPaths((prev) => {
        const next = new Map(prev);
        next.set(selectedFile.path, selectedClass);
        return next;
      });

      showToast(`"${selectedFile.name}" → "${selectedClass}" folder (inside ${selectedFile.parentDirHandle.name})`);
      setSelectedClass("");

      // Refresh the tree so the new classification folder appears
      await refreshTree();
    } catch (e: any) {
      showToast(`Error: ${e.message}`, false);
    } finally {
      setClassifying(false);
    }
  }

  const totalFiles = allFiles.length;
  const doneFiles = classifiedPaths.size;
  const progress = totalFiles ? Math.round((doneFiles / totalFiles) * 100) : 0;

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f8fafc" }}>

      {/* Top bar */}
      <header
        className="bg-white border-b flex-shrink-0 px-5 h-14 flex items-center justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/employee/task/${id}`)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <FolderOpen size={13} className="text-white" />
            </div>
            <span className="font-semibold text-sm">{task?.title || "Workspace"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {totalFiles > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: "var(--primary)" }}
                />
              </div>
              <span className="text-xs text-slate-500">{doneFiles}/{totalFiles} classified</span>
            </div>
          )}
          {!folderHandle ? (
            <button
              onClick={handleSelectFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-medium"
              style={{ background: "var(--primary)" }}
            >
              <FolderOpen size={15} /> Select Folder
            </button>
          ) : (
            <button
              onClick={refreshTree}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Refresh Tree
            </button>
          )}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm`}
          style={{ background: toast.ok ? "#1e293b" : "#dc2626" }}
        >
          {toast.ok ? <Check size={15} className="text-green-400 flex-shrink-0" /> : <AlertCircle size={15} className="flex-shrink-0" />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}

      {noFSAPI && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2 text-sm text-amber-800">
          <AlertCircle size={15} /> File System Access API not supported. Please use Chrome or Edge.
        </div>
      )}

      {/* No folder selected yet */}
      {!folderHandle ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "var(--primary-light)" }}
            >
              <FolderOpen size={28} style={{ color: "var(--primary)" }} />
            </div>
            <h2 className="text-lg font-bold mb-2">Select Your Work Folder</h2>
            <p className="text-sm text-slate-500 mb-2">
              Download &amp; unzip the task ZIP, then select that folder to start classifying.
            </p>
            <p className="text-xs text-slate-400 mb-6 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              Classification folders will be created <strong>inside each subfolder</strong> where files live — not at the root.
            </p>
            <button
              onClick={handleSelectFolder}
              className="px-6 py-3 rounded-xl text-white font-medium"
              style={{ background: "var(--primary)" }}
            >
              Select Folder from Computer
            </button>
            <p className="text-xs text-slate-400 mt-3">Requires Chrome / Edge browser</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* ── PANEL 1: Folder Tree ─────────────────────────────── */}
          <div
            className="w-64 bg-white border-r flex flex-col flex-shrink-0 overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Folder Structure</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {rootNodes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Empty folder</p>
              ) : (
                rootNodes.map((node) => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    selectedPath={selectedFile?.path || null}
                    onSelect={onSelectFile}
                    classifiedPaths={classifiedPaths}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── PANEL 2: File Preview ────────────────────────────── */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <div
              className="px-5 py-2.5 border-b flex items-center justify-between flex-shrink-0"
              style={{ borderColor: "var(--border)", background: "#f8fafc" }}
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">File Preview</p>
              {selectedFile && (
                <span className="text-xs text-slate-400 font-mono truncate max-w-xs">{selectedFile.path}</span>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-white">
              {!selectedFile ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Eye size={32} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-sm text-slate-400">Select a file to preview</p>
                  </div>
                </div>
              ) : previewType === "image" && previewUrl ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img src={previewUrl} alt={selectedFile.name} className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              ) : previewType === "pdf" && previewUrl ? (
                <iframe src={previewUrl} className="w-full h-full border-0" title={selectedFile.name} />
              ) : previewType === "video" && previewUrl ? (
                <div className="flex items-center justify-center h-full p-4">
                  <video src={previewUrl} controls className="max-w-full max-h-full rounded-lg" />
                </div>
              ) : previewType === "audio" && previewUrl ? (
                <div className="flex items-center justify-center h-full gap-4 flex-col">
                  <Music size={48} className="text-indigo-300" />
                  <audio src={previewUrl} controls />
                </div>
              ) : previewType === "text" && previewText !== null ? (
                <pre className="p-5 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                  {previewText}
                </pre>
              ) : previewType === "unsupported" ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    {getFileIcon(selectedFile.name, 40)}
                    <p className="text-sm font-medium text-slate-600 mt-3">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Preview not available — classify using the panel →</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* ── PANEL 3: Classifier ──────────────────────────────── */}
          <div className="w-64 bg-white flex flex-col flex-shrink-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classify</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!selectedFile ? (
                <p className="text-xs text-slate-400 text-center py-8">Select a file first</p>
              ) : (
                <>
                  {/* Selected file info */}
                  <div
                    className="mb-4 p-3 rounded-xl"
                    style={{ background: "#f8fafc", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs text-slate-500 mb-1">Selected file</p>
                    <div className="flex items-center gap-1.5">
                      {getFileIcon(selectedFile.name, 13)}
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">in: {selectedFile.parentDirHandle?.name || "root"}</p>
                    {classifiedPaths.has(selectedFile.path) && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1.5 font-medium">
                        <Check size={11} /> Classified as "{classifiedPaths.get(selectedFile.path)}"
                      </span>
                    )}
                  </div>

                  {/* Where the folder will be created */}
                  <div
                    className="mb-4 px-3 py-2 rounded-xl text-xs flex items-start gap-1.5"
                    style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}
                  >
                    <Folder size={12} className="mt-0.5 flex-shrink-0" />
                    <span>
                      Classification folder will be created inside <strong>{selectedFile.parentDirHandle?.name || "root"}/</strong>
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Tag size={11} /> Choose Classification
                  </p>

                  <div className="space-y-2 mb-5">
                    {classifications.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all border`}
                        style={{
                          background: selectedClass === c ? "var(--primary)" : "var(--primary-light)",
                          color: selectedClass === c ? "white" : "var(--primary-dark)",
                          borderColor: selectedClass === c ? "var(--primary)" : "transparent",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleClassify}
                    disabled={!selectedClass || classifying}
                    className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    style={{ background: "var(--primary)" }}
                  >
                    {classifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Moving...
                      </>
                    ) : (
                      <>
                        <Move size={15} /> Classify &amp; Move
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center mt-3">
                    File is copied into <strong>{selectedClass || "chosen"}/</strong> inside its current folder
                  </p>
                </>
              )}
            </div>

            {/* Progress footer */}
            <div className="p-4 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600">Progress</p>
                <span className="text-xs font-semibold" style={{ color: "var(--primary-dark)" }}>
                  {progress}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: "var(--primary)" }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{doneFiles} / {totalFiles} files</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}