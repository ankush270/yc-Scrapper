import React, { useState, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  GitCompareArrows, X, Search, Plus, MapPin, Users,
  Activity, Tag, DollarSign, Calendar, Building2,
  ExternalLink, ArrowRight
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

// Comparison dimension row
function CompareRow({ label, icon, valueA, valueB, highlight }) {
  const Icon = icon;
  const match = valueA && valueB && valueA === valueB;
  return (
    <div className={`flex items-stretch border-b border-slate-200 ${highlight ? 'bg-neon-cyan/5' : ''}`}>
      <div className="w-[120px] shrink-0 flex items-center space-x-1.5 p-2.5 border-r border-slate-200 bg-obsidian-dark">
        <Icon className="w-3 h-3 text-black shrink-0" />
        <span className="font-mono-tech text-[9px] font-bold text-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 p-2.5 text-center border-r border-slate-200">
        <span className="font-sans-body text-xs text-black font-medium">{valueA || '—'}</span>
      </div>
      <div className="flex-1 p-2.5 text-center">
        <span className="font-sans-body text-xs text-black font-medium">{valueB || '—'}</span>
      </div>
      {match && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <span className="font-mono-code text-[8px] bg-neon-emerald text-black px-1 py-0.5 rounded font-bold">MATCH</span>
        </div>
      )}
    </div>
  );
}

