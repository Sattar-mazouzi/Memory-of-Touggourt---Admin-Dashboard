
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Place, CategoryType } from '../types';
import { generatePlaceDescription } from '../services/geminiService';

interface PlaceFormProps {
  place?: Place;
  onSave: (place: Partial<Place>) => void;
  onClose: () => void;
}

const PlaceForm: React.FC<PlaceFormProps> = ({ place, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Place>>({
    name: '',
    location: '',
    category: CategoryType.CULTURAL,
    description: '',
    imageUrl: '',
    featured: false,
    ...place
  });
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIHelp = async () => {
    if (!formData.name) return alert('Please enter a place name first');
    setIsGenerating(true);
    const desc = await generatePlaceDescription(formData.name, formData.category || 'Tourist Attraction');
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {place ? 'Edit Place' : 'Add New Place'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Place Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
                placeholder="e.g. Great Mosque"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none appearance-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as CategoryType })}
              >
                {Object.values(CategoryType).map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
              placeholder="e.g. 43200 Touggourt"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
              <button 
                type="button"
                onClick={handleAIHelp}
                disabled={isGenerating}
                className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Generate with AI
              </button>
            </div>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none resize-none"
              placeholder="Tell visitors about this hidden gem..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Image URL</label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="url"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none pl-12"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                <ImageIcon className="absolute left-4 top-3.5 text-slate-300" size={20} />
              </div>
              <div className="w-20 h-14 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <ImageIcon size={20} className="text-slate-300" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="featured"
              className="w-5 h-5 rounded-lg border-slate-300 text-orange-500 focus:ring-orange-500"
              checked={formData.featured}
              onChange={e => setFormData({ ...formData, featured: e.target.checked })}
            />
            <label htmlFor="featured" className="text-sm font-medium text-slate-700">Set as Featured Place</label>
          </div>

          <div className="pt-4 flex gap-4 sticky bottom-0 bg-white border-t border-slate-50 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
            >
              {place ? 'Update Place' : 'Create Place'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceForm;
