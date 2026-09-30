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
  ChevronUp,
  CheckCircle2
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected & Active
          </span>
        );
      case 'login_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Login Required
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            Session Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Disconnected
          </span>
        );
    }
  };

  const providersConfig: Array<{
    id: ProviderType;
    name: string;
    description: string;
    icon: string;
  }> = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Used for long-form LinkedIn copy, technical deep dives, and Imagen 3 generation.',
      icon: '✨'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT (OpenAI)',
      description: 'Used for viral Twitter threads, punchy hooks, and DALL-E image generation.',
      icon: '🧠'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-500" />
            Browser Automation Connections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect your personal Gemini and ChatGPT accounts without paid API keys. Sessions are kept alive persistently.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
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
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                    </div>
                  </div>
                </div>

                <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Connection State:</span>
                    {renderStatusBadge(session?.status)}
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Persistent Profile:</span>
                    <span className="font-mono text-[11px] text-slate-700 flex items-center gap-1 truncate max-w-[200px]">
                      <Folder className="w-3 h-3 shrink-0 text-slate-400" />
                      storage/profiles/{p.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Last Checked:</span>
                    <span className="text-slate-700 font-medium">
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
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveModalProvider(p.id)}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 ${
                    isConnected
                      ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isConnected ? 'Reconnect / Inspect' : 'Connect via Live Browser'}</span>
                </button>

                <button
                  onClick={() => checkMutation.mutate(p.id)}
                  disabled={checkMutation.isPending}
                  className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs transition-colors"
                  title="Verify session health check"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      checkMutation.isPending && checkMutation.variables === p.id ? 'animate-spin' : ''
                    }`}
                  />
                </button>

                {isConnected && (
                  <button
                    onClick={() => disconnectMutation.mutate(p.id)}
                    disabled={disconnectMutation.isPending}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 transition-colors"
                    title="Disconnect and close browser"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Headless VPS Fallback Guide */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <button
          onClick={() => setShowFallbackGuide(!showFallbackGuide)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Deploying on a Headless VPS? Use Profile Transfer Fallback
              </h3>
              <p className="text-[11px] text-slate-400">
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
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs text-slate-600">
            <p>
              When hosting AutoSocial on a cloud server without a GUI or display server, you can perform authentication once locally:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Run AutoSocial locally with <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]">npm run dev</code>.
              </li>
              <li>
                Click <strong>"Connect via Live Browser"</strong> above to complete Google / OpenAI login and 2FA.
              </li>
              <li>
                Your session cookies are saved to <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]">server/storage/profiles/gemini</code>.
              </li>
              <li>
                Copy this directory to your production server volume:
                <pre className="mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-400">
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