// Company selector search
function CompanySelector({ allCompanies, onSelect, placeholder, exclude }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return allCompanies
      .filter(c => c.id !== exclude)
      .filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.one_liner?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, allCompanies, exclude]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full brutal-input pl-8 pr-3 py-2 text-xs font-mono-code text-black placeholder-slate-400"
        />
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 brutal-card p-1.5 z-30 max-h-[200px] overflow-y-auto bg-white">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c);
                setQuery('');
                setShowResults(false);
              }}
              className="w-full flex items-center space-x-2.5 p-2 rounded cursor-pointer hover:bg-neon-cyan/10 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded border border-black flex items-center justify-center overflow-hidden shrink-0 bg-white">
                {c.small_logo_thumb_url ? (
                  <img src={c.small_logo_thumb_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono-tech text-[10px] font-bold">{c.name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <span className="font-mono-tech text-[10px] font-bold text-black block truncate">{c.name}</span>
                <span className="font-mono-code text-[8px] text-slate-500 block truncate">{c.one_liner}</span>
              </div>
              <span className="font-mono-code text-[8px] text-slate-400 font-bold shrink-0">{c.batch}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComparatorPanel({ allCompanies }) {
  const [companyA, setCompanyA] = useState(null);
  const [companyB, setCompanyB] = useState(null);
  const compareRef = useRef(null);

  useGSAP(() => {
    if (compareRef.current && companyA && companyB) {
      const rows = compareRef.current.querySelectorAll('.compare-row');
      if (rows.length) {
        gsap.fromTo(rows,
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: 0.2, stagger: 0.03, ease: 'power2.out' }
        );
      }
    }
  }, { dependencies: [companyA, companyB], scope: compareRef });

  // Tag overlap analysis
  const tagAnalysis = useMemo(() => {
    if (!companyA || !companyB) return null;
    const tagsA = new Set((companyA.tags || []).map(t => t.toLowerCase()));
    const tagsB = new Set((companyB.tags || []).map(t => t.toLowerCase()));
    const shared = [...tagsA].filter(t => tagsB.has(t));
    const onlyA = [...tagsA].filter(t => !tagsB.has(t));
    const onlyB = [...tagsB].filter(t => !tagsA.has(t));
    const jaccardScore = tagsA.size + tagsB.size > 0
      ? Math.round((shared.length / new Set([...tagsA, ...tagsB]).size) * 100)
      : 0;
    return { shared, onlyA, onlyB, jaccardScore };
  }, [companyA, companyB]);

  return (
    <div className="brutal-card p-5 bg-white">
      {/* Header */}
      <div className="flex items-center space-x-2.5 border-b-2 border-black pb-4 mb-5">
        <div className="w-9 h-9 rounded bg-neon-magenta border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <GitCompareArrows className="w-4.5 h-4.5" />
        </div>
        <div>
          <h2 className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest leading-none">
            STARTUP_COMPARATOR
          </h2>
          <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
            Side-by-side analysis of any two YC companies
          </span>
        </div>
      </div>

      {/* Company selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="space-y-2">
          <span className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider">Company A</span>
          {companyA ? (
            <div className="brutal-card p-3 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded border border-black flex items-center justify-center overflow-hidden shrink-0 bg-white">
                {companyA.small_logo_thumb_url ? (
                  <img src={companyA.small_logo_thumb_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono-tech text-sm font-bold bg-neon-cyan w-full h-full flex items-center justify-center">{companyA.name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <span className="font-mono-tech text-xs font-extrabold text-black block truncate">{companyA.name}</span>
                <span className="font-mono-code text-[9px] text-slate-600 block">{companyA.batch} • {companyA.industry}</span>
              </div>
              <button onClick={() => setCompanyA(null)} className="text-slate-500 hover:text-black cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <CompanySelector allCompanies={allCompanies} onSelect={setCompanyA} placeholder="Search company A..." exclude={companyB?.id} />
          )}
        </div>

        <div className="space-y-2">
          <span className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider">Company B</span>
          {companyB ? (
            <div className="brutal-card p-3 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded border border-black flex items-center justify-center overflow-hidden shrink-0 bg-white">
                {companyB.small_logo_thumb_url ? (
                  <img src={companyB.small_logo_thumb_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono-tech text-sm font-bold bg-neon-orange text-white w-full h-full flex items-center justify-center">{companyB.name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <span className="font-mono-tech text-xs font-extrabold text-black block truncate">{companyB.name}</span>
                <span className="font-mono-code text-[9px] text-slate-600 block">{companyB.batch} • {companyB.industry}</span>
              </div>
              <button onClick={() => setCompanyB(null)} className="text-slate-500 hover:text-black cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <CompanySelector allCompanies={allCompanies} onSelect={setCompanyB} placeholder="Search company B..." exclude={companyA?.id} />
          )}
        </div>
      </div>

      {/* Comparison table */}
      {companyA && companyB ? (
        <div ref={compareRef}>
          {/* Main comparison grid */}
          <div className="brutal-card overflow-hidden mb-5">
            {/* Header row */}
            <div className="flex items-stretch border-b-2 border-black bg-obsidian-dark">
              <div className="w-[120px] shrink-0 p-2.5 border-r border-black">
                <span className="font-mono-tech text-[9px] font-bold text-black uppercase">Dimension</span>
              </div>
              <div className="flex-1 p-2.5 text-center border-r border-black">
                <span className="font-mono-tech text-[10px] font-extrabold text-black uppercase">{companyA.name}</span>
              </div>
              <div className="flex-1 p-2.5 text-center">
                <span className="font-mono-tech text-[10px] font-extrabold text-black uppercase">{companyB.name}</span>
              </div>
            </div>

            {/* Data rows */}
            <div className="compare-row"><CompareRow label="Batch" icon={Calendar} valueA={companyA.batch} valueB={companyB.batch} /></div>
            <div className="compare-row"><CompareRow label="Industry" icon={Building2} valueA={companyA.industry} valueB={companyB.industry} highlight /></div>
            <div className="compare-row"><CompareRow label="Sub-Industry" icon={Tag} valueA={companyA.subindustry} valueB={companyB.subindustry} /></div>
            <div className="compare-row"><CompareRow label="Status" icon={Activity} valueA={companyA.status} valueB={companyB.status} highlight /></div>
            <div className="compare-row"><CompareRow label="Team Size" icon={Users} valueA={companyA.team_size?.toString()} valueB={companyB.team_size?.toString()} /></div>
            <div className="compare-row"><CompareRow label="Location" icon={MapPin} valueA={companyA.all_locations} valueB={companyB.all_locations} /></div>
            <div className="compare-row"><CompareRow label="Stage" icon={DollarSign} valueA={companyA.stage} valueB={companyB.stage} /></div>
            <div className="compare-row">
              <CompareRow
                label="Hiring"
                icon={Users}
                valueA={companyA.isHiring ? '✅ Yes' : '❌ No'}
                valueB={companyB.isHiring ? '✅ Yes' : '❌ No'}
              />
            </div>
          </div>

          {/* Pitch comparison */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="brutal-card p-3">
              <span className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase block mb-1.5">Pitch — {companyA.name}</span>
              <p className="font-sans-body text-xs text-black leading-relaxed font-medium">"{companyA.one_liner}"</p>
            </div>
            <div className="brutal-card p-3">
              <span className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase block mb-1.5">Pitch — {companyB.name}</span>
              <p className="font-sans-body text-xs text-black leading-relaxed font-medium">"{companyB.one_liner}"</p>
            </div>
          </div>

          {/* Tag overlap analysis */}
          {tagAnalysis && (
            <div className="brutal-card p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-tech text-[10px] font-extrabold text-black uppercase tracking-wider">
                  Tag Overlap Analysis
                </span>
                <span className={`font-mono-code text-[10px] font-bold px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000000] ${
                  tagAnalysis.jaccardScore > 50 ? 'bg-neon-emerald' :
                  tagAnalysis.jaccardScore > 20 ? 'bg-neon-cyan' : 'bg-white'
                }`}>
                  {tagAnalysis.jaccardScore}% overlap
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Only A */}
                <div className="space-y-1.5">
                  <span className="font-mono-code text-[8px] text-slate-500 font-bold uppercase block">
                    Only {companyA.name}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tagAnalysis.onlyA.map(t => (
                      <span key={t} className="font-mono-code text-[8px] bg-neon-cyan/20 border border-black px-1.5 py-0.5 rounded font-bold">#{t}</span>
                    ))}
                    {tagAnalysis.onlyA.length === 0 && <span className="font-mono-code text-[8px] text-slate-400">None</span>}
                  </div>
                </div>

                {/* Shared */}
                <div className="space-y-1.5">
                  <span className="font-mono-code text-[8px] text-slate-500 font-bold uppercase block">
                    Shared Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tagAnalysis.shared.map(t => (
                      <span key={t} className="font-mono-code text-[8px] bg-neon-emerald border border-black px-1.5 py-0.5 rounded font-bold">#{t}</span>
                    ))}
                    {tagAnalysis.shared.length === 0 && <span className="font-mono-code text-[8px] text-slate-400">None</span>}
                  </div>
                </div>

                {/* Only B */}
                <div className="space-y-1.5">
                  <span className="font-mono-code text-[8px] text-slate-500 font-bold uppercase block">
                    Only {companyB.name}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tagAnalysis.onlyB.map(t => (
                      <span key={t} className="font-mono-code text-[8px] bg-neon-orange/20 border border-black px-1.5 py-0.5 rounded font-bold">#{t}</span>
                    ))}
                    {tagAnalysis.onlyB.length === 0 && <span className="font-mono-code text-[8px] text-slate-400">None</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            {[companyA, companyB].map(c => (
              <div key={c.id} className="flex items-center space-x-2">
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    className="brutal-btn flex items-center space-x-1 px-2.5 py-1.5 text-[9px] font-mono-tech uppercase hover:bg-neon-cyan">
                    <span>{c.name} Website</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <GitCompareArrows className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <span className="font-mono-tech text-xs text-slate-500 font-bold uppercase block">
            Select two companies above to compare
          </span>
          <p className="font-mono-code text-[9px] text-slate-400 mt-1.5 max-w-[280px] mx-auto">
            Search and select any two YC startups to see a detailed side-by-side breakdown of their profiles, tags, and market positioning.
          </p>
        </div>
      )}
    </div>
  );
}
