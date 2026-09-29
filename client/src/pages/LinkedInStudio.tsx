import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import { LinkedInIcon } from '../components/common/BrandIcons';
import type { PostItem, LinkedInPayload, PostStatus, ImageItem } from '../types';
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Send,
  Globe,
  MoreHorizontal,
  Smartphone,
  Monitor,
  Hash,
  X
} from 'lucide-react';

export const LinkedInStudio: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Fetch LinkedIn posts
  const { data: postsData } = useQuery<{ posts: PostItem[]; total: number }>({
    queryKey: ['linkedin-posts', statusFilter],
    queryFn: () =>
      apiClient.get<{ posts: PostItem[]; total: number }>(
        `/posts?platform=linkedin${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`
      )
  });

  const posts = postsData?.posts || [];
  const selectedPost = posts.find((p) => p._id === selectedPostId) || posts[0];
  const payload: LinkedInPayload = (selectedPost?.payload as LinkedInPayload) || {
    body: 'Draft your insightful LinkedIn article...',
    hashtags: ['#Tech', '#Engineering']
  };

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: (updated: Partial<PostItem>) =>
      apiClient.put<PostItem>(`/posts/${selectedPost?._id}`, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-posts'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to save post');
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
      queryClient.invalidateQueries({ queryKey: ['linkedin-posts'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to update status');
    }
  });

  // Create new blank LinkedIn post
  const createNewPost = async () => {
    try {
      const newPost = await apiClient.post<PostItem>('/posts', {
        platform: 'linkedin',
        title: 'Untitled LinkedIn Post',
        topic: 'Engineering Leadership',
        payload: {
          hook: 'Most engineering teams are wasting thousands of dollars on generic LLM APIs.',
          body: 'Most engineering teams are wasting thousands of dollars on generic LLM APIs.\n\nHere is how we switched to persistent browser automation:\n\n• Zero per-token bills\n• Full human editorial control\n• MCP agents driving real chat tabs\n\nWhat is your automation stack in 2026?',
          hashtags: ['#SoftwareEngineering', '#Automation', '#AI']
        }
      });
      setSelectedPostId(newPost._id);
      success('Created new LinkedIn post draft');
      queryClient.invalidateQueries({ queryKey: ['linkedin-posts'] });
    } catch (err: unknown) {
      error((err as Error).message, 'Failed to create post');
    }
  };

  const updateBody = (body: string) => {
    if (!selectedPost) return;
    updatePostMutation.mutate({
      payload: { ...payload, body }
    });
  };

  const addHashtag = (tag: string) => {
    if (!selectedPost) return;
    const currentTags = payload.hashtags || [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      updatePostMutation.mutate({
        payload: { ...payload, hashtags: newTags }
      });
    }
  };

  const removeHashtag = (tag: string) => {
    if (!selectedPost) return;
    const currentTags = payload.hashtags || [];
    const newTags = currentTags.filter((t) => t !== tag);
    updatePostMutation.mutate({
      payload: { ...payload, hashtags: newTags }
    });
  };

  const copyFormattedText = () => {
    if (!selectedPost) return;
    const fullText = `${payload.body}\n\n${(payload.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    success('Copied formatted post with exact line breaks!');
    setTimeout(() => setCopied(false), 2000);
  };

  const popularHashtags = [
    '#SoftwareEngineering',
    '#ArtificialIntelligence',
    '#Automation',
    '#TechLeadership',
    '#DevOps',
    '#ProductManagement'
  ];

  const bodyLength = payload.body?.length || 0;
  const remaining = 3000 - bodyLength;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <LinkedInIcon className="w-6 h-6 text-blue-500" />
            LinkedIn Articles & Posts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative long-form post composer with "...see more" truncation and high-fidelity feed preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={createNewPost}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New LinkedIn Post</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Drafts List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Drafts ({posts.length})
            </h3>
            <div className="flex items-center gap-1">
              {(['all', 'draft', 'ready', 'posted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                    statusFilter === st ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                No posts found. Create one or generate via Studio!
              </div>
            ) : (
              posts.map((p) => {
                const isSelected = selectedPost?._id === p._id;
                const pPayload = p.payload as LinkedInPayload;
                return (
                  <button
                    key={p._id}
                    onClick={() => {
                      setSelectedPostId(p._id);
                      setIsExpanded(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/50 shadow-sm'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[180px]">
                        {p.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          p.status === 'posted'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.status === 'ready'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {pPayload?.body || 'Empty post body'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>{(p.images || []).length} images</span>
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Composer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Post Content
            </h3>
            {selectedPost && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Status: <span className="text-blue-400 uppercase">{selectedPost.status}</span>
              </button>
            )}
          </div>

          {!selectedPost ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
              Select a post to edit
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Internal Title / Headline
                </label>
                <input
                  type="text"
                  value={selectedPost.title}
                  onChange={(e) => updatePostMutation.mutate({ title: e.target.value })}
                  className="w-full p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Post Body (Markdown & Line Breaks preserved)
                </label>
                <textarea
                  rows={14}
                  value={payload.body}
                  onChange={(e) => updateBody(e.target.value)}
                  placeholder="Draft your insight-driven post..."
                  className="w-full p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                />
                <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
                  <span>Characters: {bodyLength} / 3000</span>
                  <span className={remaining < 100 ? 'text-amber-400 font-semibold' : ''}>
                    {remaining} chars left
                  </span>
                </div>
              </div>

              {/* Active & Suggested Hashtags */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {payload.hashtags && payload.hashtags.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Active Hashtags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {payload.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs text-blue-300"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeHashtag(tag)}
                            className="text-blue-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    Add Hashtags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {popularHashtags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addHashtag(tag)}
                        className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Authentic LinkedIn Feed Post Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <LinkedInIcon className="w-3.5 h-3.5 text-blue-500" />
              Feed Post Preview
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobilePreview(!isMobilePreview)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title={isMobilePreview ? 'Switch to Desktop preview' : 'Switch to Mobile preview'}
              >
                {isMobilePreview ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={copyFormattedText}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Post</span>
              </button>
            </div>
          </div>

          {/* Authentic LinkedIn Post Container */}
          <div
            className={`rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden transition-all ${
              isMobilePreview ? 'max-w-[340px] mx-auto text-xs' : 'w-full'
            }`}
          >
            {/* LinkedIn Author Header */}
            <div className="p-4 flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                  AS
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1">
                    AutoSocial Engineering
                    <span className="text-slate-400 text-xs font-normal">• 1st</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-snug">
                    Autonomous Content Pipeline • AI Automation Portal
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <span>1h • Edited •</span>
                    <Globe className="w-3 h-3 text-slate-500" />
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* LinkedIn Post Content with authentic "...see more" truncation */}
            <div className="px-4 pb-3">
              {payload.body ? (
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {!isExpanded && payload.body.length > 220 ? (
                    <>
                      {payload.body.substring(0, 220)}...
                      <button
                        onClick={() => setIsExpanded(true)}
                        className="text-slate-400 hover:text-white font-semibold ml-1 inline-block"
                      >
                        …see more
                      </button>
                    </>
                  ) : (
                    <>
                      {payload.body}
                      {payload.body.length > 220 && (
                        <button
                          onClick={() => setIsExpanded(false)}
                          className="text-slate-400 hover:text-white font-semibold ml-2 text-[11px] block mt-1"
                        >
                          show less
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No content typed yet</p>
              )}

              {/* Hashtags */}
              {payload.hashtags && payload.hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {payload.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-400 hover:underline cursor-pointer">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image Attachment in LinkedIn Post if present */}
            {selectedPost?.images && selectedPost.images.length > 0 && (
              <div className="bg-black/60 border-y border-slate-800/80">
                <img
                  src={
                    typeof selectedPost.images[0] === 'string'
                      ? (selectedPost.images[0] as string)
                      : (selectedPost.images[0] as ImageItem).url
                  }
                  alt="Post visual"
                  className="w-full max-h-72 object-cover"
                />
              </div>
            )}

            {/* Engagement Counts Bar */}
            <div className="px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span>👍</span>
                <span>💡</span>
                <span>❤️ 48</span>
              </span>
              <span>16 comments • 4 reposts</span>
            </div>

            {/* LinkedIn Interaction Bar */}
            <div className="px-2 py-1.5 border-t border-slate-800/80 grid grid-cols-4 gap-1 text-slate-400 text-xs">
              <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-800/60 rounded-lg transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Like</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-800/60 rounded-lg transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Comment</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-800/60 rounded-lg transition-colors">
                <Repeat className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Repost</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-800/60 rounded-lg transition-colors">
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>

            {/* Direct Platform Share Footer */}
            {selectedPost && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <a
                  href="https://www.linkedin.com/feed/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open LinkedIn Feed</span>
                </a>

                {selectedPost.externalUrl && (
                  <a
                    href={selectedPost.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Live Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Transition Modal */}
      {showStatusModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Update Post Status</h3>
            <p className="text-xs text-slate-400">
              Track publication lifecycle: Draft -&gt; Ready -&gt; Posted.
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
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-medium text-slate-300">
                Live LinkedIn URL (Optional)
              </label>
              <input
                type="url"
                value={externalUrlInput}
                onChange={(e) => setExternalUrlInput(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
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
