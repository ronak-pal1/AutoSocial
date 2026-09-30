import React from 'react';
import { Globe, Heart, MessageSquare, Repeat, Bookmark, Flame, ArrowUpRight } from 'lucide-react';
import { TwitterIcon, LinkedInIcon, InstagramIcon, TikTokIcon } from '../components/common/BrandIcons';

export const EngagementTracker: React.FC = () => {
  const events = [
    {
      id: '1',
      platform: 'x',
      type: 'like',
      user: '@alex_builds',
      content: 'Liked "How To Create Viral Content In 2025"',
      time: '2m ago'
    },
    {
      id: '2',
      platform: 'linkedin',
      type: 'comment',
      user: 'Sarah Jenkins (CTO @ GrowthHQ)',
      content: 'Commented: "The AI agent architecture here is super slick!"',
      time: '5m ago'
    },
    {
      id: '3',
      platform: 'instagram',
      type: 'save',
      user: '@creator_lab',
      content: 'Saved your carousel on automation stacks',
      time: '12m ago'
    },
    {
      id: '4',
      platform: 'x',
      type: 'repost',
      user: '@startup_daily',
      content: 'Retweeted: "Behind the scenes scaling to $50k MRR"',
      time: '24m ago'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-500" />
          Engagement Tracker
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Live stream of audience interactions, viral mentions, and response triggers.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Likes Today</span>
            <div className="text-2xl font-bold text-slate-900">1,842</div>
            <span className="text-[11px] font-semibold text-emerald-600">+12% vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Comments & Replies</span>
            <div className="text-2xl font-bold text-slate-900">314</div>
            <span className="text-[11px] font-semibold text-emerald-600">+8% vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Shares & Reposts</span>
            <div className="text-2xl font-bold text-slate-900">428</div>
            <span className="text-[11px] font-semibold text-emerald-600">+15% viral velocity</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Saved Bookmarks</span>
            <div className="text-2xl font-bold text-slate-900">962</div>
            <span className="text-[11px] font-semibold text-emerald-600">+19% high intent</span>
          </div>
        </div>
      </div>

      {/* Live Stream Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">Live Activity Feed</h3>
          </div>
          <span className="text-xs text-slate-400">Real-time sync</span>
        </div>

        <div className="space-y-3 pt-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  {ev.platform === 'x' ? (
                    <TwitterIcon className="w-4 h-4 text-slate-800" />
                  ) : ev.platform === 'linkedin' ? (
                    <LinkedInIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <InstagramIcon className="w-4 h-4 text-pink-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {ev.user}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {ev.content}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{ev.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
