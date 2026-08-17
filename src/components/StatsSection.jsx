import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Database, Zap, Trophy, Tag, RotateCcw } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function StatsSection({ 
  allCompanies, 
  filteredCompanies,
  selectedStatus,
  setSelectedStatus,
  onlyTop,
  setOnlyTop,
  selectedBatch,
  setSelectedBatch,
  resetFilters
}) {
  // Refs for numbers we want to animate
  const totalRef = useRef(null);
  const activeRef = useRef(null);
  const topRef = useRef(null);
  const batchRef = useRef(null);

  // Compute stats on the fly
  const totalCount = filteredCompanies.length;
  const activeCount = filteredCompanies.filter(c => c.status === 'Active').length;
  const topCount = filteredCompanies.filter(c => c.top_company === true).length;
  
  // Get unique batches
  const batches = new Set(filteredCompanies.map(c => c.batch).filter(Boolean));
  const batchCount = batches.size;

  const animateNumber = (ref, targetValue) => {
    if (!ref.current) return;
    const obj = { value: parseInt(ref.current.innerText) || 0 };
    gsap.to(obj, {
      value: targetValue,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.innerText = Math.floor(obj.value).toLocaleString();
        }
      }
    });
  };

  useGSAP(() => {
    animateNumber(totalRef, totalCount);
    animateNumber(activeRef, activeCount);
    animateNumber(topRef, topCount);
    animateNumber(batchRef, batchCount);
  }, { dependencies: [totalCount, activeCount, topCount, batchCount] });

  // Define stat cards configuration with interactive toggles
  const statCards = [
    {
      id: 'total',
      label: 'MATCHED STARTUPS',
      value: totalCount,
      ref: totalRef,
      icon: Database,
      textColor: 'text-neon-cyan',
      borderClass: 'border-slate-800 hover:border-neon-cyan/60 hover:shadow-[0_0_15px_rgba(0,210,255,0.15)]',
      bgGlow: 'rgba(0, 210, 255, 0.03)',
      onClick: resetFilters,
      isActive: false,
      title: 'Click to reset all filters'
    },
    {
      id: 'active',
      label: 'ACTIVE STATUS',
      value: activeCount,
      ref: activeRef,
      icon: Zap,
      textColor: 'text-neon-emerald',
      borderClass: selectedStatus === 'Active'
        ? 'border-neon-emerald shadow-[0_0_15px_rgba(0,255,157,0.25)] bg-neon-emerald/10'
        : 'border-slate-800 hover:border-neon-emerald/60 hover:shadow-[0_0_15px_rgba(0,255,157,0.15)]',
      bgGlow: selectedStatus === 'Active' ? 'rgba(0, 255, 157, 0.08)' : 'rgba(0, 255, 157, 0.03)',
      onClick: () => setSelectedStatus(selectedStatus === 'Active' ? 'All' : 'Active'),
      isActive: selectedStatus === 'Active',
      title: selectedStatus === 'Active' ? 'Click to show all operating statuses' : 'Click to filter for active startups'
    },
    {
      id: 'top',
      label: 'TOP YC COMPANIES',
      value: topCount,
      ref: topRef,
      icon: Trophy,
      textColor: 'text-neon-magenta',
      borderClass: onlyTop
        ? 'border-neon-magenta shadow-[0_0_15px_rgba(255,0,127,0.25)] bg-neon-magenta/10'
        : 'border-slate-800 hover:border-neon-magenta/60 hover:shadow-[0_0_15px_rgba(255,0,127,0.15)]',
      bgGlow: onlyTop ? 'rgba(255, 0, 127, 0.08)' : 'rgba(255, 0, 127, 0.03)',
      onClick: () => setOnlyTop(!onlyTop),
      isActive: onlyTop,
      title: onlyTop ? 'Click to show all startups' : 'Click to filter for Top YC companies'
    },
    {
      id: 'batches',
      label: 'ACTIVE BATCHES',
      value: batchCount,
      ref: batchRef,
      icon: Tag,
      textColor: 'text-neon-orange',
      borderClass: selectedBatch !== 'All'
        ? 'border-neon-orange shadow-[0_0_15px_rgba(255,170,0,0.25)] bg-neon-orange/10'
        : 'border-slate-800 hover:border-neon-orange/60 hover:shadow-[0_0_15px_rgba(255,170,0,0.15)]',
      bgGlow: selectedBatch !== 'All' ? 'rgba(255, 170, 0, 0.08)' : 'rgba(255, 170, 0, 0.03)',
      onClick: () => {
        if (selectedBatch !== 'All') {
          setSelectedBatch('All');
        }
      },
      isActive: selectedBatch !== 'All',
      title: selectedBatch !== 'All' ? 'Click to show all batches' : 'Click to explore different batches below'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full select-none">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.onClick}
            title={card.title}
            className={`glass-panel p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${card.borderClass}`}
            style={{ backgroundColor: card.bgGlow }}
          >
            {/* Corner Decorative Tech Lines */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-700 group-hover:border-neon-cyan transition-colors"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-slate-700 group-hover:border-neon-cyan transition-colors"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-slate-700 group-hover:border-neon-cyan transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-700 group-hover:border-neon-cyan transition-colors"></div>

            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] tracking-wider text-slate-400 font-mono-tech uppercase">
                {card.label}
              </span>
              <div className="flex items-center space-x-1.5">
                {card.isActive && (
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${card.textColor} animate-pulse`} />
                )}
                {card.id === 'total' && (
                  <RotateCcw className="w-3 h-3 text-slate-500 group-hover:text-neon-cyan transition-colors" />
                )}
                <IconComponent className={`w-4 h-4 ${card.textColor} opacity-80`} />
              </div>
            </div>

            <div className="flex items-baseline">
              <span
                ref={card.ref}
                className="text-2xl md:text-3xl font-mono-tech font-bold text-white tracking-tight"
              >
                0
              </span>
              <span className="text-xs text-slate-400 font-mono-tech ml-1">
                / {allCompanies.length.toLocaleString()}
              </span>
            </div>
            
            {/* Click call-to-action hints */}
            <div className="absolute bottom-1 right-2 font-mono-code text-[8px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {card.id === 'total' ? '[RESET]' : card.isActive ? '[CLEAR]' : '[FILTER]'}
            </div>

            {/* Tech grid dots background element */}
            <div className="absolute bottom-0 right-0 w-16 h-12 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] mask-gradient-to-l"></div>
          </div>
        );
      })}
    </div>
  );
}
