// src/components/SearchModal.jsx
import { useState, useEffect } from 'react';
import { pb } from '../lib/pb';

export default function SearchModal({ isOpen, onClose, onSelectVerse }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 0 = Exact match only, 1 = +/- 1 verse, 2 = +/- 2 verses
  const [contextSize, setContextSize] = useState(0); 

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // 1. Fetch the exact matching verses
        const res = await pb.collection('verses').getList(1, 20, {
          filter: `text ~ "${query}" || reference ~ "${query}"`,
          sort: 'book,chapter,verse_num'
        });

        // 2. If no context needed, just use the direct results
        if (contextSize === 0) {
          setResults(res.items.map(v => ({ ...v, passageText: v.text })));
          setLoading(false);
          return;
        }

        // 3. If context is requested, fetch surrounding verses for each result
        const expandedResults = await Promise.all(
          res.items.map(async (verse) => {
            const minVerse = verse.verse_num - contextSize;
            const maxVerse = verse.verse_num + contextSize;

            const contextRes = await pb.collection('verses').getFullList({
              filter: `book = "${verse.book}" && chapter = ${verse.chapter} && verse_num >= ${minVerse} && verse_num <= ${maxVerse}`,
              sort: 'verse_num'
            });

            // Combine the surrounding text into a single passage
            const passageText = contextRes
              .map(v => `[${v.verse_num}] ${v.text}`)
              .join(' ');

            // Create an expanded reference string (e.g., "John 3:15-17")
            const startVerse = contextRes[0].verse_num;
            const endVerse = contextRes[contextRes.length - 1].verse_num;
            const passageRef = startVerse !== endVerse 
              ? `${verse.reference.split(':')[0]}:${startVerse}-${endVerse}`
              : verse.reference;

            return {
              ...verse, 
              passageText,
              passageRef
            };
          })
        );

        setResults(expandedResults);
      } catch (err) {
        console.error("Search query error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, contextSize]); 

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200">
        
        {/* Search Input Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              type="text"
              placeholder="Search scripture or reference (e.g., grace, Romans 8)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-lg outline-none text-gray-800 placeholder-gray-400"
            />
            <button 
              onClick={onClose}
              className="text-xs font-semibold px-2 py-1 text-gray-500 bg-gray-200 hover:bg-gray-300 rounded ml-2"
            >
              ESC
            </button>
          </div>

          {/* Context Size Controls */}
          <div className="flex items-center gap-2 pl-8">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Passage Size:</span>
            {[
              { label: 'Exact Verse', value: 0 },
              { label: '+/- 1 Verse', value: 1 },
              { label: '+/- 2 Verses', value: 2 }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setContextSize(option.value)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  contextSize === option.value 
                    ? 'bg-blue-100 text-blue-700 font-bold border border-blue-200' 
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {loading && (
            <div className="p-6 text-center text-gray-400 text-sm">Searching scriptures...</div>
          )}

          {!loading && results.map((verse) => (
            <div
              key={verse.id}
              onClick={() => {
                onSelectVerse(verse); 
                onClose();
              }}
              className="p-4 hover:bg-blue-50 cursor-pointer transition-colors group"
            >
              <div className="text-xs font-bold text-blue-600 mb-1 group-hover:text-blue-800 flex justify-between">
                <span>{verse.passageRef || verse.reference}</span>
                {contextSize > 0 && (
                  <span className="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-600">
                    Keyword in verse {verse.verse_num}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700">
                {verse.passageText || verse.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}