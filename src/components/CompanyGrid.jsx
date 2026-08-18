import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CompanyCard from './CompanyCard';
import { ChevronLeft, ChevronRight, AlertTriangle, Search, Sparkles } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function CompanyGrid({
  companies,
  selectedCompany,
  setSelectedCompany,
  userNotes,
  currentPage,
  setCurrentPage,
  searchQuery,
  searchSuggestions,
  setSearchQuery,
  favoriteIds,
  setFavoriteIds
}) {
  const gridRef = useRef(null);
  const itemsPerPage = 30;
  
  // Calculate paging parameters
  const totalItems = companies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Guard against currentPage out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentCompanies = companies.slice(startIndex, endIndex);

  // GSAP Stagger Entry Animation whenever page or companies change
  useGSAP(() => {
    const cards = gridRef.current?.querySelectorAll('.company-card-wrapper');
    if (!cards || cards.length === 0) return;
    
    // Reset before animating
    gsap.killTweensOf(cards);
    gsap.set(cards, { opacity: 0, y: 15 });
    
    // Animate in
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      stagger: 0.015,
      ease: 'power2.out',
      clearProps: 'transform' // Avoid fixing position absolute/transform styles that interfere with hover
    });
  }, { 
    dependencies: [currentPage, companies],
    scope: gridRef
  });

  // Page selection handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Smooth scroll back to top of grid area
      const gridElem = document.getElementById('grid-anchor');
      if (gridElem) {
        gridElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Helper to construct paginator button numbers
  const getPaginatorRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="space-y-4 flex flex-col h-full overflow-hidden" id="grid-anchor">
      {/* Search statistics header */}
      <div className="flex justify-between items-center text-xs font-mono-code text-slate-700 border-b-2 border-black pb-3 flex-shrink-0 font-bold">
        <span>
          SHOWING <span className="text-black font-extrabold">{totalItems > 0 ? startIndex + 1 : 0}-{endIndex}</span> OF <span className="text-black font-extrabold">{totalItems.toLocaleString()}</span> MATCHED
        </span>
        <span>
          PAGE <span className="text-black font-extrabold">{currentPage}</span> / {totalPages}
        </span>
      </div>

      {/* Search mode indicator */}
      {searchQuery && searchQuery.trim().length >= 2 && totalItems > 0 && (
        <div className="flex items-center space-x-2 bg-neon-cyan/10 border-2 border-black rounded p-2.5 flex-shrink-0 shadow-[2px_2px_0px_0px_#000000]">
          <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
          <span className="font-mono-code text-[10px] text-black font-bold">
            FUZZY_SEARCH: Results ranked by relevance for "{searchQuery}"
          </span>
        </div>
      )}

      {totalItems === 0 ? (
        <div className="brutal-card border-dashed p-12 text-center my-8 bg-white flex flex-col items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-neon-orange mb-3 opacity-90" />
          <h4 className="font-mono-tech text-base font-extrabold text-black uppercase tracking-wider mb-2">
            NO_STARTUPS_FOUND
          </h4>
          <p className="text-xs text-slate-700 max-w-sm leading-relaxed font-medium">
            Your query didn't match any YC records in our database. Try adjusting your search term or relaxing selected controllers.
          </p>

          {/* Did you mean? suggestions */}
          {searchSuggestions && searchSuggestions.length > 0 && (
            <div className="mt-5 w-full max-w-sm">
              <span className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block mb-2.5">
                🔍 Did you mean?
              </span>
              <div className="space-y-2">
                {searchSuggestions.map((s) => (
                  <button
                    key={s.item.id}
                    onClick={() => {
                      setSearchQuery(s.item.name);
                      setSelectedCompany(s.item);
                    }}
                    className="w-full brutal-card p-3 flex items-center space-x-3 cursor-pointer hover:bg-neon-cyan/10 transition-all text-left"
                  >
                    <Search className="w-3.5 h-3.5 text-black shrink-0" />
                    <div className="flex-grow min-w-0">
                      <span className="font-mono-tech text-[11px] font-extrabold text-black block truncate">
                        {s.item.name}
                      </span>
                      <span className="font-mono-code text-[9px] text-slate-600 block truncate">
                        {s.item.one_liner}
                      </span>
                    </div>
                    <span className="font-mono-code text-[8px] font-bold bg-neon-emerald border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000] shrink-0">
                      {s.relevance}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Main Grid wrapper */}
          <div className="flex-grow overflow-y-auto pr-1.5 pb-2">
            <div
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {currentCompanies.map((c) => {
                const slug = c.slug || c.id.toString();
                const hasNote = !!userNotes[slug];
                const isSelected = selectedCompany && selectedCompany.id === c.id;
                
                return (
                  <div key={c.id} className="company-card-wrapper opacity-0">
                    <CompanyCard
                      company={c}
                      hasNote={hasNote}
                      isSelected={isSelected}
                      onClick={() => setSelectedCompany(c)}
                      favoriteIds={favoriteIds}
                      setFavoriteIds={setFavoriteIds}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cyberpunk Paginator -> Neo-Brutalist Paginator */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-4 border-t-2 border-black flex-shrink-0 select-none">
              {/* Prev button */}
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="brutal-btn w-8 h-8 flex items-center justify-center text-black shadow-[1.5px_1.5px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px]"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3px]" />
              </button>

              {/* Number buttons */}
              {getPaginatorRange().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="w-8 h-8 flex items-center justify-center font-mono-code text-xs text-slate-700 font-bold"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = p === currentPage;
                return (
                  <button
                    key={`page-${p}`}
                    onClick={() => handlePageChange(p)}
                    className={`brutal-btn w-8 h-8 flex items-center justify-center font-mono-code text-xs transition-all cursor-pointer border
                      ${isActive
                        ? 'bg-neon-cyan text-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-[0.5px] -translate-y-[0.5px]'
                        : 'bg-white text-black hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px]'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next button */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="brutal-btn w-8 h-8 flex items-center justify-center text-black shadow-[1.5px_1.5px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px]"
              >
                <ChevronRight className="w-4 h-4 stroke-[3px]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
