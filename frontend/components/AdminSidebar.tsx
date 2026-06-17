

"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import {
  LayoutDashboard, Users, ClipboardList, BarChart2,
  FolderOpen, LogOut, Folder, Database, Upload, Layers
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard",      label: "Dashboard",        icon: LayoutDashboard },
  { href: "/admin/users",          label: "Users",            icon: Users           },
  { href: "/admin/assign",         label: "Assign Task",      icon: ClipboardList   },
  { href: "/admin/upload-folder",  label: "Upload to DB",     icon: Database        },
  { href: "/admin/tracking",       label: "Task Tracking",    icon: FolderOpen      },
  { href: "/admin/analytics",      label: "Analytics",        icon: BarChart2       },
  { href: "/admin/deduplicate", label: "Deduplicator", icon: Layers },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, name } = useAuthStore();

  function handleLogout() {
    logout();
    router.push("/admin");
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{ background: "var(--accent)" }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--primary)" }}
          >
            <Folder size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">FileClassify</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${active
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              style={active ? { background: "var(--primary)", color: "white" } : {}}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            {name?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{name || "Admin"}</p>
            <p className="text-xs" style={{ color: "#64748b" }}>Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
