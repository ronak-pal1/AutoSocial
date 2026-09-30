import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, LayoutDashboard, BarChart3, Radio, Settings, Wand2, FileText, X } from 'lucide-react';
import { TwitterIcon, LinkedInIcon, FacebookIcon, InstagramIcon, TikTokIcon } from './BrandIcons';

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const quickLinks = [
    { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard, category: 'Pages' },
    { name: 'Content Performance & Analytics', path: '/analytics', icon: BarChart3, category: 'Pages' },
    { name: 'AI Studio Generator', path: '/studio', icon: Wand2, category: 'Creation' },
    { name: 'X / Twitter Automation', path: '/twitter', icon: TwitterIcon, category: 'Platforms' },
    { name: 'LinkedIn Campaign Studio', path: '/linkedin', icon: LinkedInIcon, category: 'Platforms' },
    { name: 'Facebook Hub', path: '/facebook', icon: FacebookIcon, category: 'Platforms' },
    { name: 'Instagram Creator Suite', path: '/instagram', icon: InstagramIcon, category: 'Platforms' },
    { name: 'TikTok Viral Studio', path: '/tiktok', icon: TikTokIcon, category: 'Platforms' },
    { name: 'Research & Knowledge Notes', path: '/research', icon: FileText, category: 'Creation' },
    { name: 'Live Engine Connections', path: '/connections', icon: Radio, category: 'System' },
    { name: 'Platform Settings & MCP Keys', path: '/settings', icon: Settings, category: 'System' },
  ];

  const filtered = query.trim() === ''
    ? quickLinks
    : quickLinks.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search content, platforms, campaigns..."
            className="w-full py-4 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching content, platforms, or campaigns found for "{query}".
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200/80 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-800 group-hover:text-slate-900">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100/60">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AutoSocial AI Command Hub</span>
          </div>
          <span>Press ↵ to open</span>
        </div>
      </div>
    </div>
  );
};
