import React, { useState, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Database, Download, Upload, Terminal, Settings } from 'lucide-react';
import StatsSection from './components/StatsSection';
import FiltersBar from './components/FiltersBar';
import CompanyGrid from './components/CompanyGrid';
import InspectorPanel from './components/InspectorPanel';
import TrendsDashboard from './components/TrendsDashboard';
import IdeaGapFinder from './components/IdeaGapFinder';
import SandboxTab from './components/SandboxTab';
import FavoritesBar from './components/FavoritesBar';
import ComparatorPanel from './components/ComparatorPanel';
import SettingsModal from './components/SettingsModal';
import AuthBar from './components/AuthBar';
import DailyChallenge from './components/DailyChallenge';
import AchievementToast from './components/AchievementToast';
import PublicProfile from './components/PublicProfile';
import { fuzzySearch, getSearchSuggestions } from './lib/fuzzySearch';
import { getAllFavorites, getSetting, setSetting } from './lib/storage';
import { trackUserAction } from './lib/achievements';
import { subscribeToAuth, getAuthHeader } from './lib/firebase';
import LandingPage from './components/LandingPage';
import PublicTeardownView from './components/PublicTeardownView';
import StreakCounter from './components/StreakCounter';
import Leaderboard from './components/Leaderboard';

gsap.registerPlugin(useGSAP);

