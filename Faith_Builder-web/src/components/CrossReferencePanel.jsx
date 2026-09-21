// src/components/CrossReferencePanel.jsx
import { useState, useEffect } from 'react';
import { pb } from '../lib/pb';

export default function CrossReferencePanel({ activeVerse, onSelectVerse, onOpenMaterial }) {
  const [crossRefs, setCrossRefs] = useState([]);
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeVerse) {
      setCrossRefs([]);
      setTopics([]);
      setMaterials([]);
      return;
    }

    async function fetchDeepStudyData(verse) {
      setLoading(true);
      try {
        // Run all three queries concurrently for maximum speed
        const [refsRes, topicsRes, materialsRes] = await Promise.all([
          // 1. Cross References
          pb.collection('cross_refs').getList(1, 20, {
            filter: `source_verse = "${verse.id}"`,
            expand: 'target_verse',
            sort: '-importance'
          }),
          // 2. Thematic Topics
          pb.collection('verse_topics').getList(1, 10, {
            filter: `verse = "${verse.id}"`,
            expand: 'topic'
          }),
          // 3. Ingested Materials (Match by relation link OR by text search in the transcript)
          pb.collection('materials').getList(1, 10, {
            filter: `linked_verses ~ "${verse.id}" || content ~ "${verse.reference}"`,
            sort: '-created'
          })
        ]);

        setCrossRefs(refsRes.items);
        setTopics(topicsRes.items);
        setMaterials(materialsRes.items);

      } catch (err) {
        console.error("Failed to load deep study data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDeepStudyData(activeVerse);
  }, [activeVerse]);

  if (!activeVerse) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center h-full text-center text-gray-400">
        <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
        <p className="text-sm font-medium text-gray-600">Deep Study Workspace</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Click any verse to view cross-references, thematic connections, and study materials.
        </p>
      </div>
    );
  }

  // Helper to format material badges
  const getSourceColor = (type) => {
    switch(type) {
      case 'sermon': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'book': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'email': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full overflow-hidden">
      
      {/* Active Verse Header Banner */}
      <div className="pb-4 border-b border-gray-100 mb-4 shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          Active Focus
        </span>
        <h3 className="text-base font-bold text-gray-900 mt-1">{activeVerse.reference}</h3>
        <p className="text-xs text-gray-600 italic mt-1 line-clamp-3">&ldquo;{activeVerse.text}&rdquo;</p>
      </div>

      {/* Scrollable Research Content */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-1">
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-xs">Loading research data...</div>
        ) : (
          <>
            {/* Section 1: Ingested Materials */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Study Materials</span>
                {materials.length > 0 && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[10px]">{materials.length}</span>}
              </h4>

              {materials.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No sermons or books found referencing this verse.</p>
              ) : (
                <div className="space-y-3">
                  {materials.map((mat) => (
                    <div 
                      key={mat.id}
                      onClick={() => onOpenMaterial(mat)}
                      className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{mat.title}</h5>
                          {mat.author && <p className="text-[10px] text-gray-500 uppercase tracking-wide">{mat.author}</p>}
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getSourceColor(mat.source_type)}`}>
                          {mat.source_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-line bg-gray-50 p-2 rounded border border-gray-100">
                        {mat.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Associated Topics */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Thematic Connections
              </h4>
              {topics.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No topics assigned to this verse.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => {
                    const topicObj = t.expand?.topic;
                    if (!topicObj) return null;
                    return (
                      <span key={t.id} className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md">
                        {topicObj.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Cross-References */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Cross References</span>
                {crossRefs.length > 0 && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[10px]">{crossRefs.length}</span>}
              </h4>

              {crossRefs.length === 0 ? (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                  No automated cross-references linked.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {crossRefs.map((ref) => {
                    const target = ref.expand?.target_verse;
                    if (!target) return null;
                    return (
                      <div 
                        key={ref.id}
                        onClick={() => onSelectVerse(target)}
                        className="p-3 bg-gray-50 hover:bg-blue-50/50 border border-gray-200/80 hover:border-blue-300 rounded-lg cursor-pointer transition-all group"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800">
                            {target.reference}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                            {ref.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 line-clamp-2">{target.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}