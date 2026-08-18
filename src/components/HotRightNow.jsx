import React, { useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Flame, TrendingUp, HelpCircle } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const TARGET_INDUSTRIES = [
  'B2B', 'Consumer', 'Healthcare', 'Fintech', 'Industrials',
  'Real Estate and Construction', 'Education', 'Government'
];

export default function HotRightNow({ companies }) {
  const containerRef = useRef(null);

  const hotTrends = useMemo(() => {
    // 1. Identify the recent batches (last 3 years found in dataset)
    const years = [];
    companies.forEach(c => {
      if (c.batch) {
        const match = c.batch.match(/\d+/);
        if (match) {
          const yr = parseInt(match[0]);
          if (!years.includes(yr)) years.push(yr);
        }
      }
    });

    years.sort((a, b) => b - a);
    const recentYears = years.slice(0, 3); // top 3 years (e.g. 2025, 2026, 2027)
    
    if (recentYears.length === 0) return [];

    // 2. Count distributions
    let totalRecent = 0;
    let totalHistorical = 0;

    const recentCounts = {};
    const historicalCounts = {};

    TARGET_INDUSTRIES.forEach(ind => {
      recentCounts[ind] = 0;
      historicalCounts[ind] = 0;
    });

    companies.forEach(c => {
      if (c.industry && TARGET_INDUSTRIES.includes(c.industry) && c.batch) {
        const match = c.batch.match(/\d+/);
        if (match) {
          const yr = parseInt(match[0]);
          if (recentYears.includes(yr)) {
            recentCounts[c.industry]++;
            totalRecent++;
          } else {
            historicalCounts[c.industry]++;
            totalHistorical++;
          }
        }
      }
    });

    // 3. Compute spikes
    const list = TARGET_INDUSTRIES.map(ind => {
      const recentShare = totalRecent > 0 ? recentCounts[ind] / totalRecent : 0;
      const historicalShare = totalHistorical > 0 ? historicalCounts[ind] / totalHistorical : 0;

      // Spike score represents growth ratio
      let spikePct = 0;
      if (historicalShare > 0) {
        spikePct = Math.round(((recentShare / historicalShare) - 1) * 100);
      } else if (recentShare > 0) {
        spikePct = 100; // New sector emergence
      }

      return {
        name: ind,
        recentCount: recentCounts[ind],
        historicalCount: historicalCounts[ind],
        recentShare: (recentShare * 100).toFixed(1),
        historicalShare: (historicalShare * 100).toFixed(1),
        spikePct
      };
    });

    // Only show positive growth trends, sorted by spike percentage descending
    return list
      .filter(item => item.spikePct > 5 && item.recentCount > 2)
      .sort((a, b) => b.spikePct - a.spikePct)
      .slice(0, 4);
  }, [companies]);

  useGSAP(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('.trend-spike-item');
      gsap.fromTo(items,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, { scope: containerRef, dependencies: [hotTrends] });

  return (
    <div className="brutal-card p-5 bg-white space-y-4" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded border-2 border-black bg-neon-orange flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000000]">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest leading-none">
              HOT_RIGHT_NOW_RADAR
            </h3>
            <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
              Spiking sectors // comparison to historical average baseline share
            </span>
          </div>
        </div>
      </div>

      {/* List of trending items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotTrends.map((trend) => (
          <div
            key={trend.name}
            className="trend-spike-item brutal-card p-3.5 flex flex-col justify-between bg-white hover:bg-slate-50 transition-colors relative overflow-hidden"
          >
            {/* Title & Badge */}
            <div className="flex items-start justify-between mb-3 gap-2">
              <span className="font-mono-tech text-xs font-extrabold text-black uppercase block leading-tight">
                {trend.name === 'Real Estate and Construction' ? 'Real Estate' : trend.name}
              </span>
              <span className="font-mono-code text-[9px] font-bold bg-neon-orange text-white border border-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_#000000] shrink-0">
                +{trend.spikePct}% SPIKE
              </span>
            </div>

            {/* Metrics info */}
            <div className="space-y-1.5 font-mono-code text-[9px] font-bold text-slate-700">
              <div className="flex justify-between">
                <span>Recent share of batch:</span>
                <span className="text-black">{trend.recentShare}%</span>
              </div>
              <div className="flex justify-between">
                <span>Historical share:</span>
                <span className="text-slate-500">{trend.historicalShare}%</span>
              </div>
            </div>

            {/* Insight blurb */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-neon-emerald shrink-0" />
              <p className="font-mono-code text-[8px] text-slate-800 leading-snug font-bold">
                Spike driven by {trend.recentCount} launches in recent cohorts.
              </p>
            </div>
          </div>
        ))}

        {hotTrends.length === 0 && (
          <div className="col-span-2 text-center py-8">
            <HelpCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
            <span className="font-mono-tech text-[10px] text-slate-500 font-bold uppercase block">
              No significant macro spikes detected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
