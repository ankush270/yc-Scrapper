import React, { useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Globe, MapPin } from 'lucide-react';

gsap.registerPlugin(useGSAP);

// Center coordinates for map markers on a 500x250 canvas
const REGION_COORDINATES = {
  'United States': { x: 100, y: 85 },
  'Canada': { x: 95, y: 55 },
  'Europe': { x: 250, y: 70 },
  'South Asia': { x: 345, y: 110 },
  'Southeast Asia': { x: 375, y: 130 },
  'East Asia': { x: 380, y: 85 },
  'Latin America': { x: 155, y: 155 },
  'South America': { x: 165, y: 180 },
  'Africa': { x: 260, y: 145 },
  'Middle East and North Africa': { x: 295, y: 105 },
  'Oceania': { x: 420, y: 185 },
  'Central Asia': { x: 330, y: 80 },
  'Remote': { x: 50, y: 200 } // Rendered as separate indicator, but also on map
};

export default function GeographicDistribution({ companies }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const containerRef = useRef(null);

  // Group counts by region
  const regionData = useMemo(() => {
    const counts = {};
    let totalRegionCount = 0;

    companies.forEach(c => {
      if (c.regions) {
        c.regions.forEach(reg => {
          if (!counts[reg]) counts[reg] = 0;
          counts[reg]++;
          totalRegionCount++;
        });
      }
    });

    const list = Object.keys(REGION_COORDINATES).map(reg => {
      const count = counts[reg] || 0;
      return {
        name: reg,
        count,
        percent: totalRegionCount > 0 ? ((count / totalRegionCount) * 100).toFixed(1) : 0,
        coords: REGION_COORDINATES[reg]
      };
    });

    // Sort descending by count
    return list.sort((a, b) => b.count - a.count);
  }, [companies]);

  const maxCount = useMemo(() => {
    return Math.max(...regionData.map(r => r.count), 1);
  }, [regionData]);

  useGSAP(() => {
    if (containerRef.current) {
      const markers = containerRef.current.querySelectorAll('.map-marker');
      gsap.fromTo(markers,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.03, ease: 'back.out(1.7)' }
      );
    }
  }, { scope: containerRef, dependencies: [companies] });

  return (
    <div className="brutal-card p-5 bg-white space-y-5" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded border-2 border-black bg-neon-cyan flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000000]">
            <Globe className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest leading-none">
              GEOGRAPHIC_DISTRIBUTION_RADAR
            </h3>
            <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
              Global operations nodes map // regional density index
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-center">
        {/* Map Panel */}
        <div className="xl:col-span-2 brutal-card p-3 bg-obsidian-dark relative overflow-hidden shadow-[2px_2px_0px_0px_#000000]">
          {/* Grid background dots pattern */}
          <div className="absolute inset-0 halftone-dots pointer-events-none" />

          {/* SVG Map grid layout */}
          <svg viewBox="0 0 500 250" className="w-full h-auto overflow-visible relative z-10">
            {/* Outline Continent Guides (stylized geometric grids) */}
            {/* North America / Canada */}
            <path d="M 40 40 L 150 40 L 170 90 L 110 110 L 80 80 Z" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 3" />
            {/* South America */}
            <path d="M 120 120 L 170 120 L 180 190 L 140 220 Z" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Europe */}
            <path d="M 210 50 L 280 40 L 290 85 L 220 90 Z" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Africa */}
            <path d="M 220 100 L 280 100 L 290 180 L 240 190 Z" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Asia */}
            <path d="M 290 40 L 410 40 L 430 110 L 320 140 Z" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Australia / Oceania */}
            <path d="M 390 160 L 440 160 L 440 200 L 390 200 Z" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Connecting radar links to show global network */}
            <line x1={REGION_COORDINATES['United States'].x} y1={REGION_COORDINATES['United States'].y} x2={REGION_COORDINATES['Europe'].x} y2={REGION_COORDINATES['Europe'].y} stroke="rgba(0, 188, 230, 0.2)" strokeWidth="1.5" strokeDasharray="2 4" />
            <line x1={REGION_COORDINATES['United States'].x} y1={REGION_COORDINATES['United States'].y} x2={REGION_COORDINATES['Southeast Asia'].x} y2={REGION_COORDINATES['Southeast Asia'].y} stroke="rgba(0, 188, 230, 0.2)" strokeWidth="1.5" strokeDasharray="2 4" />
            <line x1={REGION_COORDINATES['United States'].x} y1={REGION_COORDINATES['United States'].y} x2={REGION_COORDINATES['South Asia'].x} y2={REGION_COORDINATES['South Asia'].y} stroke="rgba(0, 188, 230, 0.2)" strokeWidth="1.5" strokeDasharray="2 4" />

            {/* Region Markers */}
            {regionData.map(reg => {
              const radius = 6 + (reg.count / maxCount) * 22;
              const isHovered = hoveredRegion?.name === reg.name;

              return (
                <g
                  key={reg.name}
                  className="map-marker cursor-pointer"
                  onMouseEnter={() => setHoveredRegion(reg)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  {/* Glowing background halo */}
                  <circle
                    cx={reg.coords.x}
                    cy={reg.coords.y}
                    r={radius + 4}
                    fill={isHovered ? 'var(--color-neon-cyan)' : 'transparent'}
                    opacity="0.15"
                    className="transition-all duration-150"
                  />
                  {/* Outer brutalist border */}
                  <circle
                    cx={reg.coords.x}
                    cy={reg.coords.y}
                    r={radius}
                    fill={isHovered ? 'var(--color-neon-cyan)' : 'rgba(0, 188, 230, 0.45)'}
                    stroke="#000000"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                  {/* Center core point */}
                  <circle
                    cx={reg.coords.x}
                    cy={reg.coords.y}
                    r="2.5"
                    fill="#000000"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Region Stats List */}
        <div className="space-y-3 h-[250px] overflow-y-auto pr-1.5 scrollbar-thin">
          {regionData.map((reg) => (
            <div
              key={reg.name}
              onMouseEnter={() => setHoveredRegion(reg)}
              onMouseLeave={() => setHoveredRegion(null)}
              className={`p-2.5 rounded border-2 transition-all duration-100 flex items-center justify-between cursor-pointer ${
                hoveredRegion?.name === reg.name
                  ? 'bg-neon-cyan/15 border-black shadow-[2px_2px_0px_0px_#000000] -translate-x-[0.5px] -translate-y-[0.5px]'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                <span className="font-mono-tech text-[10px] font-extrabold text-black uppercase truncate">
                  {reg.name}
                </span>
              </div>
              <div className="shrink-0 flex items-center space-x-2 font-mono-code text-[9px] font-bold text-slate-800">
                <span className="bg-slate-100 border border-black/10 px-1.5 py-0.2 rounded">
                  {reg.count}
                </span>
                <span className="text-slate-500 w-[36px] text-right">
                  {reg.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
