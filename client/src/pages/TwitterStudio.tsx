import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import { TwitterIcon } from '../components/common/BrandIcons';
import type { PostItem, TwitterTweet, PostStatus } from '../types';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  ExternalLink,
  Scissors,
  Sun,
  Moon,
  MessageCircle,
  Repeat2,
  Heart,
  BarChart2,
  Bookmark,
  Share,
  BadgeCheck
} from 'lucide-react';

export const TwitterStudio: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('light');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [rawTextToSplit, setRawTextToSplit] = useState('');
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Fetch Twitter posts
  const { data: postsData } = useQuery<{ posts: PostItem[]; total: number }>({
    queryKey: ['twitter-posts', statusFilter],
    queryFn: () =>
      apiClient.get<{ posts: PostItem[]; total: number }>(
        `/posts?platform=twitter${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`
      )
  });

  const posts = postsData?.posts || [];
  const selectedPost = posts.find((p) => p._id === selectedPostId) || posts[0];
  const thread: TwitterTweet[] = (selectedPost?.payload as { thread?: TwitterTweet[] })?.thread || [
    { order: 1, text: 'Drafting your first viral thread on AutoSocial...' }
  ];

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: (updated: Partial<PostItem>) =>
      apiClient.put<PostItem>(`/posts/${selectedPost?._id}`, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to save thread');
    }
  });

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, externalUrl }: { status: PostStatus; externalUrl?: string }) =>
      apiClient.patch<PostItem>(`/posts/${selectedPost?._id}/status`, { status, externalUrl }),
    onSuccess: () => {
      success('Post workflow status updated!');
      setShowStatusModal(false);
      setExternalUrlInput('');
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to update status');
    }
  });

  // Regenerate single tweet
  const regenTweetMutation = useMutation({
    mutationFn: (order: number) =>
      apiClient.post<PostItem>(`/posts/${selectedPost?._id}/regenerate-tweet`, { tweetOrder: order }),
    onSuccess: () => {
      success('Tweet revised with AI!');
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Regeneration failed');
    }
  });

  // Create new blank thread
  const createNewThread = async () => {
    try {
      const newPost = await apiClient.post<PostItem>('/posts', {
        platform: 'twitter',
        title: 'Untitled Thread',
        topic: 'Engineering & Automation',
        payload: {
          thread: [
            { order: 1, text: 'Hook tweet: Stop the scroll with a compelling bold premise 🧵👇' },
            { order: 2, text: '1. The biggest lesson from scaling autonomous systems...' }
          ]
        }
      });
      setSelectedPostId(newPost._id);
      success('Created new thread draft');
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    } catch (err: unknown) {
      error((err as Error).message, 'Failed to create thread');
    }
  };

  const updateTweetText = (order: number, text: string) => {
    if (!selectedPost) return;
    const newThread = thread.map((t) => (t.order === order ? { ...t, text } : t));
    updatePostMutation.mutate({
      payload: { thread: newThread }
    });
  };

  const addTweet = () => {
    if (!selectedPost) return;
    const newOrder = thread.length + 1;
    const newThread = [...thread, { order: newOrder, text: '' }];
    updatePostMutation.mutate({ payload: { thread: newThread } });
  };

  const removeTweet = (order: number) => {
    if (!selectedPost || thread.length <= 1) return;
    const filtered = thread.filter((t) => t.order !== order);
    const reordered = filtered.map((t, idx) => ({ ...t, order: idx + 1 }));
    updatePostMutation.mutate({ payload: { thread: reordered } });
  };

  const moveTweet = (index: number, direction: 'up' | 'down') => {
    if (!selectedPost) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= thread.length) return;

    const list = [...thread];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    const reordered = list.map((t, idx) => ({ ...t, order: idx + 1 }));
    updatePostMutation.mutate({ payload: { thread: reordered } });
  };

  // Smart split long text into thread
  const handleSplitText = () => {
    if (!rawTextToSplit.trim() || !selectedPost) return;

    const sentences = rawTextToSplit.split(/(?<=[.?!])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const s of sentences) {
      if ((currentChunk + ' ' + s).trim().length <= 260) {
        currentChunk = (currentChunk + ' ' + s).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = s;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    const newThread: TwitterTweet[] = chunks.map((c, i) => ({
      order: i + 1,
      text: c
    }));

    updatePostMutation.mutate({ payload: { thread: newThread } });
    setShowSplitModal(false);
    setRawTextToSplit('');
    success(`Split text into ${chunks.length} clean tweets!`);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TwitterIcon className="w-5 h-5 text-sky-500" />
            Twitter / X Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thread composer with 280-character validation, AI single-tweet regenerator, and pixel-faithful X preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSplitModal(true)}
            disabled={!selectedPost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors disabled:opacity-40"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-500" />
            <span>Split Long Text</span>
          </button>

          <button
            onClick={createNewThread}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Thread</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Drafts List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thread Drafts ({posts.length})
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              {(['all', 'draft', 'ready', 'posted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase transition-all ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs shadow-xs">
                No threads found. Click "New Thread" to start.
              </div>
            ) : (
              posts.map((p) => {
                const isSelected = selectedPost?._id === p._id;
                const pThread = (p.payload as { thread?: TwitterTweet[] })?.thread || [];
                return (
                  <button
                    key={p._id}
                    onClick={() => setSelectedPostId(p._id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                        {p.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          p.status === 'posted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'ready'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {pThread[0]?.text || 'Empty thread'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{pThread.length} tweets</span>
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Thread Composer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Interactive Composer
            </h3>
            {selectedPost && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                >
                  Status: <span className="text-sky-600 font-bold uppercase">{selectedPost.status}</span>
                </button>
              </div>
            )}
          </div>

          {!selectedPost ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              Select a thread to edit
            </div>
          ) : (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              {thread.map((t, idx) => {
                const remaining = 280 - t.text.length;
                const isOver = remaining < 0;

                return (
                  <div
                    key={t.order}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isOver
                        ? 'bg-rose-50/50 border-rose-300'
                        : 'bg-white border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {t.order}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {idx === 0 ? 'Hook Tweet' : idx === thread.length - 1 ? 'CTA Tweet' : `Tweet ${t.order}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveTweet(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveTweet(idx, 'down')}
                          disabled={idx === thread.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => regenTweetMutation.mutate(t.order)}
                          disabled={regenTweetMutation.isPending}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                          title="Regenerate this tweet with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        {thread.length > 1 && (
                          <button
                            onClick={() => removeTweet(t.order)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete tweet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={t.text}
                      onChange={(e) => updateTweetText(t.order, e.target.value)}
                      placeholder="Write tweet text..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none leading-relaxed"
                    />

                    {/* Character Meter */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Character Count</span>
                      <span
                        className={`font-mono font-semibold ${
                          isOver ? 'text-rose-600' : remaining < 20 ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        {remaining} remaining
                      </span>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addTweet}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tweet to Thread</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Pixel-Faithful X Feed Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TwitterIcon className="w-3.5 h-3.5 text-sky-500" />
              Live X Feed Preview
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs"
                title="Toggle preview theme"
              >
                {previewTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  const full = thread.map((t) => t.text).join('\n\n---\n\n');
                  copyText(full, 'preview-thread');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs"
              >
                {copiedId === 'preview-thread' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy Thread</span>
              </button>
            </div>
          </div>

          {/* Authentic X Feed Component */}
          <div
            className={`rounded-2xl border p-4 transition-colors max-h-[750px] overflow-y-auto ${
              previewTheme === 'dark'
                ? 'bg-zinc-950 text-white border-zinc-800'
                : 'bg-white text-slate-900 border-slate-200/80 shadow-xs'
            }`}
          >
            {thread.map((t, idx) => {
              const isLast = idx === thread.length - 1;

              return (
                <div key={t.order} className="flex gap-3 relative pb-6">
                  {/* Timeline connecting line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[19px] top-10 bottom-0 w-[2px] ${
                        previewTheme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Avatar bubble */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow z-10">
                    AS
                  </div>

                  {/* Content body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold truncate">AutoSocial</span>
                      <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500 shrink-0" />
                      <span className={`${previewTheme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                        @autosocial_ai • 2m
                      </span>
                    </div>

                    <p className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">
                      {t.text || 'Type your tweet content in the composer...'}
                    </p>

                    {/* X Action Bar */}
                    <div
                      className={`flex items-center justify-between max-w-xs mt-3 pt-1 text-[11px] ${
                        previewTheme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
                      }`}
                    >
                      <button className="flex items-center gap-1 hover:text-sky-500 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>12</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-emerald-500 transition-colors">
                        <Repeat2 className="w-3.5 h-3.5" />
                        <span>4</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                        <Heart className="w-3.5 h-3.5" />
                        <span>89</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-sky-500 transition-colors">
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>2.4K</span>
                      </button>
                      <button className="hover:text-sky-500 transition-colors">
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                      <button className="hover:text-sky-500 transition-colors">
                        <Share className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Launch to X Button */}
            {selectedPost && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(thread[0]?.text || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Twitter Compose</span>
                </a>

                {selectedPost.externalUrl && (
                  <a
                    href={selectedPost.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 hover:underline flex items-center gap-1"
                  >
                    <span>View Live Tweet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Split Long Text Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-sky-500" />
              Split Text into Thread
            </h3>
            <p className="text-xs text-slate-500">
              Paste long-form notes, newsletters, or articles. AutoSocial will intelligently segment them into &le; 280 character tweets at natural sentence boundaries.
            </p>
            <textarea
              rows={6}
              value={rawTextToSplit}
              onChange={(e) => setRawTextToSplit(e.target.value)}
              placeholder="Paste raw content here..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSplitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSplitText}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Convert to Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Status Modal */}
      {showStatusModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Update Post Status</h3>
            <p className="text-xs text-slate-500">
              Mark post readiness or declare as published with optional live URL.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(['draft', 'ready', 'posted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    if (st !== 'posted') {
                      updateStatusMutation.mutate({ status: st });
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase border transition-all ${
                    selectedPost.status === st
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-medium text-slate-700">
                Live Tweet URL (Optional for Posted status)
              </label>
              <input
                type="url"
                value={externalUrlInput}
                onChange={(e) => setExternalUrlInput(e.target.value)}
                placeholder="https://x.com/yourhandle/status/123456789"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  updateStatusMutation.mutate({
                    status: 'posted',
                    externalUrl: externalUrlInput || undefined
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Confirm Published
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
