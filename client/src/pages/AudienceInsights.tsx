import React from 'react';
import { Users, Globe2, Clock, Award, TrendingUp, Sparkles, MapPin } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AudienceInsights: React.FC = () => {
  const ageData = [
    { age: '18-24', share: 22 },
    { age: '25-34', share: 44 },
    { age: '35-44', share: 21 },
    { age: '45-54', share: 9 },
    { age: '55+', share: 4 },
  ];

  const countryData = [
    { country: 'United States', percentage: '38%', flag: '🇺🇸' },
    { country: 'United Kingdom', percentage: '16%', flag: '🇬🇧' },
    { country: 'Germany', percentage: '12%', flag: '🇩🇪' },
    { country: 'Canada', percentage: '9%', flag: '🇨🇦' },
    { country: 'India', percentage: '8%', flag: '🇮🇳' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-500" />
          Audience Insights
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Demographics, active follower hours, and geo-distribution across all connected accounts.
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-slate-500 font-medium">Total Audience Reach</span>
          <div className="text-2xl font-bold text-slate-900">348,200</div>
          <span className="text-[11px] font-semibold text-emerald-600">+4.8% this month</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-slate-500 font-medium">Peak Active Time</span>
          <div className="text-2xl font-bold text-slate-900">2:00 PM EST</div>
          <span className="text-[11px] text-slate-500">Wednesday & Friday</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-slate-500 font-medium">Primary Core Age</span>
          <div className="text-2xl font-bold text-slate-900">25 - 34</div>
          <span className="text-[11px] text-sky-600 font-semibold">44% of total base</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-slate-500 font-medium">Audience Authenticity</span>
          <div className="text-2xl font-bold text-emerald-600">97.2%</div>
          <span className="text-[11px] text-slate-500">Verified real accounts</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Age breakdown chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Age Demographics</h3>
            <p className="text-xs text-slate-400 mt-0.5">Audience age brackets distribution</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="age" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="share" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Share %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Locations list */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Geographic Regions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Where your highest engaging users reside</p>
          </div>

          <div className="space-y-3 pt-2">
            {countryData.map((item) => (
              <div
                key={item.country}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.flag}</span>
                  <span className="text-xs font-semibold text-slate-800">{item.country}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{item.percentage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
