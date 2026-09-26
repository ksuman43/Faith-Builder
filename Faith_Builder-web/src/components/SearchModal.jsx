import React, { useState, useEffect, useRef } from 'react';
import { pb } from '../lib/pb';

export default function SearchModal({ isOpen, onClose, onSelectVerse }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus the input when opened via Ctrl+K
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    if (searchTerm.trim().length < 3) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        // Searches the 'verses' collection for the text string.
        // Adjust to your PocketBase schema (e.g., if book names are stored vs relations)
        const records = await pb.collection('verses').getList(1, 20, {
          filter: `text ~ "${searchTerm.replace(/"/g, '\\"')}"`,
          expand: 'book', // Assumes a relation field named 'book'
        });
        setResults(records.items);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms delay to prevent spamming the database while typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search scripture (e.g. 'faith without works')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-lg placeholder-gray-400 dark:placeholder-slate-500 font-medium"
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition text-sm font-bold bg-gray-200 dark:bg-slate-700 rounded px-2">
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {loading && <div className="p-4 text-center text-sm text-gray-500">Searching...</div>}
          
          {!loading && searchTerm.length >= 3 && results.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">No verses found for "{searchTerm}"</div>
          )}

          {!loading && results.map((v) => {
            // If book is a relation, extract the name. Otherwise fallback to ID.
            const bookName = v.expand?.book?.name || "Book"; 
            const refString = `${bookName} ${v.chapter}:${v.verse}`;

            return (
              <button
                key={v.id}
                onClick={() => {
                  onSelectVerse({ ...v, reference: refString, book: v.book, chapter: v.chapter });
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-slate-700 mb-1"
              >
                <div className="text-xs font-bold text-blue-600 dark:text-emerald-400 mb-1">
                  {refString}
                </div>
                <div className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2 font-serif">
                  {v.text}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}