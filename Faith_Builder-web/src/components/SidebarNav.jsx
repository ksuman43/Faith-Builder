// src/components/SidebarNav.jsx
import { useState, useEffect } from 'react';

// Standard 66-book chapter counts sorted canonically (Genesis to Revelation)
const CHAPTER_COUNTS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 
  31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 
  24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22
];

export default function SidebarNav({ books, currentBook, currentChapter, onNavigate }) {
  const [expandedBookId, setExpandedBookId] = useState(currentBook?.id || null);

  // Auto-expand the book if it changes from outside (e.g., from a search result)
  useEffect(() => {
    if (currentBook) setExpandedBookId(currentBook.id);
  }, [currentBook]);

  // Group books by testament
  const oldTestament = books.filter(b => b.testament === 'OT');
  const newTestament = books.filter(b => b.testament === 'NT');

  const renderBookList = (bookList) => (
    <div className="space-y-1">
      {bookList.map((book) => {
        const isExpanded = expandedBookId === book.id;
        const isCurrentBook = currentBook?.id === book.id;
        
        // Use sort_order (1-66) to find the correct chapter count
        const chapterCount = CHAPTER_COUNTS[book.sort_order - 1];
        
        // Generate an array of chapter numbers: [1, 2, 3...]
        const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);

        return (
          <div key={book.id} className="border-b border-gray-100 last:border-0 pb-1">
            {/* Book Title Button */}
            <button
              onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
              className={`w-full flex justify-between items-center px-2 py-2 rounded text-sm font-medium transition-colors ${
                isCurrentBook ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{book.name}</span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Chapter Grid (Accordion Content) */}
            {isExpanded && (
              <div className="grid grid-cols-5 gap-1 p-2 bg-gray-50 rounded-lg mt-1 mb-2 border border-gray-100">
                {chapters.map(chapterNum => {
                  const isActiveChapter = isCurrentBook && currentChapter === chapterNum;
                  return (
                    <button
                      key={chapterNum}
                      onClick={() => onNavigate(book, chapterNum)}
                      className={`
                        py-1.5 text-xs font-semibold rounded transition-colors
                        ${isActiveChapter 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-white text-gray-600 hover:bg-blue-100 hover:text-blue-800 border border-gray-200'
                        }
                      `}
                    >
                      {chapterNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Library</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
            Old Testament
          </h3>
          {renderBookList(oldTestament)}
        </div>
        
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
            New Testament
          </h3>
          {renderBookList(newTestament)}
        </div>
      </div>
    </div>
  );
}
