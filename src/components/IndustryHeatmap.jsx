import React, { useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Grid, HelpCircle } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const YEARS = Array.from({ length: 23 }, (_, i) => 2005 + i);

const INDUSTRIES = [
  'B2B', 'Consumer', 'Healthcare', 'Fintech', 'Industrials',
  'Real Estate and Construction', 'Education', 'Government'
];

function getCellColor(count, max) {
  if (count === 0) return 'rgba(255, 255, 255, 0.05)';
  const ratio = count / max;
  // Use shades of neon-cyan/blue for heatmap
  if (ratio < 0.1) return 'rgba(0, 188, 230, 0.15)';
  if (ratio < 0.25) return 'rgba(0, 188, 230, 0.35)';
  if (ratio < 0.5) return 'rgba(0, 188, 230, 0.55)';
  if (ratio < 0.75) return 'rgba(0, 188, 230, 0.75)';
  return '#00bce6'; // Solid neon-cyan
}

export default function IndustryHeatmap({ companies }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const containerRef = useRef(null);

  // Group companies by year and industry
  const { dataMatrix, maxCount } = useMemo(() => {
    const matrix = {};
    let max = 0;

    INDUSTRIES.forEach(ind => {
      matrix[ind] = {};
      YEARS.forEach(yr => {
        matrix[ind][yr] = 0;
      });
    });

    companies.forEach(c => {
      if (c.industry && INDUSTRIES.includes(c.industry) && c.batch) {
        const match = c.batch.match(/\d+/);
        if (match) {
          const yr = parseInt(match[0]);
          if (matrix[c.industry]?.[yr] !== undefined) {
            matrix[c.industry][yr]++;
            if (matrix[c.industry][yr] > max) {
              max = matrix[c.industry][yr];
            }
          }
        }
      }
    });

    return { dataMatrix: matrix, maxCount: max };
  }, [companies]);

  useGSAP(() => {
    if (containerRef.current) {
      const cells = containerRef.current.querySelectorAll('.heatmap-cell');
      gsap.fromTo(cells,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.002, ease: 'power1.out' }
      );
    }
  }, { scope: containerRef, dependencies: [companies] });

  return (
    <div className="brutal-card p-5 bg-white space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded border-2 border-black bg-neon-cyan flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000000]">
            <Grid className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest leading-none">
              INDUSTRY_DENSITY_HEATMAP
            </h3>
            <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
              Startup density over time // industry vs launch year // 2005 - 2027
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[800px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-1.5 text-left font-mono-tech text-[9px] font-extrabold text-slate-800 uppercase tracking-wider sticky left-0 bg-white z-10 w-[120px] border-b border-black">
                  Sector
                </th>
                {YEARS.map(yr => (
                  <th key={yr} className="p-1 text-center font-mono-code text-[9px] font-bold text-slate-800 border-b border-black">
                    {yr.toString().slice(2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INDUSTRIES.map(ind => (
                <tr key={ind} className="hover:bg-slate-50 transition-colors">
                  <td className="p-1.5 font-mono-tech text-[10px] font-extrabold text-black uppercase tracking-wider sticky left-0 bg-white z-10 border-b border-slate-200">
                    {ind === 'Real Estate and Construction' ? 'Real Estate' : ind}
                  </td>
                  {YEARS.map(yr => {
                    const count = dataMatrix[ind][yr];
                    const bg = getCellColor(count, maxCount);
                    const isHovered = hoveredCell?.industry === ind && hoveredCell?.year === yr;

                    return (
                      <td
                        key={`${ind}-${yr}`}
                        className="p-0.5 border border-slate-200 text-center"
                        onMouseEnter={() => setHoveredCell({ industry: ind, year: yr, count })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className="heatmap-cell h-7 w-full flex items-center justify-center font-mono-code text-[9px] font-bold border border-black/5 rounded transition-all duration-100"
                          style={{
                            backgroundColor: bg,
                            color: count > maxCount / 2 ? '#fff' : '#000',
                            transform: isHovered ? 'scale(1.15) z-index-20' : 'none',
                            position: 'relative',
                            zIndex: isHovered ? 10 : 1,
                            boxShadow: isHovered ? '2px 2px 0px 0px #000000' : 'none',
                            border: isHovered ? '1.5px solid #000000' : '1px solid rgba(0,0,0,0.05)'
                          }}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Readout */}
      <div className="h-10 flex items-center">
        {hoveredCell ? (
          <div className="brutal-card px-3 py-1.5 bg-obsidian-dark flex items-center space-x-2 text-xs w-full">
            <span className="font-mono-tech font-bold uppercase">{hoveredCell.industry}</span>
            <span className="text-slate-500 font-mono-code">•</span>
            <span className="font-mono-code font-bold">Class of {hoveredCell.year}</span>
            <span className="text-slate-500 font-mono-code">•</span>
            <span className="font-mono-code font-bold bg-neon-cyan/20 border border-black px-1.5 py-0.2 rounded shadow-[1px_1px_0px_0px_#000000]">
              {hoveredCell.count} startups
            </span>
          </div>
        ) : (
          <div className="text-[9px] font-mono-code text-slate-500 font-bold uppercase flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hover over any cell to see detailed density data</span>
          </div>
        )}
      </div>
    </div>
  );
}
