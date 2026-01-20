
import React, { useState, useEffect, useMemo } from 'react';
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
  Globe
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

  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    document.dir = isRtl ? 'rtl' : 'ltr';
    localStorage.setItem('admin_lang', currentLang);
  }, [currentLang, isRtl]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data()?.role === 'admin') {
            setUser(currentUser);
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

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const list = places || [];
    return list.filter(p => {
      const nameCurrent = String(p?.name?.[currentLang] || '').toLowerCase();
      const addrCurrent = String(p?.address?.[currentLang] || '').toLowerCase();
      return nameCurrent.includes(q) || addrCurrent.includes(q);
    });
  }, [places, searchQuery, currentLang]);

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
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'Admin'}`} className="w-8 h-8 rounded-full border border-orange-100" alt="Admin" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 leading-none">{user?.email?.split('@')[0] || 'Admin'}</span>
                <span className="text-[10px] text-orange-500 font-bold uppercase">{t.staff}</span>
              </div>
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

        {(activeTab === 'categories' || activeTab === 'settings') && (
          <div className="bg-white p-12 rounded-[40px] text-center shadow-sm border border-slate-100">
             <Settings className="text-orange-500 animate-pulse mx-auto mb-6" size={48} />
             <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.settings}</h2>
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
