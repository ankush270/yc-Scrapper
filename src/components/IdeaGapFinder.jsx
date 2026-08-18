import React, { useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Crosshair, Zap, TrendingUp, MapPin } from 'lucide-react';

gsap.registerPlugin(useGSAP);

// Industries to show in the heatmap
const HEATMAP_INDUSTRIES = [
  'B2B', 'Consumer', 'Healthcare', 'Fintech', 'Industrials',
  'Real Estate and Construction', 'Education', 'Government'
];

// Regions to show in the heatmap
const HEATMAP_REGIONS = [
  'United States',
  'Europe',
  'South Asia',
  'Southeast Asia',
  'Latin America',
  'Africa',
  'Middle East and North Africa',
  'East Asia',
  'Canada',
  'Oceania',
  'Central Asia',
  'South America',
  'Remote'
];

// Color scale: low count = green (opportunity), high count = red (saturated)
function getHeatColor(count, max) {
  if (max === 0) return { bg: '#00d37e', text: '#000000', label: 'OPEN' };
  const ratio = count / max;
  
  if (ratio === 0) return { bg: '#00d37e', text: '#000000', label: 'OPEN' };
  if (ratio < 0.1) return { bg: '#4ade80', text: '#000000', label: 'LOW' };
  if (ratio < 0.25) return { bg: '#fbbf24', text: '#000000', label: 'MODERATE' };
  if (ratio < 0.5) return { bg: '#fb923c', text: '#000000', label: 'GROWING' };
  if (ratio < 0.75) return { bg: '#f87171', text: '#000000', label: 'SATURATED' };
  return { bg: '#e60073', text: '#FFFFFF', label: 'VERY SATURATED' };
}

