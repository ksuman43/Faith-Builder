import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pb';

export default function ChapterReader({ books, currentBook, currentChapter, activeVerse, onSelectVerse, onNavigate }) {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch verses when the book or chapter changes
  useEffect(() => {
    let isMounted = true;

    async function fetchVerses() {
      if (!currentBook) return;
      
      setLoading(true);
      try {
        // Using PocketBase parameterized filter syntax to prevent 400 Bad Request errors
        const records = await pb.collection('verses').getFullList({
          filter: `book = "${currentBook.id}" && chapter = ${currentChapter}`,
          sort: 'verse',
        });
        
        if (isMounted) {
          setVerses(records);
        }
      } catch (err) {
        console.error("Error fetching verses:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchVerses();

    return () => {
      isMounted = false;
    };
  }, [currentBook, currentChapter]);

  const handleVerseClick = (v) => {
    const reference = v.reference || `${currentBook.name} ${currentChapter}:${v.verse}`;
    onSelectVerse({ ...v, reference, book: currentBook.id, chapter: currentChapter });
  };

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      onNavigate(currentBook, currentChapter - 1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < currentBook.chapters) {
      onNavigate(currentBook, currentChapter + 1);
    }
  };

  if (!currentBook) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
        <p className="text-gray-400 dark:text-slate-500">Select a book from the sidebar to begin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors duration-200 overflow-hidden relative">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-10 shadow-sm">
        <button 
          onClick={handlePrevChapter}
          disabled={currentChapter <= 1}
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-emerald-400 font-serif">
          {currentBook.name} {currentChapter}
        </h2>
        
        <button 
          onClick={handleNextChapter}
          disabled={currentChapter >= currentBook.chapters}
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Reader Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scroll-smooth text-lg leading-relaxed text-gray-800 dark:text-slate-300 font-serif">
        {loading ? (
          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/5"></div>
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-slate-500 mt-10">
            <p>No verses found for {currentBook.name} {currentChapter}.</p>
            <p className="text-sm mt-2">Check collection schema or public list rules in PocketBase.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {verses.map((v) => {
              const isSelected = activeVerse?.id === v.id;
              
              return (
                <span 
                  key={v.id} 
                  onClick={() => handleVerseClick(v)}
                  className={`inline cursor-pointer transition-colors duration-150 rounded-sm px-1 ${
                    isSelected 
                      ? 'bg-yellow-200 dark:bg-emerald-900/60 text-black dark:text-emerald-100 shadow-sm' 
                      : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <sup className="text-xs font-sans font-bold text-gray-400 dark:text-slate-500 mr-1 select-none">
                    {v.verse}
                  </sup>
                  {v.text}{' '}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}