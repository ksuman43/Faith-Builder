import { useEffect, useState } from 'react';
import { pb } from './lib/pb';
import SidebarNav from './components/SidebarNav';
import ChapterReader from './components/ChapterReader';
import CrossReferencePanel from './components/CrossReferencePanel';
import SearchModal from './components/SearchModal';
import MaterialIngestModal from './components/MaterialIngestModal';
import MaterialViewerModal from './components/MaterialViewerModal';
import LoginModal from './components/LoginModal';

function App() {
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Auth state
  const [isAdmin, setIsAdmin] = useState(pb.authStore.isValid);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Data state
  const [books, setBooks] = useState([]);
  
  // Navigation state
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [activeVerse, setActiveVerse] = useState(null);
  
  // Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);

  // Handle Theme Switching
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Initialize App (Fetch Books)
  useEffect(() => {
    async function initApp() {
      try {
        const resultList = await pb.collection('books').getFullList({
          sort: 'sort_order',
        });
        setBooks(resultList);
        if (resultList.length > 0) {
          setCurrentBook(resultList[0]); // Default to Genesis
        }
      } catch (err) {
        console.error("Failed to connect to PocketBase or fetch books:", err);
      }
    }
    initApp();
  }, []);

  // Keyboard Shortcuts
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

  // Handlers
  const handleNavigate = (book, chapterNum) => {
    setCurrentBook(book);
    setCurrentChapter(chapterNum);
    setActiveVerse(null); // Reset active verse on chapter change
  };

  const handleSelectVerse = (verse) => {
    setActiveVerse(verse);
    // Auto-navigate the reader to show the selected verse in context
    const book = books.find(b => b.id === verse.book);
    if (book) {
      setCurrentBook(book);
      setCurrentChapter(verse.chapter);
    }
  };

  // Re-trigger activeVerse to refresh the panel when material is added/updated
  const handleMaterialUpdated = () => {
    if (activeVerse) {
      const current = activeVerse;
      setActiveVerse(null);
      setTimeout(() => setActiveVerse(current), 10);
    }
    setViewingMaterial(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors duration-200">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shadow-sm shrink-0 transition-colors duration-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-emerald-400 tracking-tight transition-colors">Faith Builder</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Deep Study Bible Database Tool</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            title="Toggle Dark Mode"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* Only show Add Material and Logout if authenticated */}
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsIngestOpen(true)}
                className="flex items-center gap-2 bg-blue-50 dark:bg-emerald-900/30 hover:bg-blue-100 dark:hover:bg-emerald-900/60 text-blue-700 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-200 dark:border-emerald-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Material
              </button>
              <button
                onClick={() => {
                  pb.authStore.clear();
                  setIsAdmin(false);
                }}
                className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 px-2"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="text-sm font-medium text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 px-2"
            >
              Admin Login
            </button>
          )}
          
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-slate-700"
          >
            <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span>Search scripture...</span>
            <kbd className="bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-slate-400 rounded border border-gray-300 dark:border-slate-700 shadow-sm">
              Ctrl K
            </kbd>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-80px)]">
        
        {/* Left Column: Navigation Sidebar */}
        <div className="lg:col-span-3 h-full overflow-hidden flex flex-col">
          <SidebarNav 
            books={books}
            currentBook={currentBook}
            currentChapter={currentChapter}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Center Column: Reader */}
        <div className="lg:col-span-5 h-full overflow-hidden flex flex-col">
          <ChapterReader 
            books={books}
            currentBook={currentBook}
            currentChapter={currentChapter}
            activeVerse={activeVerse}
            onSelectVerse={handleSelectVerse}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Right Column: Deep Study */}
        <div className="lg:col-span-4 h-full overflow-hidden flex flex-col">
          <CrossReferencePanel 
            activeVerse={activeVerse}
            onSelectVerse={handleSelectVerse}
            onOpenMaterial={setViewingMaterial}
          />
        </div>
      </main>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectVerse={handleSelectVerse}
      />

      <MaterialIngestModal 
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onIngestSuccess={handleMaterialUpdated}
      />

      <MaterialViewerModal 
        isOpen={!!viewingMaterial}
        material={viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        onMaterialUpdated={handleMaterialUpdated}
      />

      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => setIsAdmin(true)}
      />
    </div>
  );
}

export default App;