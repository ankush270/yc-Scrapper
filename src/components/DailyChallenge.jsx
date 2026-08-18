import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Target, CheckCircle2, Flame, Award, HelpCircle } from 'lucide-react';
import { trackUserAction } from '../lib/achievements';
import { getSetting, setSetting } from '../lib/storage';

gsap.registerPlugin(useGSAP);

const CHALLENGE_TEMPLATES = [
  {
    id: 0,
    title: "🔍 Target Sector Hunt",
    description: "Inspect a B2B startup with a team size larger than 50 employees",
    validator: (c) => c.industry === 'B2B' && (c.team_size || 0) > 50
  },
  {
    id: 1,
    title: "🩺 Healthcare Deep-Dive",
    description: "Analyze a Healthcare startup from the W24, S24, W23 or S23 batch",
    validator: (c) => c.industry === 'Healthcare' && c.batch && (c.batch.includes('23') || c.batch.includes('24'))
  },
  {
    id: 2,
    title: "🌍 Euro Discovery",
    description: "Inspect a startup operating in Europe",
    validator: (c) => c.regions && c.regions.includes('Europe')
  },
  {
    id: 3,
    title: "💳 Fintech Talent Search",
    description: "Inspect a Fintech company that is actively hiring",
    validator: (c) => c.industry === 'Fintech' && c.isHiring === true
  },
  {
    id: 4,
    title: "🏆 Elite Consumer Study",
    description: "Teardown a Top Company in the Consumer space",
    validator: (c) => c.industry === 'Consumer' && c.top_company === true
  },
  {
    id: 5,
    title: "🍁 Canadian Innovation",
    description: "Inspect a YC startup operating in Canada",
    validator: (c) => c.regions && c.regions.includes('Canada')
  },
  {
    id: 6,
    title: "🎓 Future of EdTech",
    description: "Examine any Education startup in the directory",
    validator: (c) => c.industry === 'Education'
  },
  {
    id: 7,
    title: "🤖 Intelligence Cohort",
    description: "Study a YC startup specializing in 'AI', 'LLM', or 'GPT' in its pitch",
    validator: (c) => {
      const q = c.one_liner?.toLowerCase() || '';
      const tags = (c.tags || []).map(t => t.toLowerCase());
      return q.includes('ai') || q.includes('llm') || q.includes('gpt') || tags.some(t => t.includes('ai') || t.includes('llm') || t.includes('gpt'));
    }
  },
  {
    id: 8,
    title: "🌏 South Asian Frontier",
    description: "Explore a startup with a team size under 10 members in South Asia",
    validator: (c) => c.regions && c.regions.includes('South Asia') && (c.team_size || 0) < 10
  },
  {
    id: 9,
    title: "🏛️ GovTech Explorer",
    description: "Inspect a Government sector YC startup",
    validator: (c) => c.industry === 'Government'
  }
];

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const containerRef = useRef(null);

  // Load daily challenge based on current date
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toDateString();
    
    // Pick challenge using day of month
    const dayOfMonth = today.getDate();
    const activeIndex = dayOfMonth % CHALLENGE_TEMPLATES.length;
    const currentTemplate = CHALLENGE_TEMPLATES[activeIndex];
    setChallenge(currentTemplate);

    // Check if already completed today
    getSetting(`challenge_completed_date`).then(completedDate => {
      setCompleted(completedDate === dateStr);
    });

    // Check streak
    getSetting(`challenge_streak`).then(s => {
      setStreak(s || 0);
    });
  }, []);

  // Listen for inspections
  useEffect(() => {
    if (!challenge || completed) return;

    const handleInspect = async (e) => {
      const company = e.detail;
      if (challenge.validator(company)) {
        const today = new Date();
        const dateStr = today.toDateString();
        
        // Mark as completed
        setCompleted(true);
        await setSetting(`challenge_completed_date`, dateStr);

        // Update streak
        const lastCompletedDate = await getSetting(`challenge_last_completed_date`);
        let newStreak = 1;

        if (lastCompletedDate) {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();
          if (lastCompletedDate === yesterdayStr) {
            newStreak = streak + 1;
          } else if (lastCompletedDate === dateStr) {
            newStreak = streak; // Same day viewing
          }
        }

        setStreak(newStreak);
        await setSetting(`challenge_streak`, newStreak);
        await setSetting(`challenge_last_completed_date`, dateStr);

        // Track achievement stat
        await trackUserAction('challenges_completed');

        // GSAP complete animation
        if (containerRef.current) {
          gsap.fromTo(containerRef.current.querySelector('.success-glowing-ring'),
            { scale: 0.8, opacity: 0 },
            { scale: 1.5, opacity: 1, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity' }
          );
        }
      }
    };

    window.addEventListener('yc_company_inspected', handleInspect);
    return () => {
      window.removeEventListener('yc_company_inspected', handleInspect);
    };
  }, [challenge, completed, streak]);

  if (!challenge) return null;

  return (
    <div
      ref={containerRef}
      className={`brutal-card p-5 relative overflow-hidden transition-colors duration-150 ${
        completed ? 'bg-neon-emerald/5' : 'bg-white'
      }`}
    >
      <div className="success-glowing-ring absolute left-6 top-6 w-10 h-10 rounded-full border-4 border-neon-emerald opacity-0 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 mb-4 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded border-2 border-black bg-neon-orange flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000000]">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest leading-none">
              DAILY_DISCOVERY_CHALLENGE
            </h3>
            <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
              Explore the database // find startups matching conditions
            </span>
          </div>
        </div>

        {/* Streak Indicator */}
        <div className="flex items-center space-x-1.5 bg-obsidian-dark border-2 border-black rounded px-2.5 py-1 shrink-0 font-mono-tech text-[10px] font-bold uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000]">
          <Flame className="w-3.5 h-3.5 text-neon-orange fill-neon-orange animate-pulse" />
          <span>STREAK: {streak} DAYS</span>
        </div>
      </div>

      {/* Challenge Card details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-obsidian-dark border-2 border-black p-4 rounded shadow-[2.5px_2.5px_0px_0px_#000000]">
        <div className="space-y-1">
          <span className="font-mono-code text-[8px] text-slate-700 font-bold uppercase block">ACTIVE MISSION</span>
          <h4 className="font-mono-tech text-xs font-extrabold text-black uppercase">
            {challenge.title}
          </h4>
          <p className="font-sans-body text-xs text-slate-800 font-medium leading-relaxed mt-1">
            {challenge.description}
          </p>
        </div>

        <div className="shrink-0">
          {completed ? (
            <div className="flex items-center space-x-1.5 font-mono-tech text-[10px] font-bold text-neon-emerald bg-neon-emerald/10 border-2 border-neon-emerald rounded px-3 py-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,211,126,0.3)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>COMPLETED</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 font-mono-tech text-[10px] font-bold text-slate-700 bg-white border-2 border-black rounded px-3 py-1.5 shadow-[1.5px_1.5px_0px_0px_#000000] animate-pulse">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>ONGOING</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
