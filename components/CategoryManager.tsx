
import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  Loader2, 
  Globe, 
  Tag, 
  AlertCircle,
  Map as MapIcon,
  Upload,
  Link as LinkIcon,
  Maximize2
} from 'lucide-react';
import { AppLanguage, CategoryMap, LocalizedText, normalizeCategoryKey } from '../types';
import { translations } from '../translations';
import { db, doc, setDoc, onSnapshot, updateDoc } from '../services/firebaseService';
import { uploadImage } from '../services/cloudinaryService';
import ConfirmModal from './ConfirmModal';

interface CategoryManagerProps {
  currentLang: AppLanguage;
  categories: CategoryMap;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ currentLang, categories }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState<LocalizedText>({ ar: '', en: '', fr: '' });
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);

  // GIS State
  const [gisMaps, setGisMaps] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion Modal State
  const [keyToConfirmDelete, setKeyToConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "appConfig", "gisMaps"), (snapshot) => {
      if (snapshot.exists()) {
        setGisMaps(snapshot.data());
      }
    });
    return () => unsub();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = newKey.trim().toLowerCase();
    
    if (!key || categories[key]) {
      setError(t.keyError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedCategories = {
        ...categories,
        [key]: newName
      };

      await setDoc(doc(db, "appConfig", "categories"), updatedCategories);
      
      // Reset form
      setNewKey('');
      setNewName({ ar: '', en: '', fr: '' });
      setIsAdding(false);
    } catch (err: any) {
      console.error("Failed to save category:", err);
      setError(err.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setKeyToConfirmDelete(key);
  };

  const executeDeleteCategory = async () => {
    if (!keyToConfirmDelete) return;

    setDeletingKey(keyToConfirmDelete);
    try {
      const updatedCategories = { ...categories };
      delete updatedCategories[keyToConfirmDelete];

      await setDoc(doc(db, "appConfig", "categories"), updatedCategories);
      setKeyToConfirmDelete(null);
    } catch (err: any) {
      console.error("Failed to delete category:", err);
      alert(err.message || "Failed to delete category.");
    } finally {
      setDeletingKey(null);
    }
  };

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingField) return;

    const fieldKey = uploadingField;
    setUploadingField(fieldKey);

    try {
      const url = await uploadImage(file);
      await updateDoc(doc(db, "appConfig", "gisMaps"), {
        [fieldKey]: url
      });
    } catch (err: any) {
      alert(`Map Upload Failed: ${err.message}`);
    } finally {
      setUploadingField(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateLocalizedName = (val: string) => {
    setNewName(prev => ({ ...prev, [editingLang]: val }));
  };

  const categoryKeys = Object.keys(categories);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png,image/jpeg" 
        onChange={handleMapUpload} 
      />

      {/* 1. GIS Main Map Settings Section */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-orange-500 rounded-3xl shadow-lg shadow-orange-500/20">
                  <MapIcon size={32} />
               </div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">{t.mainMapSettings}</h3>
                  <p className="text-slate-400 text-sm font-medium">{t.mainMapDesc}</p>
               </div>
            </div>

            <div className="space-y-4 max-w-xl">
               <div className="relative group">
                  <LinkIcon className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-500`} size={20} />
                  <input 
                    type="url"
                    placeholder={t.mapUrlPlaceholder}
                    className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 ring-orange-500/50 font-bold transition-all text-sm`}
                    value={gisMaps.mainMap || ''}
                    onChange={async (e) => {
                      const url = e.target.value;
                      await updateDoc(doc(db, "appConfig", "gisMaps"), { mainMap: url });
                    }}
                  />
               </div>
               <button 
                 onClick={() => { setUploadingField('mainMap'); fileInputRef.current?.click(); }}
                 disabled={uploadingField === 'mainMap'}
                 className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
               >
                 {uploadingField === 'mainMap' ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                 {t.uploadMap}
               </button>
            </div>
          </div>

          <div className="w-full lg:w-96 aspect-video bg-white/5 rounded-[32px] border border-white/10 overflow-hidden group relative">
             {gisMaps.mainMap ? (
               <img src={gisMaps.mainMap} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Main City Map" />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                  <MapIcon size={48} className="mb-2 opacity-20" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.mapPreview}</span>
               </div>
             )}
             {gisMaps.mainMap && (
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a href={gisMaps.mainMap} target="_blank" rel="noreferrer" className="p-3 bg-white text-slate-900 rounded-full shadow-2xl">
                    <Maximize2 size={24} />
                  </a>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* 2. Category List Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <Layers size={28} />
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.manageCategories}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.categoryDesc}</p>
           </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <Plus size={20} /> {t.newCategory}
        </button>
      </div>

      {/* 3. Categories Grid with GIS Integration */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {categoryKeys.map((key) => {
          const catMapUrl = gisMaps[key] || '';
          return (
            <div key={key} className={`bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden group hover:border-orange-200 transition-all ${deletingKey === key ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex flex-col md:flex-row">
                 {/* Metadata Side */}
                 <div className="flex-1 p-8 space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          {deletingKey === key ? <Loader2 size={24} className="animate-spin" /> : <Tag size={24} />}
                       </div>
                       <button 
                          type="button"
                          onClick={(e) => handleOpenDeleteConfirm(e, key)}
                          disabled={deletingKey !== null}
                          className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-30"
                        >
                          <Trash2 size={20} />
                       </button>
                    </div>

                    <div>
                       <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 w-fit mb-2">
                          ID: {key}
                       </div>
                       <h4 className="text-2xl font-black text-slate-800">{categories[key][currentLang] || key}</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                       {(['ar', 'en', 'fr'] as const).map(lang => (
                         <div key={lang} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[8px] font-black text-slate-300 uppercase mb-1">{lang}</p>
                            <p className="text-[10px] font-black text-slate-700 truncate">{categories[key][lang]}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* GIS Map Side */}
                 <div className="w-full md:w-80 bg-slate-50 border-s border-slate-100 p-8 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                       <MapIcon size={16} className="text-orange-500" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.categoryMap}</span>
                    </div>

                    <div className="aspect-square bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden relative group/map">
                       {catMapUrl ? (
                         <img src={catMapUrl} className="w-full h-full object-cover group-hover/map:scale-110 transition-transform duration-500" alt={`${key} GIS Map`} />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <MapIcon size={32} className="opacity-20" />
                         </div>
                       )}
                       
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/map:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button 
                            onClick={() => { setUploadingField(key); fileInputRef.current?.click(); }}
                            disabled={uploadingField === key}
                            className="p-3 bg-white text-orange-600 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all"
                          >
                             {uploadingField === key ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                          </button>
                       </div>
                    </div>

                    <div className="relative">
                       <input 
                         type="url"
                         placeholder="Direct image URL..."
                         className="w-full pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 outline-none focus:ring-1 ring-orange-200 transition-all"
                         value={catMapUrl}
                         onChange={async (e) => {
                           const url = e.target.value;
                           await updateDoc(doc(db, "appConfig", "gisMaps"), { [key]: url });
                         }}
                       />
                       <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
        
        {categoryKeys.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Layers size={40} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">{t.noRecords}</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!keyToConfirmDelete}
        onClose={() => setKeyToConfirmDelete(null)}
        onConfirm={executeDeleteCategory}
        isLoading={deletingKey !== null}
        title={isRtl ? 'حذف التصنيف' : 'Delete Category'}
        message={isRtl ? `هل أنت متأكد من رغبتك في حذف هذا التصنيف؟ سيؤدي ذلك إلى إزالته من جميع الأماكن المرتبطة.` : `Are you sure you want to delete this category? This will affect how places associated with it are displayed.`}
        currentLang={currentLang}
      />

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-inner">
                  <Plus size={22} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{t.newCategory}</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-10 space-y-8">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-bold border border-red-100 animate-in shake-1">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.categoryKey}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. museums"
                  className="w-full px-5 py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none text-slate-700 font-bold transition-all"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.categoryName}</label>
                  <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
                    {(['en', 'ar', 'fr'] as const).map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setEditingLang(l)}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                          editingLang === l ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                   <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-slate-300 group-focus-within:text-orange-500 transition-colors`}>
                      <Globe size={20} />
                   </div>
                   <input
                      type="text"
                      required
                      dir={editingLang === 'ar' ? 'rtl' : 'ltr'}
                      placeholder={`${t.categoryName} (${editingLang.toUpperCase()})`}
                      className={`w-full ${editingLang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none text-slate-700 font-bold transition-all`}
                      value={newName[editingLang]}
                      onChange={e => updateLocalizedName(e.target.value)}
                    />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> {t.save}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
