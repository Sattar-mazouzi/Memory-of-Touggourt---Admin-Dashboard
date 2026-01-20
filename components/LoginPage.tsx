
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ChevronRight, AlertCircle, Globe } from 'lucide-react';
import { signInWithEmailAndPassword, auth } from '../services/firebaseService';
import { AppLanguage } from '../types';
import { translations } from '../translations';

interface LoginPageProps {
  currentLang: AppLanguage;
  onLangChange: (lang: AppLanguage) => void;
  errorOverride?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ currentLang, onLangChange, errorOverride }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    if (errorOverride) setError(errorOverride);
  }, [errorOverride]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Language Switcher Floating */}
      <div className={`absolute top-8 ${isRtl ? 'left-8' : 'right-8'} z-20 flex bg-white/50 backdrop-blur p-1 rounded-xl border border-white/20 shadow-xl`}>
        {(['en', 'ar', 'fr'] as const).map(l => (
          <button
            key={l}
            onClick={() => onLangChange(l)}
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
              currentLang === l ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:text-orange-500'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Left side: Visuals */}
      <div className={`hidden lg:flex lg:w-1/2 bg-orange-500 relative items-center justify-center p-20`}>
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
            <span className="text-orange-500 font-black text-3xl">T</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">{t.appName} {t.adminPortal}</h1>
          <p className="text-orange-50 text-xl font-medium leading-relaxed opacity-90">
            Manage your city's digital heritage. Add places, update stories, and guide visitors through the beauty of the Sahara.
          </p>
          
          <div className="mt-12 flex gap-4">
             <div className="h-1 w-12 bg-white rounded-full"></div>
             <div className="h-1 w-4 bg-white/40 rounded-full"></div>
             <div className="h-1 w-4 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
             <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">T</div>
             <h1 className="font-bold text-slate-800 text-xl">{t.appName}</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{t.welcomeBack}</h2>
            <p className="text-slate-500">{t.signInDesc}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className={`text-xs font-bold text-slate-400 uppercase tracking-widest ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.email}</label>
              <div className="relative group">
                <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-slate-400 group-focus-within:text-orange-500 transition-colors`} size={20} />
                <input
                  type="email"
                  required
                  placeholder="admin@touggourt.dz"
                  className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none text-slate-700`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold text-slate-400 uppercase tracking-widest ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.password}</label>
              <div className="relative group">
                <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-slate-400 group-focus-within:text-orange-500 transition-colors`} size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl transition-all outline-none text-slate-700`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                <label htmlFor="remember" className="text-sm text-slate-500 font-medium">{t.rememberMe}</label>
              </div>
              <button type="button" className="text-sm text-orange-600 font-bold hover:text-orange-700 transition-colors">{t.forgotPassword}</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  {t.signIn}
                  <ChevronRight size={20} className={`${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-transform`} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm">
            {t.accessRestricted}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
