import React from 'react';
import { FileSpreadsheet, Plus, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export const CampaignReports: React.FC = () => {
  const campaigns = [
    {
      id: 'c1',
      name: 'Spring Launch 2025',
      channel: 'Multi-Channel (X + LinkedIn)',
      status: 'active',
      postsCount: 14,
      reach: '148,000',
      engagementRate: '5.8%',
      budget: '$1,200',
      roi: '3.4x'
    },
    {
      id: 'c2',
      name: 'AI Workflow Thought Leadership',
      channel: 'LinkedIn Priority',
      status: 'active',
      postsCount: 8,
      reach: '92,400',
      engagementRate: '6.4%',
      budget: '$600',
      roi: '4.1x'
    },
    {
      id: 'c3',
      name: 'Q1 Founder Journey & MRR Milestones',
      channel: 'X / Twitter Threads',
      status: 'completed',
      postsCount: 12,
      reach: '210,000',
      engagementRate: '7.1%',
      budget: '$450',
      roi: '5.2x'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-500" />
            Campaign Reports & Attribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-channel campaign performance, conversion velocity, and ROI attribution.
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-xs hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 gap-4">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{camp.name}</h3>
                <Badge variant={camp.status === 'active' ? 'success' : 'secondary'}>
                  {camp.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{camp.channel} • {camp.postsCount} posts scheduled</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Reach</span>
                <span className="font-bold text-slate-900">{camp.reach}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Engagement</span>
                <span className="font-bold text-emerald-600">{camp.engagementRate}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Budget</span>
                <span className="font-bold text-slate-900">{camp.budget}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-400 text-[11px] block">ROI</span>
                <span className="font-bold text-sky-600">{camp.roi}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
