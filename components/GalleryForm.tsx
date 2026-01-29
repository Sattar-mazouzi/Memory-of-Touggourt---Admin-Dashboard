
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Link as LinkIcon, Loader2, Youtube, Type } from 'lucide-react';
// Fix: Removed GalleryItemImages and GalleryItemVideos from import list as they are not defined in types.ts
import { GalleryItem, LocalizedText, AppLanguage } from '../types';
import { translations } from '../translations';
import { uploadImage } from '../services/cloudinaryService';

// Defining internal interface for better type checking in the form
interface GalleryItemImages {
  img1: string;
  img2: string;
  img3: string;
  img4: string;
  img5: string;
}

interface GalleryItemVideos {
  video1: string;
  video2: string;
  video3: string;
}

interface GalleryFormProps {
  item?: GalleryItem;
  currentLang: AppLanguage;
  onSave: (item: Partial<GalleryItem>) => void;
  onClose: () => void;
}

const GalleryForm: React.FC<GalleryFormProps> = ({ item, currentLang, onSave, onClose }) => {
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);
  const t = translations[currentLang];
  const isFormRtl = editingLang === 'ar';
  const [uploadingField, setUploadingField] = useState<keyof GalleryItemImages | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<GalleryItem>>(() => {
    const defaults = {
      title: { ar: '', en: '', fr: '' },
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

    if (!item) return defaults;
    return { ...defaults, ...item };
  });

  const updateLocalizedTitle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: {
        ...(prev.title as LocalizedText),
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
        images: {
          ...(prev.images as GalleryItemImages),
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

  const triggerUpload = (field: keyof GalleryItemImages) => {
    setUploadingField(field);
    fileInputRef.current?.click();
  };

  const updateImageUrlManually = (field: keyof GalleryItemImages, url: string) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...(prev.images as GalleryItemImages),
        [field]: url
      }
    }));
  };

  const updateVideoUrl = (field: keyof GalleryItemVideos, url: string) => {
    setFormData(prev => ({
      ...prev,
      videos: {
        ...(prev.videos as GalleryItemVideos),
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
    onSave(formData);
  };

  const imageSlots: { key: keyof GalleryItemImages; label: string }[] = [
    { key: 'img1', label: `${t.image} 1` },
    { key: 'img2', label: `${t.image} 2` },
    { key: 'img3', label: `${t.image} 3` },
    { key: 'img4', label: `${t.image} 4` },
    { key: 'img5', label: `${t.image} 5` },
  ];

  const videoSlots: { key: keyof GalleryItemVideos; label: string }[] = [
    { key: 'video1', label: `${t.videoSlot} 1` },
    { key: 'video2', label: `${t.videoSlot} 2` },
    { key: 'video3', label: `${t.videoSlot} 3` },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={translations[currentLang] === translations.ar ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
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
            <div className="flex items-center gap-2 mb-2">
               <Type className="text-orange-500" size={18} />
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {t.cityTitle} ({editingLang.toUpperCase()})
               </label>
            </div>
            <input
              type="text"
              required
              dir={isFormRtl ? 'rtl' : 'ltr'}
              className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none text-lg font-bold text-slate-800"
              placeholder={editingLang === 'ar' ? 'أدخل عنوان المعرض هنا...' : 'Enter gallery title...'}
              value={formData.title?.[editingLang] || ''}
              onChange={e => updateLocalizedTitle(e.target.value)}
            />
          </div>

          {/* Image Gallery Section */}
          <div className="space-y-6 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="text-orange-500" size={20} />
                {t.exploreGallery}
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {imageSlots.map((slot) => (
                <div key={slot.key} className="space-y-3">
                  <div className={`relative aspect-square rounded-[24px] overflow-hidden bg-slate-50 border border-slate-200 group shadow-sm`}>
                    {formData.images?.[slot.key] ? (
                      <img 
                        src={formData.images[slot.key]} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={slot.label} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm p-4">
                      <button 
                        type="button" 
                        onClick={() => triggerUpload(slot.key)}
                        disabled={!!uploadingField}
                        className="w-full py-1.5 bg-white text-orange-600 rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
                      >
                        {uploadingField === slot.key ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                        {uploadingField === slot.key ? '' : t.uploadImage}
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative group/input">
                    <input 
                      type="url"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-transparent focus:border-orange-100 rounded-lg outline-none text-[8px] text-slate-500 font-medium truncate"
                      placeholder="URL..."
                      value={formData.images?.[slot.key] || ''}
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
                const videoId = getYoutubeId(formData.videos?.[slot.key] || '');
                return (
                  <div key={slot.key} className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{slot.label}</p>
                    
                    <div className="aspect-video rounded-[24px] overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative group">
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
                        className={`w-full ${isFormRtl ? 'pr-9 pl-2' : 'pl-9 pr-2'} py-2.5 bg-slate-50 border border-transparent focus:border-orange-100 rounded-xl outline-none text-[10px] text-slate-500 font-medium`}
                        placeholder="YouTube URL..."
                        value={formData.videos?.[slot.key] || ''}
                        onChange={e => updateVideoUrl(slot.key, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
              {item ? t.updateEntry : t.saveNewEntry}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GalleryForm;
