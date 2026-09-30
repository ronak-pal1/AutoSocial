import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Send, Plus, Flame, TrendingUp, BarChart2 } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '../components/common/BrandIcons';
import { Link } from 'react-router-dom';

export const ChannelHub: React.FC = () => {
  const location = useLocation();

  const getPlatformDetails = () => {
    if (location.pathname.includes('facebook')) {
      return {
        name: 'Facebook',
        icon: FacebookIcon,
        color: 'text-blue-600',
        followers: '48.2K',
        reach: '184K',
        avgEngagement: '4.6%',
        desc: 'Page updates, community discussions, and automated group posts.'
      };
    }
    if (location.pathname.includes('instagram')) {
      return {
        name: 'Instagram',
        icon: InstagramIcon,
        color: 'text-pink-600',
        followers: '86.4K',
        reach: '412K',
        avgEngagement: '6.2%',
        desc: 'Visual carousels, Reels captions, and aesthetic brand storytelling.'
      };
    }
    return {
      name: 'TikTok',
      icon: TikTokIcon,
      color: 'text-slate-900',
      followers: '124K',
      reach: '890K',
      avgEngagement: '9.4%',
      desc: 'Viral hooks, video outlines, script generator, and sound trending topics.'
    };
  };

  const platform = getPlatformDetails();
  const Icon = platform.icon;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shadow-xs">
            <Icon className={`w-5 h-5 ${platform.color}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {platform.name} Suite
            </h1>
            <p className="text-xs text-slate-500">
              {platform.desc}
            </p>
          </div>
        </div>

        <Link
          to="/studio"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-xs hover:bg-zinc-800 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Draft for {platform.name}</span>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-slate-500 font-medium">Active Followers</span>
          <div className="text-2xl font-bold text-slate-900">{platform.followers}</div>
          <span className="text-[11px] font-semibold text-emerald-600">+3.2% this month</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-slate-500 font-medium">Monthly Impressions</span>
          <div className="text-2xl font-bold text-slate-900">{platform.reach}</div>
          <span className="text-[11px] font-semibold text-sky-600">+8.4% reach velocity</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-slate-500 font-medium">Avg Engagement Rate</span>
          <div className="text-2xl font-bold text-slate-900">{platform.avgEngagement}</div>
          <span className="text-[11px] font-semibold text-purple-600">Above industry median</span>
        </div>
      </div>

      {/* Queue & Content suggestions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Active Pipeline for {platform.name}
        </h3>
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No scheduled {platform.name} posts pending. Click "Draft for {platform.name}" to generate viral content using our AI studio.
        </div>
      </div>
    </div>
  );
};
