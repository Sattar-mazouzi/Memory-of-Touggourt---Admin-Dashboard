
import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2, Star } from 'lucide-react';
import { Place, CategoryType, LocalizedText, AppLanguage } from '../types';
import { translations } from '../translations';
import { generatePlaceDescription } from '../services/geminiService';

interface PlaceFormProps {
  place?: Place;
  currentLang: AppLanguage;
  onSave: (place: Partial<Place>) => void;
  onClose: () => void;
}

const PlaceForm: React.FC<PlaceFormProps> = ({ place, currentLang, onSave, onClose }) => {
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);
  const t = translations[currentLang];
  const isFormRtl = editingLang === 'ar';
  
  const [formData, setFormData] = useState<Partial<Place>>({
    name: place?.name || { ar: '', en: '', fr: '' },
    address: place?.address || { ar: '', en: '', fr: '' },
    category: place?.category || 'culture',
    description: place?.description || { ar: '', en: '', fr: '' },
    imageUrl: place?.imageUrl || '',
    featured: place?.featured || false,
    rating: place?.rating ?? 4.5,
    location: place?.location || { latitude: 33.1092, longitude: 6.0332 },
    ...place
  });
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIHelp = async () => {
    const currentName = formData.name?.[editingLang];
    if (!currentName) return alert(editingLang === 'ar' ? 'يرجى إدخال اسم المكان أولاً باللغة الحالية' : 'Please enter a place name first in the current language');
    setIsGenerating(true);
    const desc = await generatePlaceDescription(currentName, formData.category || 'culture');
    
    setFormData(prev => ({ 
      ...prev, 
      description: { 
        ...prev.description as LocalizedText, 
        [editingLang]: desc 
      } 
    }));
    setIsGenerating(false);
  };

  const updateLocalized = (field: 'name' | 'address' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as LocalizedText),
        [editingLang]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={translations[currentLang] === translations.ar ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {place ? t.editAsset : t.newAsset}
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['en', 'ar', 'fr'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setEditingLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    editingLang === l ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {t.name} ({editingLang.toUpperCase()})
              </label>
              <input
                type="text"
                required
                dir={isFormRtl ? 'rtl' : 'ltr'}
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
                placeholder={editingLang === 'ar' ? 'مثلاً: المسجد العتيق' : 'e.g. Ancient Mosque'}
                value={formData.name?.[editingLang] || ''}
                onChange={e => updateLocalized('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.category}</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none appearance-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="religion">{t.religion}</option>
                <option value="history">{t.history}</option>
                <option value="culture">{t.culture}</option>
                <option value="nature">{t.nature}</option>
                <option value="hotels">{t.hotels}</option>
                <option value="restaurants">{t.restaurants}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.latitude}</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
                value={formData.location?.latitude}
                onChange={e => setFormData({ ...formData, location: { ...formData.location!, latitude: parseFloat(e.target.value) } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.longitude}</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
                value={formData.location?.longitude}
                onChange={e => setFormData({ ...formData, location: { ...formData.location!, longitude: parseFloat(e.target.value) } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.rating} (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
                value={formData.rating}
                onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t.address} ({editingLang.toUpperCase()})
            </label>
            <input
              type="text"
              required
              dir={isFormRtl ? 'rtl' : 'ltr'}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
              placeholder="..."
              value={formData.address?.[editingLang] || ''}
              onChange={e => updateLocalized('address', e.target.value)}
            />
          </div>

          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {t.description} ({editingLang.toUpperCase()})
              </label>
              <button 
                type="button"
                onClick={handleAIHelp}
                disabled={isGenerating}
                className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {t.suggestAI}
              </button>
            </div>
            <textarea
              required
              rows={4}
              dir={isFormRtl ? 'rtl' : 'ltr'}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none resize-none"
              placeholder="..."
              value={formData.description?.[editingLang] || ''}
              onChange={e => updateLocalized('description', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.image}</label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="url"
                  required
                  className={`w-full ${editingLang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none`}
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                <ImageIcon className={`absolute ${editingLang === 'ar' ? 'right-4' : 'left-4'} top-3.5 text-slate-300`} size={20} />
              </div>
              <div className="w-20 h-14 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
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
            <label htmlFor="featured" className="text-sm font-medium text-slate-700">{t.featuredCheckbox}</label>
          </div>

          <div className="pt-4 flex gap-4 sticky bottom-0 bg-white border-t border-slate-50 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
            >
              {place ? t.updateEntry : t.saveNewEntry}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceForm;