export default function IdeaGapFinder({ companies, onFilterApply }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedView, setSelectedView] = useState('region'); // 'region' | 'batch' | 'status'
  const gridRef = useRef(null);

  // Animate the grid in on mount
  useGSAP(() => {
    if (gridRef.current) {
      const cells = gridRef.current.querySelectorAll('.heat-cell');
      if (cells.length > 0) {
        gsap.fromTo(cells,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.25, stagger: 0.008, ease: 'power2.out' }
        );
      }
    }
  }, { dependencies: [selectedView], scope: gridRef });

  // Compute the heatmap data matrix
  const { matrix, maxCount, opportunities } = useMemo(() => {
    const mat = {};
    let max = 0;

    HEATMAP_INDUSTRIES.forEach(ind => {
      mat[ind] = {};
      HEATMAP_REGIONS.forEach(reg => {
        const count = companies.filter(c => {
          const matchInd = c.industry === ind;
          const matchReg = c.regions && c.regions.includes(reg);
          return matchInd && matchReg;
        }).length;
        mat[ind][reg] = count;
        if (count > max) max = count;
      });
    });

    // Find top opportunities (lowest non-zero or zero cells)
    const opps = [];
    HEATMAP_INDUSTRIES.forEach(ind => {
      HEATMAP_REGIONS.forEach(reg => {
        const count = mat[ind][reg];
        if (count <= 5) { // Potential gap: 5 or fewer startups
          opps.push({
            industry: ind,
            region: reg,
            count,
            message: count === 0
              ? `Zero YC startups in ${ind} × ${reg} — wide open opportunity!`
              : `Only ${count} startups in ${ind} × ${reg} — underserved market.`
          });
        }
      });
    });

    // Sort: lowest count first
    opps.sort((a, b) => a.count - b.count);

    return { matrix: mat, maxCount: max, opportunities: opps.slice(0, 12) };
  }, [companies]);

  // Summary stats
  const totalGaps = useMemo(() => {
    let gaps = 0;
    HEATMAP_INDUSTRIES.forEach(ind => {
      HEATMAP_REGIONS.forEach(reg => {
        if (matrix[ind]?.[reg] === 0) gaps++;
      });
    });
    return gaps;
  }, [matrix]);

  const truncateRegion = (reg) => {
    const map = {
      'United States': 'US',
      'Europe': 'EU',
      'South Asia': 'S.Asia',
      'Southeast Asia': 'SE.Asia',
      'Latin America': 'LatAm',
      'Africa': 'Africa',
      'Middle East and North Africa': 'MENA',
      'East Asia': 'E.Asia',
      'Canada': 'Canada',
      'Oceania': 'Oceania',
      'Central Asia': 'C.Asia',
      'South America': 'S.Am',
      'Remote': 'Remote'
    };
    return map[reg] || reg.slice(0, 6);
  };

  const truncateIndustry = (ind) => {
    const map = {
      'B2B': 'B2B',
      'Consumer': 'Consumer',
      'Healthcare': 'Health',
      'Fintech': 'FinTech',
      'Industrials': 'Indust.',
      'Real Estate and Construction': 'RealEst',
      'Education': 'Edu',
      'Government': 'Gov'
    };
    return map[ind] || ind.slice(0, 6);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card p-5 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-black pb-4 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded bg-neon-emerald border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Crosshair className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest leading-none">
                IDEA_GAP_FINDER
              </h2>
              <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
                Identify underserved markets & opportunity zones across YC landscape
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-3">
            <div className="brutal-card p-2.5 flex flex-col items-center min-w-[80px]">
              <span className="font-mono-code text-[9px] text-slate-700 uppercase font-bold">Gaps Found</span>
              <span className="font-mono-tech text-xl font-extrabold text-neon-emerald">{totalGaps}</span>
            </div>
            <div className="brutal-card p-2.5 flex flex-col items-center min-w-[80px]">
              <span className="font-mono-code text-[9px] text-slate-700 uppercase font-bold">Opportunities</span>
              <span className="font-mono-tech text-xl font-extrabold text-neon-orange">{opportunities.length}</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="font-mono-code text-[9px] text-slate-700 font-bold uppercase">Saturation Scale:</span>
          {[
            { label: 'Open', color: '#00d37e' },
            { label: 'Low', color: '#4ade80' },
            { label: 'Moderate', color: '#fbbf24' },
            { label: 'Growing', color: '#fb923c' },
            { label: 'Saturated', color: '#f87171' },
            { label: 'Very Saturated', color: '#e60073' }
          ].map(l => (
            <div key={l.label} className="flex items-center space-x-1.5">
              <span
                className="w-3 h-3 rounded-sm border border-black"
                style={{ backgroundColor: l.color }}
              />
              <span className="font-mono-code text-[9px] font-bold uppercase">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto" ref={gridRef}>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-mono-tech text-[9px] font-extrabold text-slate-700 uppercase tracking-wider border-b-2 border-black sticky left-0 bg-white z-10 min-w-[70px]">
                  Industry
                </th>
                {HEATMAP_REGIONS.map(reg => (
                  <th key={reg} className="p-1.5 text-center font-mono-code text-[8px] font-bold text-slate-700 uppercase border-b-2 border-black min-w-[52px]">
                    {truncateRegion(reg)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEATMAP_INDUSTRIES.map(ind => (
                <tr key={ind}>
                  <td className="p-2 font-mono-tech text-[10px] font-extrabold text-black uppercase tracking-wider border-b border-slate-200 sticky left-0 bg-white z-10">
                    {truncateIndustry(ind)}
                  </td>
                  {HEATMAP_REGIONS.map(reg => {
                    const count = matrix[ind]?.[reg] || 0;
                    const heat = getHeatColor(count, maxCount);
                    const isHovered = hoveredCell?.industry === ind && hoveredCell?.region === reg;

                    return (
                      <td
                        key={`${ind}-${reg}`}
                        className="heat-cell p-0 border-b border-slate-200"
                        onMouseEnter={() => setHoveredCell({ industry: ind, region: reg, count })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <button
                          onClick={() => {
                            if (onFilterApply) {
                              onFilterApply({ industry: ind, region: reg });
                            }
                          }}
                          className="w-full h-full p-2 cursor-pointer transition-all duration-100 border-0 outline-none"
                          style={{
                            backgroundColor: heat.bg,
                            color: heat.text,
                            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                            zIndex: isHovered ? 20 : 1,
                            position: 'relative',
                            boxShadow: isHovered ? '3px 3px 0px 0px rgba(0,0,0,1)' : 'none',
                            border: isHovered ? '2px solid #000000' : '1px solid rgba(0,0,0,0.1)',
                            borderRadius: isHovered ? '4px' : '2px'
                          }}
                          title={`${ind} × ${reg}: ${count} startups`}
                        >
                          <span className="font-mono-code text-[10px] font-extrabold block leading-none">
                            {count}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover tooltip detail */}
        {hoveredCell && (
          <div className="mt-4 brutal-card p-3 bg-obsidian-dark flex items-center space-x-3 animate-fade-in">
            <Crosshair className="w-4 h-4 text-black shrink-0" />
            <div>
              <span className="font-mono-tech text-[10px] font-extrabold text-black uppercase block">
                {hoveredCell.industry} × {hoveredCell.region}
              </span>
              <span className="font-mono-code text-[9px] text-slate-700 font-bold">
                {hoveredCell.count === 0
                  ? '🟢 ZERO startups — completely untapped opportunity!'
                  : hoveredCell.count <= 3
                    ? `🟡 Only ${hoveredCell.count} startup${hoveredCell.count > 1 ? 's' : ''} — high opportunity zone`
                    : `${hoveredCell.count} startups operating in this market`
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Opportunity Zones */}
      <div className="brutal-card p-5 bg-white">
        <div className="flex items-center space-x-2.5 border-b-2 border-black pb-3 mb-4">
          <div className="w-8 h-8 rounded border-2 border-black bg-neon-orange flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000000]">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest">
            TOP_OPPORTUNITY_ZONES
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {opportunities.map((opp, idx) => (
            <button
              key={`${opp.industry}-${opp.region}`}
              onClick={() => {
                if (onFilterApply) {
                  onFilterApply({ industry: opp.industry, region: opp.region });
                }
              }}
              className="brutal-card p-3 text-left cursor-pointer hover:bg-neon-emerald/10 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`font-mono-code text-[9px] font-bold px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000000] ${
                  opp.count === 0 ? 'bg-neon-emerald text-black' : 'bg-neon-cyan text-black'
                }`}>
                  {opp.count === 0 ? '🎯 WIDE OPEN' : `⚡ ${opp.count} STARTUPS`}
                </span>
                <span className="font-mono-code text-[9px] text-slate-500 font-bold">#{idx + 1}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5">
                  <TrendingUp className="w-3 h-3 text-black shrink-0" />
                  <span className="font-mono-tech text-[10px] font-extrabold text-black uppercase">
                    {opp.industry}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3 h-3 text-black shrink-0" />
                  <span className="font-mono-code text-[10px] font-bold text-slate-700">
                    {opp.region}
                  </span>
                </div>
              </div>
              <p className="font-mono-code text-[9px] text-slate-600 mt-2 leading-snug font-bold group-hover:text-black transition-colors">
                {opp.message}
              </p>
            </button>
          ))}
        </div>

        {opportunities.length === 0 && (
          <div className="text-center py-8">
            <span className="font-mono-tech text-xs text-slate-500 font-bold uppercase">
              No significant gaps detected in the current dataset
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
