
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import PlaceCard from './components/PlaceCard';
import PlaceForm from './components/PlaceForm';
import StaffManager from './components/StaffManager';
import CityInfoEditor from './components/CityInfoEditor';
import LoginPage from './components/LoginPage';
import CategoryManager from './components/CategoryManager';
import GalleryManager from './components/GalleryManager';
import ConfirmModal from './components/ConfirmModal';
import VisitorAnalytics from './components/VisitorAnalytics';
import ProfileEditor from './components/ProfileEditor';
import { Place, AppLanguage, UserRole, CityStaff, normalizeCategoryKey, CategoryMap } from './types';
import { translations } from './translations';
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
  query
} from './services/firebaseService';
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Users, 
  Eye, 
  MapPin, 
  Settings, 
  Loader2,
  ChevronDown,
  User,
  LogOut,
  Layers,
  Save,
  Layout,
  Heart,
  Filter,
  Church,
  History,
  Palmtree,
  Hotel,
  UtensilsCrossed,
  AlertTriangle,
  RefreshCw,
  Star,
  BookOpen,
  Compass,
  X,
  Image as ImageIcon
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
  const [categories, setCategories] = useState<CategoryMap>(DEFAULT_CATEGORIES);
  const [staffList, setStaffList] = useState<CityStaff[]>([]);
  const [cityReads, setCityReads] = useState<number>(0);
  const [totalGlobalVisitors, setTotalGlobalVisitors] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Deletion Modal State
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isDeletingPlace, setIsDeletingPlace] = useState(false);

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
              fullName: data.fullName || data.full_name || 'Admin', // Support migration
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
      setStaffList([]);
      setCategories(DEFAULT_CATEGORIES);
      setCityReads(0);
      return;
    }

    setDataLoading(true);
    setPermissionError(null);
    
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

    // Fetch Global Stats
    const unsubGlobalStats = onSnapshot(doc(db, "appStats", "global"), 
      (snapshot) => {
        if (snapshot.exists()) {
          setTotalGlobalVisitors(snapshot.data().totalSessions || 0);
        }
      }
    );

    // Fetch City readingCount dynamically
    const unsubCity = onSnapshot(collection(db, "aboutCity"), 
      (snapshot) => {
        if (!snapshot.empty) {
          const cityData = snapshot.docs[0].data();
          setCityReads(cityData.readingCount || 0);
        }
      }
    );

    const placesQ = query(collection(db, "places"));
    const unsubPlaces = onSnapshot(placesQ, 
      (snapshot) => {
        const placesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Place[];
        setPlaces(placesList || []);
        setDataLoading(false);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          setPermissionError("Access Denied: Permissions required.");
        }
        setDataLoading(false);
      }
    );

    let unsubUsers = () => {};
    if (user.role === 'admin') {
      const usersQ = query(collection(db, "users"));
      unsubUsers = onSnapshot(usersQ, 
        (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
            fullName: doc.data().fullName || doc.data().full_name // Migration support
          })) as CityStaff[];
          setStaffList(list || []);
        }
      );
    } else {
      setStaffList([user]);
    }

    return () => {
      unsubCategories();
      unsubPlaces();
      unsubUsers();
      unsubCity();
      unsubGlobalStats();
    };
  }, [user, isAuthorized]);

  const totalFavorites = useMemo(() => places.reduce((acc, p) => acc + (p.favoritesCount || 0), 0), [places]);
  const totalRatings = useMemo(() => places.reduce((acc, p) => acc + (p.ratingCount || 0), 0), [places]);

  const topPlaces = useMemo(() => [...places].sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0)).slice(0, 5), [places]);
  const topRatedPlaces = useMemo(() => [...places].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5), [places]);

  const categoryData = useMemo(() => {
    return categoryKeys.map(cat => ({
      key: cat,
      name: categories[cat]?.[currentLang] || cat,
      value: places.filter(p => p?.category === cat).length
    }));
  }, [places, categories, currentLang, categoryKeys]);

  const COLORS_PIE = ['#F97316', '#38BDF8', '#818CF8', '#F472B6', '#10B981', '#F59E0B'];

  const handleSavePlace = async (placeData: Partial<Place>) => {
    try {
      if (editingPlace?.id) {
        await updateDoc(doc(db, "places", editingPlace.id), { ...placeData });
      } else {
        await addDoc(collection(db, "places"), { ...placeData, favoritesCount: 0, ratingCount: 0 });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const executeDeletePlace = async () => {
    if (!idToDelete) return;
    setIsDeletingPlace(true);
    try {
      await deleteDoc(doc(db, "places", idToDelete));
      setIdToDelete(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeletingPlace(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (err) { console.error("Logout failed", err); }
  };

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return places.filter(p => {
      // Search in Name
      const nameMatch = (p?.name?.[currentLang] || '').toLowerCase().includes(q) || 
                        (p?.name?.en || '').toLowerCase().includes(q) ||
                        (p?.name?.ar || '').toLowerCase().includes(q) ||
                        (p?.name?.fr || '').toLowerCase().includes(q);
      
      // Search in Address
      const addressMatch = (p?.address?.[currentLang] || '').toLowerCase().includes(q) ||
                           (p?.address?.en || '').toLowerCase().includes(q) ||
                           (p?.address?.ar || '').toLowerCase().includes(q) ||
                           (p?.address?.fr || '').toLowerCase().includes(q);

      // Search in Description
      const descMatch = (p?.description?.[currentLang] || '').toLowerCase().includes(q) ||
                        (p?.description?.en || '').toLowerCase().includes(q) ||
                        (p?.description?.ar || '').toLowerCase().includes(q) ||
                        (p?.description?.fr || '').toLowerCase().includes(q);

      const matchesSearch = nameMatch || addressMatch || descMatch;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [places, searchQuery, currentLang, selectedCategory]);

  const getUserRoleLabel = (role: UserRole) => role === 'admin' ? t.adminRole : t.managerRole;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">{t.loading}</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage currentLang={currentLang} onLangChange={setCurrentLang} errorOverride={!isAuthorized ? "Access Denied." : undefined} />;
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 animate-in fade-in duration-500`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar currentLang={currentLang} activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />
      
      <main className={`flex-1 ${isRtl ? 'mr-64' : 'ml-64'} p-8 transition-all duration-300`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{t[activeTab as keyof typeof t] || activeTab}</h2>
            <p className="text-slate-400 text-sm">{t.appName} {t.adminPortal}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
              {(['en', 'ar', 'fr'] as const).map(l => (
                <button key={l} onClick={() => setCurrentLang(l)} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${currentLang === l ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>{l}</button>
              ))}
            </div>

            <div className="relative group">
              <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-slate-400`} size={18} />
              <input 
                type="text" placeholder={t.searchPlaceholder}
                className={`${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white border border-transparent focus:border-orange-200 rounded-full text-sm outline-none shadow-sm w-64 transition-all`}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'Admin'}`} className="w-8 h-8 rounded-full" alt="Admin" />
                <div className="flex flex-col text-start max-w-[120px]">
                  <span className="text-xs font-bold text-slate-700 leading-none truncate">{user?.fullName || 'Admin'}</span>
                  <span className="text-[10px] text-orange-500 font-bold uppercase">{getUserRoleLabel(user?.role)}</span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {isProfileOpen && (
                <div className={`absolute top-full mt-2 ${isRtl ? 'left-0' : 'right-0'} w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50`}>
                  <div className="p-4 border-b border-slate-50">
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                    {user?.age && <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t.age}: {user.age}</p>}
                  </div>
                  <div className="p-2 space-y-1">
                    <button onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><Settings size={18} /> {t.profile}</button>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={18} /> {t.signOut}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-white/10 backdrop-blur rounded-xl"><Layout className="text-orange-400" size={24} /></div>
                     <h3 className="text-xl md:text-2xl font-bold">{t.welcomeAdmin} {user?.fullName || 'Admin'}!</h3>
                  </div>
                  <p className="text-slate-300 max-w-lg font-medium">{t.dashboardSubtitle}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {[
                { label: t.totalPlaces, value: places.length, icon: <MapPin className="text-orange-500" />, color: 'orange' },
                { label: t.registeredUsers, value: staffList.length, icon: <Users className="text-purple-500" />, color: 'purple' },
                { label: t.totalFavorites, value: totalFavorites, icon: <Heart className="text-pink-500" />, color: 'pink' },
                { label: t.totalRatings, value: totalRatings, icon: <Star className="text-yellow-500" />, color: 'yellow' },
                { label: t.cityReads, value: cityReads, icon: <BookOpen className="text-emerald-500" />, color: 'emerald' },
                { label: t.totalVisitors, value: totalGlobalVisitors.toLocaleString(), icon: <Eye className="text-blue-500" />, color: 'blue' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4"><div className="p-3 rounded-2xl bg-slate-50">{stat.icon}</div></div>
                  <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h4>
                  <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <VisitorAnalytics currentLang={currentLang} />
              </div>

              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col">
                <h3 className="font-black text-slate-800 text-lg uppercase mb-8 flex items-center gap-2"><Layers className="text-orange-500" size={20} />{t.categories}</h3>
                <div className="h-56 w-full relative mb-8">
                  <ResponsiveContainer><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">{categoryData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} stroke="transparent" />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                    <div><p className="text-3xl font-black text-slate-800">{places.length}</p><p className="text-[8px] text-slate-400 font-black uppercase">{t.totalPlaces}</p></div>
                  </div>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  {categoryData.map((cat, idx) => (
                    <div key={cat.key} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50">
                       <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_PIE[idx % COLORS_PIE.length] }}></div><span className="text-xs font-bold text-slate-600">{cat.name}</span></div>
                       <span className="text-xs font-black text-slate-800">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                  <h3 className="font-black text-slate-800 text-xl uppercase mb-10 flex items-center gap-2"><Heart className="text-pink-500" size={24} />{t.popularPlaces}</h3>
                  <div className="space-y-6">
                    {topPlaces.map((place, index) => (
                       <div key={place.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-6">
                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>#{index + 1}</div>
                             <div className="w-16 h-12 rounded-xl overflow-hidden"><img src={place.imageUrl.cover} className="w-full h-full object-cover" alt="" /></div>
                             <div><h4 className="font-bold text-slate-800 leading-none mb-1">{place.name[currentLang]}</h4><p className="text-[10px] text-slate-400 font-bold uppercase"><MapPin size={10} className="inline mr-1" />{place.address[currentLang] || 'Touggourt'}</p></div>
                          </div>
                          <p className="text-sm font-black text-slate-800">{place.favoritesCount || 0}</p>
                       </div>
                    ))}
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                  <h3 className="font-black text-slate-800 text-xl uppercase mb-10 flex items-center gap-2"><Star className="text-yellow-500" size={24} fill="currentColor" />{t.topRated}</h3>
                  <div className="space-y-6">
                    {topRatedPlaces.map((place, index) => (
                       <div key={place.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-6">
                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-400'}`}>#{index + 1}</div>
                             <div className="w-16 h-12 rounded-xl overflow-hidden"><img src={place.imageUrl.cover} className="w-full h-full object-cover" alt="" /></div>
                             <div><h4 className="font-bold text-slate-800 leading-none mb-1">{place.name[currentLang]}</h4><div className="flex items-center gap-1.5"><Star size={10} className="text-yellow-500" fill="currentColor" /><span className="text-xs font-black">{place.rating?.toFixed(1) || '0.0'}</span><span className="text-[10px] text-slate-400">({place.ratingCount || 0})</span></div></div>
                          </div>
                       </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'places' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header, Search and Add Button */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-inner">
                   <MapPin size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-0.5">
                    {t.managePlaces}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{places.length} {t.totalPlaces}</p>
                </div>
              </div>

              {/* New Prominent Search Field */}
              <div className="flex-1 max-w-2xl relative group">
                <Search className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors`} size={20} />
                <input 
                  type="text" 
                  placeholder={isRtl ? 'ابحث بالاسم، العنوان، أو كلمات من الوصف...' : 'Search by name, address, or description...'}
                  className={`w-full ${isRtl ? 'pr-14 pl-12' : 'pl-14 pr-12'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none transition-all`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-1 bg-slate-200 text-slate-400 rounded-full hover:bg-orange-100 hover:text-orange-500 transition-all`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button 
                onClick={() => { setEditingPlace(undefined); setIsFormOpen(true); }} 
                className="flex items-center justify-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-[20px] font-black shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Plus size={20} /> {t.newPlace}
              </button>
            </div>

            {/* Category Filter Bar */}
            <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-3 min-w-max">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                    selectedCategory === 'all' 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Compass size={16} />
                  {t.allCategories || 'All Categories'}
                </button>
                {categoryKeys.map(key => {
                  const count = places.filter(p => p.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                        selectedCategory === key 
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
                          : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {categories[key]?.[currentLang] || key}
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg ${selectedCategory === key ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Places Grid */}
            {filteredPlaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPlaces.map(place => (
                  <PlaceCard 
                    key={place.id} 
                    place={place} 
                    currentLang={currentLang} 
                    categories={categories} 
                    onEdit={(p) => { setEditingPlace(p); setIsFormOpen(true); }} 
                    onDelete={setIdToDelete} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white py-24 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Search size={32} className="text-slate-200" />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2">{t.noRecords}</h4>
                <p className="text-slate-400 max-w-xs font-medium">{t.searchPlaceholder}</p>
                {(selectedCategory !== 'all' || searchQuery !== '') && (
                  <button 
                    onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                    className="mt-6 text-orange-500 font-black text-xs uppercase tracking-widest hover:underline"
                  >
                    Clear Filters & Search
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && <GalleryManager currentLang={currentLang} />}
        {activeTab === 'categories' && <CategoryManager currentLang={currentLang} categories={categories} />}
        {activeTab === 'aboutCity' && <CityInfoEditor currentLang={currentLang} />}
        {activeTab === 'staff' && user?.role === 'admin' && <StaffManager currentLang={currentLang} />}
        {activeTab === 'settings' && user && (
          <ProfileEditor 
            currentLang={currentLang} 
            user={user} 
            onUpdate={(updates) => setUser(prev => prev ? ({ ...prev, ...updates }) : null)} 
          />
        )}
      </main>

      <ConfirmModal 
        isOpen={!!idToDelete} onClose={() => setIdToDelete(null)} 
        onConfirm={executeDeletePlace} isLoading={isDeletingPlace}
        title="Delete Item" message="Are you sure you want to delete this record?" currentLang={currentLang} 
      />

      {isFormOpen && <PlaceForm place={editingPlace} currentLang={currentLang} categories={categories} onSave={handleSavePlace} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default App;
