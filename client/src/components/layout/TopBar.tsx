import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut, User as UserIcon, Activity, Sparkles, Search, Home, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CommandSearchModal } from '../common/CommandSearchModal';

interface TopBarProps {
  onMobileOpen: () => void;
  activeJobCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ onMobileOpen, activeJobCount = 0 }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for Cmd+/ keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview';
      case '/analytics':
      case '/performance':
        return 'Content Performance';
      case '/audience':
        return 'Audience Insights';
      case '/engagement':
        return 'Engagement Tracker';
      case '/reports':
        return 'Campaign Reports';
      case '/export':
        return 'Export Center';
      case '/twitter':
        return 'X (Formerly Twitter)';
      case '/facebook':
        return 'Facebook';
      case '/instagram':
        return 'Instagram';
      case '/tiktok':
        return 'TikTok';
      case '/linkedin':
        return 'LinkedIn';
      case '/studio':
        return 'AI Studio';
      case '/images':
        return 'Media Library';
      case '/research':
        return 'Research & Notes';
      case '/connections':
        return 'Engine Connections';
      case '/settings':
        return 'Settings';
      default:
        return 'Overview';
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={onMobileOpen}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb section title */}
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm select-none">
            <Home className="w-4 h-4 text-slate-400" />
            <span className="capitalize">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center / Right Area */}
        <div className="flex items-center gap-3">
          {/* Search bar button matching the inspiration UI */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center gap-3 w-72 md:w-88 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 transition-all text-xs cursor-pointer group shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="truncate text-slate-400 text-left flex-1 font-normal">
              Search (can search content, platforms, campaigns)
            </span>
            <kbd className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded shadow-2xs group-hover:border-slate-300">
              ⌘/
            </kbd>
          </button>

          {/* Active Jobs / Engines status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/60">
            <Activity
              className={`w-3 h-3 ${
                activeJobCount > 0 ? 'text-amber-500 animate-spin' : 'text-emerald-500'
              }`}
            />
            <span>{activeJobCount > 0 ? `${activeJobCount} active` : 'Active'}</span>
          </div>

          {/* Notification bell */}
          <button
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>

          {/* User profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              aria-expanded={menuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs shadow-xs ring-2 ring-white">
                {user?.email?.charAt(0).toUpperCase() || 'R'}
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[11px] text-slate-400">Signed in as</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60">
                    {user?.role?.toUpperCase() || 'PRO ADMIN'}
                  </span>
                </div>

                <div className="py-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Profile & Account</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>MCP Agent Suite</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Search Modal */}
      <CommandSearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};

