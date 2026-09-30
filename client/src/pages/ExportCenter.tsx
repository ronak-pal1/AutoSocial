import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, Clock, Calendar } from 'lucide-react';

export const ExportCenter: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const exportsList = [
    {
      id: 'exp1',
      title: 'Monthly Engagement & Viral Posts (April 2025)',
      format: 'PDF',
      size: '2.4 MB',
      date: 'May 1, 2025',
      type: 'Executive Report'
    },
    {
      id: 'exp2',
      title: 'Raw Multi-Platform Analytics & Impressions (Q1 2025)',
      format: 'CSV',
      size: '840 KB',
      date: 'Apr 15, 2025',
      type: 'Raw Data'
    },
    {
      id: 'exp3',
      title: 'AI Generation Latency & Browser Reliability Logs',
      format: 'JSON',
      size: '1.2 MB',
      date: 'Apr 10, 2025',
      type: 'Telemetry'
    }
  ];

  const handleDownload = (id: string, title: string) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      // Create a mock downloaded file
      const blob = new Blob([`AutoSocial Report: ${title}\nGenerated on ${new Date().toISOString()}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Download className="w-5 h-5 text-sky-500" />
          Export Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Download executive stakeholder summaries, CSV datasets, and automation telemetry.
        </p>
      </div>

      {/* Export List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Generated Exports</h3>

        <div className="space-y-3 pt-1">
          {exportsList.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                  {item.format}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">{item.type} • {item.size} • Created on {item.date}</p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(item.id, item.title)}
                disabled={downloading === item.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>{downloading === item.id ? 'Preparing...' : 'Download'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
