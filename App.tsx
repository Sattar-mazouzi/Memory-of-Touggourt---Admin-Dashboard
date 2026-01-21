
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import PlaceCard from './components/PlaceCard';
import PlaceForm from './components/PlaceForm';
import LoginPage from './components/LoginPage';
import { Place, CategoryType, AppLanguage } from './types';
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
  query,
  orderBy
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
  Globe,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Calendar,
  Layers,
  Save,
  CheckCircle2
} from 'lucide-react';

const App: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<AppLanguage>(() => {
    return (localStorage.getItem('admin_lang') as AppLanguage) || 'ar';
  });
  
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [places, setPlaces] = useState<Place[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Profile Edit State
  const [profileFullName, setProfileFullName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    document.dir = isRtl ? 'rtl' : 'ltr';
    localStorage.setItem('admin_lang', currentLang);
  }, [currentLang, isRtl]);

  // Click outside listener for profile dropdown
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
          
          if (userDoc.exists() && userDoc.data()?.role === 'admin') {
            const userData = { ...currentUser, ...userDoc.data() };
            setUser(userData);
            setProfileFullName(userData.full_name || '');
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
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
    if (!user) {
      setDataLoading(false);
      setPlaces([]);
      return;
    }

    setDataLoading(true);
    const q = query(collection(db, "places"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const placesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Place[];
      setPlaces(placesList || []);
      setDataLoading(false);
    }, (error) => {
      console.error("Firestore Listen Error:", error);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const statsData = [
    { name: t.jan, visits: 400 }, { name: t.feb, visits: 300 },
    { name: t.mar, visits: 600 }, { name: t.apr, visits: 800 },
    { name: t.may, visits: 500 }, { name: t.jun, visits: 900 },
  ];

  const categoryData = useMemo(() => {
    const list = places || [];
    const categories = ['religion', 'history', 'culture', 'nature'];
    return categories.map(cat => ({
      name: t[cat as keyof typeof t] || cat,
      value: list.filter(p => p?.category === cat).length
    }));
  }, [places, t]);

  const COLORS_PIE = ['#F97316', '#38BDF8', '#818CF8', '#F472B6'];

  const handleSavePlace = async (placeData: Partial<Place>) => {
    try {
      if (editingPlace?.id) {
        const placeRef = doc(db, "places", editingPlace.id);
        await updateDoc(placeRef, { ...placeData });
      } else {
        await addDoc(collection(db, "places"), {
          ...placeData
        });
      }
      setIsFormOpen(false);
      setEditingPlace(undefined);
    } catch (err) {
      alert("Failed to save record.");
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      try {
        await deleteDoc(doc(db, "places", id));
      } catch (err) {
        console.error("Delete error:", err);
      }
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
      alert("Update failed");
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
      return nameCurrent.includes(q) || addrCurrent.includes(q);
    });
  }, [places, searchQuery, currentLang]);

  const getDisplayName = () => {
    if (user?.full_name) return user.full_name;
    return user?.email?.split('@')[0] || 'Admin';
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
        errorOverride={!isAuthorized ? "Account access denied." : undefined} 
      />
    );
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 animate-in fade-in duration-500`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar currentLang={currentLang} activeTab={activeTab} setActiveTab={setActiveTab} />
      
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
            
            {/* Admin Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100 hover:border-orange-200 transition-all ${isProfileOpen ? 'ring-2 ring-orange-100' : ''}`}
              >
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.email || 'Admin'}`} className="w-8 h-8 rounded-full border border-orange-100" alt="Admin" />
                <div className="flex flex-col text-start max-w-[120px]">
                  <span className="text-xs font-bold text-slate-700 leading-none truncate">{getDisplayName()}</span>
                  <span className="text-[10px] text-orange-500 font-bold uppercase">{t.staff}</span>
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

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: t.places, value: places?.length || 0, icon: <MapPin className="text-orange-500" />, trend: 'Live' },
                { label: t.views, value: '12.4k', icon: <Eye className="text-blue-500" />, trend: '+5%' },
                { label: t.subscribers, value: '2.8k', icon: <Users className="text-purple-500" />, trend: 'Stable' },
                { label: t.systemStatus, value: 'Online', icon: <TrendingUp className="text-green-500" />, trend: 'Healthy' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
                    <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full uppercase">
                      {stat.trend}
                    </span>
                  </div>
                  <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</h4>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 min-h-[400px]">
                <h3 className="font-bold text-slate-800 text-lg mb-8">{t.visitorsOverview}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                      <Bar dataKey="visits" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-8">{t.categories}</h3>
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">{places?.length || 0}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{t.totalPlaces}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'places' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t.manageAssets}</h3>
                <p className="text-sm text-slate-400">Add or edit database records in real-time</p>
              </div>
              <button 
                onClick={() => { setEditingPlace(undefined); setIsFormOpen(true); }}
                className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus size={20} /> {t.newPlace}
              </button>
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
                    onEdit={(p) => { setEditingPlace(p); setIsFormOpen(true); }}
                    onDelete={handleDeletePlace}
                  />
                ))}
                {filteredPlaces.length === 0 && !dataLoading && (
                   <div className="col-span-full py-20 text-center">
                      <p className="text-slate-400">{t.noRecords}</p>
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
               <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 relative">
                  <div className={`absolute -bottom-12 ${isRtl ? 'right-12' : 'left-12'}`}>
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.email || 'Admin'}`} 
                      className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl bg-white" 
                      alt="Profile" 
                    />
                  </div>
               </div>
               <div className={`pt-16 pb-12 px-12 space-y-8`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-1">{getDisplayName()}</h2>
                      <p className="text-slate-400">{user?.email}</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors"
                      >
                        <LogOut size={20} /> {t.signOut}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <User className="text-orange-500" size={20} /> {t.updateProfile}
                         </h3>
                         {showProfileSuccess && (
                            <div className="flex items-center gap-1.5 text-green-500 animate-in fade-in slide-in-from-right-2">
                               <CheckCircle2 size={16} />
                               <span className="text-xs font-bold uppercase">{t.profileUpdated}</span>
                            </div>
                         )}
                      </div>
                      
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.fullName}</label>
                          <input 
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none text-slate-700 font-medium"
                            placeholder={t.fullName}
                            value={profileFullName}
                            onChange={e => setProfileFullName(e.target.value)}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                        >
                          {isUpdatingProfile ? (
                            <Loader2 size={24} className="animate-spin" />
                          ) : (
                            <>
                              <Save size={20} />
                              {t.saveChanges}
                            </>
                          )}
                        </button>
                      </form>

                      <div className="space-y-6 pt-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <ShieldCheck className="text-orange-500" size={20} /> {t.accountInfo}
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.role}</p>
                            <p className="font-bold text-slate-700">{t.adminRole}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastLogin}</p>
                            <p className="font-bold text-slate-700 flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(user?.metadata?.lastSignInTime).toLocaleDateString(currentLang === 'ar' ? 'ar-DZ' : currentLang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'long' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-orange-500" size={20} /> {t.appName}
                      </h3>
                      <div className="bg-slate-50 p-8 rounded-[40px] border border-orange-50 shadow-inner">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-50">
                           <span className="text-orange-500 font-black text-2xl">T</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">
                           {translations[currentLang].appName} {translations[currentLang].adminPortal} is your central workspace for digital curation.
                        </p>
                        <ul className="mt-6 space-y-3">
                           {[
                             "Real-time tourism data sync",
                             "AI-assisted content generation",
                             "Multi-language support (AR, EN, FR)",
                             "Featured assets management"
                           ].map((feature, idx) => (
                             <li key={idx} className="flex items-center gap-2 text-sm text-slate-500">
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                {feature}
                             </li>
                           ))}
                        </ul>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white p-12 rounded-[40px] text-center shadow-sm border border-slate-100">
             <Layers className="text-orange-500 animate-pulse mx-auto mb-6" size={48} />
             <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.categories}</h2>
             <p className="text-slate-400">Advanced settings are coming soon.</p>
          </div>
        )}
      </main>

      {isFormOpen && (
        <PlaceForm 
          place={editingPlace} 
          currentLang={currentLang}
          onSave={handleSavePlace} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
