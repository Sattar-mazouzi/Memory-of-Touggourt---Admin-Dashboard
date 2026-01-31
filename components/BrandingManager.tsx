
import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Upload, 
  Link as LinkIcon, 
  Loader2, 
  Image as ImageIcon, 
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { db, doc, setDoc, onSnapshot } from '../services/firebaseService';
import { uploadImage } from '../services/cloudinaryService';
import { AppLanguage } from '../types';
import { translations } from '../translations';

interface BrandingManagerProps {
  currentLang: AppLanguage;
}

const BrandingManager: React.FC<BrandingManagerProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';
  
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "appConfig", "logo"), (snapshot) => {
      if (snapshot.exists()) {
        setLogoUrl(snapshot.data().mainLogo || '');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveLogo = async (url: string) => {
    try {
      await setDoc(doc(db, "appConfig", "logo"), {
        mainLogo: url,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setLogoUrl(url);
      await handleSaveLogo(url);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start text-center lg:text-start">
          
          {/* Logo Preview Section */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="w-48 h-48 bg-slate-50 rounded-[48px] border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative group">
                {logoUrl ? (
                  <img src={logoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="App Logo" />
                ) : (
                  <div className="text-slate-200">
                    <ImageIcon size={64} className="opacity-20" />
                  </div>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              {success && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg animate-in zoom-in duration-300">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.appLogo}</p>
          </div>

          {/* Controls Section */}
          <div className="flex-1 space-y-8 py-2">
            <div>
              <div className="flex items-center gap-3 mb-2 justify-center lg:justify-start">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <Palette size={20} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{t.appBranding}</h3>
              </div>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">
                {t.brandingDesc}
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <LinkIcon className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors`} size={18} />
                <input 
                  type="url"
                  placeholder="Direct Logo URL (HTTPS)..."
                  className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-4 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-sm text-slate-600 transition-all`}
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    if (e.target.value.startsWith('http')) {
                       handleSaveLogo(e.target.value);
                    }
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-500 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  {t.uploadLogo}
                </button>
                
                <button 
                  onClick={() => setLogoUrl('')}
                  className="px-6 py-4 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl font-black transition-all hover:bg-red-50"
                >
                  <RefreshCw size={20} />
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-orange-700 leading-normal uppercase">
                  {isRtl 
                    ? 'نوصي باستخدام صورة مربعة (1:1) بخلفية شفافة (PNG) وبحجم لا يتجاوز 512 بكسل للحصول على أفضل مظهر.'
                    : 'Recommended: Square image (1:1) with transparent background (PNG), max 512px for optimal performance.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png,image/jpeg,image/webp" 
        onChange={handleFileUpload} 
      />
    </div>
  );
};

export default BrandingManager;
