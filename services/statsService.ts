
import { db, doc, increment, writeBatch, serverTimestamp } from './firebaseService';

/**
 * Tracks a new visitor session if it's the first time in the current browser session.
 */
export const trackSession = async () => {
  const SESSION_KEY = 'touggourt_session_tracked';
  
  // Prevent multiple increments per session
  if (sessionStorage.getItem(SESSION_KEY)) return;

  try {
    const batch = writeBatch(db);
    
    // 1. Increment Global Total
    const globalRef = doc(db, 'appStats', 'global');
    batch.set(globalRef, { 
      totalSessions: increment(1) 
    }, { merge: true });

    // 2. Increment Daily Total
    const now = new Date();
    const year2Digit = String(now.getFullYear()).substring(2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year2Digit}-${month}-${day}`; // Format: YY-MM-DD

    const dailyRef = doc(db, 'dailyStats', todayStr);
    
    batch.set(dailyRef, { 
      count: increment(1),
      date: todayStr,
      lastUpdate: serverTimestamp()
    }, { merge: true });

    await batch.commit();
    sessionStorage.setItem(SESSION_KEY, 'true');
    console.log('[Stats] Session tracked successfully for:', todayStr);
  } catch (err: any) {
    console.error('[Stats] Tracking failed:', err.message);
  }
};
