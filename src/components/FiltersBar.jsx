import React, { useMemo } from 'react';
import { Search, Filter, SortAsc, HelpCircle, Check, X } from 'lucide-react';

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
    <div className="glass-panel rounded-xl border border-slate-800 p-5 space-y-6 select-none relative overflow-hidden">
      {/* Tech line detail */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-neon-cyan via-neon-emerald to-transparent"></div>

      {/* Terminal Title */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Filter className="w-4 h-4 text-neon-emerald" />
        <span className="font-mono-tech text-sm font-bold text-white tracking-widest uppercase">
          CONSOLE_CONTROLLERS
        </span>
      </div>

      {/* 1. Live Text Search */}
      <div className="space-y-2">
        <label className="block font-mono-tech text-xs text-slate-300 uppercase tracking-wider">
          Search Directory
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-mono-code">
            &gt;_
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, pitch, or tech..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-450 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all font-mono-code"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sorting */}
      <div className="space-y-2">
        <label className="block font-mono-tech text-xs text-slate-300 uppercase tracking-wider">
          Sort Order
        </label>
        <div className="relative">
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-neon-cyan appearance-none cursor-pointer font-sans-body"
          >
            <option value="batch-newest">Batch: Newest First</option>
            <option value="batch-oldest">Batch: Oldest First</option>
            <option value="name-az">Company Name: A-Z</option>
            <option value="name-za">Company Name: Z-A</option>
            <option value="size-largest">Team Size: Largest</option>
            <option value="size-smallest">Team Size: Smallest</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
            ▼
          </div>
        </div>
      </div>

      {/* 3. Filters dropdowns */}
      <div className="space-y-4 pt-2 border-t border-slate-900">
        {/* Batch Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-300 uppercase tracking-wider">
            YC Batch
          </label>
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-neon-cyan appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Batches</option>
              {batchesList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>

        {/* Industry Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-300 uppercase tracking-wider">
            Industry
          </label>
          <div className="relative">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-neon-cyan appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Industries</option>
              {industriesList.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>

        {/* Region Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-300 uppercase tracking-wider">
            Geographic Region
          </label>
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-neon-cyan appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Regions</option>
              {regionsList.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="block font-mono-tech text-xs text-slate-300 uppercase tracking-wider">
            Operating Status
          </label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-neon-cyan appearance-none cursor-pointer font-sans-body"
            >
              <option value="All">All Statuses</option>
              {statusesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Checkboxes */}
      <div className="space-y-3 pt-4 border-t border-slate-900">
        <label className="block font-mono-tech text-xs text-slate-300 uppercase tracking-wider mb-2">
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
            <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${onlyHiring ? 'bg-neon-emerald/20 border-neon-emerald text-neon-emerald' : 'border-slate-800 bg-slate-950 group-hover:border-slate-600'}`}>
              {onlyHiring && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
          <span className="text-xs text-slate-300 font-sans-body select-none">
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
            <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${onlyTop ? 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta' : 'border-slate-800 bg-slate-950 group-hover:border-slate-600'}`}>
              {onlyTop && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
          <span className="text-xs text-slate-300 font-sans-body select-none">
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
            <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${onlyHasNotes ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-slate-800 bg-slate-950 group-hover:border-slate-600'}`}>
              {onlyHasNotes && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
          <span className="text-xs text-slate-300 font-sans-body select-none flex items-center justify-between w-full">
            <span>Has My Study Notes</span>
            {notesCount > 0 && (
              <span className="bg-neon-cyan/10 border border-neon-cyan/35 text-neon-cyan font-mono-code text-[10px] px-1.5 py-0.2 rounded-full">
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
          className="w-full font-mono-tech text-xs bg-slate-950 border border-slate-800 text-slate-400 hover:text-neon-cyan hover:border-neon-cyan hover:shadow-glow-cyan py-2 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
