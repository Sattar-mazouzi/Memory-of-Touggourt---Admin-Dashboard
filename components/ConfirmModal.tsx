
import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../translations';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  currentLang: AppLanguage;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  currentLang, 
  isLoading = false,
  variant = 'danger'
}) => {
  if (!isOpen) return null;
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            <AlertTriangle size={40} />
          </div>
          
          <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">{message}</p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                variant === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : t.saveChanges.includes('حفظ') ? 'تأكيد الحذف' : 'Confirm Deletion'}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
