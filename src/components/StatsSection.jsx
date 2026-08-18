import React, { useRef } from 'react';
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
      textColor: 'text-black',
      borderClass: 'border-black bg-white hover:bg-neon-cyan/20 hover:shadow-[4.5px_4.5px_0px_0px_#000000] hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] shadow-[3px_3px_0px_0px_#000000]',
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
      textColor: 'text-black',
      borderClass: selectedStatus === 'Active'
        ? 'border-black bg-neon-emerald shadow-[3px_3px_0px_0px_#000000] -translate-x-[1px] -translate-y-[1px]'
        : 'border-black bg-white hover:bg-neon-emerald/20 hover:shadow-[4.5px_4.5px_0px_0px_#000000] hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] shadow-[3px_3px_0px_0px_#000000]',
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
      textColor: 'text-black',
      borderClass: onlyTop
        ? 'border-black bg-neon-magenta shadow-[3px_3px_0px_0px_#000000] -translate-x-[1px] -translate-y-[1px] text-white'
        : 'border-black bg-white hover:bg-neon-magenta/20 hover:shadow-[4.5px_4.5px_0px_0px_#000000] hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] shadow-[3px_3px_0px_0px_#000000]',
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
      textColor: 'text-black',
      borderClass: selectedBatch !== 'All'
        ? 'border-black bg-neon-orange shadow-[3px_3px_0px_0px_#000000] -translate-x-[1px] -translate-y-[1px] text-white'
        : 'border-black bg-white hover:bg-neon-orange/20 hover:shadow-[4.5px_4.5px_0px_0px_#000000] hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] shadow-[3px_3px_0px_0px_#000000]',
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
            className={`p-4 border-2.5 transition-all duration-150 relative overflow-hidden group cursor-pointer rounded ${card.borderClass}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] tracking-wider font-mono-tech uppercase font-bold ${
                card.isActive ? 'text-black' : 'text-slate-700'
              }`}>
                {card.label}
              </span>
              <div className="flex items-center space-x-1.5">
                {card.isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
                {card.id === 'total' && (
                  <RotateCcw className="w-3 h-3 text-slate-600 group-hover:text-black transition-colors" />
                )}
                <IconComponent className="w-4 h-4 opacity-90" />
              </div>
            </div>

            <div className="flex items-baseline">
              <span
                ref={card.ref}
                className="text-2xl md:text-3xl font-mono-tech font-bold text-black tracking-tight"
              >
                0
              </span>
              <span className={`text-xs font-mono-tech ml-1 font-bold ${
                card.isActive ? 'text-black/70' : 'text-slate-600'
              }`}>
                / {allCompanies.length.toLocaleString()}
              </span>
            </div>
            
            {/* Click call-to-action hints */}
            <div className="absolute bottom-1 right-2 font-mono-code text-[8px] text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              {card.id === 'total' ? '[RESET]' : card.isActive ? '[CLEAR]' : '[FILTER]'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
