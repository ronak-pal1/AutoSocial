import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import type { VoiceProfile, ApiKeyItem } from '../types';
import {
  Settings,
  Sparkles,
  KeyRound,
  HardDrive,
  User as UserIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  Ban,
  CheckCircle2,
  Folder,
  Terminal,
  Save
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { success, error } = useToastStore();

  const [activeTab, setActiveTab] = useState<'brand' | 'mcp' | 'storage' | 'account'>('brand');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState<{ plainKey: string; name: string } | null>(null);

  // Form state for Brand Voice
  const [voiceForm, setVoiceForm] = useState<VoiceProfile>({
    tone: 'Insightful, accessible, authoritative, high-energy',
    niche: 'AI Automation, Dev Tools, Scalable Systems',
    audience: 'Founders, Software Engineers, Creators, Builders',
    dos: [
      'Start with a strong scroll-stopping hook statement',
      'Use structured bullet points for digestible takeaways',
      'Cite real examples and practical numbers where applicable',
      'Include a clear call to conversation at the end'
    ],
    donts: [
      'Never use overhyped fluff words like "game-changer" or "delve"',
      'Do not include more than 3 hashtags per post',
      'Avoid vague platitudes without actionable takeaways'
    ]
  });

  const [newDoInput, setNewDoInput] = useState('');
  const [newDontInput, setNewDontInput] = useState('');

  // Fetch voice profile
  useQuery<VoiceProfile>({
    queryKey: ['brand-voice'],
    queryFn: async () => {
      const res = await apiClient.get<VoiceProfile>('/voice');
      if (res && res.tone) {
        setVoiceForm(res);
      }
      return res;
    }
  });

  // Fetch API keys
  const { data: apiKeys = [] } = useQuery<ApiKeyItem[]>({
    queryKey: ['api-keys'],
    queryFn: () => apiClient.get<ApiKeyItem[]>('/auth/keys'),
    enabled: activeTab === 'mcp'
  });

  // Update voice mutation
  const updateVoiceMutation = useMutation({
    mutationFn: (updated: VoiceProfile) => apiClient.put<VoiceProfile>('/voice', updated),
    onSuccess: () => {
      success('Brand voice guidelines updated!', 'Voice Saved');
      queryClient.invalidateQueries({ queryKey: ['brand-voice'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to update voice');
    }
  });

  // Create key mutation
  const createKeyMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.post<{ apiKey: ApiKeyItem; plainKey: string }>('/auth/keys', { name }),
    onSuccess: (data) => {
      setCreatedKeyData({ plainKey: data.plainKey, name: data.apiKey.name });
      setShowNewKeyModal(false);
      setNewKeyName('');
      success('API Key generated successfully!', 'Key Created');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to create API key');
    }
  });

  // Revoke key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/auth/keys/${id}/revoke`),
    onSuccess: () => {
      success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to revoke key');
    }
  });

  // Delete key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/auth/keys/${id}`),
    onSuccess: () => {
      success('API key removed');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to delete key');
    }
  });

  const handleAddDo = () => {
    if (!newDoInput.trim()) return;
    setVoiceForm({ ...voiceForm, dos: [...voiceForm.dos, newDoInput.trim()] });
    setNewDoInput('');
  };

  const handleRemoveDo = (idx: number) => {
    setVoiceForm({ ...voiceForm, dos: voiceForm.dos.filter((_, i) => i !== idx) });
  };

  const handleAddDont = () => {
    if (!newDontInput.trim()) return;
    setVoiceForm({ ...voiceForm, donts: [...voiceForm.donts, newDontInput.trim()] });
    setNewDontInput('');
  };

  const handleRemoveDont = (idx: number) => {
    setVoiceForm({ ...voiceForm, donts: voiceForm.donts.filter((_, i) => i !== idx) });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const mcpConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        autosocial: {
          url: `${window.location.origin}/mcp`,
          headers: {
            Authorization: 'Bearer as_live_YOUR_API_KEY'
          }
        }
      }
    },
    null,
    2
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            System & Brand Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fine-tune editorial Brand Voice, manage external MCP API keys, and monitor storage.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'brand' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Brand Voice
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'mcp' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            MCP API Keys
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'storage' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Storage
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'account' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Account
          </button>
        </div>
      </div>

      {/* Brand Voice Tab */}
      {activeTab === 'brand' && (
        <div className="max-w-4xl space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Autonomous Brand Voice Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These rules are automatically injected into all prompts generated by both the portal and external MCP agents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tone of Voice
                </label>
                <input
                  type="text"
                  value={voiceForm.tone}
                  onChange={(e) => setVoiceForm({ ...voiceForm, tone: e.target.value })}
                  placeholder="e.g. Authoritative, insightful, accessible, and high-energy"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Niche & Focus Area
                </label>
                <input
                  type="text"
                  value={voiceForm.niche}
                  onChange={(e) => setVoiceForm({ ...voiceForm, niche: e.target.value })}
                  placeholder="e.g. AI Engineering, Dev Tools, Software Automation"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={voiceForm.audience}
                  onChange={(e) => setVoiceForm({ ...voiceForm, audience: e.target.value })}
                  placeholder="e.g. Founders, Senior Engineers, Tech Leaders, Builders"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Do's Section */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-emerald-700">Rules to FOLLOW (DOs):</span>
              <div className="space-y-1.5">
                {voiceForm.dos.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span>✓ {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDo(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDoInput}
                  onChange={(e) => setNewDoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDo())}
                  placeholder="Add a new editorial DO rule..."
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddDo}
                  className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
                >
                  Add DO
                </button>
              </div>
            </div>

            {/* Don'ts Section */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-rose-700">Rules to AVOID (DON'Ts):</span>
              <div className="space-y-1.5">
                {voiceForm.donts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span>✕ {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDont(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDontInput}
                  onChange={(e) => setNewDontInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDont())}
                  placeholder="Add a new banned buzzword or rule..."
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddDont}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  Add DON'T
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => updateVoiceMutation.mutate(voiceForm)}
                disabled={updateVoiceMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Brand Guidelines</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MCP API Keys Tab */}
      {activeTab === 'mcp' && (
        <div className="max-w-4xl space-y-6">
          {/* Key Just Created Banner */}
          {createdKeyData && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>New API Key Created: {createdKeyData.name}</span>
                </div>
                <button
                  onClick={() => setCreatedKeyData(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-emerald-700">
                Please copy and store your API key in a secure location. You will not be able to view it again once dismissed.
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200 font-mono text-xs text-emerald-800 shadow-2xs">
                <span className="truncate max-w-lg">{createdKeyData.plainKey}</span>
                <button
                  onClick={() => copyToClipboard(createdKeyData.plainKey, 'new-key')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-sans text-xs font-semibold transition-colors"
                >
                  {copiedKey === 'new-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Key</span>
                </button>
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  MCP Server Access Keys
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allows external agents (like your Grok research bot or Cursor) to call AutoSocial tools.
                </p>
              </div>

              <button
                onClick={() => setShowNewKeyModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Key</span>
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  No MCP API keys created yet. Generate one to connect external agents.
                </div>
              ) : (
                apiKeys.map((k) => (
                  <div
                    key={k._id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{k.name}</span>
                        {k.revoked ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Revoked
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mt-1">
                        <span>Prefix: {k.keyPrefix}...</span>
                        <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                        <span>
                          Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!k.revoked && (
                        <button
                          onClick={() => revokeKeyMutation.mutate(k._id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteKeyMutation.mutate(k._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete key record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connection Guide for External Clients */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                Connect AutoSocial to External MCP Clients
              </h4>
              <button
                onClick={() => copyToClipboard(mcpConfigSnippet, 'mcp-config')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
              >
                {copiedKey === 'mcp-config' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Config</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Paste this configuration into your Claude Desktop, Cursor, or Grok bot settings:
            </p>
            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
              {mcpConfigSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && (
        <div className="max-w-4xl space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                System Storage & Profile Directories
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Local disk volumes mounted for persistent browser credentials and media.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                  <Folder className="w-4 h-4" />
                  <span>Browser Profiles</span>
                </div>
                <div className="text-xs font-mono text-slate-800">server/storage/profiles/</div>
                <p className="text-[11px] text-slate-500">Persistent cookies for Gemini & ChatGPT</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-600 text-xs font-bold">
                  <Folder className="w-4 h-4" />
                  <span>Generated Images</span>
                </div>
                <div className="text-xs font-mono text-slate-800">server/storage/images/</div>
                <p className="text-[11px] text-slate-500">Full-resolution local image storage</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
                  <Folder className="w-4 h-4" />
                  <span>Failure Snapshots</span>
                </div>
                <div className="text-xs font-mono text-slate-800">server/storage/screenshots/</div>
                <p className="text-[11px] text-slate-500">Auto-captured on browser errors</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-600" />
              Master Administrator Account
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Admin Email:</span>
                <span className="font-bold text-slate-900">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Portal Role:</span>
                <span className="font-bold text-indigo-600 uppercase">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Registration Status:</span>
                <span className="font-bold text-emerald-600">Single-Owner Locked</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
              >
                Log Out of Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Create MCP API Key</h3>
            <p className="text-xs text-slate-500">
              Give this key an identifiable name (e.g. "Grok Research Agent" or "Cursor MCP").
            </p>

            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Grok Bot Key"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => createKeyMutation.mutate(newKeyName)}
                disabled={!newKeyName.trim() || createKeyMutation.isPending}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
