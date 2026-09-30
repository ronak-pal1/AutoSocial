import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import type { Job, ProviderType, PostPlatform } from '../types';
import { TwitterIcon, LinkedInIcon } from '../components/common/BrandIcons';
import {
  Wand2,
  Sparkles,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  Clock,
  AlertCircle,
  Maximize2,
  X,
  History,
  FileText
} from 'lucide-react';

export const Studio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  const [activeTab, setActiveTab] = useState<'post' | 'text' | 'image'>(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'text' || tabParam === 'image' ? tabParam : 'post';
  });
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | 'mock'>('gemini');
  const [platform, setPlatform] = useState<PostPlatform>(() => {
    const p = searchParams.get('platform');
    return p === 'linkedin' ? 'linkedin' : 'twitter';
  });
  const [topic, setTopic] = useState(() => searchParams.get('topic') || '');
  const [context, setContext] = useState(() => searchParams.get('context') || '');
  const [tone, setTone] = useState('');
  const [tweetCount, setTweetCount] = useState(5);
  const [withImage, setWithImage] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const pTopic = searchParams.get('topic');
    const pContext = searchParams.get('context');
    const pPlatform = searchParams.get('platform') as PostPlatform | null;
    const pTab = searchParams.get('tab') as 'post' | 'text' | 'image' | null;

    if (pTopic) setTopic(pTopic);
    if (pContext) setContext(pContext);
    if (pPlatform && (pPlatform === 'twitter' || pPlatform === 'linkedin')) setPlatform(pPlatform);
    if (pTab && ['post', 'text', 'image'].includes(pTab)) setActiveTab(pTab);
  }, [searchParams]);

  // Fetch recent jobs
  const { data: recentJobs = [], refetch: refetchJobs } = useQuery<Job[]>({
    queryKey: ['recent-jobs'],
    queryFn: () => apiClient.get<Job[]>('/jobs?limit=25'),
    refetchInterval: activeJobId ? 2500 : 15000
  });

  // Current active or selected job
  const activeJob = recentJobs.find((j) => j._id === activeJobId) || recentJobs[0];

  // Stop active polling when job succeeds or fails
  useEffect(() => {
    if (activeJob && (activeJob.status === 'succeeded' || activeJob.status === 'failed')) {
      if (activeJob._id === activeJobId) {
        if (activeJob.status === 'succeeded') {
          success('Generation completed successfully!', 'Studio');
        } else if (activeJob.status === 'failed') {
          error(activeJob.error || 'Generation failed', 'Job Error');
        }
        setActiveJobId(null);
      }
    }
  }, [activeJob, activeJobId, success, error]);

  // Mutations
  const generatePostMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ job: Job }>('/generation/post', {
        platform,
        topic,
        context: context || undefined,
        tone: tone || undefined,
        tweetCount: platform === 'twitter' ? tweetCount : undefined,
        withImage,
        provider: selectedProvider
      }),
    onSuccess: (data) => {
      setActiveJobId(data.job._id);
      success('Job dispatched to browser automation queue!', 'Pipeline Triggered');
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Generation Request Failed');
    }
  });

  const generateTextMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ job: Job }>('/generation/text', {
        prompt: topic,
        provider: selectedProvider
      }),
    onSuccess: (data) => {
      setActiveJobId(data.job._id);
      success('Prompt submitted to model engine', 'Text Job Enqueued');
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Text Generation Failed');
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ job: Job }>('/generation/image', {
        prompt: topic,
        provider: selectedProvider,
        aspectRatio
      }),
    onSuccess: (data) => {
      setActiveJobId(data.job._id);
      success('Image render dispatched to engine', 'Image Job Enqueued');
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Image Generation Failed');
    }
  });

  const isSubmitting =
    generatePostMutation.isPending ||
    generateTextMutation.isPending ||
    generateImageMutation.isPending ||
    (activeJob?.status === 'queued' || activeJob?.status === 'running');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      error('Please specify a topic or prompt');
      return;
    }

    if (activeTab === 'post') {
      generatePostMutation.mutate();
    } else if (activeTab === 'text') {
      generateTextMutation.mutate();
    } else {
      generateImageMutation.mutate();
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to parse result data
  const renderJobOutput = (job?: Job) => {
    if (!job) {
      return (
        <div className="text-center py-20 text-slate-400 text-xs flex flex-col items-center gap-2">
          <Wand2 className="w-8 h-8 text-slate-300 animate-pulse" />
          <span>Select an existing job from the history or submit a prompt above.</span>
        </div>
      );
    }

    if (job.status === 'queued' || job.status === 'running') {
      return (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Browser Automation in Progress</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Engaging {job.provider.toUpperCase()} session tab. Streaming prompt, waiting for DOM stabilization, and extracting high-fidelity output.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>State: {job.status.toUpperCase()}</span>
          </div>
        </div>
      );
    }

    if (job.status === 'failed') {
      return (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-4">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Job Execution Failed</span>
          </div>
          <p className="text-xs text-rose-700 font-mono bg-white p-3 rounded-xl border border-rose-200">
            {job.error || 'Unknown failure during browser execution'}
          </p>
          {job.errorScreenshot && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-rose-800">Failure Snapshot Captured:</span>
              <img
                src={job.errorScreenshot}
                alt="Failure screenshot"
                className="max-h-60 rounded-xl border border-rose-200 object-cover"
              />
            </div>
          )}
        </div>
      );
    }

    // Succeeded output
    if (job.type === 'image' && job.result?.imageUrl) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rendered Visual Asset
            </span>
            <div className="flex items-center gap-2">
              <a
                href={job.result.imageUrl}
                download="autosocial-render.jpg"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                onClick={() => setPreviewImage(job.result?.imageUrl as string)}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs"
                title="Fullscreen Preview"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer group relative shadow-2xs"
            onClick={() => setPreviewImage(job.result?.imageUrl as string)}
          >
            <img
              src={job.result.imageUrl}
              alt="Generated Visual"
              className="w-full max-h-[460px] object-contain group-hover:scale-[1.01] transition-transform"
            />
            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-2xs">
              <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md">
                Click to Enlarge
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Text / Post output
    const rawText = job.result?.text as string;
    let parsedJson: Record<string, unknown> | null = null;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      // not direct JSON
    }

    if (parsedJson && parsedJson.thread && Array.isArray(parsedJson.thread)) {
      const thread = parsedJson.thread as Array<{ order: number; text: string }>;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
              <TwitterIcon className="w-3.5 h-3.5" />
              Generated Twitter Thread ({thread.length} Tweets)
            </span>
            <button
              onClick={() => {
                const fullText = thread.map((t) => t.text).join('\n\n---\n\n');
                copyText(fullText, 'full-thread');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
            >
              {copiedId === 'full-thread' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy All Tweets</span>
            </button>
          </div>

          <div className="space-y-3">
            {thread.map((t) => (
              <div
                key={t.order}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative group"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-700">Tweet {t.order}</span>
                  <div className="flex items-center gap-2">
                    <span className={`${t.text.length > 280 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                      {t.text.length}/280
                    </span>
                    <button
                      onClick={() => copyText(t.text, `tweet-${t.order}`)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                      title="Copy tweet"
                    >
                      {copiedId === `tweet-${t.order}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (parsedJson && parsedJson.body) {
      const linkedInBody = parsedJson.body as string;
      const hashtags = (parsedJson.hashtags as string[]) || [];

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
              <LinkedInIcon className="w-3.5 h-3.5" />
              Generated LinkedIn Post
            </span>
            <button
              onClick={() => {
                const fullText = `${linkedInBody}\n\n${hashtags.join(' ')}`;
                copyText(fullText, 'linkedin-full');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
            >
              {copiedId === 'linkedin-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Post Text</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{linkedInBody}</p>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-200">
                {hashtags.map((h, i) => (
                  <span key={i} className="text-xs text-blue-600 font-medium hover:underline">
                    {h.startsWith('#') ? h : `#${h}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Standard markdown / text output
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generated Text</span>
          <button
            onClick={() => copyText(rawText, 'raw-text')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
          >
            {copiedId === 'raw-text' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Text</span>
          </button>
        </div>
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{rawText}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            AI Content Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prompt personal browser sessions to craft viral social posts and high-resolution visuals.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <button
            onClick={() => setActiveTab('post')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'post' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Social Post
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'text' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Direct Text
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              activeTab === 'image' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Image Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt Composer & Live Output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Composer */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Provider & Engine Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Automation Engine:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('gemini')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedProvider === 'gemini'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('chatgpt')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedProvider === 'chatgpt'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    ChatGPT Tab
                  </button>
                </div>
              </div>

              {/* Social Platform Selection if in 'post' tab */}
              {activeTab === 'post' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">Platform:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlatform('twitter')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        platform === 'twitter'
                          ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <TwitterIcon className="w-3.5 h-3.5 text-sky-500" />
                      <span>Twitter / X Thread</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatform('linkedin')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        platform === 'linkedin'
                          ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>LinkedIn Article</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Topic / Prompt Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {activeTab === 'image'
                    ? 'Image Prompt & Visual Concept'
                    : activeTab === 'post'
                    ? 'Post Topic or Core Insight'
                    : 'Prompt / Instruction'}
                </label>
                <textarea
                  rows={activeTab === 'text' ? 5 : 3}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    activeTab === 'image'
                      ? 'Cyberpunk developer workspace with holographic code monitors in neon purple, cinematic 8k render...'
                      : activeTab === 'post'
                      ? 'Why persistent browser sessions beat paying for token-billed LLM APIs...'
                      : 'Ask anything to the browser session...'
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Additional Options for Social Posts */}
              {activeTab === 'post' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Context / Source Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g. Based on recent Grok AI research or release notes"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                    />
                  </div>

                  {platform === 'twitter' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tweet Count ({tweetCount} tweets)
                      </label>
                      <input
                        type="range"
                        min={3}
                        max={10}
                        value={tweetCount}
                        onChange={(e) => setTweetCount(Number(e.target.value))}
                        className="w-full accent-slate-900 mt-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tone Override
                      </label>
                      <input
                        type="text"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        placeholder="e.g. Provocative, Technical, Narrative"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-slate-700 font-semibold">
                        Generate Accompanying High-Res Visual
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={withImage}
                        onChange={(e) => setWithImage(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Aspect Ratio for Images */}
              {activeTab === 'image' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">Aspect Ratio:</span>
                  {(['1:1', '16:9', '9:16'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        aspectRatio === r
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Automating Session...' : 'Generate with AutoSocial'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Job Output Container */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            {renderJobOutput(activeJob)}
          </div>
        </div>

        {/* Right Col: Studio Jobs History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              Generation Queue & History
            </h3>
            <button
              onClick={() => refetchJobs()}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {recentJobs.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs shadow-xs">
                No past jobs found. Run your first generation!
              </div>
            ) : (
              recentJobs.map((job) => {
                const isSelected = activeJob?._id === job._id;
                return (
                  <button
                    key={job._id}
                    onClick={() => setActiveJobId(job._id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        {job.type === 'image' ? (
                          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        {job.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                          job.status === 'succeeded'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.status === 'running'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : job.status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium line-clamp-2">{job.prompt}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {job.durationMs && <span>{(job.durationMs / 1000).toFixed(1)}s</span>}
                      <span className="capitalize">{job.provider}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="High resolution preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/20 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
