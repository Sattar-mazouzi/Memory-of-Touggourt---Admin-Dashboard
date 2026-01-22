
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Star, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Place, LocalizedText, AppLanguage } from '../types';
import { translations } from '../translations';
import { uploadImage } from '../services/cloudinaryService';

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Place>>(() => {
    const defaults = {
      name: { ar: '', en: '', fr: '' },
      address: { ar: '', en: '', fr: '' },
      category: 'culture',
      description: { ar: '', en: '', fr: '' },
      imageUrl: '',
      featured: false,
      rating: 4.5,
      location: { latitude: 33.1092, longitude: 6.0332 }
    };

    if (!place) return defaults;

    return {
      ...defaults,
      ...place,
      location: {
        latitude: place.location?.latitude ?? defaults.location.latitude,
        longitude: place.location?.longitude ?? defaults.location.longitude,
      }
    };
  });

  const updateLocalized = (field: 'name' | 'address' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as LocalizedText),
        [editingLang]: value
      }
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />

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
                value={formData.location?.latitude ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, location: { ...formData.location!, latitude: val } });
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.longitude}</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
                value={formData.location?.longitude ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, location: { ...formData.location!, longitude: val } });
                }}
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
                value={formData.rating ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, rating: val });
                }}
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t.description} ({editingLang.toUpperCase()})
            </label>
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

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.image}</label>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 aspect-video md:aspect-square bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 shadow-inner group relative">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Preview" />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isUploading}
                      className="p-2 bg-white rounded-full shadow-lg text-orange-600 hover:scale-110 transition-transform"
                    >
                      {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-orange-100 text-orange-600 font-bold rounded-2xl hover:bg-orange-200 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  {isUploading ? t.uploading : t.uploadImage}
                </button>
                
                <div className="relative">
                  <div className={`absolute ${editingLang === 'ar' ? 'right-4' : 'left-4'} top-3.5 text-slate-300`}>
                    <LinkIcon size={20} />
                  </div>
                  <input
                    type="url"
                    required
                    className={`w-full ${editingLang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none text-sm font-medium`}
                    placeholder="https://... or paste URL"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
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
