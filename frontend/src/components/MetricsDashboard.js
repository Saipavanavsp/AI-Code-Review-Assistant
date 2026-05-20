"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, Bug } from 'lucide-react';

const data = [
  { name: 'Day 1', score: 65, defects: 12, security: 5 },
  { name: 'Day 2', score: 72, defects: 8, security: 3 },
  { name: 'Day 3', score: 68, defects: 15, security: 4 },
  { name: 'Day 4', score: 85, defects: 5, security: 1 },
  { name: 'Day 5', score: 78, defects: 9, security: 2 },
  { name: 'Day 6', score: 92, defects: 2, security: 0 },
];

export default function MetricsDashboard() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold mb-2">Engineering Insights</h2>
          <p className="text-slate-400 text-sm">Historical repository health and quality trends over the last 30 days.</p>
        </div>
        <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-indigo-400 text-xs font-bold uppercase tracking-widest">
          Last updated: Just now
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Avg Quality Score" value="82.4%" trend="+5.2%" icon={<TrendingUp size={18} />} color="text-emerald-400" />
        <StatCard title="Defect Density" value="0.42" trend="-12%" icon={<Bug size={18} />} color="text-blue-400" />
        <StatCard title="OWASP Alerts" value="0" trend="Resolved" icon={<ShieldCheck size={18} />} color="text-indigo-400" />
        <StatCard title="Total Reviews" value="1,240" trend="+140" icon={<Activity size={18} />} color="text-amber-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" />
            Code Quality over Time
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Bug size={20} className="text-amber-400" />
            Defect Frequency
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar dataKey="defects" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }) {
  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-slate-800 ${color}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md bg-slate-800 ${color}`}>
          {trend}
        </span>
      </div>
      <h4 className="text-slate-400 text-sm font-medium">{title}</h4>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ShieldCheck({ size, className }) {
  return <CheckCircle2 size={size} className={className} />;
}

function Activity({ size, className }) {
  return <TrendingUp size={size} className={className} />;
}
