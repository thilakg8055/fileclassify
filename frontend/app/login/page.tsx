"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Folder, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login(email, password);
      setAuth(data.token, data.role, data.name, data.id);
      if (data.role === "admin") router.push("/admin/dashboard");
      else router.push("/employee/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center p-16 relative overflow-hidden"
        style={{ background: "var(--accent)" }}>
        <div className="absolute inset-0 opacity-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute border border-white rounded-2xl"
              style={{ width: 200 + i * 60, height: 200 + i * 60, top: `${-20 + i * 5}%`, left: `${-10 + i * 3}%`, transform: `rotate(${i * 5}deg)` }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Folder size={22} className="text-white" />
            </div>
            <span className="text-white text-xl font-semibold">FileClassify</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Document<br />Classification<br />Platform
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Organize, classify, and manage documents with precision and speed.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              ["Assign Tasks", "Distribute work efficiently"],
              ["Track Progress", "Real-time updates"],
              ["Classify Files", "Smart categorization"],
              ["Download Reports", "ZIP export ready"],
            ].map(([t, s]) => (
              <div key={t} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="text-white text-sm font-medium">{t}</p>
                <p className="text-slate-500 text-xs mt-1">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Folder size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg">FileClassify</span>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Welcome back</h2>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Sign in to your employee account</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Email / Employee ID</label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                  style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none pr-12 transition-all"
                    style={{ borderColor: "var(--border)", background: "#f8fafc" }}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--primary)" }}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Are you an admin?{" "}
                <Link href="/admin" className="font-medium hover:underline" style={{ color: "var(--primary-dark)" }}>
                  Go to Admin Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
