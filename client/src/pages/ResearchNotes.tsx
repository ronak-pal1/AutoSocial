import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import { TwitterIcon, LinkedInIcon } from '../components/common/BrandIcons';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Bot,
  User,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Trash2,
  Tag,
  X,
  FileText
} from 'lucide-react';

interface ResearchNote {
  _id: string;
  title: string;
  content: string;
  sources?: string[];
  tags?: string[];
  source: 'manual' | 'mcp' | 'automated';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
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

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSources, setFormSources] = useState('');
  const [formTags, setFormTags] = useState('');

  // Fetch notes
  const { data: notesData, isLoading } = useQuery<{ notes: ResearchNote[]; total: number }>({
    queryKey: ['research-notes', searchQuery, selectedTag],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedTag) params.set('tag', selectedTag);
      return apiClient.get<{ notes: ResearchNote[]; total: number }>(`/research?${params.toString()}`);
    }
  });

  const notes = notesData?.notes || [];
  const totalNotes = notesData?.total || 0;

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newNote: { title: string; content: string; sources?: string[]; tags?: string[] }) =>
      apiClient.post<ResearchNote>('/research', newNote),
    onSuccess: () => {
      success('Research note added successfully!', 'Knowledge Base');
      setIsCreateModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to create note');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResearchNote> }) =>
      apiClient.put<ResearchNote>(`/research/${id}`, data),
    onSuccess: () => {
      success('Research note updated', 'Saved');
      setEditingNote(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to update note');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/research/${id}`),
    onSuccess: () => {
      success('Research note deleted');
      setDeleteCandidateId(null);
      if (activeNoteForDetail?._id === deleteCandidateId) {
        setActiveNoteForDetail(null);
      }
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to delete note');
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
      error('Title and content are required');
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
        data: {
          title: formTitle,
          content: formContent,
          sources,
          tags
        }
      });
    } else {
      createMutation.mutate({
        title: formTitle,
        content: formContent,
        sources,
        tags
      });
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied note to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Convert Note to Social Post
  const convertToTwitter = (note: ResearchNote) => {
    const params = new URLSearchParams({
      tab: 'post',
      platform: 'twitter',
      topic: note.title,
      context: note.content.slice(0, 2000)
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Research Notes & Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated intelligence ingested by external Grok bots via MCP or entered manually. Convert any note into a social post in one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white font-semibold text-xs hover:bg-zinc-800 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Research Note</span>
          </button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research topics, insights, tags..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Tags:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedTag === null
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All ({totalNotes})
            </button>
            {allTags.slice(0, 8).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedTag === t
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse space-y-3 shadow-xs">
              <div className="h-5 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              <div className="h-24 bg-slate-50 rounded"></div>
              <div className="h-8 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-dashed border-slate-200 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-800">No research notes found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery || selectedTag
                ? 'Try adjusting your search query or tag filters.'
                : 'Connect your external Grok bot using the MCP tool `save_research_note` or write your first research note manually.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs"
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
              className="group relative rounded-2xl bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-slate-300 p-5 transition-all flex flex-col justify-between shadow-xs hover:shadow-sm"
            >
              <div className="space-y-3">
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {note.source === 'mcp' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        <Bot className="w-3 h-3" /> Grok Bot / MCP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        <User className="w-3 h-3" /> Portal
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(note._id, `${note.title}\n\n${note.content}`)}
                      title="Copy content"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      {copiedId === note._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(note)}
                      title="Edit note"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidateId(note._id)}
                      title="Delete note"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => setActiveNoteForDetail(note)}
                  className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors cursor-pointer line-clamp-2"
                >
                  {note.title}
                </h3>

                {/* Body Content preview */}
                <p
                  onClick={() => setActiveNoteForDetail(note)}
                  className="text-xs text-slate-600 leading-relaxed line-clamp-4 cursor-pointer hover:text-slate-800 whitespace-pre-wrap"
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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 cursor-pointer transition-colors"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sources list */}
                {note.sources && note.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
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
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline max-w-full truncate"
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
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Convert to:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => convertToTwitter(note)}
                    title="Generate Twitter Thread from this note"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition-all"
                  >
                    <TwitterIcon className="w-3.5 h-3.5" />
                    <span>Thread</span>
                  </button>
                  <button
                    onClick={() => convertToLinkedIn(note)}
                    title="Generate LinkedIn Post from this note"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">Research Intelligence</span>
                {activeNoteForDetail.source === 'mcp' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Grok Bot / MCP
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveNoteForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{activeNoteForDetail.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
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
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Content Full */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {activeNoteForDetail.content}
              </div>

              {/* Sources */}
              {activeNoteForDetail.sources && activeNoteForDetail.sources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Verified Sources & Citations
                  </h4>
                  <div className="space-y-1.5">
                    {activeNoteForDetail.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-800 hover:underline p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 transition-colors"
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
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopy(activeNoteForDetail._id, `${activeNoteForDetail.title}\n\n${activeNoteForDetail.content}`)
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
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
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-xs"
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
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingNote ? <Edit3 className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
                {editingNote ? 'Edit Research Note' : 'Create Research Note'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingNote(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Note Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Breakthroughs in Quantum AI Computing 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Research Content & Insights *</label>
                <textarea
                  required
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Enter detailed facts, bullet points, key takeaways, and analysis..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sources (One URL per line)
                </label>
                <textarea
                  rows={2}
                  value={formSources}
                  onChange={(e) => setFormSources(e.target.value)}
                  placeholder="https://arxiv.org/abs/...&#10;https://bloomberg.com/..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="ai, quantum, tech, research"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingNote(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Research Note?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this research note? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidateId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCandidateId && deleteMutation.mutate(deleteCandidateId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-xs"
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
