import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Trophy, Compass, Notebook, Hammer, Cpu, Zap,
  Globe, Folder, Lock, CheckCircle
} from 'lucide-react';
import { getUnlockedAchievements } from '../lib/achievements';
import { BADGES } from '../lib/achievements';
import { getStat } from '../lib/storage';

gsap.registerPlugin(useGSAP);

const ICON_MAP = {
  Compass,
  Notebook,
  Hammer,
  Cpu,
  Zap,
  Globe,
  Folder,
  Trophy
};

export default function AchievementsPanel() {
  const [unlocked, setUnlocked] = useState([]);
  const [stats, setStats] = useState({});
  const gridRef = useRef(null);

  useEffect(() => {
    // Load stats and unlocked achievements
    const loadData = async () => {
      const list = await getUnlockedAchievements();
      setUnlocked(list.map(x => x.id));

      const compViewed = await getStat('companies_viewed');
      const notesWritten = await getStat('notes_written');
      const projectsCreated = await getStat('sandbox_projects_created');
      const aiAnalyses = await getStat('ai_analyses_run');
      const challenges = await getStat('challenges_completed');
      const regions = await getStat('regions_explored');
      const collections = await getStat('collections_created');

      setStats({
        companies_viewed: compViewed,
        notes_written: notesWritten,
        sandbox_projects_created: projectsCreated,
        ai_analyses_run: aiAnalyses,
        challenges_completed: challenges,
        regions_explored: regions,
        collections_created: collections
      });
    };

    loadData();
  }, []);

  useGSAP(() => {
    if (gridRef.current) {
      const items = gridRef.current.querySelectorAll('.badge-item-card');
      gsap.fromTo(items,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }, { scope: gridRef, dependencies: [unlocked] });

  // Get current progress counter for a badge
  const getBadgeProgress = (badgeId) => {
    if (badgeId === 'explorer') return { current: stats.companies_viewed || 0, target: BADGES.explorer.threshold };
    if (badgeId === 'analyst') return { current: stats.notes_written || 0, target: BADGES.analyst.threshold };
    if (badgeId === 'builder') return { current: stats.sandbox_projects_created || 0, target: BADGES.builder.threshold };
    if (badgeId === 'ai_whisperer') return { current: stats.ai_analyses_run || 0, target: BADGES.ai_whisperer.threshold };
    if (badgeId === 'streak_master') return { current: stats.challenges_completed || 0, target: BADGES.streak_master.threshold };
    if (badgeId === 'global_thinker') return { current: stats.regions_explored || 0, target: BADGES.global_thinker.threshold };
    if (badgeId === 'curator') return { current: stats.collections_created || 0, target: BADGES.curator.threshold };
    return { current: 0, target: 1 };
  };

  return (
    <div className="brutal-card p-5 bg-white space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2.5 border-b-2 border-black pb-4">
        <div className="w-9 h-9 rounded bg-neon-magenta border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Trophy className="w-4.5 h-4.5" />
        </div>
        <div>
          <h2 className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest leading-none">
            ACHIEVEMENTS_&_TROPHIES
          </h2>
          <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
            Complete milestones // unlock badges // level up your analytics
          </span>
        </div>
      </div>

      {/* Grid of Badges */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.values(BADGES).map(badge => {
          const isUnlocked = unlocked.includes(badge.id);
          const IconComponent = ICON_MAP[badge.icon] || Trophy;
          const prog = getBadgeProgress(badge.id);
          const pct = Math.min(100, Math.round((prog.current / prog.target) * 100));

          return (
            <div
              key={badge.id}
              className={`badge-item-card brutal-card p-4 flex items-start space-x-3.5 relative overflow-hidden transition-all duration-100 select-none ${
                isUnlocked 
                  ? 'bg-white hover:bg-slate-50' 
                  : 'bg-slate-100/50 opacity-70'
              }`}
            >
              {/* Badge Icon Core */}
              <div
                style={{ backgroundColor: isUnlocked ? badge.color : '#e2e8f0' }}
                className={`w-10 h-10 rounded border-2 border-black flex items-center justify-center shrink-0 text-black shadow-[2px_2px_0px_0px_#000000]`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Contents details */}
              <div className="flex-grow min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono-tech text-xs font-extrabold text-black uppercase leading-tight truncate">
                    {badge.name}
                  </h4>
                  {isUnlocked ? (
                    <CheckCircle className="w-3.5 h-3.5 text-neon-emerald shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>

                <p className="font-sans-body text-[10px] text-slate-650 leading-snug font-medium">
                  {badge.description}
                </p>

                {/* Progress bar if locked */}
                {!isUnlocked && (
                  <div className="space-y-1 pt-1.5">
                    <div className="flex justify-between font-mono-code text-[8px] text-slate-500 font-bold">
                      <span>Progress</span>
                      <span>{prog.current} / {prog.target}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 border border-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {isUnlocked && (
                  <span className="font-mono-code text-[7px] text-neon-emerald font-extrabold block pt-1.5 uppercase">
                    Unlocked cohort active member
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
