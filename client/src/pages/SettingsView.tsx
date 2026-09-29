import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import type { BrandVoice, McpApiKeyItem } from '../types';
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
  Terminal,
  Save,
  CheckCircle2,
  Folder
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { success, error } = useToastStore();

  const [activeTab, setActiveTab] = useState<'brand' | 'mcp' | 'storage' | 'account'>('brand');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState<{ name: string; plainKey: string } | null>(null);

  // New do/dont input fields
  const [newDoInput, setNewDoInput] = useState('');
  const [newDontInput, setNewDontInput] = useState('');

  // 1. Fetch Brand Voice
  const { data: brandVoice } = useQuery<BrandVoice>({
    queryKey: ['brand-voice'],
    queryFn: () => apiClient.get<BrandVoice>('/generation/brand-voice')
  });

  const [voiceForm, setVoiceForm] = useState<BrandVoice>({
    tone: '',
    niche: '',
    audience: '',
    dos: [],
    donts: [],
    samplePosts: []
  });

  // Sync form when brandVoice loads
  React.useEffect(() => {
    if (brandVoice) {
      setVoiceForm({
        tone: brandVoice.tone || '',
        niche: brandVoice.niche || '',
        audience: brandVoice.audience || '',
        dos: brandVoice.dos || [],
        donts: brandVoice.donts || [],
        samplePosts: brandVoice.samplePosts || []
      });
    }
  }, [brandVoice]);

  // Update Brand Voice mutation
  const updateVoiceMutation = useMutation({
    mutationFn: (updated: BrandVoice) => apiClient.put<BrandVoice>('/generation/brand-voice', updated),
    onSuccess: () => {
      success('Brand Voice guidelines updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['brand-voice'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to update brand voice');
    }
  });

  // 2. Fetch MCP API Keys
  const { data: apiKeys = [] } = useQuery<McpApiKeyItem[]>({
    queryKey: ['mcp-api-keys'],
    queryFn: () => apiClient.get<McpApiKeyItem[]>('/mcp-keys')
  });

  // Create Key Mutation
  const createKeyMutation = useMutation({
    mutationFn: (name: string) => apiClient.post<McpApiKeyItem>('/mcp-keys', { name }),
    onSuccess: (data) => {
      if (data.plainKey) {
        setCreatedKeyData({ name: data.name, plainKey: data.plainKey });
      }
      setShowNewKeyModal(false);
      setNewKeyName('');
      success('API key generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['mcp-api-keys'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to create API key');
    }
  });

  // Revoke Key Mutation
  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/mcp-keys/${id}/revoke`),
    onSuccess: () => {
      success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['mcp-api-keys'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to revoke key');
    }
  });

  // Delete Key Mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/mcp-keys/${id}`),
    onSuccess: () => {
      success('API key removed');
      queryClient.invalidateQueries({ queryKey: ['mcp-api-keys'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to delete key');
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDo = () => {
    if (!newDoInput.trim()) return;
    setVoiceForm({ ...voiceForm, dos: [...voiceForm.dos, newDoInput.trim()] });
    setNewDoInput('');
  };

  const handleRemoveDo = (index: number) => {
    setVoiceForm({ ...voiceForm, dos: voiceForm.dos.filter((_, i) => i !== index) });
  };

  const handleAddDont = () => {
    if (!newDontInput.trim()) return;
    setVoiceForm({ ...voiceForm, donts: [...voiceForm.donts, newDontInput.trim()] });
    setNewDontInput('');
  };

  const handleRemoveDont = (index: number) => {
    setVoiceForm({ ...voiceForm, donts: voiceForm.donts.filter((_, i) => i !== index) });
  };

  const mcpConfigSnippet = `{
  "mcpServers": {
    "autosocial": {
      "url": "${window.location.origin}/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            System & Brand Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Fine-tune editorial Brand Voice, manage external MCP API keys, and monitor storage.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'brand' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Brand Voice
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'mcp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            MCP API Keys
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'storage' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Storage
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'account' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Account
          </button>
        </div>
      </div>

      {/* Brand Voice Tab */}
      {activeTab === 'brand' && (
        <div className="max-w-4xl space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Autonomous Brand Voice Profile
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                These rules are automatically injected into all prompts generated by both the portal and external MCP agents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tone of Voice
                </label>
                <input
                  type="text"
                  value={voiceForm.tone}
                  onChange={(e) => setVoiceForm({ ...voiceForm, tone: e.target.value })}
                  placeholder="e.g. Authoritative, insightful, accessible, and high-energy"
                  className="w-full p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Niche & Focus Area
                </label>
                <input
                  type="text"
                  value={voiceForm.niche}
                  onChange={(e) => setVoiceForm({ ...voiceForm, niche: e.target.value })}
                  placeholder="e.g. AI Engineering, Dev Tools, Software Automation"
                  className="w-full p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={voiceForm.audience}
                  onChange={(e) => setVoiceForm({ ...voiceForm, audience: e.target.value })}
                  placeholder="e.g. Founders, Senior Engineers, Tech Leaders, Builders"
                  className="w-full p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Do's Section */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-emerald-400">Rules to FOLLOW (DOs):</span>
              <div className="space-y-1.5">
                {voiceForm.dos.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200"
                  >
                    <span>✓ {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDo(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
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
                  className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddDo}
                  className="px-3.5 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium hover:bg-emerald-600/30"
                >
                  Add DO
                </button>
              </div>
            </div>

            {/* Don'ts Section */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-rose-400">Rules to AVOID (DON'Ts):</span>
              <div className="space-y-1.5">
                {voiceForm.donts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200"
                  >
                    <span>✕ {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDont(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
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
                  className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddDont}
                  className="px-3.5 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium hover:bg-rose-600/30"
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
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
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
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>New API Key Created: {createdKeyData.name}</span>
                </div>
                <button
                  onClick={() => setCreatedKeyData(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-emerald-300">
                Please copy and store your API key in a secure location. You will not be able to view it again once dismissed.
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-800 font-mono text-xs text-emerald-400">
                <span className="truncate max-w-lg">{createdKeyData.plainKey}</span>
                <button
                  onClick={() => copyToClipboard(createdKeyData.plainKey, 'new-key')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                >
                  {copiedKey === 'new-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Key</span>
                </button>
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  MCP Server Access Keys
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allows external agents (like your Grok research bot or Cursor) to call AutoSocial tools.
                </p>
              </div>

              <button
                onClick={() => setShowNewKeyModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Key</span>
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-slate-500 text-xs">
                  No MCP API keys created yet. Generate one to connect external agents.
                </div>
              ) : (
                apiKeys.map((k) => (
                  <div
                    key={k._id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{k.name}</span>
                        {k.revoked ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Revoked
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/30 text-slate-300 hover:text-amber-400 text-xs font-medium transition-colors border border-slate-700"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteKeyMutation.mutate(k._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
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
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Connect AutoSocial to External MCP Clients
              </h4>
              <button
                onClick={() => copyToClipboard(mcpConfigSnippet, 'mcp-config')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                {copiedKey === 'mcp-config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Config</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste this configuration into your Claude Desktop, Cursor, or Grok bot settings:
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              {mcpConfigSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && (
        <div className="max-w-4xl space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-400" />
                System Storage & Profile Directories
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local disk volumes mounted for persistent browser credentials and media.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                  <Folder className="w-4 h-4" />
                  <span>Browser Profiles</span>
                </div>
                <div className="text-xs font-mono text-slate-300">server/storage/profiles/</div>
                <p className="text-[11px] text-slate-500">Persistent cookies for Gemini & ChatGPT</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                  <Folder className="w-4 h-4" />
                  <span>Generated Images</span>
                </div>
                <div className="text-xs font-mono text-slate-300">server/storage/images/</div>
                <p className="text-[11px] text-slate-500">Full-resolution local image storage</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                  <Folder className="w-4 h-4" />
                  <span>Failure Snapshots</span>
                </div>
                <div className="text-xs font-mono text-slate-300">server/storage/screenshots/</div>
                <p className="text-[11px] text-slate-500">Auto-captured on browser errors</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-400" />
              Master Administrator Account
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Admin Email:</span>
                <span className="font-semibold text-white">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Portal Role:</span>
                <span className="font-semibold text-indigo-400 uppercase">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Registration Status:</span>
                <span className="font-semibold text-emerald-400">Single-Owner Locked</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-semibold transition-colors"
              >
                Log Out of Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create MCP API Key</h3>
            <p className="text-xs text-slate-400">
              Give this key an identifiable name (e.g. "Grok Research Agent" or "Cursor MCP").
            </p>

            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Grok Bot Key"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => createKeyMutation.mutate(newKeyName)}
                disabled={!newKeyName.trim() || createKeyMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
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
