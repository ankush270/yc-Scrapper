import React, { useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Trophy, ArrowUpDown, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function BatchSuccessScorecard({ companies }) {
  const [sortBy, setSortBy] = useState('year-desc'); // 'year-desc' | 'year-asc' | 'score-desc'
  const containerRef = useRef(null);

  // Group by batch year
  const scorecardData = useMemo(() => {
    const years = {};
    companies.forEach(c => {
      if (c.batch) {
        const match = c.batch.match(/\d+/);
        if (match) {
          const yr = parseInt(match[0]);
          if (!years[yr]) {
            years[yr] = { total: 0, active: 0, acquired: 0, public: 0, inactive: 0 };
          }
          years[yr].total++;
          if (c.status === 'Active') years[yr].active++;
          else if (c.status === 'Acquired') years[yr].acquired++;
          else if (c.status === 'Public') years[yr].public++;
          else if (c.status === 'Inactive') years[yr].inactive++;
        }
      }
    });

    const list = Object.keys(years).map(yr => {
      const stats = years[yr];
      const activePct = Math.round((stats.active / stats.total) * 100);
      const acquiredPct = Math.round((stats.acquired / stats.total) * 100);
      const publicPct = Math.round((stats.public / stats.total) * 100);
      const inactivePct = Math.round((stats.inactive / stats.total) * 100);

      // Success Score = (Public% * 10) + (Acquired% * 5) + (Active% * 2.5) normalized
      // This awards the highest score to classes with public IPOs and acquisitions.
      const rawScore = (publicPct * 10) + (acquiredPct * 5) + (activePct * 2.5);
      // Normalized between 0 and 10
      const score = Math.min(10, Math.max(0, (rawScore / 3.5) / 10)).toFixed(1);

      return {
        year: parseInt(yr),
        label: `Class of ${yr}`,
        total: stats.total,
        active: activePct,
        acquired: acquiredPct,
        public: publicPct,
        inactive: inactivePct,
        score: parseFloat(score)
      };
    });

    // Filter out years with very few startups (e.g. before 2008 often has too sparse records in some datasets)
    const filteredList = list.filter(item => item.total > 5);

    // Apply sorting
    return filteredList.sort((a, b) => {
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'year-asc') return a.year - b.year;
      return b.score - a.score;
    });
  }, [companies, sortBy]);

  useGSAP(() => {
    if (containerRef.current) {
      const rows = containerRef.current.querySelectorAll('.score-card-row');
      gsap.fromTo(rows,
        { x: -15, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.02, ease: 'power2.out' }
      );
    }
  }, { scope: containerRef, dependencies: [scorecardData] });

  return (
    <div className="brutal-card p-5 bg-white space-y-4" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded border-2 border-black bg-neon-magenta flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000000]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest leading-none">
              BATCH_SUCCESS_SCORECARD
            </h3>
            <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
              Class cohort outcomes analysis // computed success score // index metrics
            </span>
          </div>
        </div>

        {/* Sorting Controller */}
        <div className="flex items-center space-x-2 bg-obsidian-dark border-2 border-black rounded p-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-black ml-1 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-0 text-[10px] font-mono-tech uppercase font-bold outline-none cursor-pointer text-black"
          >
            <option value="year-desc">Chronological: Newest</option>
            <option value="year-asc">Chronological: Oldest</option>
            <option value="score-desc">Sort by Success Score</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin">
        {scorecardData.map((item) => (
          <div
            key={item.year}
            className="score-card-row brutal-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
          >
            {/* Class Info */}
            <div className="w-[120px] shrink-0">
              <span className="font-mono-tech text-xs font-extrabold text-black uppercase block leading-tight">
                {item.label}
              </span>
              <span className="font-mono-code text-[8px] text-slate-600 block">
                {item.total} startups listed
              </span>
            </div>

            {/* Status ratios progress indicators */}
            <div className="flex-grow flex items-center space-x-2.5">
              <div className="flex-grow h-3.5 rounded-sm bg-slate-900 border border-black overflow-hidden flex shadow-inner">
                {item.public > 0 && (
                  <div style={{ width: `${item.public}%` }} className="bg-neon-magenta h-full" title={`Public: ${item.public}%`} />
                )}
                {item.acquired > 0 && (
                  <div style={{ width: `${item.acquired}%` }} className="bg-neon-cyan h-full" title={`Acquired: ${item.acquired}%`} />
                )}
                {item.active > 0 && (
                  <div style={{ width: `${item.active}%` }} className="bg-neon-emerald h-full" title={`Active: ${item.active}%`} />
                )}
                {item.inactive > 0 && (
                  <div style={{ width: `${item.inactive}%` }} className="bg-slate-500 h-full" title={`Inactive: ${item.inactive}%`} />
                )}
              </div>

              {/* Status details print */}
              <div className="shrink-0 flex items-center space-x-2 font-mono-code text-[8px] font-bold text-slate-800">
                <span className="text-neon-magenta">P:{item.public}%</span>
                <span className="text-neon-cyan">A:{item.acquired}%</span>
                <span className="text-neon-emerald">Ac:{item.active}%</span>
              </div>
            </div>

            {/* Success Score Badge */}
            <div className="shrink-0 flex items-center space-x-2.5 md:pl-4 border-t md:border-t-0 md:border-l border-slate-200 pt-2.5 md:pt-0">
              <div className="flex flex-col items-end">
                <span className="font-mono-code text-[8px] text-slate-700 font-bold uppercase tracking-wider">SUCCESS_SCORE</span>
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-neon-emerald" />
                  <span className="font-mono-tech text-sm font-extrabold text-black">
                    {item.score} <span className="text-[10px] text-slate-600 font-bold">/ 10</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
