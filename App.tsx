
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PlaceCard from './components/PlaceCard';
import PlaceForm from './components/PlaceForm';
import LoginPage from './components/LoginPage';
import { Place, CategoryType } from './types';
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
  Bell, 
  Search, 
  Plus, 
  TrendingUp, 
  Users, 
  Eye, 
  MapPin, 
  Settings, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [places, setPlaces] = useState<Place[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Handle Authentication and Role Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Check if user has admin role in Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setUser(currentUser);
            setIsAuthorized(true);
          } else {
            // Not an admin - sign them out
            console.error("Unauthorized access attempt.");
            setIsAuthorized(false);
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
          console.error("Error verifying permissions:", err);
          setIsAuthorized(false);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Sync for Places
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "places"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const placesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Place[];
      setPlaces(placesList);
      setDataLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const statsData = [
    { name: 'Jan', visits: 400 },
    { name: 'Feb', visits: 300 },
    { name: 'Mar', visits: 600 },
    { name: 'Apr', visits: 800 },
    { name: 'May', visits: 500 },
    { name: 'Jun', visits: 900 },
  ];

  const categoryData = Object.values(CategoryType).map(cat => ({
    name: cat,
    value: places.filter(p => p.category === cat).length
  }));

  const COLORS_PIE = ['#F97316', '#38BDF8', '#818CF8', '#F472B6'];

  const handleSavePlace = async (placeData: Partial<Place>) => {
    try {
      if (editingPlace) {
        const placeRef = doc(db, "places", editingPlace.id);
        await updateDoc(placeRef, { ...placeData });
      } else {
        await addDoc(collection(db, "places"), {
          ...placeData,
          createdAt: new Date()
        });
      }
      setIsFormOpen(false);
      setEditingPlace(undefined);
    } catch (err) {
      alert("Failed to save: " + (err as Error).message);
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (confirm('Are you sure you want to delete this place permanently from the city database?')) {
      try {
        await deleteDoc(doc(db, "places", id));
      } catch (err) {
        alert("Delete failed: " + (err as Error).message);
      }
    }
  };

  const filteredPlaces = places.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage errorOverride={!isAuthorized ? "You do not have administrative privileges." : undefined} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 animate-in fade-in duration-700">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8">
        {/* Top Navbar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-slate-400 text-sm">Tourgourt Tourism Database</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search places..."
                className="pl-10 pr-4 py-2 bg-white border border-transparent focus:border-orange-200 rounded-full text-sm outline-none transition-all shadow-sm w-64"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2.5 bg-white rounded-full text-slate-400 hover:text-orange-500 transition-colors shadow-sm">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} className="w-8 h-8 rounded-full border border-orange-100" alt="Admin" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 leading-none">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-orange-500 font-bold uppercase">Administrator</span>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Places', value: places.length, icon: <MapPin className="text-orange-500" />, trend: 'Live Data' },
                { label: 'Total Visits', value: '12.4k', icon: <Eye className="text-blue-500" />, trend: '+5%' },
                { label: 'Subscribers', value: '2,840', icon: <Users className="text-purple-500" />, trend: '+18%' },
                { label: 'Status', value: 'Online', icon: <TrendingUp className="text-green-500" />, trend: 'Stable' },
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
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-slate-800 text-lg">App Visitors Trend</h3>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs font-bold text-slate-500">Live Traffic</span>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="visits" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart / Categories */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-8">Category Distribution</h3>
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
                      <p className="text-2xl font-bold text-slate-800">{places.length}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                   {categoryData.map((cat, i) => (
                     <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS_PIE[i % COLORS_PIE.length]}}></div>
                           <span className="text-slate-500 font-medium">{cat.name}</span>
                        </div>
                        <span className="font-bold text-slate-700">{cat.value}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'places' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Manage Places</h3>
                <p className="text-sm text-slate-400">Add or edit city landmarks directly in Firestore</p>
              </div>
              <button 
                onClick={() => {
                  setEditingPlace(undefined);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95"
              >
                <Plus size={20} />
                Add New Place
              </button>
            </div>

            {dataLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                 <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                 <p className="text-slate-400 font-medium">Fetching Touggourt treasures...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlaces.map(place => (
                  <PlaceCard 
                    key={place.id} 
                    place={place} 
                    onEdit={(p) => {
                      setEditingPlace(p);
                      setIsFormOpen(true);
                    }}
                    onDelete={handleDeletePlace}
                  />
                ))}
                {filteredPlaces.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                     <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Search size={40} />
                     </div>
                     <h3 className="text-slate-800 font-bold">No places found</h3>
                     <p className="text-slate-400">Try adjusting your search or add a new place.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'categories' || activeTab === 'settings') && (
          <div className="bg-white p-12 rounded-[40px] text-center shadow-sm border border-slate-100 animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="text-orange-500 animate-pulse" size={48} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">System Config</h2>
             <p className="text-slate-400 max-w-md mx-auto">This section allows editing city-wide metadata and about sections stored in the 'aboutCity' collection.</p>
             <button 
              onClick={() => setActiveTab('dashboard')}
              className="mt-8 px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all"
             >
                Go Back to Dashboard
             </button>
          </div>
        )}
      </main>

      {isFormOpen && (
        <PlaceForm 
          place={editingPlace} 
          onSave={handleSavePlace} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
