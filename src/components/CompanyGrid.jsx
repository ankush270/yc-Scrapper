import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CompanyCard from './CompanyCard';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function CompanyGrid({
  companies,
  selectedCompany,
  setSelectedCompany,
  userNotes,
  currentPage,
  setCurrentPage
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
      <div className="flex justify-between items-center text-xs font-mono-code text-slate-500 border-b border-slate-900 pb-3 flex-shrink-0">
        <span>
          SHOWING <span className="text-white">{totalItems > 0 ? startIndex + 1 : 0}-{endIndex}</span> OF <span className="text-white">{totalItems.toLocaleString()}</span> MATCHED
        </span>
        <span>
          PAGE <span className="text-white">{currentPage}</span> / {totalPages}
        </span>
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 my-8">
          <AlertTriangle className="w-10 h-10 text-neon-orange mb-3 opacity-60" />
          <h4 className="font-mono-tech text-base font-bold text-white uppercase tracking-wider mb-2">
            NO_STARTUPS_FOUND
          </h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Your query didn't match any YC records in our database. Try adjusting your search term or relaxing selected controllers.
          </p>
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
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cyberpunk Paginator */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-1.5 pt-4 border-t border-slate-900 flex-shrink-0 select-none">
              {/* Prev button */}
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:text-neon-cyan hover:border-neon-cyan disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Number buttons */}
              {getPaginatorRange().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="w-8 h-8 flex items-center justify-center font-mono-code text-xs text-slate-600"
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
                    className={`w-8 h-8 rounded font-mono-code text-xs transition-all cursor-pointer border
                      ${isActive
                        ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-glow-cyan'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
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
                className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:text-neon-cyan hover:border-neon-cyan disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
