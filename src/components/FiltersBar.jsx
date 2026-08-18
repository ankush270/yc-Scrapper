import React, { useMemo } from 'react';
import { Filter, Check, X } from 'lucide-react';

export default function FiltersBar({
  allCompanies,
  searchQuery,
  setSearchQuery,
  sortType,
  setSortType,
  selectedBatch,
  setSelectedBatch,
  selectedIndustry,
  setSelectedIndustry,
  selectedRegion,
  setSelectedRegion,
  selectedStatus,
  setSelectedStatus,
  onlyHiring,
  setOnlyHiring,
  onlyTop,
  setOnlyTop,
  onlyHasNotes,
  setOnlyHasNotes,
  notesCount
}) {
  // Extract unique batches, sorted chronologically (Newest first)
  const batchesList = useMemo(() => {
    const batches = new Set();
    allCompanies.forEach(c => {
      if (c.batch) batches.add(c.batch);
    });
    
    return Array.from(batches).sort((a, b) => {
      const getVal = (batchStr) => {
        const match = batchStr.match(/(\w+)\s+(\d+)/);
        if (!match) return 0;
        const season = match[1];
        const year = parseInt(match[2]);
        // Winter starts earlier in the year than Summer
        const seasonVal = season.toLowerCase().startsWith('w') ? 1 : 2;
        return year * 10 + seasonVal;
      };
      return getVal(b) - getVal(a); // Newest first
    });
  }, [allCompanies]);

  // Extract unique industries
  const industriesList = useMemo(() => {
    const industries = new Set();
    allCompanies.forEach(c => {
      if (c.industry) industries.add(c.industry);
    });
    return Array.from(industries).sort();
  }, [allCompanies]);

  // Extract unique regions (nested array flat)
  const regionsList = useMemo(() => {
    const regions = new Set();
    allCompanies.forEach(c => {
      if (c.regions) {
        c.regions.forEach(r => regions.add(r));
      }
    });
    return Array.from(regions).sort();
  }, [allCompanies]);

  // Extract unique statuses
  const statusesList = useMemo(() => {
    const statuses = new Set();
    allCompanies.forEach(c => {
      if (c.status) statuses.add(c.status);
    });
    return Array.from(statuses).sort();
  }, [allCompanies]);

  return (
    <div className="brutal-card p-5 space-y-6 select-none relative overflow-hidden">
      {/* Terminal Title */}
      <div className="flex items-center space-x-2 border-b-2 border-black pb-3">
        <Filter className="w-4 h-4 text-black" />
        <span className="font-mono-tech text-sm font-bold text-black tracking-widest uppercase">
          CONSOLE_CONTROLLERS
        </span>
      </div>

      {/* 1. Live Text Search */}
      <div className="space-y-2">
        <label className="block font-mono-tech text-xs text-slate-800 font-bold uppercase tracking-wider">
          Search Directory
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-800 font-mono-code font-bold">
            &gt;_
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, pitch, or tech..."
            className="w-full brutal-input pl-9 pr-8 py-2 text-sm text-black placeholder-slate-500 font-mono-code"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sorting */}
      <div className="space-y-2">
        <label className="block font-mono-tech text-xs text-slate-800 font-bold uppercase tracking-wider">
          Sort Order
        </label>
        <div className="relative">
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="w-full brutal-input px-3 py-2 text-sm text-black focus:outline-none appearance-none cursor-pointer font-sans-body"
          >
            <option value="batch-newest">Batch: Newest First</option>
            <option value="batch-oldest">Batch: Oldest First</option>
            <option value="name-az">Company Name: A-Z</option>
            <option value="name-za">Company Name: Z-A</option>
            <option value="size-largest">Team Size: Largest</option>
            <option value="size-smallest">Team Size: Smallest</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-black font-bold">
            ▼
          </div>
        </div>
      </div>

      {/* 3. Filters dropdowns */}
      <div className="space-y-4 pt-2 border-t-2 border-black">
        {/* Batch Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-800 font-bold uppercase tracking-wider">
            YC Batch
          </label>
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm text-black focus:outline-none appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Batches</option>
              {batchesList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-black font-bold">
              ▼
            </div>
          </div>
        </div>

        {/* Industry Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-800 font-bold uppercase tracking-wider">
            Industry
          </label>
          <div className="relative">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm text-black focus:outline-none appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Industries</option>
              {industriesList.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-black font-bold">
              ▼
            </div>
          </div>
        </div>

        {/* Region Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-800 font-bold uppercase tracking-wider">
            Geographic Region
          </label>
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm text-black focus:outline-none appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Regions</option>
              {regionsList.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-black font-bold">
              ▼
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-800 font-bold uppercase tracking-wider">
            Operating Status
          </label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm text-black focus:outline-none appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Statuses</option>
              {statusesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-black font-bold">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Checkboxes */}
      <div className="space-y-3 pt-4 border-t-2 border-black">
        <label className="block font-mono-tech text-xs text-slate-800 font-bold uppercase tracking-wider mb-2">
          Quick Filters
        </label>
        
        {/* Only Hiring */}
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={onlyHiring}
              onChange={(e) => setOnlyHiring(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 border-black transition-all flex items-center justify-center ${onlyHiring ? 'bg-neon-emerald text-black shadow-[1.5px_1.5px_0px_0px_#000000]' : 'bg-white group-hover:shadow-[1.5px_1.5px_0px_0px_#000000] group-hover:-translate-y-[0.5px] group-hover:-translate-x-[0.5px]'}`}>
              {onlyHiring && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
            </div>
          </div>
          <span className="text-xs text-slate-800 font-bold font-sans-body select-none">
            Hiring Startups
          </span>
        </label>

        {/* Only Top Companies */}
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={onlyTop}
              onChange={(e) => setOnlyTop(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 border-black transition-all flex items-center justify-center ${onlyTop ? 'bg-neon-magenta text-white shadow-[1.5px_1.5px_0px_0px_#000000]' : 'bg-white group-hover:shadow-[1.5px_1.5px_0px_0px_#000000] group-hover:-translate-y-[0.5px] group-hover:-translate-x-[0.5px]'}`}>
              {onlyTop && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
            </div>
          </div>
          <span className="text-xs text-slate-800 font-bold font-sans-body select-none">
            Top Companies Only
          </span>
        </label>

        {/* Only Has Personal Notes */}
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={onlyHasNotes}
              onChange={(e) => setOnlyHasNotes(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 border-black transition-all flex items-center justify-center ${onlyHasNotes ? 'bg-neon-cyan text-black shadow-[1.5px_1.5px_0px_0px_#000000]' : 'bg-white group-hover:shadow-[1.5px_1.5px_0px_0px_#000000] group-hover:-translate-y-[0.5px] group-hover:-translate-x-[0.5px]'}`}>
              {onlyHasNotes && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
            </div>
          </div>
          <span className="text-xs text-slate-800 font-bold font-sans-body select-none flex items-center justify-between w-full">
            <span>Has My Study Notes</span>
            {notesCount > 0 && (
              <span className="bg-neon-cyan border border-black text-black font-mono-code font-bold text-[9px] px-1.5 py-0.2 shadow-[1px_1px_0px_0px_#000000] rounded-sm">
                {notesCount}
              </span>
            )}
          </span>
        </label>
      </div>

      {/* Clear Filters Button */}
      {(searchQuery || selectedBatch !== 'All' || selectedIndustry !== 'All' || selectedRegion !== 'All' || selectedStatus !== 'All' || onlyHiring || onlyTop || onlyHasNotes) && (
        <button
          onClick={() => {
            setSearchQuery('');
            setSelectedBatch('All');
            setSelectedIndustry('All');
            setSelectedRegion('All');
            setSelectedStatus('All');
            setOnlyHiring(false);
            setOnlyTop(false);
            setOnlyHasNotes(false);
          }}
          className="w-full brutal-btn py-2 hover:bg-neon-orange hover:text-white uppercase tracking-wider text-xs"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
