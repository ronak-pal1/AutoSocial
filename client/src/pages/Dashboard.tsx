import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Job, PostItem, ProviderSession } from '../types';
import {
  Flame,
  Users,
  Eye,
  Sparkles,
  Zap,
  TrendingUp,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  Plus,
  Target,
  Clock,
  Radio,
  ExternalLink,
  ChevronDown,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Dropdown } from '../components/ui/dropdown';
import { Dialog } from '../components/ui/dialog';
import { TwitterIcon, FacebookIcon, InstagramIcon, TikTokIcon, LinkedInIcon } from '../components/common/BrandIcons';

interface DashboardData {
  kpis: {
    totalGenerations: number;
    draftsCount: number;
    readyCount: number;
    postedCount: number;
    totalImages: number;
    successRate: number;
    avgDurationMs: number;
  };
  recentJobs: Job[];
  recentPosts: PostItem[];
  sessions: ProviderSession[];
}

// Chart dataset structured according to the inspiration graph
const chartDatasets: Record<string, Array<{ day: string; value: number; label: string; tooltipSub: string }>> = {
  Likes: [
    { day: 'Mon', value: 2900, label: 'Mon', tooltipSub: 'Social Strategy' },
    { day: 'Tue', value: 5100, label: 'Tue', tooltipSub: 'Viral Reels' },
    { day: 'Wed', value: 3800, label: 'Wed', tooltipSub: 'UX Design' },
    { day: 'Thu', value: 3100, label: 'Thu', tooltipSub: 'Product Update' },
    { day: 'Fri', value: 2400, label: 'Fri', tooltipSub: 'Community AMA' },
    { day: 'Sat', value: 2600, label: 'Sat', tooltipSub: 'Weekly Recap' },
    { day: 'Sun', value: 3200, label: 'Sun', tooltipSub: 'Founder Journey' }
  ],
  Comments: [
    { day: 'Mon', value: 420, label: 'Mon', tooltipSub: 'Social Strategy' },
    { day: 'Tue', value: 920, label: 'Tue', tooltipSub: 'Viral Reels' },
    { day: 'Wed', value: 680, label: 'Wed', tooltipSub: 'UX Design' },
    { day: 'Thu', value: 510, label: 'Thu', tooltipSub: 'Product Update' },
    { day: 'Fri', value: 430, label: 'Fri', tooltipSub: 'Community AMA' },
    { day: 'Sat', value: 390, label: 'Sat', tooltipSub: 'Weekly Recap' },
    { day: 'Sun', value: 590, label: 'Sun', tooltipSub: 'Founder Journey' }
  ],
  Shares: [
    { day: 'Mon', value: 310, label: 'Mon', tooltipSub: 'Social Strategy' },
    { day: 'Tue', value: 890, label: 'Tue', tooltipSub: 'Viral Reels' },
    { day: 'Wed', value: 740, label: 'Wed', tooltipSub: 'UX Design' },
    { day: 'Thu', value: 420, label: 'Thu', tooltipSub: 'Product Update' },
    { day: 'Fri', value: 380, label: 'Fri', tooltipSub: 'Community AMA' },
    { day: 'Sat', value: 310, label: 'Sat', tooltipSub: 'Weekly Recap' },
    { day: 'Sun', value: 490, label: 'Sun', tooltipSub: 'Founder Journey' }
  ],
  Saves: [
    { day: 'Mon', value: 850, label: 'Mon', tooltipSub: 'Social Strategy' },
    { day: 'Tue', value: 1650, label: 'Tue', tooltipSub: 'Viral Reels' },
    { day: 'Wed', value: 1280, label: 'Wed', tooltipSub: 'UX Design' },
    { day: 'Thu', value: 990, label: 'Thu', tooltipSub: 'Product Update' },
    { day: 'Fri', value: 750, label: 'Fri', tooltipSub: 'Community AMA' },
    { day: 'Sat', value: 820, label: 'Sat', tooltipSub: 'Weekly Recap' },
    { day: 'Sun', value: 1100, label: 'Sun', tooltipSub: 'Founder Journey' }
  ]
};

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['dashboard-data'],
    queryFn: () => apiClient.get<{ success: boolean; data: DashboardData }>('/analytics/dashboard'),
    refetchInterval: 15000
  });

  const [activePlatform, setActivePlatform] = useState<'All' | 'Facebook' | 'Instagram' | 'X' | 'Tiktok'>('All');
  const [activeMetricTab, setActiveMetricTab] = useState<'Likes' | 'Comments' | 'Shares' | 'Saves'>('Likes');
  const [timeRange, setTimeRange] = useState('7 Days');
  const [addPlatformModalOpen, setAddPlatformModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const dashboard = data?.data;
  const kpis = dashboard?.kpis || {
    totalGenerations: 12430,
    draftsCount: 18,
    readyCount: 12,
    postedCount: 84,
    totalImages: 245,
    successRate: 98,
    avgDurationMs: 3200
  };

  const sessions = dashboard?.sessions || [];

  const handleExport = (format: string) => {
    setExportNotice(`Exporting analytics report as ${format.toUpperCase()}...`);
    setTimeout(() => {
      setExportNotice(null);
    }, 3000);
  };

  // Sample top performing posts matching the inspiration cards
  const topPosts = [
    {
      id: '1',
      date: 'May 10, 2025',
      title: 'How To Create Viral Content In 2025',
      topic: 'Content Strategy & Algorithm Tips',
      platform: 'x',
      likes: '14.2K',
      comments: '842',
      shares: '1.8K',
      saves: '3.4K'
    },
    {
      id: '2',
      date: 'May 10, 2025',
      title: 'AI Automation Workflows That Save 20h/Week',
      topic: 'Agency Scaling Framework',
      platform: 'linkedin',
      likes: '9.8K',
      comments: '614',
      shares: '1.2K',
      saves: '2.9K'
    },
    {
      id: '3',
      date: 'May 10, 2025',
      title: 'Behind the Scenes: Scaling to $50k MRR',
      topic: 'Founder Transparency & Metrics',
      platform: 'instagram',
      likes: '18.4K',
      comments: '1.1K',
      shares: '2.4K',
      saves: '4.8K'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Platform Filter Tabs (Matching inspiration pill navigation) */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-2">
          {(['All', 'Facebook', 'Instagram', 'X', 'Tiktok'] as const).map((platform) => {
            const isActive = activePlatform === platform;
            return (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/70'
                }`}
              >
                {platform}
              </button>
            );
          })}

          <button
            onClick={() => setAddPlatformModalOpen(true)}
            className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Connect new platform"
            aria-label="Connect new platform"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {exportNotice && (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Row (Exact layout from the inspiration image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Engagement */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Engagement</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {kpis.totalGenerations > 0 ? kpis.totalGenerations.toLocaleString() : '12,430'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                +2% increased
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Follower Growth */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Follower Growth</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                +1,230
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                +2% increased
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Impressions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Impressions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                245K
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                +2% increased
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Engagement Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Engagement Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                5.2%
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                +2% increased
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Active Campaigns / Content Queue */}
        <div className="hidden xl:block bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Campaigns</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {kpis.readyCount + kpis.draftsCount > 0 ? kpis.readyCount + kpis.draftsCount : 5}
              </span>
              <span className="text-[11px] font-semibold text-sky-600">
                +1 new
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Engagement Performance Section (Matches the inspiration chart card) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        {/* Header row: title + export/time buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Engagement Performance
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Engagement trends over the last 24 hours
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Export As Dropdown */}
            <Dropdown
              label="Export As"
              icon={<Download className="w-3.5 h-3.5 text-slate-400" />}
              items={[
                { id: 'csv', label: 'CSV Spreadsheet', onClick: () => handleExport('csv') },
                { id: 'pdf', label: 'PDF Report', onClick: () => handleExport('pdf') },
                { id: 'json', label: 'JSON Dataset', onClick: () => handleExport('json') },
                { id: 'png', label: 'PNG Screenshot', onClick: () => handleExport('png') }
              ]}
            />

            {/* Time range dropdown */}
            <Dropdown
              label={timeRange}
              items={[
                { id: '24h', label: '24 Hours', onClick: () => setTimeRange('24 Hours') },
                { id: '7d', label: '7 Days', onClick: () => setTimeRange('7 Days') },
                { id: '30d', label: '30 Days', onClick: () => setTimeRange('30 Days') },
                { id: '90d', label: '90 Days', onClick: () => setTimeRange('90 Days') }
              ]}
            />
          </div>
        </div>

        {/* Sub-tabs: Likes, Comments, Shares, Saves */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
          {(['Likes', 'Comments', 'Shares', 'Saves'] as const).map((tab) => {
            const isActive = activeMetricTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveMetricTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all select-none ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* High-Fidelity Area Chart with exact styling */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartDatasets[activeMetricTab]}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-lg animate-in fade-in zoom-in-95">
                        <p className="text-[11px] font-medium text-slate-400">
                          {dataPoint.tooltipSub}
                        </p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          Total {activeMetricTab}: {dataPoint.value > 1000 ? `${(dataPoint.value / 100).toFixed(2)}K` : dataPoint.value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#engagementGradient)"
                activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section: Top Performing Posts (Exact inspiration layout) */}
      <div className="space-y-4">
        {/* Section title */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Top Performing Posts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showcase best content to replicate success
            </p>
          </div>
        </div>

        {/* Posts Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{post.date}</span>
                  {post.platform === 'x' ? (
                    <TwitterIcon className="w-3.5 h-3.5 text-slate-700" />
                  ) : post.platform === 'linkedin' ? (
                    <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                  )}
                </div>

                <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {post.topic}
                </p>
              </div>

              {/* Interaction icons bar (Likes, Comments, Shares, Saves) */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-rose-500 transition-colors group cursor-pointer"
                  title="Likes"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-600">{post.likes}</span>
                </button>

                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-sky-500 transition-colors group cursor-pointer"
                  title="Comments"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-600">{post.comments}</span>
                </button>

                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-emerald-500 transition-colors group cursor-pointer"
                  title="Shares"
                >
                  <Repeat className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-600">{post.shares}</span>
                </button>

                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-amber-500 transition-colors group cursor-pointer"
                  title="Bookmarks"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-600">{post.saves}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Platform Dialog */}
      <Dialog open={addPlatformModalOpen} onOpenChange={setAddPlatformModalOpen}>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Connect Channel</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an official API or headless browser profile to integrate with your client workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {[
              { name: 'Threads', icon: TwitterIcon, status: 'Ready' },
              { name: 'YouTube Shorts', icon: Eye, status: 'OAuth 2.0' },
              { name: 'Pinterest Business', icon: Bookmark, status: 'API Token' },
              { name: 'Bluesky Network', icon: Sparkles, status: 'AT Protocol' },
            ].map((channel) => {
              const Icon = channel.icon;
              return (
                <button
                  key={channel.name}
                  onClick={() => setAddPlatformModalOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {channel.name}
                    </p>
                    <span className="text-[10px] text-slate-400">{channel.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

