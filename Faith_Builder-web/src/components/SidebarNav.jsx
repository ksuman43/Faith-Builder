import React, { useState, useEffect } from 'react';

export default function SidebarNav({ books = [], currentBook, currentChapter, onNavigate }) {
  // Keep track of which book's chapter grid is currently expanded
  const [expandedBook, setExpandedBook] = useState(currentBook?.id || null);

  // Auto-expand the current book when navigating from outside (like Search)
  useEffect(() => {
    if (currentBook) {
      setExpandedBook(currentBook.id);
    }
  }, [currentBook]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors duration-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
        <h2 className="font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider text-xs">
          Books
        </h2>
      </div>

      {/* Scrollable Book List */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {books.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-slate-500 p-4 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
            No books found. Configure PocketBase 'books' collection.
          </div>
        ) : (
          books.map(book => (
            <div key={book.id} className="mb-1">
              
              {/* Book Button */}
              <button
                onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  expandedBook === book.id
                    ? 'bg-blue-50 dark:bg-emerald-900/30 text-blue-700 dark:text-emerald-400'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {book.name}
              </button>
              
              {/* Expandable Chapter Grid */}
              {expandedBook === book.id && (
                <div className="grid grid-cols-5 gap-1.5 p-2 bg-gray-50 dark:bg-slate-950 rounded-lg mt-1 mb-3 border border-gray-100 dark:border-slate-800/80 shadow-inner">
                  {Array.from({ length: book.chapters }).map((_, i) => {
                    const chapterNum = i + 1;
                    const isCurrent = currentBook?.id === book.id && currentChapter === chapterNum;
                    
                    return (
                      <button
                        key={chapterNum}
                        onClick={() => onNavigate(book, chapterNum)}
                        className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-md transition-all ${
                          isCurrent
                            ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800'
                        }`}
                      >
                        {chapterNum}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}