import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pb';

export default function CrossReferencePanel({ activeVerse, onSelectVerse, onOpenMaterial }) {
  const [crossRefs, setCrossRefs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch related data whenever a new verse is clicked
  useEffect(() => {
    let isMounted = true;

    async function fetchDeepStudyData() {
      if (!activeVerse) {
        setCrossRefs([]);
        setMaterials([]);
        return;
      }

      setLoading(true);
      try {
        // We assume activeVerse has a string property like 'reference' (e.g., "Romans 8:1")
        // Adjust the filter query to match your exact PocketBase schema
        const verseRef = activeVerse.reference;

        // 1. Fetch Cross References
        const refsResult = await pb.collection('cross_references').getList(1, 50, {
          filter: `reference = "${verseRef}"`,
          sort: '-created',
        });

        // 2. Fetch Study Materials linked to this verse
        // Note: Adjust the filter depending on how your ingest-md script maps verses
        // If it uses a JSON array or a text field, a "~" (contains) operator might be needed: `verses ~ "${verseRef}"`
        const materialsResult = await pb.collection('materials').getList(1, 20, {
          filter: `verses ~ "${verseRef}"`, 
          sort: '-created',
        });

        if (isMounted) {
          setCrossRefs(refsResult.items);
          setMaterials(materialsResult.items);
        }
      } catch (err) {
        console.error("Error fetching deep study data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDeepStudyData();

    return () => {
      isMounted = false;
    };
  }, [activeVerse]);

  if (!activeVerse) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm p-6 text-center transition-colors">
        <svg className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">Deep Study</h3>
        <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
          Select a verse from the reader to view cross-references and your Markdown study notes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-blue-50 dark:bg-slate-800/80 flex justify-between items-center">
        <h2 className="font-bold text-blue-800 dark:text-emerald-400">
          {activeVerse.reference}
        </h2>
        <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-emerald-900/50 text-blue-700 dark:text-emerald-300 rounded-md">
          Focus Mode
        </span>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        ) : (
          <>
            {/* Cross References Section */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Related Verses
              </h3>
              
              {crossRefs.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 italic">No cross-references mapped yet.</p>
              ) : (
                <ul className="space-y-2">
                  {crossRefs.map(ref => (
                    <li key={ref.id}>
                      {/* When clicked, it tells the parent App to navigate to this related verse */}
                      <button 
                        onClick={() => onSelectVerse({ reference: ref.related_verse })}
                        className="text-sm w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-600 dark:text-sky-400 font-medium transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                      >
                        {ref.related_verse}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <hr className="border-gray-100 dark:border-slate-800" />

            {/* Study Materials Section */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Study Notes
              </h3>

              {materials.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 italic">No notes linked to this verse.</p>
              ) : (
                <div className="space-y-3">
                  {materials.map(material => (
                    <button
                      key={material.id}
                      onClick={() => onOpenMaterial(material)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
                    >
                      <h4 className="font-bold text-gray-800 dark:text-emerald-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-sm mb-1">
                        {material.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                        {material.content.replace(/[#*`_]/g, '')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}