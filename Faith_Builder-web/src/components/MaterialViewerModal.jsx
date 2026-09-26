import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MaterialViewerModal({ isOpen, material, onClose, onMaterialUpdated }) {
  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl max-w-4xl w-full h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-emerald-400 mb-2">{material.title}</h2>
            <div className="flex gap-2 flex-wrap text-xs">
              {material.verses && material.verses.split(',').map((v, i) => (
                <span key={`v-${i}`} className="px-2 py-1 font-semibold bg-blue-100 dark:bg-sky-900/40 text-blue-800 dark:text-sky-300 rounded border border-blue-200 dark:border-sky-800/50">
                  📖 {v.trim()}
                </span>
              ))}
              {material.tags && material.tags.split(',').map((tag, i) => (
                <span key={`t-${i}`} className="px-2 py-1 font-semibold bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded border border-gray-300 dark:border-slate-700">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Markdown Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin bg-white dark:bg-slate-950">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            className="prose prose-slate dark:prose-invert prose-emerald max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-emerald-400"
          >
            {material.content}
          </ReactMarkdown>
        </div>

      </div>
    </div>
  );
}