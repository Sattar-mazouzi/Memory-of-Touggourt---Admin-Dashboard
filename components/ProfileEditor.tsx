
import React, { useState } from 'react';
import { User, Shield, Save, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { AppLanguage, CityStaff } from '../types';
import { translations } from '../translations';
import { db, doc, updateDoc } from '../services/firebaseService';

interface ProfileEditorProps {
  currentLang: AppLanguage;
  user: CityStaff;
  onUpdate: (updatedUser: Partial<CityStaff>) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ currentLang, user, onUpdate }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';
  
  const [fullName, setFullName] = useState(user.fullName || '');
  const [age, setAge] = useState<number | string>(user.age || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates = {
        fullName,
        age: Number(age)
      };
      
      await updateDoc(userRef, updates);
      onUpdate(updates);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update failed:', err);
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-orange-500 text-white rounded-3xl shadow-lg shadow-orange-100">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{t.profile}</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.accountInfo}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.fullName}</label>
              <div className="relative group">
                <User className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-slate-300 group-focus-within:text-orange-500 transition-colors`} size={20} />
                <input
                  type="text"
                  required
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.age}</label>
              <div className="relative group">
                <Calendar className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-slate-300 group-focus-within:text-orange-500 transition-colors`} size={20} />
                <input
                  type="number"
                  required
                  min="18"
                  max="120"
                  className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                  value={age}
                  onChange={e => setAge(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-50">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.email}</label>
            <div className="px-5 py-4 bg-slate-100/50 rounded-2xl text-slate-400 font-bold text-sm border border-slate-100">
              {user.email}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <Shield className="text-orange-500" size={20} />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{t.role}</p>
              <p className="text-xs font-black text-slate-800">{user.role === 'admin' ? t.adminRole : t.managerRole}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-5 rounded-3xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${
              showSuccess ? 'bg-green-500 shadow-green-100' : 'bg-orange-500 shadow-orange-100 hover:bg-orange-600'
            }`}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : showSuccess ? <CheckCircle2 /> : <Save />}
            {showSuccess ? t.profileUpdated : t.saveChanges}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
