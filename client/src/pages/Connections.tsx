import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import { ScreencastModal } from '../components/connections/ScreencastModal';
import type { ProviderSession, ProviderType } from '../types';
import {
  Radio,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Folder,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const Connections: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  const [activeModalProvider, setActiveModalProvider] = useState<ProviderType | null>(null);
  const [showFallbackGuide, setShowFallbackGuide] = useState(false);

  // Fetch provider sessions
  const { data: sessions, isLoading, refetch } = useQuery<ProviderSession[]>({
    queryKey: ['provider-sessions'],
    queryFn: () => apiClient.get<ProviderSession[]>('/connections/status')
  });

  // Health check mutation
  const checkMutation = useMutation({
    mutationFn: (provider: ProviderType) => apiClient.post('/connections/check', { provider }),
    onSuccess: (_, provider) => {
      success(`Session health check passed for ${provider.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['provider-sessions'] });
    },
    onError: (err: Error, provider) => {
      error(err.message, `Health Check Failed (${provider})`);
      queryClient.invalidateQueries({ queryKey: ['provider-sessions'] });
    }
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (provider: ProviderType) => apiClient.post('/connections/disconnect', { provider }),
    onSuccess: (_, provider) => {
      success(`Disconnected session for ${provider.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['provider-sessions'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to disconnect session');
    }
  });

  const getSession = (provider: ProviderType): ProviderSession | undefined => {
    return sessions?.find((s) => s.provider === provider);
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected & Active
          </span>
        );
      case 'login_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Login Required
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Session Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Disconnected
          </span>
        );
    }
  };

  const providersConfig: Array<{
    id: ProviderType;
    name: string;
    description: string;
    color: string;
    bgGradient: string;
    icon: string;
  }> = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Used for long-form LinkedIn copy, technical deep dives, and Imagen 3 generation.',
      color: 'text-indigo-400',
      bgGradient: 'from-indigo-950/40 via-slate-900 to-slate-900',
      icon: '✨'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT (OpenAI)',
      description: 'Used for viral Twitter threads, punchy hooks, and DALL-E image generation.',
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-900',
      icon: '🧠'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-400" />
            Browser Automation Connections
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your personal Gemini and ChatGPT accounts without paid API keys. Sessions are kept alive persistently.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providersConfig.map((p) => {
          const session = getSession(p.id);
          const isConnected = session?.status === 'connected';

          return (
            <div
              key={p.id}
              className={`rounded-2xl border border-slate-800 bg-gradient-to-b ${p.bgGradient} p-6 shadow-xl relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h3 className="text-base font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                    </div>
                  </div>
                </div>

                <div className="my-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Connection State:</span>
                    {renderStatusBadge(session?.status)}
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Persistent Profile:</span>
                    <span className="font-mono text-[11px] text-slate-300 flex items-center gap-1 truncate max-w-[200px]">
                      <Folder className="w-3 h-3 shrink-0 text-slate-500" />
                      storage/profiles/{p.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Last Checked:</span>
                    <span className="text-slate-300">
                      {session?.lastCheckedAt
                        ? new Date(session.lastCheckedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setActiveModalProvider(p.id)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isConnected
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/25'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isConnected ? 'Reconnect / Inspect' : 'Connect via Live Browser'}</span>
                </button>

                <button
                  onClick={() => checkMutation.mutate(p.id)}
                  disabled={checkMutation.isPending}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="Verify session health check"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      checkMutation.isPending && checkMutation.variables === p.id ? 'animate-spin' : ''
                    }`}
                  />
                </button>

                {isConnected && (
                  <button
                    onClick={() => disconnectMutation.mutate(p.id)}
                    disabled={disconnectMutation.isPending}
                    className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
                    title="Disconnect and close browser"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Headful Fallback Guide */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <button
          onClick={() => setShowFallbackGuide(!showFallbackGuide)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Deploying on a Headless VPS? Use Profile Transfer Fallback
              </h3>
              <p className="text-xs text-slate-400">
                How to log in once on your local machine and copy the persistent Chrome directory.
              </p>
            </div>
          </div>
          {showFallbackGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showFallbackGuide && (
          <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 text-xs text-slate-300">
            <p>
              When hosting AutoSocial on a cloud server without a GUI or display server, you can perform authentication once locally:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Run AutoSocial locally with <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300">npm run dev</code>.
              </li>
              <li>
                Click <strong>"Connect via Live Browser"</strong> above to complete Google / OpenAI login and 2FA.
              </li>
              <li>
                Your session cookies are saved to <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300">server/storage/profiles/gemini</code>.
              </li>
              <li>
                Copy this directory to your production server volume:
                <pre className="mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-400">
                  scp -r server/storage/profiles/gemini user@your-vps:/app/server/storage/profiles/
                </pre>
              </li>
              <li>The deployed container will immediately resume the authenticated session without requiring re-login!</li>
            </ol>
          </div>
        )}
      </div>

      {/* Live Screencast Interactive Modal */}
      {activeModalProvider && (
        <ScreencastModal
          provider={activeModalProvider}
          isOpen={!!activeModalProvider}
          onClose={() => setActiveModalProvider(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['provider-sessions'] });
          }}
        />
      )}
    </div>
  );
};
