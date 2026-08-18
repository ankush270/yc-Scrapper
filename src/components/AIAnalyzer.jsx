import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Sparkles, Key, FileText, Cpu, Compass, Layers,
  ChevronDown, BookOpen, AlertTriangle, ArrowRight, Save, Trash,
  Maximize2, X, Share2
} from 'lucide-react';
import { streamStartupAnalysis } from '../lib/geminiClient';
import { getSetting } from '../lib/storage';
import { trackUserAction, getUnlockedAchievements } from '../lib/achievements';
import { subscribeToAuth, getAuthHeader } from '../lib/firebase';
import ShareableCard from './ShareableCard';

gsap.registerPlugin(useGSAP);

// Simple custom Markdown parser to clean up asterisks, backticks, list items, and headers into styled JSX
const renderMarkdown = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  let inList = false;
  let listItems = [];
  const elements = [];

  const parseInline = (lineText) => {
    if (!lineText) return "";
    
    // Parse bold text (**text**) and code blocks (`text`)
    let tokens = [{ text: lineText, type: 'plain' }];
    
    // Pass 1: Bold **
    let nextTokens = [];
    for (const t of tokens) {
      if (t.type !== 'plain') {
        nextTokens.push(t);
        continue;
      }
      
      const parts = t.text.split('**');
      for (let idx = 0; idx < parts.length; idx++) {
        if (idx % 2 === 1) {
          nextTokens.push({ text: parts[idx], type: 'bold' });
        } else if (parts[idx] !== '') {
          nextTokens.push({ text: parts[idx], type: 'plain' });
        }
      }
    }
    tokens = nextTokens;
    
    // Pass 2: Backticks `
    nextTokens = [];
    for (const t of tokens) {
      if (t.type !== 'plain') {
        nextTokens.push(t);
        continue;
      }
      
      const parts = t.text.split('`');
      for (let idx = 0; idx < parts.length; idx++) {
        if (idx % 2 === 1) {
          nextTokens.push({ text: parts[idx], type: 'code' });
        } else if (parts[idx] !== '') {
          nextTokens.push({ text: parts[idx], type: 'plain' });
        }
      }
    }
    tokens = nextTokens;
    
    return tokens.map((token, i) => {
      if (token.type === 'bold') {
        return (
          <strong key={i} className="font-extrabold text-neon-orange font-mono-tech">
            {token.text}
          </strong>
        );
      }
      if (token.type === 'code') {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-neon-cyan font-mono-code text-[9px] border border-zinc-700 font-bold mx-0.5">
            {token.text}
          </code>
        );
      }
      return token.text;
    });
  };

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1 text-slate-200">
          {listItems.map((item, idx) => (
            <li key={`li-${key}-${idx}`} className="font-mono-code leading-relaxed text-[10px]">
              {item}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Horizontal Rule
    if (line === '---' || line === '***') {
      flushList(i);
      elements.push(<hr key={i} className="border-t border-slate-700 my-3" />);
      continue;
    }

    // Headers
    if (line.startsWith('#')) {
      flushList(i);
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headerText = match[2];
        const headingStyles = {
          1: 'text-xs font-extrabold text-neon-orange uppercase tracking-wider mb-2.5 mt-3.5 font-mono-tech border-b border-neutral-700 pb-1',
          2: 'text-[11px] font-bold text-neon-cyan uppercase tracking-wide mb-2 mt-3 font-mono-tech',
          3: 'text-[10px] font-bold text-neon-magenta uppercase tracking-wide mb-1.5 mt-2.5 font-mono-tech',
          default: 'text-[10px] font-bold text-white uppercase mb-1 mt-2 font-mono-tech',
        };
        const className = headingStyles[level] || headingStyles.default;
        elements.push(
          <div key={i} className={className}>
            {parseInline(headerText)}
          </div>
        );
        continue;
      }
    }

    // Bullet list items
    if (line.startsWith('* ') || line.startsWith('- ')) {
      inList = true;
      const itemText = line.substring(2);
      listItems.push(parseInline(itemText));
      continue;
    }

    // Numbered list items
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushList(i);
      elements.push(
        <div key={i} className="pl-4 my-1.5 text-slate-200 font-mono-code text-[10px] flex items-start space-x-1.5">
          <span className="text-neon-cyan font-mono-tech font-bold shrink-0">{numMatch[1]}.</span>
          <span className="leading-relaxed">{parseInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (line === '') {
      flushList(i);
      continue;
    }

    // Standard paragraph line
    flushList(i);
    elements.push(
      <p key={i} className="my-1.5 leading-relaxed text-slate-300 font-mono-code text-[10px]">
        {parseInline(line)}
      </p>
    );
  }

  // Flush any remaining list
  flushList(lines.length);

  return elements;
};

const ANALYSIS_MODES = [
  { id: 'teardown', label: 'TEARDOWN', icon: BookOpen, color: '#00d37e' },
  { id: 'techspec', label: 'TECH_SPEC', icon: Cpu, color: '#00bce6' },
  { id: 'competitive', label: 'COMPETITORS', icon: Compass, color: '#a855f7' },
  { id: 'buildguide', label: 'BUILD_GUIDE', icon: Layers, color: '#e60073' }
];

export default function AIAnalyzer({ company, similarCompanies, onOpenSettings }) {
  const [selectedMode, setSelectedMode] = useState('teardown');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [activeModelName, setActiveModelName] = useState('GEMINI-3.6-FLASH');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState('');
  const [savedReports, setSavedReports] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [badgesCount, setBadgesCount] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const outputRef = useRef(null);

  // Check if API key is configured on backend or local storage
  useEffect(() => {
    Promise.all([
      fetch('/api/health')
        .then(res => res.json())
        .catch(() => null),
      getSetting('yc_llm_provider'),
      getSetting('yc_llm_model'),
      getSetting('yc_llm_api_key'),
      getSetting('gemini_api_key')
    ]).then(([backendData, userProvider, userModel, userApiKey, legacyKey]) => {
      // If user has local storage settings configured
      if (userProvider && (userApiKey || (userProvider === 'gemini' && legacyKey))) {
        setApiKeySet(true);
        const activeModel = userModel || 'DEFAULT';
        setActiveModelName(`${userProvider.toUpperCase()} // ${activeModel.toUpperCase()}`);
      } 
      // Else check if backend is enabled
      else if (backendData && backendData.gemini_enabled) {
        setApiKeySet(true);
        if (backendData.llm && backendData.llm.model) {
          setActiveModelName(`${backendData.llm.provider.toUpperCase()} // ${backendData.llm.model.toUpperCase()}`);
        } else {
          setActiveModelName('BACKEND DEFAULT');
        }
      } 
      // Fallback: check legacy gemini key directly
      else if (legacyKey) {
        setApiKeySet(true);
        setActiveModelName('GEMINI // DEFAULT');
      }
      // No keys set anywhere
      else {
        setApiKeySet(false);
        setActiveModelName('NO MODEL');
      }
    });
  }, [onOpenSettings]);

  // Sync auth and stats
  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
    });
    getUnlockedAchievements().then((list) => {
      setBadgesCount(list.length);
    });
    return () => unsubscribe();
  }, []);

  // Load saved analysis if any
  useEffect(() => {
    if (company) {
      const slug = company.slug || company.id.toString();
      const localSaved = localStorage.getItem(`yc_ai_analysis_${slug}`);
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          setSavedReports(parsed);
          // If we have a saved report for selected mode, show it
          if (parsed[selectedMode]) {
            setReport(parsed[selectedMode]);
          } else {
            setReport('');
          }
        } catch (e) {
          setSavedReports({});
          setReport('');
        }
      } else {
        setSavedReports({});
        setReport('');
      }
    }
  }, [company, selectedMode]);

  const handleGenerate = async () => {
    if (!company) return;
    setReport('');
    setAnalyzing(true);
    
    try {
      let accumulatedText = '';
      await streamStartupAnalysis(
        company,
        selectedMode,
        similarCompanies,
        (chunk) => {
          accumulatedText += chunk;
          setReport(accumulatedText);
          
          // Scroll down output pane
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }
        }
      );
      
      // Track action
      await trackUserAction('ai_analyses_run');

      // Auto save the generated report
      const slug = company.slug || company.id.toString();
      const updatedSaved = {
        ...savedReports,
        [selectedMode]: accumulatedText
      };
      setSavedReports(updatedSaved);
      localStorage.setItem(`yc_ai_analysis_${slug}`, JSON.stringify(updatedSaved));

    } catch (err) {
      setReport(`Error generating report: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearReport = () => {
    if (!company) return;
    const slug = company.slug || company.id.toString();
    const updatedSaved = { ...savedReports };
    delete updatedSaved[selectedMode];
    setSavedReports(updatedSaved);
    setReport('');
    
    if (Object.keys(updatedSaved).length === 0) {
      localStorage.removeItem(`yc_ai_analysis_${slug}`);
    } else {
      localStorage.setItem(`yc_ai_analysis_${slug}`, JSON.stringify(updatedSaved));
    }
  };

  const handlePublishTeardown = async () => {
    if (!company || !report) return;
    setPublishing(true);
    try {
      const header = getAuthHeader();
      const res = await fetch('/api/teardowns/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': header || `Bearer mock_${user?.uid || 'anonymous'}`
        },
        body: JSON.stringify({
          companyName: company.name,
          companyOneLiner: company.one_liner,
          companyBatch: company.batch,
          companyIndustry: company.industry,
          companyWebsite: company.website || company.url,
          teardownTitle: `${company.name} AI Analysis`,
          teardownContent: report,
          userDisplayName: user?.displayName || 'Anonymous Builder',
          unlockedBadgesCount: badgesCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${window.location.origin}/#teardown/${data.id}`;
        setPublishUrl(fullUrl);
        setIsShareModalOpen(true);
      } else {
        alert("Failed to publish teardown card. Please verify your connection.");
      }
    } catch (e) {
      alert(`Error publishing card: ${e.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Controls Header */}
      <div className="flex items-center space-x-2 border-b-2 border-black pb-2 mb-2">
        <Sparkles className="w-4 h-4 text-neon-orange animate-pulse" />
        <span className="font-mono-tech text-[10px] text-black font-extrabold uppercase tracking-wider">
          AI STUDY CONSOLE // {activeModelName}
        </span>
      </div>

      {!apiKeySet ? (
        <div className="brutal-card border-dashed p-4 text-center bg-white space-y-3">
          <AlertTriangle className="w-8 h-8 text-neon-orange mx-auto opacity-90" />
          <h4 className="font-mono-tech text-[10px] font-extrabold text-black uppercase">
            API_KEY_REQUIRED
          </h4>
          <p className="font-mono-code text-[9px] text-slate-700 leading-relaxed font-bold">
            Configure your Gemini developer API key in Settings to run teardowns, generated database schemas, and build guides.
          </p>
          <button
            onClick={onOpenSettings}
            className="brutal-btn px-4 py-1.5 font-mono-tech text-[9px] uppercase bg-neon-cyan flex items-center space-x-1.5 mx-auto"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Open Settings</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Analysis mode selector tabs */}
          <div className="grid grid-cols-2 gap-1.5">
            {ANALYSIS_MODES.map(mode => {
              const Icon = mode.icon;
              const isActive = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  style={{
                    backgroundColor: isActive ? mode.color : '#FFFFFF',
                    boxShadow: isActive ? '2px 2px 0px 0px #000000' : '1px 1px 0px 0px #000000',
                    transform: isActive ? 'translate(-1px, -1px)' : 'none'
                  }}
                  className="flex items-center space-x-2 p-2 rounded border-2 border-black text-black font-mono-tech text-[9px] font-bold uppercase cursor-pointer transition-all"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleGenerate}
            disabled={analyzing}
            className="w-full brutal-btn flex items-center justify-center space-x-2 py-2 text-xs bg-neon-orange hover:bg-neon-orange/90 text-white font-bold uppercase transition-all"
          >
            <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
            <span>{analyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}</span>
          </button>

          {/* Output Display Terminal */}
          {(report || analyzing) && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8px] font-mono-code text-slate-500 font-bold uppercase">
                <span>Console Output</span>
                {savedReports[selectedMode] && (
                  <span className="text-neon-emerald font-bold">✓ AUTO-SAVED</span>
                )}
              </div>
              
              <div className="relative">
                <div
                  ref={outputRef}
                  className="brutal-card p-3 pr-10 max-h-[220px] overflow-y-auto bg-neutral-950 text-white font-mono-code text-[10px] leading-relaxed select-text select-all"
                >
                  {renderMarkdown(report)}
                  {analyzing && <span className="inline-block w-1.5 h-3 bg-neon-cyan animate-pulse ml-0.5">_</span>}
                </div>

                {/* Maximize/Popup Icon Button */}
                {!analyzing && report && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="absolute top-2 right-2 z-20 p-1.5 bg-neutral-900 border border-slate-700 hover:border-neon-cyan hover:bg-neutral-800 rounded text-slate-400 hover:text-white transition-all cursor-pointer shadow-md"
                    title="Maximize / Open in Popup Window"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Actions (Share / Clear) */}
              {!analyzing && (
                <div className="flex items-center justify-between mt-1 select-none">
                  <button
                    onClick={handlePublishTeardown}
                    disabled={publishing}
                    className="flex items-center space-x-1.5 font-mono-tech text-[9px] text-neon-cyan hover:underline hover:text-neon-cyan/80 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>{publishing ? 'PUBLISHING...' : 'SHARE TEARDOWN CARD'}</span>
                  </button>
                  <button
                    onClick={handleClearReport}
                    className="flex items-center space-x-1.5 font-mono-tech text-[9px] text-neon-magenta hover:underline cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    <span>DELETE REPORT</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detailed Analysis Modal Popup */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="brutal-card w-full max-w-3xl bg-neutral-900 text-white flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-black p-3 bg-neon-orange text-white">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 shrink-0 animate-pulse text-white" />
                <span className="font-mono-tech text-xs font-extrabold uppercase tracking-wider text-white">
                  AI ANALYSIS DETAILED VIEW // {selectedMode.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-black/20 border border-transparent hover:border-white rounded transition-all cursor-pointer text-white"
                title="Close Window"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto bg-neutral-950 font-mono-code text-[11px] leading-relaxed flex-1 select-text select-all">
              {renderMarkdown(report)}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 p-3 bg-neutral-900 text-slate-400 font-mono-tech text-[9px] font-bold">
              <span>Active Model: {activeModelName}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="brutal-btn bg-white hover:bg-neutral-100 text-black px-4 py-1.5 uppercase text-[9px] font-bold shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Shareable Teardown Configuration Card Modal */}
      {isShareModalOpen && (
        <ShareableCard
          company={company}
          teardownText={report}
          publishUrl={publishUrl}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
