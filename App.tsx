
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import PlaceCard from './components/PlaceCard';
import PlaceForm from './components/PlaceForm';
import GalleryCard from './components/GalleryCard';
import GalleryForm from './components/GalleryForm';
import StaffManager from './components/StaffManager';
import CityInfoEditor from './components/CityInfoEditor';
import LoginPage from './components/LoginPage';
import CategoryManager from './components/CategoryManager';
import ConfirmModal from './components/ConfirmModal';
import VisitorAnalytics from './components/VisitorAnalytics';
import ProfileEditor from './components/ProfileEditor';
import { Place, GalleryItem, AppLanguage, UserRole, CityStaff, normalizeCategoryKey, CategoryMap } from './types';
import { translations } from './translations';
import { CATEGORY_ICONS } from './constants';
import { 
  onAuthStateChanged, 
  auth, 
  db, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  signOut,
  query,
  orderBy,
  serverTimestamp
} from './services/firebaseService';
import { 
  Search, 
  Plus, 
  Users, 
  Eye, 
  MapPin, 
  Loader2,
  ChevronDown,
  Layout,
  Heart,
  Filter,
  Star,
  BookOpen,
  X,
  Image as ImageIcon,
  Tag
} from 'lucide-react';

const DEFAULT_CATEGORIES: CategoryMap = {
  religion: { ar: 'ديني', en: 'Religion', fr: 'Religieux' },
  history: { ar: 'تاريخي', en: 'History', fr: 'Historique' },
  culture: { ar: 'ثقافي', en: 'Culture', fr: 'Culturel' },
  nature: { ar: 'طبيعي', en: 'Nature', fr: 'Naturel' },
  hotels: { ar: 'فنادق', en: 'Hotels', fr: 'Hôtels' },
  restaurants: { ar: 'مطاعم', en: 'Restaurants', fr: 'Restaurants' }
};

