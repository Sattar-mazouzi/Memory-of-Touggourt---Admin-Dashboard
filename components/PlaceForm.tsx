
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Star, Upload, Link as LinkIcon, Loader2, Youtube, View, Hash, MapPin } from 'lucide-react';
import { Place, LocalizedText, AppLanguage, PlaceImages, PlaceVideoUrls, normalizeCategoryKey, CategoryMap } from '../types';
import { translations } from '../translations';
import { uploadImage, deleteImage } from '../services/cloudinaryService';

interface PlaceFormProps {
  place?: Place;
  currentLang: AppLanguage;
  categories: CategoryMap;
  onSave: (place: Partial<Place>) => void;
  onClose: () => void;
}

const TOUGGOURT_CITIES = [
  { id: 'benaceur', en: 'Benaceur', fr: 'Benaceur', ar: 'بن ناصر' },
  { id: 'blidet_amor', en: 'Blidet Amor', fr: 'Blidet Amor', ar: 'بلدة عمر' },
  { id: 'el_allia', en: 'El Allia', fr: 'El Allia', ar: 'العالية' },
  { id: 'el_hadjira', en: 'El Hadjira', fr: 'El Hadjira', ar: 'الحجيرة' },
  { id: 'megarine', en: 'Megarine', fr: 'Megarine', ar: 'مقارين' },
  { id: 'mnaguer', en: "M'Naguer", fr: "M'Naguer", ar: 'المنقر' },
  { id: 'nezla', en: 'Nezla', fr: 'Nezla', ar: 'النزلة' },
  { id: 'sidi_slimane', en: 'Sidi Slimane', fr: 'Sidi Slimane', ar: 'سيدي سليمان' },
  { id: 'taibet', en: 'Taibet', fr: 'Taibet', ar: 'الطيبات' },
  { id: 'temacine', en: 'Temacine', fr: 'Temacine', ar: 'تماسين' },
  { id: 'tebesbest', en: 'Tebesbest', fr: 'Tebesbest', ar: 'تبسبست' },
  { id: 'touggourt', en: 'Touggourt', fr: 'Touggourt', ar: 'تقرت' },
  { id: 'zaouia_el_abidia', en: 'Zaouia El Abidia', fr: 'Zaouia El Abidia', ar: 'الزاوية العابدية' }
];

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  religion: 'https://res.cloudinary.com/djgn1nqtk/image/upload/v1770756272/m6ypu0sh0hyhklyfondv.png',
  culture: 'https://res.cloudinary.com/djgn1nqtk/image/upload/v1770756967/fkx5otehqqyiqzdwo90r.png',
  nature: 'https://res.cloudinary.com/djgn1nqtk/image/upload/v1770758076/etgxnrgxbt4snnwxzryh.png'
};

