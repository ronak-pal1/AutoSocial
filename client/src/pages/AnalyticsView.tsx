import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Cpu,
  RefreshCw,
  Hash
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';

interface DetailedAnalyticsData {
  timeRange: string;
  totalJobs: number;
  successRate: number;
  avgDurationSeconds: number;
  p95DurationSeconds: number;
  timeline: Array<{ date: string; total: number; succeeded: number; failed: number }>;
  providerStats: Array<{ provider: string; count: number }>;
  platformStats: Array<{ platform: string; count: number; draft: number; ready: number; posted: number }>;
  statusFunnel: Array<{ status: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

const COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'];

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: analytics, isLoading, refetch } = useQuery<DetailedAnalyticsData>({
    queryKey: ['detailed-analytics', timeRange],
    queryFn: () => apiClient.get<DetailedAnalyticsData>(`/analytics/detailed?range=${timeRange}`)
  });

  const timeline = analytics?.timeline || [];
  const providerStats = analytics?.providerStats || [];
  const platformStats = analytics?.platformStats || [];
  const statusFunnel = analytics?.statusFunnel || [];
  const topTags = analytics?.topTags || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Performance & Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated engine reliability, generation latency percentiles, and platform distribution.
          </p>
        </div>

        {/* Time range picker */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2" />
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                  timeRange === r ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Generations ({timeRange})
          </span>
          <div className="text-3xl font-extrabold text-white">{analytics?.totalJobs ?? 0}</div>
          <p className="text-xs text-slate-500">Automated browser chat completions</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Success Rate
          </span>
          <div className="text-3xl font-extrabold text-emerald-400">
            {analytics?.successRate ?? 100}%
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400/80">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Optimal selector stability</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Average Latency
          </span>
          <div className="text-3xl font-extrabold text-sky-400">
            {analytics?.avgDurationSeconds ?? 0}s
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Browser typing + response stream</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            P95 Latency Percentile
          </span>
          <div className="text-3xl font-extrabold text-purple-400">
            {analytics?.p95DurationSeconds ?? 0}s
          </div>
          <p className="text-xs text-slate-500">Longest 5% complex runs</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Execution Timeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">Succeeded vs Failed jobs over selected period</p>
          </div>

          <div className="h-72 w-full pt-4">
            {timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No activity recorded in this time range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="succGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="succeeded" stroke="#10b981" fill="url(#succGrad)" name="Succeeded" />
                  <Area type="monotone" dataKey="failed" stroke="#f43f5e" fill="url(#failGrad)" name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Engine Provider Utilization Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Engine Share
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Gemini vs ChatGPT automation</p>
          </div>

          <div className="h-72 w-full pt-4 flex items-center justify-center">
            {providerStats.length === 0 ? (
              <div className="text-slate-500 text-xs">No engine data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerStats}
                    dataKey="count"
                    nameKey="provider"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                  >
                    {providerStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform Output Breakdown */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Platform Post Generation</h3>
            <p className="text-xs text-slate-400 mt-0.5">LinkedIn vs Twitter volume and status</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="platform" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="draft" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Draft" />
                <Bar dataKey="ready" fill="#6366f1" radius={[4, 4, 0, 0]} name="Ready" />
                <Bar dataKey="posted" fill="#10b981" radius={[4, 4, 0, 0]} name="Posted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Pipeline Status Funnel */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Pipeline Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mt-0.5">Lifecycle from Draft to Public Distribution</p>
          </div>

          <div className="space-y-4 pt-4">
            {['draft', 'ready', 'posted'].map((statusKey) => {
              const item = statusFunnel.find((s) => s.status === statusKey);
              const count = item?.count || 0;
              const maxCount = Math.max(...statusFunnel.map((s) => s.count), 1);
              const pct = Math.round((count / maxCount) * 100);

              const color =
                statusKey === 'posted'
                  ? 'bg-emerald-500'
                  : statusKey === 'ready'
                  ? 'bg-indigo-500'
                  : 'bg-sky-500';

              return (
                <div key={statusKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 uppercase tracking-wider">{statusKey}</span>
                    <span className="font-mono text-slate-400">{count} posts</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Hashtags & Niche Topics */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Hash className="w-4 h-4 text-indigo-400" />
          Top Topics & Hashtags in Published Pipeline
        </h3>

        {topTags.length === 0 ? (
          <p className="text-xs text-slate-500">No hashtags tagged in posts yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {topTags.map((t) => (
              <div
                key={t.tag}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
              >
                <span className="text-indigo-400 font-medium">{t.tag}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded-md">
                  {t.count}x
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
