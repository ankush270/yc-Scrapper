import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  X, Award, ShieldCheck, Flame, Calendar, Database,
  Share2, Check, Compass, Notebook, Hammer, Cpu, Folder
} from 'lucide-react';
import { getUnlockedAchievements } from '../lib/achievements';
import { getStat } from '../lib/storage';
import { subscribeToAuth, fetchUserProfile, syncUserProfile } from '../lib/firebase';
import AchievementsPanel from './AchievementsPanel';

gsap.registerPlugin(useGSAP);

export default function PublicProfile({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Fetch stats and sync when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const loadProfileData = async () => {
        const compViewed = await getStat('companies_viewed');
        const notesWritten = await getStat('notes_written');
        const projectsCreated = await getStat('sandbox_projects_created');
        const aiAnalyses = await getStat('ai_analyses_run');
        const challenges = await getStat('challenges_completed');
        const regions = await getStat('regions_explored');
        const collections = await getStat('collections_created');

        const activeStats = {
          companies_viewed: compViewed,
          notes_written: notesWritten,
          sandbox_projects_created: projectsCreated,
          ai_analyses_run: aiAnalyses,
          challenges_completed: challenges,
          regions_explored: regions,
          collections_created: collections
        };
        setStats(activeStats);

        const list = await getUnlockedAchievements();
        setAchievements(list);

        // Sync with Firestore/LocalProfile
        await syncUserProfile(user, activeStats, list);
      };

      loadProfileData();
    }
  }, [isOpen, user]);

  useGSAP(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, { scope: modalRef, dependencies: [isOpen] });

  const handleShareStats = () => {
    if (!user) return;
    const scoreText = `🚀 YC_DECODE Stats for ${user.displayName}:
- Startups Viewed: ${stats.companies_viewed || 0}
- Study Takeaways Logged: ${stats.notes_written || 0}
- Sandbox Project Ideas: ${stats.sandbox_projects_created || 0}
- AI Analyses Run: ${stats.ai_analyses_run || 0}
- Achievements Unlocked: ${achievements.length} badges!

Track your YC builder milestones locally or on cloud at YC_DECODE!`;

    navigator.clipboard.writeText(scoreText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div
        ref={modalRef}
        className="brutal-card p-6 w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto relative shadow-[6px_6px_0px_0px_#000000]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-black" />
            <span className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest">
              BUILDER_PROFILE_DECK
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-700 hover:text-black cursor-pointer p-1 hover:bg-slate-100 border border-transparent hover:border-black rounded transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Bio Card */}
          <div className="brutal-card p-4 bg-obsidian-dark flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-[3px_3px_0px_0px_#000000]">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-14 h-14 rounded-full border-2 border-black overflow-hidden shrink-0 bg-white shadow-[1.5px_1.5px_0px_0px_#000000]">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-lg flex items-center justify-center h-full bg-neon-cyan">
                    {user.displayName?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-base font-mono-tech font-extrabold text-black uppercase">{user.displayName}</h3>
                <span className="font-mono-code text-[8px] bg-neon-cyan border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000] font-bold text-black inline-block">
                  COHORT MEMBER
                </span>
                <div className="flex items-center justify-center sm:justify-start space-x-1.5 font-mono-code text-[9px] text-slate-700 font-bold mt-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date().toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}</span>
                </div>
              </div>
            </div>

            {/* Share Stats */}
            <button
              onClick={handleShareStats}
              className={`brutal-btn flex items-center space-x-1.5 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-wide shrink-0 transition-all ${
                copied ? 'bg-neon-emerald' : 'bg-neon-cyan hover:bg-neon-cyan/80'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED LINK' : 'SHARE MY STATS'}</span>
            </button>
          </div>

          {/* Quick Metrics Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'EXPLORED', val: stats.companies_viewed || 0, icon: Compass, color: 'bg-neon-cyan' },
              { label: 'TAKEAWAYS', val: stats.notes_written || 0, icon: Notebook, color: 'bg-fbbf24' },
              { label: 'SANDBOX IDEAS', val: stats.sandbox_projects_created || 0, icon: Hammer, color: 'bg-neon-emerald' },
              { label: 'AI ANALYSES', val: stats.ai_analyses_run || 0, icon: Cpu, color: 'bg-a855f7' }
            ].map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="brutal-card p-3 flex flex-col items-center justify-center bg-white shadow-[2px_2px_0px_0px_#000000]">
                  <Icon className="w-4.5 h-4.5 text-black mb-1.5 shrink-0" />
                  <span className="font-mono-code text-[8px] text-slate-700 font-bold uppercase tracking-wider">{m.label}</span>
                  <span className="font-mono-tech text-lg font-extrabold text-black mt-0.5">{m.val}</span>
                </div>
              );
            })}
          </div>

          {/* Achievements Grid */}
          <AchievementsPanel />
        </div>
      </div>
    </div>
  );
}
