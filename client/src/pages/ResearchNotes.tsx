import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import type { ResearchNote } from '../types';
import {
  BookOpen,
  Search,
  Plus,
  Bot,
  User,
  Tag,
  ExternalLink,
  Trash2,
  Edit3,
  Clock,
  Copy,
  Check,
  X,
  Filter
} from 'lucide-react';
import { TwitterIcon, LinkedInIcon } from '../components/common/BrandIcons';

interface NotesResponse {
  data: ResearchNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const ResearchNotes: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeNoteForDetail, setActiveNoteForDetail] = useState<ResearchNote | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ResearchNote | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for create/edit
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSources, setFormSources] = useState('');
  const [formTags, setFormTags] = useState('');

  // Fetch research notes
  const { data: responseData, isLoading } = useQuery<NotesResponse>({
    queryKey: ['research-notes', searchQuery, selectedTag],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedTag) params.set('tag', selectedTag);
      params.set('limit', '50');
      return apiClient.get<NotesResponse>(`/research?${params.toString()}`);
    }
  });

  const notes = responseData?.data || [];
  const totalNotes = responseData?.pagination?.total || 0;

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [notes]);

  // Create Note Mutation
  const createMutation = useMutation({
    mutationFn: (newNote: { title: string; content: string; sources: string[]; tags: string[] }) =>
      apiClient.post<ResearchNote>('/research', newNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
      setIsCreateModalOpen(false);
      resetForm();
      success('Research note saved successfully', 'Research');
    },
    onError: (err: unknown) => {
      error(err instanceof Error ? err.message : 'Failed to save note', 'Error');
    }
  });

  // Update Note Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResearchNote> }) =>
      apiClient.patch<ResearchNote>(`/research/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
      setEditingNote(null);
      resetForm();
      if (activeNoteForDetail?._id === updated._id) {
        setActiveNoteForDetail(updated);
      }
      success('Research note updated', 'Research');
    },
    onError: (err: unknown) => {
      error(err instanceof Error ? err.message : 'Failed to update note', 'Error');
    }
  });

  // Delete Note Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/research/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
      setDeleteCandidateId(null);
      if (activeNoteForDetail?._id === deleteCandidateId) {
        setActiveNoteForDetail(null);
      }
      success('Research note deleted', 'Research');
    },
    onError: (err: unknown) => {
      error(err instanceof Error ? err.message : 'Failed to delete note', 'Error');
    }
  });

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormSources('');
    setFormTags('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (note: ResearchNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormSources((note.sources || []).join('\n'));
    setFormTags((note.tags || []).join(', '));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      error('Title and content are required', 'Validation');
      return;
    }

    const sources = formSources
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const tags = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (editingNote) {
      updateMutation.mutate({
        id: editingNote._id,
        data: { title: formTitle.trim(), content: formContent.trim(), sources, tags }
      });
    } else {
      createMutation.mutate({
        title: formTitle.trim(),
        content: formContent.trim(),
        sources,
        tags
      });
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    success('Copied note content to clipboard', 'Clipboard');
  };

  // 1-Click Convert Handlers
  const convertToTwitter = (note: ResearchNote) => {
    const params = new URLSearchParams({
      tab: 'post',
      platform: 'twitter',
      topic: note.title,
      context: note.content.slice(0, 1500)
    });
    navigate(`/studio?${params.toString()}`);
  };

  const convertToLinkedIn = (note: ResearchNote) => {
    const params = new URLSearchParams({
      tab: 'post',
      platform: 'linkedin',
      topic: note.title,
      context: note.content.slice(0, 2000)
    });
    navigate(`/studio?${params.toString()}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Research Notes & Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated intelligence ingested by external Grok bots via MCP or entered manually. Convert any note into a social post in one click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            New Research Note
          </button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research topics, insights, tags..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Tags:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedTag === null
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalNotes})
            </button>
            {allTags.slice(0, 8).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedTag === t
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 animate-pulse space-y-3">
              <div className="h-5 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-24 bg-slate-800/60 rounded"></div>
              <div className="h-8 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-semibold text-white">No research notes found</h3>
            <p className="text-sm text-slate-400">
              {searchQuery || selectedTag
                ? 'Try adjusting your search query or tag filters.'
                : 'Connect your external Grok bot using the MCP tool `save_research_note` or write your first research note manually.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
            >
              Write First Note
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note._id}
              className="group relative rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 transition-all flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
            >
              <div className="space-y-3">
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {note.source === 'mcp' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Bot className="w-3 h-3" /> Grok Bot / MCP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <User className="w-3 h-3" /> Portal
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(note._id, `${note.title}\n\n${note.content}`)}
                      title="Copy content"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      {copiedId === note._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(note)}
                      title="Edit note"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidateId(note._id)}
                      title="Delete note"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => setActiveNoteForDetail(note)}
                  className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors cursor-pointer line-clamp-2"
                >
                  {note.title}
                </h3>

                {/* Body Content preview */}
                <p
                  onClick={() => setActiveNoteForDetail(note)}
                  className="text-xs text-slate-400 leading-relaxed line-clamp-4 cursor-pointer hover:text-slate-300 whitespace-pre-wrap"
                >
                  {note.content}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(t);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-500" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sources list */}
                {note.sources && note.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-1">
                      Sources ({note.sources.length})
                    </p>
                    <div className="space-y-1">
                      {note.sources.slice(0, 2).map((src, i) => {
                        let hostname = src;
                        try {
                          hostname = new URL(src).hostname.replace('www.', '');
                        } catch {}
                        return (
                          <a
                            key={i}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 hover:text-emerald-300 hover:underline max-w-full truncate"
                          >
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{hostname}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 1-Click Convert Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-400">Convert to:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => convertToTwitter(note)}
                    title="Generate Twitter Thread from this note"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-medium transition-all"
                  >
                    <TwitterIcon className="w-3.5 h-3.5" />
                    <span>Thread</span>
                  </button>
                  <button
                    onClick={() => convertToLinkedIn(note)}
                    title="Generate LinkedIn Post from this note"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-medium transition-all"
                  >
                    <LinkedInIcon className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Detail Drawer / Modal */}
      {activeNoteForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-300">Research Intelligence</span>
                {activeNoteForDetail.source === 'mcp' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Grok Bot / MCP
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveNoteForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{activeNoteForDetail.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>Created {new Date(activeNoteForDetail.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Source: {activeNoteForDetail.source === 'mcp' ? 'External MCP API' : 'Portal UI'}</span>
                </div>
              </div>

              {/* Tags */}
              {activeNoteForDetail.tags && activeNoteForDetail.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeNoteForDetail.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Content Full */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {activeNoteForDetail.content}
              </div>

              {/* Sources */}
              {activeNoteForDetail.sources && activeNoteForDetail.sources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Verified Sources & Citations
                  </h4>
                  <div className="space-y-1.5">
                    {activeNoteForDetail.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 hover:underline p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{src}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / 1-Click Convert */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopy(activeNoteForDetail._id, `${activeNoteForDetail.title}\n\n${activeNoteForDetail.content}`)
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const note = activeNoteForDetail;
                    setActiveNoteForDetail(null);
                    convertToTwitter(note);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/20"
                >
                  <TwitterIcon className="w-3.5 h-3.5" />
                  Generate Thread in Studio
                </button>

                <button
                  onClick={() => {
                    const note = activeNoteForDetail;
                    setActiveNoteForDetail(null);
                    convertToLinkedIn(note);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
                >
                  <LinkedInIcon className="w-3.5 h-3.5" />
                  Generate Post in Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {(isCreateModalOpen || editingNote) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                {editingNote ? <Edit3 className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                {editingNote ? 'Edit Research Note' : 'Create Research Note'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingNote(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Note Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Breakthroughs in Quantum AI Computing 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Research Content & Insights *</label>
                <textarea
                  required
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Enter detailed facts, bullet points, key takeaways, and analysis..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Sources (One URL per line)
                </label>
                <textarea
                  rows={2}
                  value={formSources}
                  onChange={(e) => setFormSources(e.target.value)}
                  placeholder="https://arxiv.org/abs/...&#10;https://bloomberg.com/..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="ai, quantum, tech, research"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingNote(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingNote
                    ? 'Update Note'
                    : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Delete Research Note?</h3>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete this research note? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidateId(null)}
                className="px-3.5 py-1.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCandidateId && deleteMutation.mutate(deleteCandidateId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all shadow-md shadow-rose-600/20"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
