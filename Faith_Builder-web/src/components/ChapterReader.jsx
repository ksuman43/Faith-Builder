// src/components/ChapterReader.jsx
import { useState, useEffect } from 'react';
import { pb } from '../lib/pb';

// Standard canonical chapter counts to handle book-jumping
const CHAPTER_COUNTS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 
  31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 
  24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22
];

export default function ChapterReader({ 
  books = [], 
  currentBook, 
  currentChapter, 
  activeVerse, 
  onSelectVerse, 
  onNavigate 
}) {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentBook) return;

    async function fetchChapter() {
      setLoading(true);
      try {
        const records = await pb.collection('verses').getFullList({
          filter: `book = "${currentBook.id}" && chapter = ${currentChapter}`,
          sort: 'verse_num',
        });
        setVerses(records);
      } catch (err) {
        console.error("Failed to fetch chapter:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchChapter();
  }, [currentBook, currentChapter]);

  // --- Navigation Logic ---
  const handlePrev = () => {
    if (currentChapter > 1) {
      // Just go back one chapter in the same book
      onNavigate(currentBook, currentChapter - 1);
    } else {
      // Jump to the last chapter of the previous book
      const bookIndex = books.findIndex(b => b.id === currentBook.id);
      if (bookIndex > 0) {
        const prevBook = books[bookIndex - 1];
        const prevBookMaxChapter = CHAPTER_COUNTS[prevBook.sort_order - 1];
        onNavigate(prevBook, prevBookMaxChapter);
      }
    }
  };

  const handleNext = () => {
    const maxChapters = CHAPTER_COUNTS[currentBook.sort_order - 1];
    
    if (currentChapter < maxChapters) {
      // Just go forward one chapter in the same book
      onNavigate(currentBook, currentChapter + 1);
    } else {
      // Jump to chapter 1 of the next book
      const bookIndex = books.findIndex(b => b.id === currentBook.id);
      if (bookIndex < books.length - 1) {
        const nextBook = books[bookIndex + 1];
        onNavigate(nextBook, 1);
      }
    }
  };

  if (!currentBook) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-white rounded-xl shadow-sm border border-gray-200">
        Select a book to begin reading.
      </div>
    );
  }

  // Disable buttons if we are at the absolute beginning or end of the Bible
  const isFirstChapter = currentBook.sort_order === 1 && currentChapter === 1;
  const isLastChapter = currentBook.sort_order === 66 && currentChapter === 22;

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[75vh] overflow-hidden">
      
      {/* Chapter Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900">
          {currentBook.name} {currentChapter}
        </h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={handlePrev}
            disabled={isFirstChapter}
            className="px-3 py-1 bg-white border border-gray-200 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <button 
            onClick={handleNext}
            disabled={isLastChapter}
            className="px-3 py-1 bg-white border border-gray-200 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Scripture Reading Pane */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="text-gray-400 text-sm animate-pulse">Loading scripture...</span>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto pb-12">
            {verses.map((verse) => {
              const isActive = activeVerse?.id === verse.id;
              
              return (
                <span 
                  key={verse.id}
                  onClick={() => onSelectVerse(verse)}
                  className={`
                    inline cursor-pointer text-lg leading-relaxed transition-colors duration-150 rounded
                    ${isActive ? 'bg-blue-100 text-blue-900 font-medium pb-0.5 border-b-2 border-blue-400' : 'hover:bg-gray-100 text-gray-800'}
                  `}
                >
                  <sup className={`
                    font-bold text-[10px] ml-1.5 mr-0.5 select-none
                    ${isActive ? 'text-blue-700' : 'text-gray-400'}
                  `}>
                    {verse.verse_num}
                  </sup>
                  {verse.text}{' '}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