const PlaceForm: React.FC<PlaceFormProps> = ({ place, currentLang, categories, onSave, onClose }) => {
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);
  const t = translations[currentLang];
  const isFormRtl = editingLang === 'ar';
  const [uploadingField, setUploadingField] = useState<keyof PlaceImages | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Place>>(() => {
    const defaultCatKey = Object.keys(categories)[0] || 'culture';
    const defaults = {
      order: 1,
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
        img5: '',
        '3d_img': ''
      },
      videoUrls: {
        video1: '',
        video2: '',
        video3: ''
      },
      featured: false,
      rating: 4.5,
      ratingCount: 0,
      favoritesCount: 0,
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
      videoUrls: {
        ...defaults.videoUrls,
        ...place.videoUrls
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
    // Capture the previous image URL for this specific slot to clean it up after a successful upload
    const oldUrl = formData.imageUrl?.[currentField];
    setUploadingField(currentField); 
    
    try {
      const url = await uploadImage(file);
      // If there was an existing image in this slot, delete it from Cloudinary
      if (oldUrl && typeof oldUrl === 'string') {
        deleteImage(oldUrl);
      }
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

  const updateVideoUrl = (field: keyof PlaceVideoUrls, url: string) => {
    setFormData(prev => ({
      ...prev,
      videoUrls: {
        ...(prev.videoUrls as PlaceVideoUrls),
        [field]: url
      }
    }));
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalData = { ...formData };
    
    // 1. Handle default cover photo if empty based on category
    if (!finalData.imageUrl?.cover && finalData.category) {
      const catKey = finalData.category.toLowerCase();
      const defaultImg = DEFAULT_CATEGORY_IMAGES[catKey];
      if (defaultImg) {
        finalData.imageUrl = {
          ...(finalData.imageUrl as PlaceImages),
          cover: defaultImg
        };
      }
    }
    
    // 2. Handle optional description with "no description available" fallback
    const langs: AppLanguage[] = ['ar', 'en', 'fr'];
    const desc = { ...(finalData.description as LocalizedText) };
    
    langs.forEach(l => {
      if (!desc[l] || desc[l].trim() === '') {
        desc[l] = translations[l].noDescriptionAvailable;
      }
    });
    
    finalData.description = desc;
    
    onSave(finalData);
  };

  const imageSlots: { key: keyof PlaceImages; label: string; icon?: any }[] = [
    { key: 'cover', label: t.coverImage },
    { key: 'img1', label: `${t.image} 1` },
    { key: 'img2', label: `${t.image} 2` },
    { key: 'img3', label: `${t.image} 3` },
    { key: 'img4', label: `${t.image} 4` },
    { key: 'img5', label: `${t.image} 5` },
    { key: '3d_img', label: t.threeDImage, icon: View },
  ];

  const videoSlots: { key: keyof PlaceVideoUrls; label: string }[] = [
    { key: 'video1', label: `${t.videoSlot} 1` },
    { key: 'video2', label: `${t.videoSlot} 2` },
    { key: 'video3', label: `${t.videoSlot} 3` },
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {t.name} ({editingLang.toUpperCase()})
              </label>
              <input
                type="text"
                required
                dir={isFormRtl ? 'rtl' : 'ltr'}
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                placeholder={editingLang === 'ar' ? 'مثلاً: المسجد العتيق' : 'e.g. Ancient Mosque'}
                value={formData.name?.[editingLang] || ''}
                onChange={e => updateLocalized('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.placeOrder}</label>
              <div className="relative group/order">
                <Hash className={`absolute ${isFormRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/order:text-orange-500 transition-colors`} size={18} />
                <input
                  type="number"
                  required
                  min="1"
                  className={`w-full ${isFormRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none font-black text-slate-700`}
                  value={formData.order ?? ''}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.category}</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none appearance-none font-bold"
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.rating} (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none font-bold"
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
              {t.address}
            </label>
            <div className="relative group/address">
              <MapPin className={`absolute ${isFormRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/address:text-orange-500 transition-colors`} size={18} />
              <select
                required
                className={`w-full ${isFormRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-700 appearance-none`}
                value={TOUGGOURT_CITIES.find(c => c.en === formData.address?.en)?.en || ''}
                onChange={e => {
                  const selected = TOUGGOURT_CITIES.find(c => c.en === e.target.value);
                  if (selected) {
                    setFormData(prev => ({
                      ...prev,
                      address: {
                        en: selected.en,
                        fr: selected.fr,
                        ar: selected.ar
                      }
                    }));
                  }
                }}
              >
                <option value="" disabled>{editingLang === 'ar' ? 'اختر المدينة/القرية...' : 'Select City/Village...'}</option>
                {TOUGGOURT_CITIES.map(city => (
                  <option key={city.id} value={city.en}>
                    {editingLang === 'ar' ? city.ar : city.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.latitude}</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none font-bold"
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
                className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                value={formData.location?.longitude ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, location: { ...formData.location!, longitude: val } });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t.description} ({editingLang.toUpperCase()})
            </label>
            <textarea
              rows={4}
              dir={isFormRtl ? 'rtl' : 'ltr'}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none resize-none font-medium text-slate-700"
              placeholder={editingLang === 'ar' ? 'اختياري...' : 'Optional...'}
              value={formData.description?.[editingLang] || ''}
              onChange={e => updateLocalized('description', e.target.value)}
            />
          </div>

          {/* Image Gallery Section */}
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    {slot.icon && <slot.icon size={10} className="text-orange-500" />}
                    {slot.label}
                  </p>
                  <div className={`relative ${slot.key === 'cover' ? 'aspect-video' : 'aspect-square'} rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 group shadow-sm`}>
                    {formData.imageUrl?.[slot.key] ? (
                      <img 
                        src={formData.imageUrl[slot.key]} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={slot.label} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        {slot.icon ? <slot.icon size={slot.key === 'cover' ? 40 : 24} /> : <ImageIcon size={slot.key === 'cover' ? 40 : 24} />}
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

          {/* YouTube Video Section */}
          <div className="space-y-6 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Youtube className="text-red-500" size={20} />
                {t.youtubeVideo}
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {videoSlots.map((slot) => {
                const videoId = getYoutubeId(formData.videoUrls?.[slot.key] || '');
                return (
                  <div key={slot.key} className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{slot.label}</p>
                    
                    {/* Video Preview Container */}
                    <div className="aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative group">
                      {videoId ? (
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={slot.label}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                          <Youtube size={32} className="mb-2 opacity-20" />
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{t.videoPreview}</p>
                        </div>
                      )}
                    </div>

                    <div className="relative group/input">
                      <div className={`absolute ${isFormRtl ? 'right-3' : 'left-3'} top-2.5 text-slate-300`}>
                        <LinkIcon size={14} />
                      </div>
                      <input 
                        type="url"
                        className={`w-full ${isFormRtl ? 'pr-9 pl-2' : 'pl-9 pr-2'} py-2 bg-slate-50 border border-transparent focus:border-orange-100 rounded-xl outline-none text-[10px] text-slate-500 font-medium`}
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.videoUrls?.[slot.key] || ''}
                        onChange={e => updateVideoUrl(slot.key, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
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
