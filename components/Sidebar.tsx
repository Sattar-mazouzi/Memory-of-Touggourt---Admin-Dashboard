
import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Layers, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { signOut, auth } from '../services/firebaseService';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'places', label: 'Places', icon: <MapPin size={20} /> },
    { id: 'categories', label: 'Categories', icon: <Layers size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
          T
        </div>
        <div>
          <h1 className="font-bold text-slate-800 leading-tight">Memory of Touggourt</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-orange-50 text-orange-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
