import React, { useState, useEffect, useMemo } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  PlayCircle, 
  X,
  Layers,
  Video,
  ExternalLink,
  LayoutGrid,
  Info
} from 'lucide-react';
import { GalleryItem, AppLanguage } from '../types';
import { translations } from '../translations';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  addDoc, 
  updateDoc,
  serverTimestamp
} from '../services/firebaseService';
import GalleryForm from './GalleryForm';
import ConfirmModal from './ConfirmModal';

interface GalleryManagerProps {
  currentLang: AppLanguage;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | undefined>(undefined);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[];
      setItems(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveItem = async (data: Partial<GalleryItem>) => {
    try {
      if (editingItem?.id) {
        await updateDoc(doc(db, "gallery", editingItem.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "gallery"), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const executeDeleteItem = async () => {
    if (!idToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "gallery", idToDelete));
      setIdToDelete(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      // Safely handle localized fields for search filtering by ensuring values are strings
      const titleMatch = Object.values(item.title || {}).some(v => typeof v === 'string' && (v as string).toLowerCase().includes(q));
      const descMatch = Object.values(item.description || {}).some(v => typeof v === 'string' && (v as string).toLowerCase().includes(q));
      return titleMatch || descMatch;
    });
  }, [items, searchQuery]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 shadow-sm gap-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-inner">
             <ImageIcon size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-0.5">
              {t.manageGallery}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {items.length} {t.totalGalleryItems}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl relative group">
          <Search className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors`} size={20} />
          <input 
            type="text" 
            placeholder={isRtl ? 'البحث في المعرض...' : 'Search gallery items...'}
            className={`w-full ${isRtl ? 'pr-14 pl-12' : 'pl-14 pr-12'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none transition-all`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          onClick={() => { setEditingItem(undefined); setIsFormOpen(true); }} 
          className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <Plus size={20} /> {t.newGalleryItem}
        </button>
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => {
            const displayTitle = item.title?.[currentLang] || item.title?.en || item.title?.fr || 'No Title';
            const displayDesc = item.description?.[currentLang] || item.description?.en || item.description?.fr || '';
            const coverImg = item.images?.img1 || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800';
            
            // Count media types
            const imgCount = Object.values(item.images || {}).filter(v => v).length;
            const videoCount = Object.values(item.videos || {}).filter(v => v).length;

            return (
              <div key={item.id} className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={coverImg} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={displayTitle}
                  />
                  
                  {/* Glass Badges */}
                  <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} flex flex-col gap-2`}>
                    <div className="bg-white/30 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/20">
                      <ImageIcon size={12} /> {imgCount} Photos
                    </div>
                    {videoCount > 0 && (
                      <div className="bg-red-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/20">
                        <Video size={12} /> {videoCount} Videos
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className={`absolute bottom-4 ${isRtl ? 'left-4' : 'right-4'} flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0`}>
                    <button 
                      onClick={() => { setEditingItem(item); setIsFormOpen(true); }}
                      className="p-3 bg-white text-slate-800 rounded-2xl shadow-2xl hover:bg-orange-500 hover:text-white transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setIdToDelete(item.id)}
                      className="p-3 bg-white text-slate-800 rounded-2xl shadow-2xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <h4 className="text-xl font-black text-slate-800 mb-3 line-clamp-1">{displayTitle}</h4>
                  
                  {displayDesc ? (
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                      {displayDesc}
                    </p>
                  ) : (
                    <div className="flex-1 mb-6"></div>
                  )}
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex -space-x-3 overflow-hidden">
                      {Object.values(item.images || {}).slice(0, 3).filter(v => v).map((url, i) => (
                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-white overflow-hidden bg-slate-100">
                          <img src={url} className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {imgCount > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-4 ring-white">
                          +{imgCount - 3}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => { setEditingItem(item); setIsFormOpen(true); }}
                      className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2 hover:underline"
                    >
                      {isRtl ? 'عرض التفاصيل' : 'View Details'} <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white py-24 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center px-10">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <LayoutGrid size={32} className="text-slate-200" />
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-2">{t.noRecords}</h4>
          <p className="text-slate-400 max-w-xs font-medium">Add some beautiful memories of Touggourt to your gallery.</p>
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <GalleryForm 
          item={editingItem} 
          currentLang={currentLang} 
          onSave={handleSaveItem} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      <ConfirmModal 
        isOpen={!!idToDelete} 
        onClose={() => setIdToDelete(null)} 
        onConfirm={executeDeleteItem} 
        isLoading={isDeleting}
        title={isRtl ? 'حذف من المعرض' : 'Delete from Gallery'} 
        message={isRtl ? 'هل أنت متأكد من حذف هذا العنصر؟' : 'Are you sure you want to delete this gallery item?'} 
        currentLang={currentLang} 
      />
    </div>
  );
};

export default GalleryManager;