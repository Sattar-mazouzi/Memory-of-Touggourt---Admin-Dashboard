
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Star, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Place, LocalizedText, AppLanguage, PlaceImages, normalizeCategoryKey, CategoryMap } from '../types';
import { translations } from '../translations';
import { uploadImage } from '../services/cloudinaryService';

interface PlaceFormProps {
  place?: Place;
  currentLang: AppLanguage;
  categories: CategoryMap;
  onSave: (place: Partial<Place>) => void;
  onClose: () => void;
}

const PlaceForm: React.FC<PlaceFormProps> = ({ place, currentLang, categories, onSave, onClose }) => {
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);
  const t = translations[currentLang];
  const isFormRtl = editingLang === 'ar';
  const [uploadingField, setUploadingField] = useState<keyof PlaceImages | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Place>>(() => {
    const defaultCatKey = Object.keys(categories)[0] || 'culture';
    const defaults = {
      name: { ar: '', en: '', fr: '' },
      address: { ar: '', en: '', fr: '' },
      category: defaultCatKey,
      description: { ar: '', en: '', fr: '' },
      imageUrl: {
        cover: '',
        img1: '',
        img2: '',
        img3: '',
        img4: '',
        img5: ''
      },
      featured: false,
      rating: 4.5,
      location: { latitude: 33.1092, longitude: 6.0332 }
    };

    if (!place) return defaults;

    return {
      ...defaults,
      ...place,
      imageUrl: {
        ...defaults.imageUrl,
        ...(typeof place.imageUrl === 'object' ? place.imageUrl : { cover: place.imageUrl as unknown as string })
      },
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
    if (!file || !uploadingField) return;

    const currentField = uploadingField;
    setUploadingField(currentField); 
    
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({
        ...prev,
        imageUrl: {
          ...(prev.imageUrl as PlaceImages),
          [currentField]: url
        }
      }));
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setUploadingField(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (field: keyof PlaceImages) => {
    setUploadingField(field);
    fileInputRef.current?.click();
  };

  const updateImageUrlManually = (field: keyof PlaceImages, url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: {
        ...(prev.imageUrl as PlaceImages),
        [field]: url
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const imageSlots: { key: keyof PlaceImages; label: string }[] = [
    { key: 'cover', label: t.coverImage },
    { key: 'img1', label: `${t.image} 1` },
    { key: 'img2', label: `${t.image} 2` },
    { key: 'img3', label: `${t.image} 3` },
    { key: 'img4', label: `${t.image} 4` },
    { key: 'img5', label: `${t.image} 5` },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={translations[currentLang] === translations.ar ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
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

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
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
                {Object.entries(categories).map(([key, labels]) => (
                  <option key={key} value={key}>
                    {labels[currentLang] || key}
                  </option>
                ))}
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

          <div className="space-y-2">
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

          <div className="space-y-6 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="text-orange-500" size={20} />
                {t.managePlaces} - {t.exploreGallery}
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {imageSlots.map((slot) => (
                <div key={slot.key} className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{slot.label}</p>
                  <div className={`relative ${slot.key === 'cover' ? 'aspect-video' : 'aspect-square'} rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 group shadow-sm`}>
                    {formData.imageUrl?.[slot.key] ? (
                      <img 
                        src={formData.imageUrl[slot.key]} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={slot.label} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon size={slot.key === 'cover' ? 40 : 24} />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm p-4">
                      <button 
                        type="button" 
                        onClick={() => triggerUpload(slot.key)}
                        disabled={!!uploadingField}
                        className="w-full py-2 bg-white text-orange-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                      >
                        {uploadingField === slot.key ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                        {uploadingField === slot.key ? t.uploading : t.uploadImage}
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative group/input">
                    <div className={`absolute ${isFormRtl ? 'right-3' : 'left-3'} top-2.5 text-slate-300`}>
                      <LinkIcon size={14} />
                    </div>
                    <input 
                      type="url"
                      className={`w-full ${isFormRtl ? 'pr-9 pl-2' : 'pl-9 pr-2'} py-2 bg-slate-50 border border-transparent focus:border-orange-100 rounded-xl outline-none text-[10px] text-slate-500 font-medium`}
                      placeholder="Paste URL..."
                      value={formData.imageUrl?.[slot.key] || ''}
                      onChange={e => updateImageUrlManually(slot.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 border-t border-slate-50 pt-8">
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