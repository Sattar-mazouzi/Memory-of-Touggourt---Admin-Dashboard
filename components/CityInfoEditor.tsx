
import React, { useState, useEffect } from 'react';
import { 
  Save, Loader2, Image as ImageIcon, CheckCircle2, 
  History, Info, BookOpen, Globe, MapPin, CloudSun, Palette,
  Shirt, UtensilsCrossed, Music4, CalendarDays, Dices, Layers,
  Layout, Type, Users, ThermometerSun, Edit2, X, Link as LinkIcon,
  Languages, Upload
} from 'lucide-react';
import { AppLanguage, CityArticle, LocalizedText, HeritageData } from '../types';
import { translations } from '../translations';
import { db, doc, getDoc, setDoc, collection, getDocs } from '../services/firebaseService';

interface CityInfoEditorProps {
  currentLang: AppLanguage;
}

interface ImageEditState {
  isOpen: boolean;
  field: 'cover' | 'location' | 'gallery';
  subField?: string;
  url: string;
}

// Cloudinary Configuration - Updated with user credentials
// IMPORTANT: Ensure "touggourt_preset" is an UNSIGNED preset in your Cloudinary settings.
const CLOUD_NAME = "dheayouzu"; 
const UPLOAD_PRESET = "touggourt_preset"; 

