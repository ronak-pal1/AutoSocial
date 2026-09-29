import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut, User as UserIcon, Activity, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface TopBarProps {
  onMobileOpen: () => void;
  activeJobCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ onMobileOpen, activeJobCount = 0 }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMobileOpen}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global title or search prompt */}
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className="font-semibold text-slate-200">AutoSocial</span>
          <span>/</span>
          <span className="text-slate-400 capitalize">Workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Jobs Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Activity
            className={`w-3.5 h-3.5 ${
              activeJobCount > 0 ? 'text-amber-400 animate-spin' : 'text-emerald-400'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {activeJobCount > 0 ? `${activeJobCount} active jobs` : 'Engines Ready'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-400" />}
        </button>

        {/* User profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
            aria-expanded={menuOpen}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-md">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-300 max-w-[130px] truncate">
              {user?.email}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {user?.role?.toUpperCase()}
                </span>
              </div>

              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 rounded-lg">
                  <UserIcon className="w-4 h-4" />
                  <span>Profile & Permissions</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 rounded-lg">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>MCP Agent Bridge Active</span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-1 mt-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-lg transition-colors"
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
  );
};
