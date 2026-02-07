
import React, { useState, useEffect } from 'react';
import { 
  Info, 
  Users, 
  Mail, 
  Phone, 
  Facebook, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Globe, 
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { db, doc, onSnapshot, setDoc } from '../services/firebaseService';
import { AppLanguage, LocalizedText } from '../types';
import { translations } from '../translations';

interface Contributor {
  name: LocalizedText;
  email: string;
  phone_1: string;
  phone_2: string;
  facebook: string;
}

interface Owner {
  boi: LocalizedText; // Keeping 'boi' as per schema provided in prompt
  contact: {
    email: string;
    phone: string;
  };
}

interface AboutAppData {
  description: LocalizedText;
  owner: Owner;
  contributors: {
    contributor_1: Contributor;
    contributor_2: Contributor;
    contributor_3: Contributor;
    contributor_4: Contributor;
  };
}

interface AboutAppEditorProps {
  currentLang: AppLanguage;
}

const AboutAppEditor: React.FC<AboutAppEditorProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';
  
  const [editingLang, setEditingLang] = useState<AppLanguage>(currentLang);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const initialContributor = (): Contributor => ({
    name: { ar: '', en: '', fr: '' },
    email: '',
    phone_1: '',
    phone_2: '',
    facebook: ''
  });

  const initialOwner = (): Owner => ({
    boi: { ar: '', en: '', fr: '' },
    contact: { email: '', phone: '' }
  });

  const [data, setData] = useState<AboutAppData>({
    description: { ar: '', en: '', fr: '' },
    owner: initialOwner(),
    contributors: {
      contributor_1: initialContributor(),
      contributor_2: initialContributor(),
      contributor_3: initialContributor(),
      contributor_4: initialContributor()
    }
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "appConfig", "aboutApp"), (snapshot) => {
      if (snapshot.exists()) {
        const firestoreData = snapshot.data();
        setData(prev => ({
          ...prev,
          description: firestoreData.description || prev.description,
          owner: {
            boi: { ...prev.owner.boi, ...(firestoreData.owner?.boi || {}) },
            contact: { ...prev.owner.contact, ...(firestoreData.owner?.contact || {}) },
          },
          contributors: {
            contributor_1: { ...prev.contributors.contributor_1, ...(firestoreData.contributors?.contributor_1 || {}) },
            contributor_2: { ...prev.contributors.contributor_2, ...(firestoreData.contributors?.contributor_2 || {}) },
            contributor_3: { ...prev.contributors.contributor_3, ...(firestoreData.contributors?.contributor_3 || {}) },
            contributor_4: { ...prev.contributors.contributor_4, ...(firestoreData.contributors?.contributor_4 || {}) },
          }
        }));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "appConfig", "aboutApp"), data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateDesc = (val: string) => {
    setData(prev => ({
      ...prev,
      description: { ...prev.description, [editingLang]: val }
    }));
  };

  const updateOwnerBio = (val: string) => {
    setData(prev => ({
      ...prev,
      owner: {
        ...prev.owner,
        boi: { ...prev.owner.boi, [editingLang]: val }
      }
    }));
  };

  const updateOwnerContact = (field: 'email' | 'phone', val: string) => {
    setData(prev => ({
      ...prev,
      owner: {
        ...prev.owner,
        contact: { ...prev.owner.contact, [field]: val }
      }
    }));
  };

  const updateContributor = (key: keyof AboutAppData['contributors'], field: keyof Contributor, val: any) => {
    setData(prev => {
      const contributor = prev.contributors[key] || initialContributor();
      return {
        ...prev,
        contributors: {
          ...prev.contributors,
          [key]: {
            ...contributor,
            [field]: val
          }
        }
      };
    });
  };

  const updateContributorName = (key: keyof AboutAppData['contributors'], val: string) => {
    setData(prev => {
      const contributor = prev.contributors[key] || initialContributor();
      return {
        ...prev,
        contributors: {
          ...prev.contributors,
          [key]: {
            ...contributor,
            name: { ...contributor.name, [editingLang]: val }
          }
        }
      };
    });
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header with Save Button and Lang Switcher */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
            <Info size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.aboutApp}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Management Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['en', 'ar', 'fr'] as const).map(l => (
              <button
                key={l}
                onClick={() => setEditingLang(l)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  editingLang === l ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
              success ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-orange-500'
            }`}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {success ? t.appInfoSaved : t.save}
          </button>
        </div>
      </div>

      {/* General Description Section */}
      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
            <MessageSquare size={20} />
          </div>
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t.appDescription} ({editingLang.toUpperCase()})</h4>
        </div>

        <textarea 
          dir={editingLang === 'ar' ? 'rtl' : 'ltr'}
          rows={6}
          placeholder="Enter app description (5-10 sentences)..."
          className="w-full bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-8 text-slate-700 leading-relaxed font-medium transition-all outline-none resize-none"
          value={data.description[editingLang] || ''}
          onChange={e => updateDesc(e.target.value)}
        />
      </div>

      {/* App Owner Section */}
      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.appOwner}</h4>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-7 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Globe size={16} className="text-orange-500" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.ownerBio} ({editingLang.toUpperCase()})</label>
            </div>
            <textarea 
              dir={editingLang === 'ar' ? 'rtl' : 'ltr'}
              rows={5}
              placeholder="About the app owner..."
              className="w-full bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-3xl p-6 text-slate-700 leading-relaxed font-medium transition-all outline-none resize-none"
              value={data.owner.boi[editingLang] || ''}
              onChange={e => updateOwnerBio(e.target.value)}
            />
          </div>

          <div className="xl:col-span-5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.contactEmail}</label>
              <div className="relative group/input">
                <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 transition-colors`} size={18} />
                <input 
                  type="email"
                  placeholder="owner@example.com"
                  className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                  value={data.owner.contact.email || ''}
                  onChange={e => updateOwnerContact('email', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.contactPhone}</label>
              <div className="relative group/input">
                <Phone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 transition-colors`} size={18} />
                <input 
                  type="tel"
                  placeholder="+213..."
                  className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                  value={data.owner.contact.phone || ''}
                  onChange={e => updateOwnerContact('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributors Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <Users className="text-orange-500" size={24} />
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t.contributors}</h4>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {(['contributor_1', 'contributor_2', 'contributor_3', 'contributor_4'] as const).map((key, idx) => (
            <div key={key} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:border-orange-200 transition-all group">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black group-hover:bg-orange-500 group-hover:text-white transition-all">
                       {idx + 1}
                    </div>
                    <h5 className="font-black text-slate-800 uppercase tracking-widest text-sm">{t.contributor} #{idx + 1}</h5>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.name} ({editingLang.toUpperCase()})</label>
                  <div className="relative group/input">
                    <Globe className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 transition-colors`} size={18} />
                    <input 
                      dir={editingLang === 'ar' ? 'rtl' : 'ltr'}
                      type="text"
                      placeholder="Contributor Name..."
                      className={`w-full ${editingLang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                      value={data.contributors[key]?.name?.[editingLang] || ''}
                      onChange={e => updateContributorName(key, e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.email}</label>
                    <div className="relative group/input">
                      <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 transition-colors`} size={18} />
                      <input 
                        type="email"
                        placeholder="email@example.com"
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                        value={data.contributors[key]?.email || ''}
                        onChange={e => updateContributor(key, 'email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.facebookPage}</label>
                    <div className="relative group/input">
                      <Facebook className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 transition-colors`} size={18} />
                      <input 
                        type="url"
                        placeholder="fb.com/page..."
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                        value={data.contributors[key]?.facebook || ''}
                        onChange={e => updateContributor(key, 'facebook', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.phone1}</label>
                    <div className="relative group/input">
                      <Phone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 transition-colors`} size={18} />
                      <input 
                        type="tel"
                        placeholder="+213..."
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                        value={data.contributors[key]?.phone_1 || ''}
                        onChange={e => updateContributor(key, 'phone_1', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.phone2}</label>
                    <div className="relative group/input">
                      <Phone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 transition-colors`} size={18} />
                      <input 
                        type="tel"
                        placeholder="+213..."
                        className={`w-full ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border-none focus:ring-2 ring-orange-100 rounded-2xl outline-none font-bold text-slate-700 transition-all`}
                        value={data.contributors[key]?.phone_2 || ''}
                        onChange={e => updateContributor(key, 'phone_2', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutAppEditor;
