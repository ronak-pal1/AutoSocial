import React from 'react';
import { useLocation } from 'react-router-dom';
import { Megaphone, BadgePercent, Users, CreditCard, Plus, ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export const BusinessSuiteView: React.FC = () => {
  const location = useLocation();

  if (location.pathname.includes('team')) {
    const teamMembers = [
      { name: 'Ronak Paul', role: 'Owner & Admin', email: 'ronak@autosocial.io', status: 'Active' },
      { name: 'Elena Rostova', role: 'Content Strategist', email: 'elena@autosocial.io', status: 'Active' },
      { name: 'Marcus Chen', role: 'Growth Specialist', email: 'marcus@autosocial.io', status: 'Invited' },
    ];

    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              Team & Co-Workers
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage team access, roles, and collaborative workspace permissions.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-xs hover:bg-zinc-800 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Team Members ({teamMembers.length})</h3>

          <div className="divide-y divide-slate-100">
            {teamMembers.map((m) => (
              <div key={m.email} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{m.name}</h4>
                    <p className="text-[11px] text-slate-400">{m.email} • {m.role}</p>
                  </div>
                </div>
                <Badge variant={m.status === 'Active' ? 'success' : 'secondary'}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (location.pathname.includes('billing')) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="pb-4 border-b border-slate-200/80">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-500" />
            Account Balance & Subscription
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Billing details, AI automation credits, and payment methods.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <span className="text-xs text-slate-500">Active Plan</span>
            <div className="text-2xl font-bold text-slate-900">AutoSocial Pro</div>
            <span className="text-[11px] font-semibold text-sky-600">$49/month • Renews Nov 1</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <span className="text-xs text-slate-500">AI Generation Credits</span>
            <div className="text-2xl font-bold text-emerald-600">Unlimited</div>
            <span className="text-[11px] text-slate-500">Local Browser Automation</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <span className="text-xs text-slate-500">Current Balance</span>
            <div className="text-2xl font-bold text-slate-900">$0.00 Due</div>
            <span className="text-[11px] text-slate-500">All invoices settled</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: Campaigns & Ads overview
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-sky-500" />
          Business Suite
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cross-platform promotion campaigns, ad boosts, and audience expansion tools.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
          <BadgePercent className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-bold text-base text-slate-900">Paid Ads & Promotion Engine</h3>
          <p className="text-xs text-slate-500">
            Boost top-performing organic posts directly on X, LinkedIn, and Meta Ads Manager with automated budget pacing.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-xs hover:bg-zinc-800 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          <span>Launch Promotion Campaign</span>
        </button>
      </div>
    </div>
  );
};
