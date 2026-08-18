import React, { useState, useEffect } from 'react';
import { Flame, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSetting, setSetting } from '../lib/storage';
import { subscribeToAuth, getAuthHeader } from '../lib/firebase';

export default function StreakCounter() {
  const [streakCount, setStreakCount] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [user, setUser] = useState(null);

  // Load streak from localStorage or python API on boot
  useEffect(() => {
    const loadStreak = async () => {
      // 1. Try local settings first
      const localStreak = await getSetting('yc_builder_streak');
      const localLastCheckIn = await getSetting('yc_last_check_in');
      
      const parsedStreak = localStreak ? parseInt(localStreak) : 0;
      setStreakCount(parsedStreak);
      setLastCheckIn(localLastCheckIn || null);

      // 2. If logged in, fetch/sync from backend
      const unsubscribe = subscribeToAuth(async (u) => {
        setUser(u);
        if (u) {
          try {
            const header = getAuthHeader();
            const res = await fetch('/api/streaks', {
              headers: { 'Authorization': header }
            });
            if (res.ok) {
              const data = await res.json();
              setStreakCount(data.streak);
              setLastCheckIn(data.lastCheckIn);
              
              // Sync back to local storage
              await setSetting('yc_builder_streak', data.streak.toString());
              await setSetting('yc_last_check_in', data.lastCheckIn || '');
            }
          } catch (e) {
            console.warn("Could not load streak from backend:", e);
          }
        }
      });
      return () => unsubscribe();
    };

    loadStreak();
  }, []);

  // Check-in helper (run automatically when user performs a builder action)
  useEffect(() => {
    const handleCheckIn = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      if (lastCheckIn === todayStr) return; // Already checked in today

      // Update state optimistically
      let newStreak = streakCount;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastCheckIn === yesterdayStr) {
        newStreak += 1;
      } else if (lastCheckIn === null || lastCheckIn !== todayStr) {
        newStreak = 1; // Streak resets/starts fresh
      }

      setStreakCount(newStreak);
      setLastCheckIn(todayStr);

      await setSetting('yc_builder_streak', newStreak.toString());
      await setSetting('yc_last_check_in', todayStr);

      // Sync to backend if logged in
      if (user) {
        try {
          const header = getAuthHeader();
          await fetch('/api/streaks/check-in', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': header 
            }
          });
        } catch (e) {
          console.warn("Failed to sync check-in to backend:", e);
        }
      }
    };

    // Listen to builder events to trigger check-in
    window.addEventListener('yc_company_inspected', handleCheckIn);
    window.addEventListener('yc_note_written', handleCheckIn);
    window.addEventListener('yc_challenge_completed', handleCheckIn);

    return () => {
      window.removeEventListener('yc_company_inspected', handleCheckIn);
      window.removeEventListener('yc_note_written', handleCheckIn);
      window.removeEventListener('yc_challenge_completed', handleCheckIn);
    };
  }, [streakCount, lastCheckIn, user]);

  const getStreakMessage = () => {
    const today = new Date().toISOString().split('T')[0];
    if (lastCheckIn === today) {
      return "You're checked in today! Streak safe. 🔥";
    }
    return "Check in today by studying a startup or writing a note!";
  };

  return (
    <div 
      className="relative flex items-center select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        className={`flex items-center space-x-1.5 px-3 py-1 rounded border-2 border-black font-mono-tech text-xs font-bold cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
          ${streakCount > 0 
            ? 'bg-neon-orange text-white border-black animate-pulse-slow shadow-[2px_2px_0px_0px_#000]' 
            : 'bg-white text-black'
          }`}
      >
        <Flame className={`w-4 h-4 ${streakCount > 0 ? 'fill-current' : ''}`} />
        <span>{streakCount} {streakCount === 1 ? 'DAY' : 'DAYS'}</span>
      </div>

      {/* Tooltip detail overlay */}
      {showTooltip && (
        <div className="absolute top-10 right-0 z-50 w-64 brutal-card p-4 bg-white text-black text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono-code text-[10px]">
          <div className="flex items-center space-x-1 mb-2 border-b border-zinc-200 pb-1.5 font-mono-tech text-xs font-black uppercase text-neon-orange">
            <Flame className="w-4 h-4 fill-current" />
            <span>Builder Streak Status</span>
          </div>

          <div className="space-y-2 leading-relaxed">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">CURRENT STREAK:</span>
              <span className="font-extrabold">{streakCount} Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">LAST CHECK-IN:</span>
              <span className="font-extrabold">{lastCheckIn || 'Never'}</span>
            </div>
            
            <div className="border-t border-dashed border-zinc-200 my-2 pt-2 flex items-start space-x-1 text-slate-800 font-sans italic text-[9px]">
              {lastCheckIn === new Date().toISOString().split('T')[0] ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-neon-emerald shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-neon-orange shrink-0 mt-0.5 animate-bounce" />
              )}
              <span>{getStreakMessage()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
