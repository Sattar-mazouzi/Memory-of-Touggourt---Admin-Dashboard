
import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Layers, 
  Settings, 
  LogOut,
  Users,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { signOut, auth } from '../services/firebaseService';
import { AppLanguage, UserRole } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  currentLang: AppLanguage;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ currentLang, activeTab, setActiveTab, userRole }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={20} /> },
    { id: 'places', label: t.places, icon: <MapPin size={20} /> },
    { id: 'gallery', label: t.gallery, icon: <ImageIcon size={20} /> },
    { id: 'aboutCity', label: t.aboutCity, icon: <Info size={20} /> },
    { id: 'categories', label: t.categories, icon: <Layers size={20} /> },
    { id: 'staff', label: t.staff, icon: <Users size={20} />, adminOnly: true },
    { id: 'settings', label: t.settings, icon: <Settings size={20} /> },
  ];

  const filteredItems = navItems.filter(item => !item.adminOnly || userRole === 'admin');

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className={`w-64 h-screen bg-white border-${isRtl ? 'l' : 'r'} border-slate-100 flex flex-col fixed ${isRtl ? 'right-0' : 'left-0'} top-0 z-30 transition-all duration-300`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
          T
        </div>
        <div>
          <h1 className="font-bold text-slate-800 leading-tight">{t.appName}</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{t.adminPortal}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-orange-50 text-orange-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className={isRtl ? 'ml-0' : 'mr-0'}>{item.icon}</div>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm">{t.signOut}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
