// src/components/MaterialViewerModal.jsx
import { useState, useEffect } from 'react';
import { pb } from '../lib/pb';

export default function MaterialViewerModal({ isOpen, material, onClose, onMaterialUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', source_type: '', author: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset state whenever the modal opens or the material changes
  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title || '',
        source_type: material.source_type || 'other',
        author: material.author || '',
        content: material.content || ''
      });
      setIsEditing(false);
      setError(null);
    }
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Update the record in PocketBase
      const updatedRecord = await pb.collection('materials').update(material.id, formData);
      setIsEditing(false);
      
      // Notify parent to refresh lists
      if (onMaterialUpdated) onMaterialUpdated(updatedRecord);
    } catch (err) {
      console.error("Failed to update material:", err);
      setError(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${material.title}"?`)) return;
    
    setIsSaving(true);
    try {
      await pb.collection('materials').delete(material.id);
      if (onMaterialUpdated) onMaterialUpdated(null); // Null signals a deletion
      onClose();
    } catch (err) {
      console.error("Failed to delete material:", err);
      setError("Failed to delete record.");
      setIsSaving(false);
    }
  };

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header Options */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded border border-blue-200 transition-colors"
              >
                Edit Material
              </button>
            ) : (
              <button 
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded border border-red-200 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-md p-1 shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="m-4 mb-0 bg-red-50 text-red-700 p-3 rounded text-sm border border-red-200 shrink-0">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {!isEditing ? (
            // --- READ MODE ---
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getSourceColor(material.source_type)}`}>
                    {material.source_type}
                  </span>
                </div>
                {material.author && (
                  <div className="text-sm font-semibold text-gray-500">By {material.author}</div>
                )}
              </div>
              
              {/* whitespace-pre-wrap respects line breaks from copied text */}
              <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                {material.content}
              </div>
            </div>
          ) : (
            // --- EDIT MODE ---
            <div className="max-w-3xl mx-auto flex flex-col gap-4 h-full">
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Source Type</label>
                    <select
                      name="source_type"
                      value={formData.source_type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="sermon">Sermon</option>
                      <option value="book">Book/Commentary</option>
                      <option value="email">Email</option>
                      <option value="article">Article</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Author</label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="w-full flex-1 border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2 shrink-0">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}