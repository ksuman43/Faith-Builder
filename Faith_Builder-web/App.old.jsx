// src/App.jsx
import { useEffect, useState } from 'react';
import { pb } from './lib/pb';
import SearchModal from './components/SearchModal';

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedVerseResult, setSelectedVerseResult] = useState(null);

  // Global Keyboard Shortcut for Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial books to test database connection
  useEffect(() => {
    async function testConnection() {
      try {
        const resultList = await pb.collection('books').getList(1, 15, {
          sort: 'sort_order',
        });
        setBooks(resultList.items);
      } catch (err) {
        console.error("Failed to connect to PocketBase:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Faith Builder</h1>
          <p className="text-xs text-gray-500 font-medium">Deep Study Bible Database Tool</p>
        </div>

        {/* Search Trigger Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <span>Search scripture...</span>
          <kbd className="bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 rounded border border-gray-300 shadow-xs">
            Ctrl K
          </kbd>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Book Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col h-[75vh]">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Canonical Books
          </h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs mb-3">
              Error connecting to PocketBase: {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <p className="text-gray-400 text-sm p-2">Loading books...</p>
            ) : (
              books.map((book) => (
                <div key={book.id} className="py-2.5 px-2 hover:bg-blue-50 rounded cursor-pointer flex justify-between items-center transition-colors">
                  <span className="text-sm font-medium text-gray-800">{book.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {book.testament}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center/Right Columns: Active Study Pane placeholder */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between h-[75vh]">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Study Workspace</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a book from the left or press <span className="font-semibold text-blue-600">Ctrl+K</span> to search for specific verses across your database.
            </p>

            {selectedVerseResult ? (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg mt-6">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">
                  Selected from Search: {selectedVerseResult.reference}
                </span>
                <p className="text-gray-800 text-base italic">&ldquo;{selectedVerseResult.text}&rdquo;</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400 mt-6">
                No active verse selected. Use the search modal to look up a verse.
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
            Faith Builder • PocketBase + Vite + React + Tailwind
          </div>
        </div>
      </main>

      {/* Instant Search Modal Overlay */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectVerse={(verse) => {
          setSelectedVerseResult(verse);
          console.log("User selected verse:", verse);
        }}
      />
    </div>
  );
}

export default App;
