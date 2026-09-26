import React, { useState } from 'react';
import { pb } from '../lib/pb';

export default function MaterialIngestModal({ isOpen, onClose, onIngestSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [verses, setVerses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await pb.collection('materials').create({
        title,
        content,
        tags,
        verses, // This field is critical for the CrossReferencePanel to find it
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setVerses('');
      
      if (onIngestSuccess) onIngestSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create material:", err);
      setError(err.message || 'Failed to create material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-emerald-400">Add Study Material</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/50 p-3 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Armor of God"
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                Linked Verses
              </label>
              <input
                type="text"
                value={verses}
                onChange={(e) => setVerses(e.target.value)}
                placeholder="e.g. Ephesians 6:11, Ephesians 6:12"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. warfare, paul, daily"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
              Markdown Content
            </label>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your study notes here..."
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 scrollbar-thin"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}