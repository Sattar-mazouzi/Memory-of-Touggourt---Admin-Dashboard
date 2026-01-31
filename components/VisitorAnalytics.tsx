
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  Calendar
} from 'lucide-react';
import { db, collection, query, orderBy, getDocs, limit } from '../services/firebaseService';
import { AppLanguage } from '../types';
import { translations } from '../translations';

interface VisitorAnalyticsProps {
  currentLang: AppLanguage;
}

type RangeType = '7d' | '30d' | '1y';

const VisitorAnalytics: React.FC<VisitorAnalyticsProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.en;
  const [range, setRange] = useState<RangeType>('7d');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalInPeriod, setTotalInPeriod] = useState(0);

  // Helper to generate IDs
  const getKeys = (date: Date) => {
    const yFull = String(date.getFullYear());
    const yShort = yFull.substring(2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return {
      full: `${yFull}-${m}-${d}`,    // 2025-01-20
      short: `${yShort}-${m}-${d}`,  // 25-01-20
      mFull: `${yFull}-${m}`,        // 2025-01
      mShort: `${yShort}-${m}`       // 25-01
    };
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const timeline: any[] = [];
      const today = new Date();
      let runningTotal = 0;

      if (range === '1y') {
        for (let i = 11; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const keys = getKeys(d);
          timeline.push({
            name: d.toLocaleDateString(currentLang, { month: 'short' }),
            visits: 0,
            fullKey: keys.mFull,
            shortKey: keys.mShort,
            type: 'month'
          });
        }
      } else {
        const daysToDisplay = range === '7d' ? 7 : 30;
        for (let i = daysToDisplay - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const keys = getKeys(d);
          timeline.push({
            name: d.toLocaleDateString(currentLang, { day: 'numeric', month: 'short' }),
            visits: 0,
            fullKey: keys.full,
            shortKey: keys.short,
            type: 'day'
          });
        }
      }

      const q = query(
        collection(db, 'dailyStats'),
        orderBy('__name__', 'desc'),
        limit(400) // Large enough to cover both short and long range merges
      );

      const snapshot = await getDocs(q);
      const firestoreMap = new Map();
      snapshot.docs.forEach(doc => {
        firestoreMap.set(doc.id, doc.data().count || 0);
      });

      const mergedData = timeline.map(item => {
        let count = 0;
        if (item.type === 'month') {
          firestoreMap.forEach((val, docId) => {
            if (docId.startsWith(item.fullKey) || docId.startsWith(item.shortKey)) {
              count += val;
            }
          });
        } else {
          count = (firestoreMap.get(item.fullKey) || 0) + (firestoreMap.get(item.shortKey) || 0);
        }
        runningTotal += count;
        return { ...item, visits: count };
      });

      setData(mergedData);
      setTotalInPeriod(runningTotal);
    } catch (err: any) {
      console.error('Stats fetch error:', err);
      setError(err.message || 'Failed to connect to stats database.');
      setData([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range, currentLang]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={10} className="text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          </div>
          <p className="text-xl font-black text-orange-600">
            {payload[0].value.toLocaleString()} 
            <span className="text-xs text-slate-400 ml-1 font-medium">{t.views}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-slate-100 min-h-[450px] flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2 mb-1">
            <TrendingUp className="text-orange-500" size={20} />
            {t.visitorsOverview}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              {loading ? '...' : totalInPeriod.toLocaleString()} {t.views} {t.totalVisitors?.toLowerCase() || ''}
            </span>
            <button 
              onClick={fetchStats}
              className="p-1 text-slate-300 hover:text-orange-500 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {(['7d', '30d', '1y'] as RangeType[]).map(id => (
            <button
              key={id}
              onClick={() => setRange(id)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                range === id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[320px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-red-400 p-8 text-center">
            <AlertCircle size={40} />
            <p className="text-sm font-bold">{error}</p>
            <button onClick={fetchStats} className="px-6 py-2 bg-slate-100 rounded-xl text-xs text-orange-500 font-black uppercase hover:bg-slate-200 transition-colors">Retry</button>
          </div>
        ) : (
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 9, fontWeight: 700}} 
                  dy={10}
                  interval={range === '30d' ? 4 : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} 
                />
                <Tooltip 
                  cursor={{fill: '#F8FAFC', radius: 12}} 
                  content={<CustomTooltip />}
                />
                <Bar 
                  dataKey="visits" 
                  fill="#F97316" 
                  radius={[8, 8, 0, 0]} 
                  barSize={range === '7d' ? 45 : range === '30d' ? 12 : 30}
                  minPointSize={5}
                  animationDuration={1000}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.visits > 0 ? '#F97316' : '#E2E8F0'} 
                      fillOpacity={entry.visits > 0 ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!loading && totalInPeriod === 0 && !error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 bg-slate-50 py-3 rounded-2xl border border-slate-100">
          <Info size={14} className="text-orange-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-center">Connected to dailyStats: No visits found for this period.</p>
        </div>
      )}
    </div>
  );
};

export default VisitorAnalytics;