const CityInfoEditor: React.FC<CityInfoEditorProps> = ({ currentLang }) => {
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);
  const t = translations[currentLang];
  const isRtl = editingLang === 'ar';

  const [article, setArticle] = useState<CityArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Modal State
  const [imageModal, setImageModal] = useState<ImageEditState>({
    isOpen: false,
    field: 'cover',
    url: ''
  });

  const articleId = 'touggourt_main'; 

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'aboutCity', articleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() } as CityArticle);
        } else {
          const colRef = collection(db, 'aboutCity');
          const querySnapshot = await getDocs(colRef);
          
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            setArticle({ id: firstDoc.id, ...firstDoc.data() } as CityArticle);
          } else {
            const emptyLoc: LocalizedText = { ar: '', en: '', fr: '' };
            const initialArticle: CityArticle = {
              id: articleId,
              name: { ar: 'توقرت', en: 'Touggourt', fr: 'Touggourt' },
              population: 611345,
              cover: 'https://raw.githubusercontent.com/Sattar-mazouzi/Touggourtmemoryimages/refs/heads/main/cover.jpg',
              location: 'https://raw.githubusercontent.com/Sattar-mazouzi/Touggourtmemoryimages/refs/heads/main/touggourt_location.png',
              bio: emptyLoc,
              extendedBio: emptyLoc,
              geography: emptyLoc,
              histBio: emptyLoc,
              extendedHistBio: emptyLoc,
              climate: emptyLoc,
              climateandTopography: emptyLoc,
              heritage: {
                industries: emptyLoc,
                clothing: emptyLoc,
                culinaryArts: emptyLoc,
                folklore: emptyLoc,
                festivals: emptyLoc,
                games: emptyLoc
              },
              gallery: {
                architecture: 'https://raw.githubusercontent.com/Sattar-mazouzi/Touggourtmemoryimages/refs/heads/main/architecture.jpg',
                camel: 'https://raw.githubusercontent.com/Sattar-mazouzi/Touggourtmemoryimages/refs/heads/main/camel.png',
                culture: 'https://raw.githubusercontent.com/Sattar-mazouzi/Touggourtmemoryimages/refs/heads/main/culture.jpg',
                dunes: 'https://raw.githubusercontent.com/Sattar-mazouzi/Touggourtmemoryimages/refs/heads/main/dunes.jpg',
                oasis: 'https://raw.githubusercontent.com/Sattar-mazouzi/Touggourtmemoryimages/refs/heads/main/oasis.jpg'
              }
            };
            setArticle(initialArticle);
          }
        }
      } catch (err) {
        console.error('Error fetching city article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, []);

  const handleSave = async () => {
    if (!article) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'aboutCity', article.id);
      await setDoc(docRef, {
        ...article,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving article:', err);
      alert('Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalized = (fieldPath: string, value: string) => {
    setArticle(prev => {
      if (!prev) return null;
      const next = { ...prev };
      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.');
        (next[parent as keyof CityArticle] as any)[child][editingLang] = value;
      } else {
        (next[fieldPath as keyof CityArticle] as any)[editingLang] = value;
      }
      return next;
    });
  };

  const handleCloudinaryUpload = () => {
    // @ts-ignore
    if (!window.cloudinary) {
      alert("Cloudinary script not loaded yet. Please refresh the page.");
      console.error("Cloudinary widget script (global/all.js) is missing from index.html");
      return;
    }

    try {
      // @ts-ignore
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUD_NAME,
          uploadPreset: UPLOAD_PRESET,
          multiple: false,
          resourceType: 'image',
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
          maxFileSize: 10000000, // 10MB
          showAdvancedOptions: false,
          cropping: false,
          sources: ['local', 'url', 'camera'],
          styles: {
            palette: {
              window: "#FFFFFF",
              windowBorder: "#90A0B3",
              tabIcon: "#F97316",
              menuIcons: "#5A616A",
              textDark: "#000000",
              textLight: "#FFFFFF",
              link: "#F97316",
              action: "#F97316",
              inactiveTabIcon: "#0E2F5A",
              error: "#F44235",
              inProgress: "#F97316",
              complete: "#20B832",
              sourceBg: "#E4EBF1"
            }
          }
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary Widget Execution Error:", error);
          }
          if (!error && result && result.event === "success") {
            const uploadedUrl = result.info.secure_url;
            console.log("Upload successful! New URL:", uploadedUrl);
            // Replace the URL in the modal preview immediately
            setImageModal(prev => ({ ...prev, url: uploadedUrl }));
          }
        }
      );
      widget.open();
    } catch (err) {
      console.error("Failed to initialize Cloudinary Widget:", err);
      alert("There was an error opening the upload tool. Please check your internet connection.");
    }
  };

  const handleUpdateImageUrl = () => {
    if (!article) return;
    const { field, subField, url } = imageModal;
    setArticle(prev => {
      if (!prev) return null;
      if (field === 'gallery' && subField) {
        return {
          ...prev,
          gallery: {
            ...prev.gallery,
            [subField]: url
          }
        };
      } else if (field === 'cover' || field === 'location') {
        return {
          ...prev,
          [field]: url
        };
      }
      return prev;
    });
    setImageModal(prev => ({ ...prev, isOpen: false }));
  };

  const SectionHeader = ({ icon, title, light = false }: { icon: any, title: string, light?: boolean }) => (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${light ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
          {icon}
        </div>
        <h4 className={`font-black tracking-tight text-lg ${light ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
      </div>
    </div>
  );

  const ImagePreview = ({ 
    src, 
    label, 
    onClick, 
    aspect = 'aspect-video' 
  }: { 
    src: string, 
    label: string, 
    onClick: () => void,
    aspect?: string 
  }) => (
    <div className={`relative ${aspect} rounded-[32px] overflow-hidden bg-slate-100 border border-slate-200 group`}>
      {src ? (
        <img src={src} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={label} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <ImageIcon size={40} />
        </div>
      )}
      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
        <button 
          onClick={onClick}
          className="flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-2xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all"
        >
          <Edit2 size={18} />
          <span className="text-xs uppercase tracking-widest">{t.save}</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-slate-400 font-medium">{t.loading}</p>
      </div>
    );
  }

  if (!article) return <div className="py-20 text-center text-slate-400">Not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Floating Control Hub */}
      <div className="sticky top-6 z-50 flex justify-center w-full mb-12">
        <div className="bg-white/80 backdrop-blur-2xl px-6 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 flex items-center gap-8 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 border-e border-slate-200 pe-6">
             <div className="p-2 bg-slate-900 text-white rounded-full">
                <Layout size={18} />
             </div>
             <div>
                <h3 className="text-sm font-black text-slate-800 leading-none mb-1">{t.editCityInfo}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Touggourt Memory</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-full border border-slate-200">
                <Languages size={14} className="text-slate-400 ml-2" />
                {(['en', 'ar', 'fr'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setEditingLang(l)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                      editingLang === l ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
             </div>

             <button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
                  success ? 'bg-green-500 text-white shadow-green-100' : 'bg-orange-500 text-white shadow-orange-100 hover:bg-orange-600'
                }`}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : success ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {success ? t.articleUpdated : t.save}
              </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <SectionHeader icon={<Type size={22} />} title="City Name" />
                   <input 
                      dir={isRtl ? 'rtl' : 'ltr'}
                      type="text"
                      className="w-full text-xl font-bold bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl p-4 transition-all text-slate-800"
                      value={article.name?.[editingLang] || ''}
                      onChange={e => updateLocalized('name', e.target.value)}
                    />
                </div>
                <div className="space-y-4">
                   <SectionHeader icon={<Users size={22} />} title="Population" />
                   <input 
                      type="number"
                      className="w-full text-xl font-bold bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl p-4 transition-all text-slate-800"
                      value={article.population || 0}
                      onChange={e => setArticle(prev => prev ? ({ ...prev, population: parseInt(e.target.value) || 0 }) : null)}
                    />
                </div>
             </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
             <SectionHeader icon={<Info size={22} />} title={t.mainBio} />
             <textarea 
                dir={isRtl ? 'rtl' : 'ltr'}
                rows={3}
                className="w-full text-lg bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-6 transition-all resize-none text-slate-800 leading-snug"
                value={article.bio?.[editingLang] || ''}
                onChange={e => updateLocalized('bio', e.target.value)}
              />
              
              <SectionHeader icon={<BookOpen size={22} />} title={t.extendedBio} />
              <textarea 
                dir={isRtl ? 'rtl' : 'ltr'}
                rows={5}
                className="w-full bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-6 transition-all resize-none text-slate-700 leading-relaxed"
                value={article.extendedBio?.[editingLang] || ''}
                onChange={e => updateLocalized('extendedBio', e.target.value)}
              />
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
            <div>
              <SectionHeader icon={<MapPin size={22} />} title={t.geography} />
              <textarea 
                dir={isRtl ? 'rtl' : 'ltr'}
                rows={4}
                className="w-full bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-6 transition-all resize-none text-slate-700"
                value={article.geography?.[editingLang] || ''}
                onChange={e => updateLocalized('geography', e.target.value)}
              />
            </div>
            
            <div className="border-t border-slate-50 pt-10">
              <SectionHeader icon={<History size={22} />} title={t.histBio} />
              <textarea 
                dir={isRtl ? 'rtl' : 'ltr'}
                rows={3}
                className="w-full font-bold bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-6 transition-all resize-none text-slate-800 mb-6"
                value={article.histBio?.[editingLang] || ''}
                onChange={e => updateLocalized('histBio', e.target.value)}
              />
              <SectionHeader icon={<BookOpen size={22} />} title={t.extendedHistBio} />
              <textarea 
                dir={isRtl ? 'rtl' : 'ltr'}
                rows={6}
                className="w-full bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-6 transition-all resize-none text-slate-700 leading-relaxed"
                value={article.extendedHistBio?.[editingLang] || ''}
                onChange={e => updateLocalized('extendedHistBio', e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
             <SectionHeader icon={<ThermometerSun size={22} />} title="Climate Summary" />
             <input 
               dir={isRtl ? 'rtl' : 'ltr'}
               type="text"
               className="w-full font-bold bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl p-4 transition-all text-slate-800 mb-4"
               value={article.climate?.[editingLang] || ''}
               onChange={e => updateLocalized('climate', e.target.value)}
             />
             <SectionHeader icon={<CloudSun size={22} />} title={t.climateAndTopography} />
             <textarea 
               dir={isRtl ? 'rtl' : 'ltr'}
               rows={5}
               className="w-full bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-6 transition-all resize-none text-slate-700"
               value={article.climateandTopography?.[editingLang] || ''}
               onChange={e => updateLocalized('climateandTopography', e.target.value)}
             />
          </div>

          <div className="bg-slate-900 p-10 rounded-[50px] space-y-8">
             <div className="flex items-center gap-3">
                <Palette className="text-orange-500" size={32} />
                <h3 className="text-3xl font-black text-white">{t.heritageTitle}</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'industries', label: t.heritageIndustries, icon: <Layers size={18} /> },
                  { id: 'clothing', label: t.heritageClothing, icon: <Shirt size={18} /> },
                  { id: 'culinaryArts', label: t.heritageCulinary, icon: <UtensilsCrossed size={18} /> },
                  { id: 'folklore', label: t.heritageFolklore, icon: <Music4 size={18} /> },
                  { id: 'festivals', label: t.heritageFestivals, icon: <CalendarDays size={18} /> },
                  { id: 'games', label: t.heritageGames, icon: <Dices size={18} /> },
                ].map(item => (
                  <div key={item.id} className="bg-white/5 backdrop-blur-md rounded-[32px] p-6 border border-white/10 group hover:bg-white/10 transition-all">
                     <SectionHeader icon={item.icon} title={item.label} light />
                     <textarea 
                        dir={isRtl ? 'rtl' : 'ltr'}
                        rows={6}
                        className="w-full bg-black/40 border-none focus:ring-2 ring-orange-500/50 rounded-2xl p-4 text-sm text-slate-200 resize-none leading-relaxed"
                        value={article.heritage?.[item.id as keyof HeritageData]?.[editingLang] || ''}
                        onChange={e => updateLocalized(`heritage.${item.id}`, e.target.value)}
                      />
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4">
           <div className="sticky top-32 z-10 space-y-8">
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
               <div className="space-y-4">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ImageIcon size={16} className="text-orange-500" /> {t.coverImage}
                 </label>
                 <ImagePreview 
                   src={article.cover} 
                   label="Cover" 
                   onClick={() => setImageModal({ isOpen: true, field: 'cover', url: article.cover })} 
                 />
               </div>

               <div className="space-y-4 border-t border-slate-50 pt-6">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <MapPin size={16} className="text-orange-500" /> {t.mapLocation}
                 </label>
                 <ImagePreview 
                   src={article.location} 
                   label="Map" 
                   aspect="aspect-[2/1]"
                   onClick={() => setImageModal({ isOpen: true, field: 'location', url: article.location })} 
                 />
               </div>
             </div>

             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Globe size={16} className="text-orange-500" /> {t.exploreGallery}
               </label>
               <div className="space-y-6">
                 {[
                   { id: 'architecture', label: "Architecture" },
                   { id: 'camel', label: "Camel" },
                   { id: 'culture', label: "Culture" },
                   { id: 'dunes', label: "Dunes" },
                   { id: 'oasis', label: "Oasis" }
                 ].map(img => (
                   <div key={img.id} className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{img.label}</p>
                     <ImagePreview 
                        src={article.gallery[img.id as keyof typeof article.gallery]} 
                        label={img.label} 
                        aspect="h-24"
                        onClick={() => setImageModal({ 
                          isOpen: true, 
                          field: 'gallery', 
                          subField: img.id, 
                          url: article.gallery[img.id as keyof typeof article.gallery] 
                        })} 
                     />
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Image URL & Upload Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                       <ImageIcon size={22} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">{t.updateEntry}</h3>
                 </div>
                 <button onClick={() => setImageModal(prev => ({ ...prev, isOpen: false }))} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-400" />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="aspect-video rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group relative">
                    {imageModal.url ? (
                      <img src={imageModal.url} className="w-full h-full object-cover" alt="Preview" onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon size={64} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={handleCloudinaryUpload}
                          className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                        >
                          <Upload size={18} /> {t.uploadImage}
                        </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    <button 
                       onClick={handleCloudinaryUpload}
                       className="w-full py-4 bg-orange-100 text-orange-600 font-black rounded-2xl hover:bg-orange-200 transition-all flex items-center justify-center gap-2"
                    >
                       <Upload size={20} />
                       {t.uploadImage}
                    </button>

                    <div className="relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-2">
                           {t.assetUrl}
                        </label>
                        <div className="flex items-center gap-2 bg-slate-50 border-none focus-within:ring-2 ring-orange-100 rounded-2xl p-4 transition-all shadow-sm">
                           <LinkIcon size={18} className="text-slate-300" />
                           <input 
                              type="url"
                              className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 transition-all"
                              placeholder="Or paste direct URL..."
                              value={imageModal.url}
                              onChange={e => setImageModal(prev => ({ ...prev, url: e.target.value }))}
                           />
                        </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                 <button 
                   onClick={() => setImageModal(prev => ({ ...prev, isOpen: false }))}
                   className="flex-1 py-4 bg-white text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all border border-slate-200"
                 >
                   {t.cancel}
                 </button>
                 <button 
                   onClick={handleUpdateImageUrl}
                   className="flex-[2] py-4 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   {t.save}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CityInfoEditor;
