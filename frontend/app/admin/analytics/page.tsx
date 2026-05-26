"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#06B6D4"];

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="p-8 flex items-center gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> Loading analytics...
      </div>
    </AdminLayout>
  );

  const employeeData = data?.employee_stats || [];
  const classData = Object.entries(data?.classification_totals || {}).map(([name, value]) => ({ name, value }));
  const completionData = employeeData.map((e: any) => ({
    name: e.name,
    Completed: e.completed,
    "In Progress": e.in_progress,
  }));

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Overview of work progress and classification statistics</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: "Total Tasks", value: data?.total_tasks || 0, color: "#F59E0B" },
            { label: "Completed", value: data?.completed_tasks || 0, color: "#10B981" },
            { label: "Completion Rate", value: data?.total_tasks ? `${Math.round((data.completed_tasks / data.total_tasks) * 100)}%` : "0%", color: "#3B82F6" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Employee work status */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-5">Employee Work Status</h2>
            {employeeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={completionData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="In Progress" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Classification totals */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-5">Files by Classification Type</h2>
            {classData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No classification data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={classData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {classData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Per-employee task count */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-5">Total Tasks per Employee</h2>
          {employeeData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={employeeData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total Tasks" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
