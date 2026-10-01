import { useState, useEffect } from 'react';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Inner Autocomplete Component
function VerseSelector({ onSelect }) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }
            try {
                const records = await pb.collection('verses').getList(1, 5, {
                    filter: `reference ~ "${query}"`,
                    sort: 'book,chapter,verse' // Using your corrected sorting fields
                });
                setSuggestions(records.items);
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative mt-4">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a verse to link (e.g., Romans 8:28)..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-xl">
                    {suggestions.map((v) => (
                        <li
                            key={v.id}
                            onClick={() => {
                                onSelect(v);
                                setQuery('');
                                setSuggestions([]);
                            }}
                            className="px-4 py-2 text-sm text-slate-100 hover:bg-slate-600 cursor-pointer"
                        >
                            {v.reference}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Main Chapter Reader Component
export default function ChapterReader({ chapterId }) {
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chapterId) return;
        
        const loadChapter = async () => {
            try {
                const record = await pb.collection('materials').getOne(chapterId, {
                    expand: 'verses' // Expand relation to show linked verses
                });
                setChapter(record);
            } catch (err) {
                console.error("Error loading chapter:", err);
            } finally {
                setLoading(false);
            }
        };
        loadChapter();
    }, [chapterId]);

    const handleAddVerse = async (verseRecord) => {
        if (!chapter) return;
        
        const currentVerses = chapter.verses || [];
        if (currentVerses.includes(verseRecord.id)) return; // Prevent duplicates

        try {
            const updatedVerses = [...currentVerses, verseRecord.id];
            const updatedChapter = await pb.collection('materials').update(chapter.id, {
                verses: updatedVerses
            });
            
            // Re-fetch to get the expanded relational data
            const refreshed = await pb.collection('materials').getOne(updatedChapter.id, {
                expand: 'verses'
            });
            setChapter(refreshed);
        } catch (err) {
            console.error("Failed to link verse:", err);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading chapter...</div>;
    if (!chapter) return <div className="p-8 text-white">Select a chapter to read.</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 bg-slate-900 min-h-screen text-slate-200">
            <h1 className="text-3xl font-bold mb-4">{chapter.title}</h1>
            
            <div className="prose prose-invert mb-8">
                {/* Assuming content is markdown/html */}
                <p>{chapter.content}</p>
            </div>

            <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold mb-3">Linked Verses</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {chapter.expand?.verses?.map(v => (
                        <span key={v.id} className="px-3 py-1 bg-blue-900/50 text-blue-200 rounded-full text-sm border border-blue-800">
                            {v.reference}
                        </span>
                    )) || <span className="text-slate-500 italic">No verses linked yet.</span>}
                </div>
                
                <VerseSelector onSelect={handleAddVerse} />
            </div>
        </div>
    );
}