const App: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<AppLanguage>(() => {
    return (localStorage.getItem('admin_lang') as AppLanguage) || 'ar';
  });
  
  const [user, setUser] = useState<CityStaff | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [places, setPlaces] = useState<Place[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<CategoryMap>(DEFAULT_CATEGORIES);
  const [staffList, setStaffList] = useState<CityStaff[]>([]);
  const [cityReads, setCityReads] = useState<number>(0);
  const [totalGlobalVisitors, setTotalGlobalVisitors] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | undefined>(undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Deletion Modal State
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'place' | 'gallery'>('place');
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const categoryKeys = useMemo(() => Object.keys(categories), [categories]);

  useEffect(() => {
    document.dir = isRtl ? 'rtl' : 'ltr';
    localStorage.setItem('admin_lang', currentLang);
  }, [currentLang, isRtl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userData: CityStaff = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              fullName: data.fullName || data.full_name || 'Admin',
              age: data.age,
              role: data.role as UserRole,
              lastLogin: data.lastLogin
            };
            
            if (userData.role === 'admin' || userData.role === 'content manager') {
              setUser(userData);
              setIsAuthorized(true);
            } else {
              setIsAuthorized(false);
              await signOut(auth);
              setUser(null);
            }
          } else {
            setIsAuthorized(false);
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
          console.error("Auth initialization error:", err);
          setIsAuthorized(false);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsAuthorized(true);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthorized) {
      setDataLoading(false);
      setPlaces([]);
      setGalleryItems([]);
      setStaffList([]);
      setCategories(DEFAULT_CATEGORIES);
      setCityReads(0);
      return;
    }

    setDataLoading(true);
    
    // Fetch Dynamic Categories
    const unsubCategories = onSnapshot(doc(db, "appConfig", "categories"), 
      (snapshot) => {
        if (snapshot.exists()) {
          setCategories(snapshot.data() as CategoryMap);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      }
    );

    // Fetch Places
    const placesQ = query(collection(db, "places"));
    const unsubPlaces = onSnapshot(placesQ, 
      (snapshot) => {
        const placesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Place[];
        setPlaces(placesList || []);
      }
    );

    // Fetch Gallery Items
    const galleryQ = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubGallery = onSnapshot(galleryQ, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GalleryItem[];
        setGalleryItems(list || []);
      }
    );

    // Other listeners (users, city stats, etc)
    const unsubCity = onSnapshot(collection(db, "aboutCity"), snapshot => {
      if (!snapshot.empty) setCityReads(snapshot.docs[0].data().readingCount || 0);
    });

    const unsubGlobalStats = onSnapshot(doc(db, "appStats", "global"), snapshot => {
      if (snapshot.exists()) setTotalGlobalVisitors(snapshot.data().totalSessions || 0);
    });

    let unsubUsers = () => {};
    if (user.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, "users"), snapshot => {
        const list = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as CityStaff[];
        setStaffList(list || []);
      });
    }

    setDataLoading(false);

    return () => {
      unsubCategories();
      unsubPlaces();
      unsubGallery();
      unsubUsers();
      unsubCity();
      unsubGlobalStats();
    };
  }, [user, isAuthorized]);

  const handleSavePlace = async (placeData: Partial<Place>) => {
    try {
      if (editingPlace?.id) {
        await updateDoc(doc(db, "places", editingPlace.id), { ...placeData });
      } else {
        await addDoc(collection(db, "places"), { ...placeData, favoritesCount: 0, ratingCount: 0 });
      }
      setIsFormOpen(false);
    } catch (err: any) { alert(`Save failed: ${err.message}`); }
  };

  const handleSaveGalleryItem = async (itemData: Partial<GalleryItem>) => {
    try {
      if (editingGalleryItem?.id) {
        await updateDoc(doc(db, "gallery", editingGalleryItem.id), { ...itemData });
      } else {
        await addDoc(collection(db, "gallery"), { ...itemData, createdAt: serverTimestamp() });
      }
      setIsGalleryFormOpen(false);
    } catch (err: any) { alert(`Save failed: ${err.message}`); }
  };

  const executeDeleteAsset = async () => {
    if (!idToDelete) return;
    setIsDeletingAsset(true);
    try {
      const collectionName = deleteType === 'place' ? 'places' : 'gallery';
      await deleteDoc(doc(db, collectionName, idToDelete));
      setIdToDelete(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeletingAsset(false);
    }
  };

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return places.filter(p => {
      const nameMatch = (p?.name?.[currentLang] || '').toLowerCase().includes(q) || (p?.name?.en || '').toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return nameMatch && matchesCategory;
    });
  }, [places, searchQuery, currentLang, selectedCategory]);

  const filteredGallery = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return galleryItems.filter(item => (item.title?.[currentLang] || item.title?.en || '').toLowerCase().includes(q));
  }, [galleryItems, searchQuery, currentLang]);

  if (authLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><Loader2 className="w-12 h-12 text-orange-500 animate-spin" /><p className="text-slate-400 font-medium animate-pulse">{t.loading}</p></div>;
  if (!user) return <LoginPage currentLang={currentLang} onLangChange={setCurrentLang} errorOverride={!isAuthorized ? "Access Denied." : undefined} />;

  return (
    <div className={`min-h-screen flex bg-slate-50`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar currentLang={currentLang} activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />
      
      <main className={`flex-1 ${isRtl ? 'mr-64' : 'ml-64'} p-8`}>
        {/* Persistent Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-bold text-slate-800">{t[activeTab as keyof typeof t] || activeTab}</h2><p className="text-slate-400 text-sm">{t.appName} {t.adminPortal}</p></div>
          <div className="flex items-center gap-6">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">{(['en', 'ar', 'fr'] as const).map(l => (<button key={l} onClick={() => setCurrentLang(l)} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${currentLang === l ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:text-orange-500 transition-colors'}`}>{l}</button>))}</div>
            <div className="relative group">
              <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-slate-400`} size={18} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                className={`${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white border-transparent focus:border-orange-200 rounded-full text-sm outline-none shadow-sm w-64 transition-all`} 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
            <div className="relative" ref={profileRef}><button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100"><img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'Admin'}`} className="w-8 h-8 rounded-full" alt="Admin" /><div className="flex flex-col text-start max-w-[120px]"><span className="text-xs font-bold text-slate-700 leading-none truncate">{user?.fullName || 'Admin'}</span><span className="text-[10px] text-orange-500 font-bold uppercase">{user.role === 'admin' ? t.adminRole : t.managerRole}</span></div><ChevronDown size={14} className="text-slate-400" /></button></div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[40px] text-white shadow-2xl">
               <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-white/10 backdrop-blur rounded-xl"><Layout className="text-orange-400" size={24} /></div><h3 className="text-xl md:text-2xl font-bold">{t.welcomeAdmin} {user?.fullName || 'Admin'}!</h3></div>
               <p className="text-slate-300 max-w-lg font-medium">{t.dashboardSubtitle}</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {[
                  { label: t.totalPlaces, value: places.length, icon: <MapPin className="text-orange-500" /> },
                  { label: t.registeredUsers, value: staffList.length, icon: <Users className="text-purple-500" /> },
                  { label: t.totalFavorites, value: places.reduce((a,c) => a+(c.favoritesCount||0),0), icon: <Heart className="text-pink-500" /> },
                  { label: t.totalRatings, value: places.reduce((a,c) => a+(c.ratingCount||0),0), icon: <Star className="text-yellow-500" /> },
                  { label: t.cityReads, value: cityReads, icon: <BookOpen className="text-emerald-500" /> },
                  { label: t.totalVisitors, value: totalGlobalVisitors.toLocaleString(), icon: <Eye className="text-blue-500" /> },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100"><div className="p-3 rounded-2xl bg-slate-50 w-fit mb-4">{stat.icon}</div><h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h4><p className="text-2xl font-black text-slate-800">{stat.value}</p></div>
                ))}
             </div>
             <VisitorAnalytics currentLang={currentLang} />
          </div>
        )}

        {activeTab === 'places' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><MapPin size={28} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.managePlaces}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredPlaces.length} {t.totalPlaces}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative group min-w-[200px]">
                  <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300`} size={16} />
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder}
                    className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 ring-orange-100 outline-none transition-all shadow-inner`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={() => { setEditingPlace(undefined); setIsFormOpen(true); }} className="flex items-center justify-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-[20px] font-black shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all"><Plus size={20} /> {t.newPlace}</button>
              </div>
            </div>

            {/* Category Filter Bar */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-3 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-[20px] font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${
                  selectedCategory === 'all' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200 hover:text-orange-500'
                }`}
              >
                <Filter size={14} />
                {t.allCategories}
              </button>
              {categoryKeys.map(key => {
                const icon = CATEGORY_ICONS[key] || <Tag size={14} className="w-3.5 h-3.5" />;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-[20px] font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${
                      selectedCategory === key 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200 hover:text-orange-500'
                    }`}
                  >
                    <div className={selectedCategory === key ? 'text-white' : 'text-orange-500'}>
                      {React.isValidElement(icon) 
                        ? React.cloneElement(icon as React.ReactElement, { size: 14, className: 'w-3.5 h-3.5' })
                        : <Tag size={14} className="w-3.5 h-3.5" />
                      }
                    </div>
                    {categories[key][currentLang] || key}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPlaces.map(p => <PlaceCard key={p.id} place={p} currentLang={currentLang} categories={categories} onEdit={p => { setEditingPlace(p); setIsFormOpen(true); }} onDelete={id => { setIdToDelete(id); setDeleteType('place'); }} />)}
            </div>

            {filteredPlaces.length === 0 && (
              <div className="py-24 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin size={32} className="text-slate-200" />
                </div>
                <h4 className="text-slate-800 font-black uppercase text-sm tracking-widest mb-1">{t.noRecords}</h4>
                <p className="text-slate-400 text-xs font-bold">{isRtl ? 'حاول استخدام كلمات بحث أخرى أو تغيير التصنيف.' : 'Try different search terms or change the category.'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4"><div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><ImageIcon size={28} /></div><div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.manageGallery}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{galleryItems.length} items</p></div></div>
              <button onClick={() => { setEditingGalleryItem(undefined); setIsGalleryFormOpen(true); }} className="flex items-center justify-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-[20px] font-black shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all"><Plus size={20} /> {t.newGalleryItem}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGallery.map(item => <GalleryCard key={item.id} item={item} currentLang={currentLang} onEdit={item => { setEditingGalleryItem(item); setIsGalleryFormOpen(true); }} onDelete={id => { setIdToDelete(id); setDeleteType('gallery'); }} />)}
            </div>
            {filteredGallery.length === 0 && <div className="py-24 text-center bg-white rounded-[40px] border border-slate-100"><ImageIcon className="mx-auto text-slate-200 mb-6" size={48} /><p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{t.noRecords}</p></div>}
          </div>
        )}

        {activeTab === 'categories' && <CategoryManager currentLang={currentLang} categories={categories} />}
        {activeTab === 'aboutCity' && <CityInfoEditor currentLang={currentLang} />}
        {activeTab === 'staff' && user?.role === 'admin' && <StaffManager currentLang={currentLang} />}
        {activeTab === 'settings' && user && <ProfileEditor currentLang={currentLang} user={user} onUpdate={updates => setUser(prev => prev ? ({ ...prev, ...updates }) : null)} />}
      </main>

      <ConfirmModal isOpen={!!idToDelete} onClose={() => setIdToDelete(null)} onConfirm={executeDeleteAsset} isLoading={isDeletingAsset} title={deleteType === 'place' ? t.deleteConfirm : t.deleteConfirm} message={t.deleteConfirm} currentLang={currentLang} />
      {isFormOpen && <PlaceForm place={editingPlace} currentLang={currentLang} categories={categories} onSave={handleSavePlace} onClose={() => setIsFormOpen(false)} />}
      {isGalleryFormOpen && <GalleryForm item={editingGalleryItem} currentLang={currentLang} onSave={handleSaveGalleryItem} onClose={() => setIsGalleryFormOpen(false)} />}
    </div>
  );
};

export default App;
