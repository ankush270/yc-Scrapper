import React, { useState, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Database, Download, Upload, Terminal, Sparkles, RefreshCw } from 'lucide-react';
import StatsSection from './components/StatsSection';
import FiltersBar from './components/FiltersBar';
import CompanyGrid from './components/CompanyGrid';
import InspectorPanel from './components/InspectorPanel';

gsap.registerPlugin(useGSAP);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('batch-newest');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [onlyHiring, setOnlyHiring] = useState(false);
  const [onlyTop, setOnlyTop] = useState(false);
  const [onlyHasNotes, setOnlyHasNotes] = useState(false);
  
  // Paging
  const [currentPage, setCurrentPage] = useState(1);

  // Notes state
  const [userNotes, setUserNotes] = useState({});
  const fileInputRef = useRef(null);

  // Main container ref for terminal boot reveal
  const bootOverlayRef = useRef(null);
  const bootTextRef = useRef(null);
  const mainDashboardRef = useRef(null);

  // useGSAP for contextSafe callbacks
  const { contextSafe } = useGSAP();

  const animateDashboardReveal = contextSafe((data) => {
    setCompanies(data);
    
    // GSAP Animate Out boot overlay
    if (bootOverlayRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          setLoading(false);
          // Animate main dashboard reveal
          gsap.fromTo(
            mainDashboardRef.current,
            { opacity: 0, scale: 0.98, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
        }
      });
      
      tl.to(bootOverlayRef.current, {
        opacity: 0,
        duration: 0.45,
        ease: 'power1.inOut'
      });
    } else {
      setLoading(false);
    }
  });

  // 1. Fetch YC local dataset and load custom notes
  useEffect(() => {
    // Load notes from localStorage
    const notes = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('yc_note_')) {
        const slug = key.replace('yc_note_', '');
        notes[slug] = localStorage.getItem(key);
      }
    }
    setUserNotes(notes);

    // Boot logs timeline simulation
    const bootLines = [
      'SYS_INIT: Booting YC Idea Explorer...',
      'NET_CONNECT: Querying secure local storage...',
      `DB_SYNC: Loaded ${Object.keys(notes).length} startup study notes from local cache.`,
      'DB_FETCH: Accessing public/data/yc_companies.json...',
      'PARSING: Indexing 6,179 company profiles...',
      'SYSTEM_ONLINE: Establishing terminal interface.'
    ];

    let currentLineIdx = 0;
    const interval = setInterval(() => {
      if (currentLineIdx < bootLines.length) {
        setLoadingProgress(prev => [...prev, bootLines[currentLineIdx]]);
        currentLineIdx++;
      } else {
        clearInterval(interval);
        
        // Fetch startup companies data
        fetch('/data/yc_companies.json')
          .then(res => res.json())
          .then(data => {
            animateDashboardReveal(data);
          })
          .catch(err => {
            console.error('Error loading YC companies data:', err);
            setLoadingProgress(prev => [...prev, 'CRITICAL ERROR: Failed to parse company JSON.']);
          });
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // 2. Filter & Sort Logic
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Filter text search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        return (
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.one_liner && c.one_liner.toLowerCase().includes(query)) ||
          (c.long_description && c.long_description.toLowerCase().includes(query)) ||
          (c.industry && c.industry.toLowerCase().includes(query)) ||
          (c.subindustry && c.subindustry.toLowerCase().includes(query)) ||
          (c.all_locations && c.all_locations.toLowerCase().includes(query)) ||
          (c.tags && c.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      });
    }

    // Filter dropdowns
    if (selectedBatch !== 'All') {
      result = result.filter(c => c.batch === selectedBatch);
    }
    if (selectedIndustry !== 'All') {
      result = result.filter(c => c.industry === selectedIndustry);
    }
    if (selectedRegion !== 'All') {
      result = result.filter(c => c.regions && c.regions.includes(selectedRegion));
    }
    if (selectedStatus !== 'All') {
      result = result.filter(c => c.status === selectedStatus);
    }

    // Checkboxes
    if (onlyHiring) {
      result = result.filter(c => c.isHiring === true);
    }
    if (onlyTop) {
      result = result.filter(c => c.top_company === true);
    }
    if (onlyHasNotes) {
      result = result.filter(c => {
        const slug = c.slug || c.id.toString();
        return !!userNotes[slug];
      });
    }

    // Sorting logic
    result.sort((a, b) => {
      switch (sortType) {
        case 'batch-newest':
        case 'batch-oldest': {
          const getBatchVal = (batchStr) => {
            if (!batchStr) return 0;
            const match = batchStr.match(/(\w+)\s+(\d+)/);
            if (!match) return 0;
            const season = match[1];
            const year = parseInt(match[2]);
            const seasonVal = season.toLowerCase().startsWith('w') ? 1 : 2;
            return year * 10 + seasonVal;
          };
          const valA = getBatchVal(a.batch);
          const valB = getBatchVal(b.batch);
          return sortType === 'batch-newest' ? valB - valA : valA - valB;
        }
        case 'name-az':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-za':
          return (b.name || '').localeCompare(a.name || '');
        case 'size-largest':
          return (b.team_size || 0) - (a.team_size || 0);
        case 'size-smallest': {
          // Put companies with size 0 or undefined at the bottom
          const sizeA = a.team_size === undefined ? 99999 : a.team_size;
          const sizeB = b.team_size === undefined ? 99999 : b.team_size;
          return sizeA - sizeB;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [
    companies,
    searchQuery,
    selectedBatch,
    selectedIndustry,
    selectedRegion,
    selectedStatus,
    onlyHiring,
    onlyTop,
    onlyHasNotes,
    sortType,
    userNotes
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedBatch,
    selectedIndustry,
    selectedRegion,
    selectedStatus,
    onlyHiring,
    onlyTop,
    onlyHasNotes
  ]);

  // 3. User Notes Management Hooks
  const handleNoteChange = (slug, text) => {
    if (!text || text.trim() === '') {
      localStorage.removeItem(`yc_note_${slug}`);
      setUserNotes(prev => {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      });
    } else {
      localStorage.setItem(`yc_note_${slug}`, text);
      setUserNotes(prev => ({
        ...prev,
        [slug]: text
      }));
    }
  };

  // 4. Notes Backup Export (JSON Download)
  const exportNotes = () => {
    const backupData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('yc_note_')) {
        backupData[key] = localStorage.getItem(key);
      }
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `yc_startup_takeaways_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 5. Notes Backup Import (JSON File Parser)
  const importNotes = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        let importCount = 0;
        
        Object.keys(importedData).forEach(key => {
          if (key.startsWith('yc_note_')) {
            localStorage.setItem(key, importedData[key]);
            importCount++;
          }
        });

        // Refresh state
        const updatedNotes = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith('yc_note_')) {
            const slug = k.replace('yc_note_', '');
            updatedNotes[slug] = localStorage.getItem(k);
          }
        }
        setUserNotes(updatedNotes);
        alert(`SUCCESS: Imported ${importCount} startup study takeaways successfully!`);
      } catch (err) {
        alert('ERROR: Failed to parse uploaded JSON file. Please verify it is a valid backup.');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = null;
  };

  const selectedSlug = selectedCompany ? (selectedCompany.slug || selectedCompany.id.toString()) : null;

  return (
    <div className="min-h-screen bg-obsidian-bg text-slate-200 terminal-scanlines flex flex-col antialiased pb-6">
      
      {/* 1. Technical Boot Up Loading Screen */}
      {loading && (
        <div 
          ref={bootOverlayRef}
          className="fixed inset-0 bg-obsidian-dark z-50 flex flex-col justify-center items-center p-6 font-mono-code"
        >
          <div className="w-full max-w-md bg-slate-950/80 border border-neon-emerald/30 p-5 rounded-lg shadow-[0_0_30px_rgba(0,255,157,0.05)]">
            <div className="flex items-center space-x-2 border-b border-neon-emerald/20 pb-3 mb-4 text-neon-emerald">
              <Terminal className="w-4 h-4" />
              <span className="font-mono-tech tracking-wider uppercase text-xs">YC_IDEA_LAB_BOOT_SEQUENCE</span>
            </div>
            
            <div ref={bootTextRef} className="space-y-2 text-xs text-slate-400 min-h-[140px]">
              {loadingProgress.map((line, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-neon-emerald mr-2">&gt;</span>
                  <span>{line}</span>
                </div>
              ))}
              <div className="flex items-center text-neon-emerald mt-2 font-bold animate-pulse">
                <span>SYSTEM BOOTING</span>
                <span className="cursor-blink ml-1">_</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Dashboard Interface */}
      <div 
        ref={mainDashboardRef}
        style={{ opacity: loading ? 0 : 1 }}
        className="w-full max-w-7xl mx-auto px-4 pt-4 pb-2 flex flex-col space-y-4 flex-grow"
      >
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 border-b border-slate-900 pb-5">
          <div className="flex items-center space-x-2.5 select-none">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-[0_0_10px_rgba(0,210,255,0.2)]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-mono-tech text-lg md:text-xl font-bold text-white tracking-widest leading-none flex items-center">
                YC_IDEA_EXPLORER <span className="text-[10px] text-neon-cyan border border-neon-cyan/30 px-1 ml-2 rounded font-mono-code font-normal">v1.2</span>
              </h1>
              <span className="text-[10px] font-mono-code text-slate-500 block mt-1 uppercase">
                Browse ideas // study value propositions // build the future
              </span>
            </div>
          </div>

          {/* Backup Restore Buttons */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={exportNotes}
              className="flex items-center justify-center space-x-1.5 font-mono-tech text-[10px] bg-slate-950 border border-slate-800 hover:border-neon-cyan hover:text-neon-cyan hover:shadow-glow-cyan px-3 py-2 rounded-lg transition-all uppercase tracking-wide cursor-pointer text-slate-400"
              title="Backup your notes to a JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup Takeaways</span>
            </button>

            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center justify-center space-x-1.5 font-mono-tech text-[10px] bg-slate-950 border border-slate-800 hover:border-neon-orange hover:text-neon-orange hover:shadow-glow-orange px-3 py-2 rounded-lg transition-all uppercase tracking-wide cursor-pointer text-slate-400"
              title="Restore notes from a JSON backup file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Takeaways</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={importNotes}
              accept=".json"
              className="hidden"
            />
          </div>
        </header>

        {/* Dynamic Metric Tickers */}
        <StatsSection 
          allCompanies={companies} 
          filteredCompanies={filteredCompanies}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          onlyTop={onlyTop}
          setOnlyTop={setOnlyTop}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          resetFilters={() => {
            setSearchQuery('');
            setSelectedBatch('All');
            setSelectedIndustry('All');
            setSelectedRegion('All');
            setSelectedStatus('All');
            setOnlyHiring(false);
            setOnlyTop(false);
            setOnlyHasNotes(false);
          }}
        />

        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start pb-1">
          
          {/* Col 1: Filters Sidebar (Tailwind width controls) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-4 h-auto">
            <FiltersBar
              allCompanies={companies}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortType={sortType}
              setSortType={setSortType}
              selectedBatch={selectedBatch}
              setSelectedBatch={setSelectedBatch}
              selectedIndustry={selectedIndustry}
              setSelectedIndustry={setSelectedIndustry}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              onlyHiring={onlyHiring}
              setOnlyHiring={setOnlyHiring}
              onlyTop={onlyTop}
              setOnlyTop={setOnlyTop}
              onlyHasNotes={onlyHasNotes}
              setOnlyHasNotes={setOnlyHasNotes}
              notesCount={Object.keys(userNotes).length}
            />
          </aside>

          {/* Col 2 & 3: Startup List Console */}
          <main className="lg:col-span-2 flex flex-col h-[780px] overflow-hidden">
            <CompanyGrid
              companies={filteredCompanies}
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
              userNotes={userNotes}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </main>

          {/* Col 4: Startup Inspector Drawer Panel */}
          <section className="lg:col-span-1 h-[780px] overflow-hidden lg:sticky lg:top-4">
            <InspectorPanel
              company={selectedCompany}
              noteText={selectedSlug ? (userNotes[selectedSlug] || '') : ''}
              onNoteChange={handleNoteChange}
              onClose={() => setSelectedCompany(null)}
            />
          </section>

        </div>
      </div>
      
      {/* Footer copyright */}
      <footer className="mt-auto border-t border-slate-950 py-4 text-center font-mono-code text-[10px] text-slate-600 bg-obsidian-dark select-none">
        <span>CONSOLE RUNNING // LOADED 6,179 YC COMPANIES FROM LOCAL PACK // BUILT FOR BUILDERS TO STUDY IDEAS</span>
      </footer>
    </div>
  );
}
