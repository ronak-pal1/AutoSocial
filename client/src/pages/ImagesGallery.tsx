import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import type { ImageItem } from '../types';
import {
  Images,
  Download,
  Search,
  Trash2,
  Maximize2,
  X,
  Sparkles,
  Archive,
  RefreshCw
} from 'lucide-react';

export const ImagesGallery: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  const { data: images = [], isLoading, refetch } = useQuery<ImageItem[]>({
    queryKey: ['images-library', search],
    queryFn: () => apiClient.get<ImageItem[]>(`/images${search ? `?search=${encodeURIComponent(search)}` : ''}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/images/${id}`),
    onSuccess: () => {
      success('Image removed from library');
      queryClient.invalidateQueries({ queryKey: ['images-library'] });
      if (selectedImage) setSelectedImage(null);
    },
    onError: (err: Error) => {
      error(err.message, 'Failed to delete image');
    }
  });

  const handleDownloadZip = () => {
    window.open('/api/images/zip', '_blank');
    success('Preparing ZIP download of all generated visuals...', 'Bulk Download');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Images className="w-6 h-6 text-purple-400" />
            Image Asset Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, inspect, and export all high-resolution imagery generated across your browser sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={images.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Archive className="w-3.5 h-3.5 text-purple-400" />
            <span>Download All (ZIP)</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh library"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images by prompt keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {images.length} assets stored
        </div>
      </div>

      {/* Grid of Images */}
      {images.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80 flex flex-col items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
            <Images className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-slate-300">No images found</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Generate your first high-resolution visuals in the AI Content Studio using Imagen 3 or DALL-E.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((img) => (
            <div
              key={img._id}
              className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              {/* Image Thumbnail */}
              <div
                className="relative aspect-video bg-black/60 overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                  <span className="text-[11px] font-mono text-slate-300">
                    {img.width || 1200}x{img.height || 630}
                  </span>
                  <div className="p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-md">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Image Info & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed" title={img.prompt}>
                  {img.prompt}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                  <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={img.url}
                      download={img.filename}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(img._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 truncate max-w-xl">
                {selectedImage.prompt}
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black/80 max-h-[70vh]">
              <img
                src={selectedImage.url}
                alt={selectedImage.prompt}
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                <span>Format: {selectedImage.mime}</span>
                <span>Size: {Math.round((selectedImage.sizeBytes || 0) / 1024)} KB</span>
                <span>Created: {new Date(selectedImage.createdAt).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigate('/studio');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use in Studio Post</span>
                </button>
                <a
                  href={selectedImage.url}
                  download={selectedImage.filename}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Resolution</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
