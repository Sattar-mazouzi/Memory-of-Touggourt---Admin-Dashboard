
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import PlaceCard from './components/PlaceCard';
import PlaceForm from './components/PlaceForm';
import StaffManager from './components/StaffManager';
import CityInfoEditor from './components/CityInfoEditor';
import LoginPage from './components/LoginPage';
import CategoryManager from './components/CategoryManager';
import ConfirmModal from './components/ConfirmModal';
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
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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
  ShieldCheck,
  Calendar,
  Layers,
  Save,
  CheckCircle2,
  Layout,
  Heart,
  Award,
  Filter,
  Church,
  History,
  Palmtree,
  Hotel,
  UtensilsCrossed,
  AlertTriangle,
  RefreshCw
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
  
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<CategoryMap>(DEFAULT_CATEGORIES);
  const [staffList, setStaffList] = useState<CityStaff[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [profileFullName, setProfileFullName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);

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
            const userData = { ...currentUser, ...userDoc.data() };
            const role = userData.role;
            
            if (role === 'admin' || role === 'content manager') {
              setUser(userData);
              setProfileFullName(userData.full_name || '');
              setIsAuthorized(true);
              setActiveTab('dashboard');
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

  // Sync Categories, Places and Users
  useEffect(() => {
    if (!user || !isAuthorized) {
      setDataLoading(false);
      setPlaces([]);
      setStaffList([]);
      setCategories(DEFAULT_CATEGORIES);
      return;
    }

    setDataLoading(true);
    setPermissionError(null);
    
    // Fetch Dynamic Categories with error handling
    const unsubCategories = onSnapshot(doc(db, "appConfig", "categories"), 
      (snapshot) => {
        if (snapshot.exists()) {
          setCategories(snapshot.data() as CategoryMap);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      },
      (error) => {
        console.warn("Categories snapshot restricted, using defaults:", error.message);
        setCategories(DEFAULT_CATEGORIES);
        if (error.code === 'permission-denied') {
          setPermissionError("Firestore Rules Error: Ensure 'appConfig' collection has read permissions set to 'true' in your Firebase console.");
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
        console.error("Places snapshot error:", error);
        if (error.code === 'permission-denied') {
          setPermissionError("Access Denied: Your account doesn't have permissions to read 'places'. Check Firestore rules.");
        }
        setDataLoading(false);
      }
    );

    // Only admins can see the full user list
    let unsubUsers = () => {};
    if (user.role === 'admin') {
      const usersQ = query(collection(db, "users"));
      unsubUsers = onSnapshot(usersQ, 
        (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          })) as CityStaff[];
          setStaffList(list || []);
        },
        (error) => {
          console.error("Users list restricted:", error);
        }
      );
    } else {
      setStaffList([{ uid: user.uid, email: user.email, full_name: user.full_name, role: user.role }]);
    }

    return () => {
      unsubCategories();
      unsubPlaces();
      unsubUsers();
    };
  }, [user, isAuthorized]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Analytics Calculations
  const totalFavorites = useMemo(() => {
    return places.reduce((acc, p) => acc + (p.favoritesCount || 0), 0);
  }, [places]);

  const mostFavoritedPlace = useMemo(() => {
    if (places.length === 0) return null;
    return [...places].sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0))[0];
  }, [places]);

  const topPlaces = useMemo(() => {
    return [...places]
      .sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0))
      .slice(0, 5);
  }, [places]);

  const categoryData = useMemo(() => {
    const list = places || [];
    return categoryKeys.map(cat => ({
      key: cat,
      name: categories[cat]?.[currentLang] || cat,
      value: list.filter(p => p?.category === cat).length
    }));
  }, [places, categories, currentLang, categoryKeys]);

  const statsData = [
    { name: t.jan, visits: 420 }, { name: t.feb, visits: 380 },
    { name: t.mar, visits: 720 }, { name: t.apr, visits: 1100 },
    { name: t.may, visits: 640 }, { name: t.jun, visits: 1350 },
  ];

  const COLORS_PIE = ['#F97316', '#38BDF8', '#818CF8', '#F472B6', '#10B981', '#F59E0B'];

  const handleSavePlace = async (placeData: Partial<Place>) => {
    try {
      if (editingPlace?.id) {
        const placeRef = doc(db, "places", editingPlace.id);
        await updateDoc(placeRef, { ...placeData });
      } else {
        await addDoc(collection(db, "places"), {
          ...placeData,
          favoritesCount: 0 
        });
      }
      setIsFormOpen(false);
      setEditingPlace(undefined);
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Permission denied'}`);
    }
  };

  const handleRequestDeletePlace = (id: string) => {
    setIdToDelete(id);
  };

  const executeDeletePlace = async () => {
    if (!idToDelete) return;
    setIsDeletingPlace(true);
    try {
      await deleteDoc(doc(db, "places", idToDelete));
      setIdToDelete(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Delete failed: ${err.message || 'Permission denied'}`);
    } finally {
      setIsDeletingPlace(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        full_name: profileFullName
      });
      setUser((prev: any) => ({ ...prev, full_name: profileFullName }));
      setShowProfileSuccess(true);
      setTimeout(() => setShowProfileSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Update failed: Check permissions.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const list = places || [];
    return list.filter(p => {
      const nameCurrent = String(p?.name?.[currentLang] || '').toLowerCase();
      const addrCurrent = String(p?.address?.[currentLang] || '').toLowerCase();
      const matchesSearch = nameCurrent.includes(q) || addrCurrent.includes(q);
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [places, searchQuery, currentLang, selectedCategory]);

  const getDisplayName = () => {
    if (user?.full_name) return user.full_name;
    return user?.email?.split('@')[0] || 'Admin';
  };

  const getUserRoleLabel = (role: UserRole) => {
    if (role === 'admin') return t.adminRole;
    return t.managerRole;
  };

  const getCategoryIcon = (cat: string) => {
    const normalized = normalizeCategoryKey(cat);
    switch(normalized) {
      case 'religion': return <Church size={16} />;
      case 'history': return <History size={16} />;
      case 'culture': return <MapPin size={16} />;
      case 'nature': return <Palmtree size={16} />;
      case 'hotels': return <Hotel size={16} />;
      case 'restaurants': return <UtensilsCrossed size={16} />;
      default: return <Filter size={16} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">{t.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage 
        currentLang={currentLang} 
        onLangChange={setCurrentLang}
        errorOverride={!isAuthorized ? "Account access denied or invalid role." : undefined} 
      />
    );
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 animate-in fade-in duration-500`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar 
        currentLang={currentLang} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={user?.role || 'content manager'}
      />
      
      <main className={`flex-1 ${isRtl ? 'mr-64' : 'ml-64'} p-8 transition-all duration-300`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {t[activeTab as keyof typeof t] || activeTab}
            </h2>
            <p className="text-slate-400 text-sm">{t.appName} {t.adminPortal}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
              {(['en', 'ar', 'fr'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setCurrentLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    currentLang === l ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="relative group">
              <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-slate-400`} size={18} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                className={`${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white border border-transparent focus:border-orange-200 rounded-full text-sm outline-none shadow-sm w-64 transition-all`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100 hover:border-orange-200 transition-all ${isProfileOpen ? 'ring-2 ring-orange-100' : ''}`}
              >
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.email || 'Admin'}`} className="w-8 h-8 rounded-full border border-orange-100" alt="Admin" />
                <div className="flex flex-col text-start max-w-[120px]">
                  <span className="text-xs font-bold text-slate-700 leading-none truncate">{getDisplayName()}</span>
                  <span className="text-[10px] text-orange-500 font-bold uppercase">{getUserRoleLabel(user?.role)}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className={`absolute top-full mt-2 ${isRtl ? 'left-0' : 'right-0'} w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200`}>
                  <div className="p-4 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.profile}</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <User size={18} className="text-slate-400" />
                      {t.settings}
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={18} className="text-red-400" />
                      {t.signOut}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {permissionError && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-[32px] flex flex-col md:flex-row items-center gap-6 text-amber-800 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="p-3 bg-amber-100 rounded-2xl">
              <AlertTriangle className="shrink-0 text-amber-600" size={28} />
            </div>
            <div className="flex-1 text-center md:text-start">
              <p className="text-lg font-black uppercase tracking-tight mb-1">Database Permission Warning</p>
              <p className="text-sm font-medium opacity-80">{permissionError}</p>
            </div>
            <button 
              onClick={handleRetry}
              className="px-6 py-3 bg-white border border-amber-200 rounded-2xl text-amber-700 font-bold text-sm flex items-center gap-2 hover:bg-amber-100 transition-colors shadow-sm"
            >
              <RefreshCw size={16} />
              Retry Connection
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            {/* Mission Statement Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-slate-200">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-white/10 backdrop-blur rounded-xl">
                        <Layout className="text-orange-400" size={24} />
                     </div>
                     <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                       {t.welcomeAdmin} {getDisplayName()}!
                     </h3>
                  </div>
                  <p className="text-slate-300 max-w-lg leading-relaxed font-medium">
                    {t.dashboardSubtitle}
                  </p>
               </div>
            </div>

            {/* Dashboard Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: t.totalPlaces, value: places.length, icon: <MapPin className="text-orange-500" />, color: 'orange' },
                { label: t.registeredUsers, value: staffList.length, icon: <Users className="text-purple-500" />, color: 'purple' },
                { label: t.totalVisitors, value: '18.2k', icon: <Eye className="text-blue-500" />, color: 'blue' },
                { label: t.totalFavorites, value: totalFavorites, icon: <Heart className="text-pink-500" />, color: 'pink' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-slate-50`}>{stat.icon}</div>
                    <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 animate-pulse`}></div>
                  </div>
                  <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h4>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Visitors Bar Chart */}
              <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 min-h-[400px]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                     <TrendingUp className="text-orange-500" size={20} />
                     {t.visitorsOverview}
                   </h3>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                      <Tooltip 
                        cursor={{fill: '#F8FAFC'}} 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '15px'}} 
                      />
                      <Bar dataKey="visits" fill="#F97316" radius={[12, 12, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Pie Chart & List */}
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight mb-8 flex items-center gap-2">
                  <Layers className="text-orange-500" size={20} />
                  {t.categories}
                </h3>
                <div className="h-56 w-full relative mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-800 tracking-tighter">{places.length}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{t.totalPlaces}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  {categoryData.map((cat, idx) => (
                    <div key={cat.key} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_PIE[idx % COLORS_PIE.length] }}></div>
                          <span className="text-xs font-bold text-slate-600">{cat.name}</span>
                       </div>
                       <span className="text-xs font-black text-slate-800">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Favourites Ranking Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight flex items-center gap-2">
                      <Heart className="text-pink-500" size={24} />
                      {t.popularPlaces}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {topPlaces.map((place, index) => (
                       <div key={place.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-6">
                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${index === 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                               #{index + 1}
                             </div>
                             <div className="w-16 h-12 rounded-xl overflow-hidden shadow-sm">
                                <img src={place.imageUrl.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={place.name[currentLang]} />
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800 leading-none mb-1 group-hover:text-orange-500 transition-colors">{place.name[currentLang]}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                   <MapPin size={10} /> {place.address[currentLang] || 'Touggourt'}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-end">
                                <p className="text-sm font-black text-slate-800 leading-none">{place.favoritesCount || 0}</p>
                                <p className="text-[10px] font-bold text-pink-500 uppercase">{t.favorites}</p>
                             </div>
                             <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(100, ((place.favoritesCount || 0) / (mostFavoritedPlace?.favoritesCount || 1)) * 100)}%` }}></div>
                             </div>
                          </div>
                       </div>
                    ))}
                    {topPlaces.length === 0 && (
                      <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No favorites recorded yet.</div>
                    )}
                  </div>
               </div>

               <div className="lg:col-span-4">
                  {mostFavoritedPlace && (
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200 h-full flex flex-col">
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
                       <div className="relative z-10 flex-1">
                          <div className="flex items-center gap-2 mb-6">
                             <div className="px-3 py-1 bg-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                <Award size={12} /> {t.mostFavorited}
                             </div>
                          </div>
                          <h3 className="text-2xl font-black mb-2 leading-tight">{mostFavoritedPlace.name[currentLang]}</h3>
                          <div className="flex items-center gap-4 pt-6 border-t border-white/10 mt-auto">
                             <div className="p-4 bg-white/5 rounded-3xl border border-white/5 flex-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t.favorites}</p>
                                <p className="text-2xl font-black text-orange-400">{mostFavoritedPlace.favoritesCount || 0}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'places' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-slate-800">{t.managePlaces}</h3>
                <p className="text-sm text-slate-400">Manage your city's digital assets</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto max-w-full scrollbar-hide">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'all' 
                        ? 'bg-orange-500 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.allCategories}
                  </button>
                  {categoryKeys.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategory === cat 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      {categories[cat]?.[currentLang] || cat}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => { setEditingPlace(undefined); setIsFormOpen(true); }}
                  className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <Plus size={20} /> {t.newPlace}
                </button>
              </div>
            </div>

            {dataLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                 <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                 <p className="text-slate-400 font-medium">{t.loading}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlaces.map(place => (
                  <PlaceCard 
                    key={place.id} 
                    place={place} 
                    currentLang={currentLang}
                    categories={categories}
                    onEdit={(p) => { setEditingPlace(p); setIsFormOpen(true); }}
                    onDelete={handleRequestDeletePlace}
                  />
                ))}
                {filteredPlaces.length === 0 && !dataLoading && (
                   <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                      <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Search size={32} className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{t.noRecords}</p>
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && <CategoryManager currentLang={currentLang} categories={categories} />}
        {activeTab === 'aboutCity' && <CityInfoEditor currentLang={currentLang} />}
        {activeTab === 'staff' && user?.role === 'admin' && <StaffManager currentLang={currentLang} />}
        {activeTab === 'settings' && (
          <div className="p-12 bg-white rounded-[40px] shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t.settings}</h2>
            <form onSubmit={handleUpdateProfile} className="max-w-md space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.fullName}</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none text-slate-700 font-medium"
                  value={profileFullName}
                  onChange={e => setProfileFullName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {t.saveChanges}</>}
              </button>
            </form>
          </div>
        )}
      </main>

      <ConfirmModal 
        isOpen={!!idToDelete}
        onClose={() => setIdToDelete(null)}
        onConfirm={executeDeletePlace}
        isLoading={isDeletingPlace}
        title={isRtl ? 'حذف الموقع' : 'Delete Place'}
        message={isRtl ? 'هل أنت متأكد من رغبتك في حذف هذا الموقع السياحي؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this tourism asset? This action cannot be undone.'}
        currentLang={currentLang}
      />

      {isFormOpen && (
        <PlaceForm 
          place={editingPlace} 
          currentLang={currentLang}
          categories={categories}
          onSave={handleSavePlace} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
