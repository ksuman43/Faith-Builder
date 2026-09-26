import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ViewMaterialModal({ material, isOpen, onClose }) {
  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl max-w-3xl w-full h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">{material.title}</h2>
            {material.tags && (
              <div className="flex gap-2 flex-wrap">
                {material.tags.split(',').map((tag, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-semibold bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Markdown Body */}
        <div className="p-6 overflow-y-auto">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            className="prose prose-invert prose-emerald max-w-none"
          >
            {material.content}
          </ReactMarkdown>
        </div>

      </div>
    </div>
  );
}