
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Link as LinkIcon, Loader2, Youtube, Save } from 'lucide-react';
import { GalleryItem, LocalizedText, AppLanguage } from '../types';
import { translations } from '../translations';
import { uploadImage } from '../services/cloudinaryService';

interface GalleryFormProps {
  item?: GalleryItem;
  currentLang: AppLanguage;
  onSave: (data: Partial<GalleryItem>) => void;
  onClose: () => void;
}

const GalleryForm: React.FC<GalleryFormProps> = ({ item, currentLang, onSave, onClose }) => {
  const t = translations[currentLang];
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);
  const isFormRtl = editingLang === 'ar';
  
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<GalleryItem>>(() => {
    const defaults = {
      title: { ar: '', en: '', fr: '' },
      description: { ar: '', en: '', fr: '' },
      images: {
        img1: '',
        img2: '',
        img3: '',
        img4: '',
        img5: ''
      },
      videos: {
        video1: '',
        video2: '',
        video3: ''
      }
    };
    return item ? { ...defaults, ...item } : defaults;
  });

  const updateLocalized = (field: 'title' | 'description', value: string) => {
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

    try {
      const url = await uploadImage(file);
      setFormData(prev => ({
        ...prev,
        images: {
          ...(prev.images as any),
          [uploadingField]: url
        }
      }));
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setUploadingField(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateImageUrl = (field: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      images: { ...(prev.images as any), [field]: url }
    }));
  };

  const updateVideoUrl = (field: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      videos: { ...(prev.videos as any), [field]: url }
    }));
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={translations[currentLang] === translations.ar ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {item ? t.editAsset : t.newGalleryItem}
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
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.galleryTitle} ({editingLang.toUpperCase()})</label>
            <input
              type="text"
              required
              dir={isFormRtl ? 'rtl' : 'ltr'}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none"
              value={formData.title?.[editingLang] || ''}
              onChange={e => updateLocalized('title', e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.galleryDesc} ({editingLang.toUpperCase()})</label>
            <textarea
              required
              rows={4}
              dir={isFormRtl ? 'rtl' : 'ltr'}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none resize-none"
              value={formData.description?.[editingLang] || ''}
              onChange={e => updateLocalized('description', e.target.value)}
            />
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-50">
            <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="text-orange-500" size={20} />
              {t.galleryImages}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['img1', 'img2', 'img3', 'img4', 'img5'].map((key) => (
                <div key={key} className="space-y-2">
                  <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative group">
                    {formData.images?.[key as keyof typeof formData.images] ? (
                      <img src={formData.images[key as keyof typeof formData.images]} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={24} /></div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <button type="button" onClick={() => { setUploadingField(key); fileInputRef.current?.click(); }} className="w-full py-1.5 bg-white text-orange-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        {uploadingField === key ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />} {t.uploadImage}
                      </button>
                    </div>
                  </div>
                  <input 
                    type="url" 
                    placeholder="URL..." 
                    className="w-full px-2 py-1 text-[8px] bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-1 ring-orange-200" 
                    value={formData.images?.[key as keyof typeof formData.images] || ''} 
                    onChange={e => updateImageUrl(key, e.target.value)} 
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-50">
            <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Youtube className="text-red-500" size={20} />
              {t.galleryVideos}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['video1', 'video2', 'video3'].map((key) => {
                const videoId = getYoutubeId(formData.videos?.[key as keyof typeof formData.videos] || '');
                return (
                  <div key={key} className="space-y-3">
                    <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-100">
                      {videoId ? (
                        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen></iframe>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Youtube size={32} opacity={0.2} /></div>
                      )}
                    </div>
                    <input 
                      type="url" 
                      placeholder="YouTube URL..." 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-1 ring-orange-200" 
                      value={formData.videos?.[key as keyof typeof formData.videos] || ''} 
                      onChange={e => updateVideoUrl(key, e.target.value)} 
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex gap-4 sticky bottom-0 bg-white pb-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors">{t.cancel}</button>
            <button type="submit" className="flex-[2] py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2"><Save size={20} /> {t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GalleryForm;
