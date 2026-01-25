
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  UserPlus, 
  Trash2, 
  Loader2,
  CheckCircle2,
  X,
  Calendar
} from 'lucide-react';
import { AppLanguage, CityStaff, UserRole } from '../types';
import { translations } from '../translations';
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query 
} from '../services/firebaseService';
import ConfirmModal from './ConfirmModal';

interface StaffManagerProps {
  currentLang: AppLanguage;
}

const StaffManager: React.FC<StaffManagerProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';
  
  const [staffList, setStaffList] = useState<CityStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('content manager');
  const [submitting, setSubmitting] = useState(false);

  // Deletion Modal State
  const [uidToDelete, setUidToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        fullName: doc.data().fullName || doc.data().full_name // Migration support
      })) as CityStaff[];
      setStaffList(list);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Staff List Error:", err);
      setError("Permission Denied: Admins need list access to users in Firestore Rules.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffName) return;
    
    setSubmitting(true);
    try {
      const dummyId = `user_${Date.now()}`;
      await setDoc(doc(db, "users", dummyId), {
        email: newStaffEmail,
        fullName: newStaffName, // Using new fullName field
        role: newStaffRole,
        created_at: new Date().toISOString()
      });
      setIsAdding(false);
      setNewStaffEmail('');
      setNewStaffName('');
    } catch (err) {
      console.error("Add staff failed", err);
      alert("Failed to add staff. Check admin permissions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
    } catch (err) {
      console.error("Role update failed", err);
      alert("Failed to update role.");
    }
  };

  const handleRequestDeleteStaff = (uid: string) => {
    setUidToDelete(uid);
  };

  const executeDeleteStaff = async () => {
    if (!uidToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", uidToDelete));
      setUidToDelete(null);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete staff member.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{t.staffTitle}</h3>
          <p className="text-sm text-slate-400">{t.staffDesc}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus size={20} /> {t.newStaff}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2">
          <X className="shrink-0" size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-start">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-start`}>{t.fullName}</th>
                <th className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-start`}>{t.email}</th>
                <th className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-start`}>{t.age}</th>
                <th className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-start`}>{t.role}</th>
                <th className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center`}>{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staffList.map((member) => (
                <tr key={member.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        {member.fullName?.charAt(0) || '?'}
                      </div>
                      <span className="font-bold text-slate-700">{member.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">{member.email}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-bold">{member.age || '-'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.uid, e.target.value as UserRole)}
                      className="bg-white border border-slate-100 rounded-lg px-3 py-1 text-xs font-bold text-slate-700 focus:ring-2 ring-orange-100 outline-none"
                    >
                      <option value="admin">{t.adminRole}</option>
                      <option value="content manager">{t.managerRole}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleRequestDeleteStaff(member.uid)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staffList.length === 0 && !loading && (
            <div className="py-20 text-center text-slate-400">{t.noRecords}</div>
          )}
        </div>
      )}

      <ConfirmModal 
        isOpen={!!uidToDelete}
        onClose={() => setUidToDelete(null)}
        onConfirm={executeDeleteStaff}
        isLoading={isDeleting}
        title={isRtl ? 'حذف الموظف' : 'Remove Staff Member'}
        message={isRtl ? 'هل أنت متأكد من رغبتك في إزالة هذا الموظف من فريق العمل؟ لن يتمكن من الوصول إلى لوحة الإدارة بعد ذلك.' : 'Are you sure you want to remove this staff member? They will lose all administrative access immediately.'}
        currentLang={currentLang}
      />

      {/* Add Staff Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{t.newStaff}</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.fullName}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.email}</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all"
                  value={newStaffEmail}
                  onChange={e => setNewStaffEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.role}</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-orange-100 transition-all"
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value as UserRole)}
                >
                  <option value="content manager">{t.managerRole}</option>
                  <option value="admin">{t.adminRole}</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> {t.save}</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