export default function App() {
  const [teardownId, setTeardownId] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#teardown/')) {
      return hash.replace('#teardown/', '');
    }
    return null;
  });

  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#teardown/')) return 'teardown';
    if (hash === '#app') return 'app';
    return 'landing';
  });

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
  
  // View tab state
  const [activeTab, setActiveTab] = useState('explorer');
  
  // Paging
  const [currentPage, setCurrentPage] = useState(1);

  // Notes state
  const [userNotes, setUserNotes] = useState({});
  const fileInputRef = useRef(null);

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favDrawerOpen, setFavDrawerOpen] = useState(false);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);

  // Main container ref for terminal boot reveal
  const bootOverlayRef = useRef(null);
  const bootTextRef = useRef(null);
  const mainDashboardRef = useRef(null);
  const tabContentRef = useRef(null);

  // Animate tab content transitions
  useGSAP(() => {
    if (tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, { dependencies: [activeTab] });

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
      'SYS_INIT: Booting YC_DECODE...',
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

  // Load favorites from IndexedDB
  useEffect(() => {
    getAllFavorites().then(favs => {
      setFavoriteIds(new Set(favs.map(f => f.companyId)));
    });
  }, []);

  // Listen to auth changes to load/sync notes and favorites from backend
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        // Fetch notes from Python backend
        try {
          const header = getAuthHeader();
          const res = await fetch('/api/notes', {
            headers: { 'Authorization': header }
          });
          if (res.ok) {
            const backendNotes = await res.json();
            setUserNotes(backendNotes);
            
            // Sync with local cache for fallback
            Object.keys(backendNotes).forEach(slug => {
              localStorage.setItem(`yc_note_${slug}`, backendNotes[slug]);
            });
          }
        } catch (err) {
          console.warn("Failed to load notes from backend:", err);
        }
      } else {
        // Logged out, load notes from localStorage only
        const notes = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('yc_note_')) {
            const slug = key.replace('yc_note_', '');
            notes[slug] = localStorage.getItem(key);
          }
        }
        setUserNotes(notes);
      }
      
      // Reload favorites to trigger sync
      getAllFavorites().then(favs => {
        setFavoriteIds(new Set(favs.map(f => f.companyId)));
      });
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#teardown/')) {
        setTeardownId(hash.replace('#teardown/', ''));
        setCurrentView('teardown');
      } else if (hash === '#app') {
        setCurrentView('app');
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Track company view and regions explored
  useEffect(() => {
    if (selectedCompany) {
      // Track company viewed stat
      trackUserAction('companies_viewed');

      // Check if regions explored stats need incrementing
      if (selectedCompany.regions) {
        getSetting('regions_explored_set').then(async (setJson) => {
          const regionsSet = new Set(setJson ? JSON.parse(setJson) : []);
          const oldSize = regionsSet.size;
          selectedCompany.regions.forEach(r => regionsSet.add(r));
          if (regionsSet.size > oldSize) {
            await setSetting('regions_explored_set', JSON.stringify(Array.from(regionsSet)));
            await trackUserAction('regions_explored', regionsSet.size - oldSize);
          }
        });
      }

      // Dispatch inspected event
      const event = new CustomEvent('yc_company_inspected', { detail: selectedCompany });
      window.dispatchEvent(event);
    }
  }, [selectedCompany]);

  const refreshAllData = () => {
    // Reload local notes
    const notes = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('yc_note_')) {
        const slug = key.replace('yc_note_', '');
        notes[slug] = localStorage.getItem(key);
      }
    }
    setUserNotes(notes);

    // Reload favorites
    getAllFavorites().then(favs => {
      setFavoriteIds(new Set(favs.map(f => f.companyId)));
    });
  };

  // 2. Filter & Sort Logic — Now powered by Fuse.js fuzzy search
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return null;
    return fuzzySearch(companies, searchQuery);
  }, [companies, searchQuery]);

  // Search suggestions when no results found
  const searchSuggestions = useMemo(() => {
    if (!searchResults || searchResults.length > 0) return [];
    return getSearchSuggestions(companies, searchQuery);
  }, [companies, searchQuery, searchResults]);

  const filteredCompanies = useMemo(() => {
    let result;
    let relevanceMap = null;

    // Use fuzzy search results if a search is active
    if (searchResults) {
      result = searchResults.map(r => r.item);
      // Build a relevance lookup for UI display
      relevanceMap = new Map();
      searchResults.forEach(r => {
        relevanceMap.set(r.item.id, r.relevance);
      });
    } else {
      result = [...companies];
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

    // Sorting logic — skip sorting when fuzzy search is active (already ranked by relevance)
    if (!searchResults) {
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
            const sizeA = a.team_size === undefined ? 99999 : a.team_size;
            const sizeB = b.team_size === undefined ? 99999 : b.team_size;
            return sizeA - sizeB;
          }
          default:
            return 0;
        }
      });
    }

    return result;
  }, [
    companies,
    searchQuery,
    searchResults,
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
  const handleNoteChange = async (slug, text) => {
    const isNewNote = !userNotes[slug] && text && text.trim().length > 0;
    
    // Update local state first (optimistic UI update)
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

    // Sync with backend if logged in
    const header = getAuthHeader();
    if (header) {
      try {
        if (!text || text.trim() === '') {
          await fetch(`/api/notes/${slug}`, {
            method: 'DELETE',
            headers: { 'Authorization': header }
          });
        } else {
          await fetch('/api/notes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': header
            },
            body: JSON.stringify({ companySlug: slug, noteText: text })
          });
        }
      } catch (err) {
        console.error("Failed to sync note to backend:", err);
      }
    }

    if (isNewNote) {
      trackUserAction('notes_written');
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

  if (currentView === 'landing') {
    return <LandingPage onStart={() => { window.location.hash = 'app'; }} />;
  }

  if (currentView === 'teardown') {
    return <PublicTeardownView teardownId={teardownId} onBackToLanding={() => { window.location.hash = 'landing'; }} />;
  }

  return (
    <div className="min-h-screen bg-obsidian-bg text-slate-900 flex flex-col antialiased pb-6">
      
      {/* 1. Technical Boot Up Loading Screen */}
      {loading && (
        <div 
          ref={bootOverlayRef}
          className="fixed inset-0 bg-obsidian-bg z-50 flex flex-col justify-center items-center p-6 font-mono-code"
        >
          <div className="w-full max-w-md bg-white border-2.5 border-black p-5 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
            <div className="flex items-center space-x-2 border-b-2 border-black pb-3 mb-4 text-black">
              <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0">
                <rect x="10" y="10" width="80" height="80" fill="#ff7700" stroke="#000" strokeWidth="4" />
                <rect x="5" y="5" width="80" height="80" fill="#00bce6" stroke="#000" strokeWidth="4" />
                <text x="22" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="2">Y</text>
                <text x="46" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#000">D</text>
              </svg>
              <span className="font-mono-tech tracking-wider uppercase text-xs font-bold">YC_DECODE_BOOT_SEQUENCE</span>
            </div>
            
            <div ref={bootTextRef} className="space-y-2 text-xs text-slate-800 min-h-[140px]">
              {loadingProgress.map((line, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-neon-orange font-bold mr-2">&gt;</span>
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 border-b-2 border-black pb-5">
          <div className="flex items-center space-x-2.5 select-none">
            <div className="w-9 h-9 rounded border-2 border-black bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="10" y="10" width="80" height="80" fill="#ff7700" stroke="#000" strokeWidth="4" />
                <rect x="5" y="5" width="80" height="80" fill="#00bce6" stroke="#000" strokeWidth="4" />
                <text x="22" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="2">Y</text>
                <text x="46" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#000">D</text>
              </svg>
            </div>
            <div>
              <h1 className="font-mono-tech text-lg md:text-xl font-bold text-black tracking-widest leading-none flex items-center">
                YC_DECODE <span className="text-[9px] bg-neon-orange border border-black px-1.5 py-0.5 ml-2 rounded font-mono-code font-bold text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">v1.2</span>
              </h1>
              <span className="text-[10px] font-mono-code text-slate-600 block mt-1 uppercase">
                Decode patterns // study value propositions // build the future
              </span>
            </div>
          </div>

          {/* Backup Restore Buttons */}
          <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
            <button
              onClick={exportNotes}
              className="brutal-btn flex items-center justify-center space-x-1.5 font-mono-tech text-[10px] px-3.5 py-2 hover:bg-neon-cyan"
              title="Backup your notes to a JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup Takeaways</span>
            </button>

            <button
              onClick={() => fileInputRef.current.click()}
              className="brutal-btn flex items-center justify-center space-x-1.5 font-mono-tech text-[10px] px-3.5 py-2 hover:bg-neon-orange hover:text-white animate-pulse"
              title="Restore notes from a JSON backup file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Takeaways</span>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="brutal-btn flex items-center justify-center space-x-1.5 font-mono-tech text-[10px] px-3.5 py-2 hover:bg-neon-cyan"
              title="Open settings and configure API keys"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <StreakCounter />

            <AuthBar onOpenProfile={() => setProfileOpen(true)} />

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

        {/* Terminal Tabs Navigation */}
        <div className="flex items-center space-x-3 border-b-2 border-black pb-2.5 select-none">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`font-mono-tech text-xs px-4 py-2 border-2 border-black cursor-pointer rounded transition-all uppercase tracking-wider ${
              activeTab === 'explorer'
                ? 'bg-neon-cyan text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            🖥️ EXPLORER_CONSOLE
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`font-mono-tech text-xs px-4 py-2 border-2 border-black cursor-pointer rounded transition-all uppercase tracking-wider ${
              activeTab === 'trends'
                ? 'bg-neon-cyan text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            📊 TRENDS_DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`font-mono-tech text-xs px-4 py-2 border-2 border-black cursor-pointer rounded transition-all uppercase tracking-wider ${
              activeTab === 'gaps'
                ? 'bg-neon-emerald text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            🎯 GAP_FINDER
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`font-mono-tech text-xs px-4 py-2 border-2 border-black cursor-pointer rounded transition-all uppercase tracking-wider ${
              activeTab === 'sandbox'
                ? 'bg-neon-orange text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            🛠️ BUILDER_SANDBOX
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`font-mono-tech text-xs px-4 py-2 border-2 border-black cursor-pointer rounded transition-all uppercase tracking-wider ${
              activeTab === 'leaderboard'
                ? 'bg-neon-magenta text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold -translate-x-[1px] -translate-y-[1px]'
                : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            🏆 ARENA_LEADERBOARD
          </button>
        </div>

        {/* Tab Content Panels */}
        <div ref={tabContentRef} className="w-full">
          {activeTab === 'explorer' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start pb-1">
              
              {/* Col 1: Filters Sidebar */}
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
              <main className="lg:col-span-2 flex flex-col h-[780px] overflow-hidden space-y-4">
                <DailyChallenge />
                <div className="flex-grow overflow-hidden">
                  <CompanyGrid
                    companies={filteredCompanies}
                    selectedCompany={selectedCompany}
                    setSelectedCompany={setSelectedCompany}
                    userNotes={userNotes}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    searchQuery={searchQuery}
                    searchSuggestions={searchSuggestions}
                    setSearchQuery={setSearchQuery}
                    favoriteIds={favoriteIds}
                    setFavoriteIds={setFavoriteIds}
                  />
                </div>
              </main>

              {/* Col 4: Startup Inspector Drawer Panel */}
              <section className="lg:col-span-1 h-[780px] overflow-hidden lg:sticky lg:top-4">
                <InspectorPanel
                  company={selectedCompany}
                  noteText={selectedSlug ? (userNotes[selectedSlug] || '') : ''}
                  onNoteChange={handleNoteChange}
                  onClose={() => setSelectedCompany(null)}
                  allCompanies={companies}
                  onSelectCompany={setSelectedCompany}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              </section>

            </div>
          ) : activeTab === 'trends' ? (
            <div className="w-full space-y-6">
              <TrendsDashboard companies={companies} />
              <ComparatorPanel allCompanies={companies} />
            </div>
          ) : activeTab === 'gaps' ? (
            <div className="w-full">
              <IdeaGapFinder
                companies={companies}
                onFilterApply={({ industry, region }) => {
                  setActiveTab('explorer');
                  setSelectedIndustry(industry || 'All');
                  setSelectedRegion(region || 'All');
                }}
              />
            </div>
          ) : activeTab === 'sandbox' ? (
            <div className="w-full">
              <SandboxTab
                allCompanies={companies}
                onSelectCompany={(c) => {
                  setSelectedCompany(c);
                  setActiveTab('explorer');
                }}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </div>
          ) : activeTab === 'leaderboard' ? (
            <div className="w-full">
              <Leaderboard />
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Footer copyright */}
      <footer className="mt-auto border-t-2 border-black py-4 text-center font-mono-code text-[10px] text-slate-800 bg-obsidian-dark select-none">
        <span>CONSOLE RUNNING // LOADED 6,179 YC COMPANIES FROM LOCAL PACK // BUILT FOR BUILDERS TO STUDY IDEAS</span>
      </footer>

      {/* Favorites Drawer */}
      <FavoritesBar
        allCompanies={companies}
        onSelectCompany={(c) => {
          setSelectedCompany(c);
          setActiveTab('explorer');
          setFavDrawerOpen(false);
        }}
        favoriteIds={favoriteIds}
        setFavoriteIds={setFavoriteIds}
        isOpen={favDrawerOpen}
        setIsOpen={setFavDrawerOpen}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDataReset={refreshAllData}
      />

      {/* Profile Modal */}
      <PublicProfile
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Achievement Unlocked Notification Toasts */}
      <AchievementToast />
    </div>
  );
}
