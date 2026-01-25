
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
  Calendar,
  Search,
  AlertCircle,
  UserCheck
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
  query,
  where,
  getDocs
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
  const [addError, setAddError] = useState<string | null>(null);
  
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('content manager');
  const [submitting, setSubmitting] = useState(false);

  // Deletion Modal State
  const [uidToDelete, setUidToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Only fetch users who are part of the management team
    const q = query(
      collection(db, "users"), 
      where("role", "in", ["admin", "content manager"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        fullName: doc.data().fullName || doc.data().full_name || 'Admin'
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

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail) return;
    
    setSubmitting(true);
    setAddError(null);
    
    try {
      // 1. Find the user by email
      const q = query(collection(db, "users"), where("email", "==", newStaffEmail.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setAddError(isRtl 
          ? "لم يتم العثور على مستخدم بهذا البريد الإلكتروني. يجب على الشخص التسجيل في التطبيق أولاً." 
          : "User not found. The person must sign up in the mobile app first.");
        setSubmitting(false);
        return;
      }

      // 2. Update the first matching user's role
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        role: newStaffRole
      });

      setIsAdding(false);
      setNewStaffEmail('');
    } catch (err: any) {
      console.error("Promotion failed", err);
      setAddError(err.message || "Failed to update user role.");
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
      // Instead of deleting the user entirely, we demote them back to visitor
      // This preserves their account if they were a legitimate app user
      await updateDoc(doc(db, "users", uidToDelete), { role: 'visitor' });
      setUidToDelete(null);
    } catch (err) {
      console.error("Demotion failed", err);
      alert("Failed to demote staff member.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-1">
            <Users size={24} className="text-orange-500" />
            {t.staffTitle}
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.staffDesc}</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setAddError(null); }}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus size={20} /> {t.newStaff}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2">
          <AlertCircle className="shrink-0" size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 shadow-sm gap-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.loading}</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className={`px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start`}>{t.fullName}</th>
                  <th className={`px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start`}>{t.email}</th>
                  <th className={`px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start`}>{t.role}</th>
                  <th className={`px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center`}>{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staffList.map((member) => (
                  <tr key={member.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-black shadow-inner">
                          {member.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 leading-none mb-1">{member.fullName}</p>
                          {member.age && <p className="text-[10px] text-slate-400 font-bold uppercase">{t.age}: {member.age}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 text-sm font-bold tracking-tight">{member.email}</td>
                    <td className="px-8 py-5">
                      <div className="relative inline-block w-48">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.uid, e.target.value as UserRole)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-slate-700 focus:ring-2 ring-orange-100 outline-none appearance-none transition-all"
                        >
                          <option value="admin">{t.adminRole}</option>
                          <option value="content manager">{t.managerRole}</option>
                        </select>
                        <Shield size={14} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none`} />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleRequestDeleteStaff(member.uid)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                          title={isRtl ? "تخفيض الرتبة إلى زائر" : "Demote to Visitor"}
                        >
                          <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {staffList.length === 0 && !loading && (
            <div className="py-24 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users size={32} className="text-slate-200" />
               </div>
               <p className="text-slate-400 font-black text-xs uppercase tracking-widest">{t.noRecords}</p>
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
        isOpen={!!uidToDelete}
        onClose={() => setUidToDelete(null)}
        onConfirm={executeDeleteStaff}
        isLoading={isDeleting}
        title={isRtl ? 'إلغاء صلاحيات الموظف' : 'Revoke Staff Access'}
        message={isRtl 
          ? 'هل أنت متأكد من رغبتك في سحب صلاحيات هذا الموظف؟ سيتم تغيير رتبته إلى "زائر" ولن يتمكن من الوصول إلى لوحة الإدارة.' 
          : 'Are you sure you want to revoke this user\'s staff access? Their role will be changed to "Visitor" and they will lose all admin permissions.'}
        currentLang={currentLang}
      />

      {/* Add Staff Modal (Promote User) */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-inner">
                  <UserCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{t.newStaff}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isRtl ? 'ترقية مستخدم موجود' : 'Promote Existing User'}</p>
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handlePromoteUser} className="p-10 space-y-8">
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-start gap-3">
                 <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                 <p className="text-xs font-bold text-orange-700 leading-relaxed">
                   {isRtl 
                     ? "لإضافة موظف جديد، يجب أن يكون الشخص مسجلاً بالفعل في التطبيق. أدخل بريده الإلكتروني أدناه لترقية حسابه."
                     : "To add a new staff member, the person must already have a registered account in the mobile app. Enter their email below to promote them."}
                 </p>
              </div>

              {addError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-bold border border-red-100 animate-in shake-1">
                  <X size={18} />
                  {addError}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.email}</label>
                <div className="relative group">
                  <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors`} size={20} />
                  <input
                    type="email"
                    required
                    placeholder="example@touggourt.dz"
                    className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                    value={newStaffEmail}
                    onChange={e => setNewStaffEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.role}</label>
                <div className="relative">
                  <Shield className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors`} size={20} />
                  <select
                    className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-black text-slate-700 appearance-none transition-all`}
                    value={newStaffRole}
                    onChange={e => setNewStaffRole(e.target.value as UserRole)}
                  >
                    <option value="content manager">{t.managerRole}</option>
                    <option value="admin">{t.adminRole}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={24} /> : <><UserCheck size={20} /> {isRtl ? 'تأكيد الترقية' : 'Confirm Promotion'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
