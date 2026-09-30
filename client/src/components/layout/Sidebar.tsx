import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  BarChart2,
  Users,
  Globe,
  FileSpreadsheet,
  Download,
  Plus,
  Megaphone,
  BadgePercent,
  CreditCard,
  Radio,
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';
import { TwitterIcon, FacebookIcon, InstagramIcon, TikTokIcon, LinkedInIcon } from '../common/BrandIcons';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'new' | 'count' | 'neutral';
  hasChevron?: boolean;
}

const mainNavItems: NavItem[] = [
  { name: 'Overview', path: '/', icon: Home },
  { name: 'Content Performance', path: '/analytics', icon: BarChart2 },
  { name: 'Audience Insights', path: '/audience', icon: Users },
  { name: 'Engagement Tracker', path: '/engagement', icon: Globe },
  { name: 'Campaign Reports', path: '/reports', icon: FileSpreadsheet },
  { name: 'Export Center', path: '/export', icon: Download },
];

const platformNavItems: NavItem[] = [
  { name: 'X ( Formerly Twitter )', path: '/twitter', icon: TwitterIcon },
  { name: 'Facebook', path: '/facebook', icon: FacebookIcon },
  { name: 'Instagram', path: '/instagram', icon: InstagramIcon },
  { name: 'TikTok', path: '/tiktok', icon: TikTokIcon },
  { name: 'LinkedIn', path: '/linkedin', icon: LinkedInIcon },
];

const businessSuiteItems: NavItem[] = [
  { name: 'Campaign Management', path: '/campaigns', icon: Megaphone },
  { name: 'Ads & Promotions', path: '/ads', icon: BadgePercent },
  { name: 'Team & Co-Workers', path: '/team', icon: Users, hasChevron: true },
  { name: 'Account Balance', path: '/billing', icon: CreditCard },
  { name: 'Live Engine Hub', path: '/connections', icon: Radio },
  { name: 'Studio & AI Agents', path: '/studio', icon: Wand2, badge: 'AI', badgeVariant: 'new' },
  { name: 'Media Library', path: '/images', icon: ImageIcon },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose
}) => {
  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onMobileClose}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative select-none ${
            isActive
              ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-400 group-hover:text-slate-700'
              }`}
            />
            {!collapsed && (
              <span className="truncate flex-1">{item.name}</span>
            )}
            {!collapsed && item.badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  item.badgeVariant === 'new'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.badge}
              </span>
            )}
            {!collapsed && item.hasChevron && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
            )}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.name}
              </div>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Minimalist modern brand mark */}
            <div className="w-7 h-7 rounded-full border-2 border-sky-400 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  buzzd
                </span>
                <span className="text-[10px] text-slate-400 font-medium">portal</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            {mainNavItems.map(renderNavLink)}
          </div>

          {/* Platforms section */}
          <div className="pt-2">
            {!collapsed ? (
              <div className="flex items-center justify-between px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Platforms</span>
                <button
                  type="button"
                  title="Add platform"
                  className="hover:text-slate-700 transition-colors p-0.5 rounded hover:bg-slate-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-full h-px bg-slate-200 my-2" />
            )}
            <div className="space-y-0.5">
              {platformNavItems.map(renderNavLink)}
            </div>
          </div>

          {/* Business Suite section */}
          <div className="pt-2">
            {!collapsed ? (
              <div className="flex items-center justify-between px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Business Suite</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                  New
                </span>
              </div>
            ) : (
              <div className="w-full h-px bg-slate-200 my-2" />
            )}
            <div className="space-y-0.5">
              {businessSuiteItems.map(renderNavLink)}
            </div>
          </div>
        </nav>

        {/* Engine status footer */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            {!collapsed ? (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-600 font-medium">Live Engine</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>
            ) : (
              <div className="flex justify-center py-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Engine Ready" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

