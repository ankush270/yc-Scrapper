import React, { useState, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Sparkles, Hammer, Plus, X, Search, Flag, Info,
  Check, FileText, ArrowRight, Lightbulb, Users, DollarSign
} from 'lucide-react';
import { streamIdeaGeneration } from '../lib/geminiClient';
import { createSandboxProject, getSetting } from '../lib/storage';

gsap.registerPlugin(useGSAP);

const PRIMARY_INDUSTRIES = [
  'B2B', 'Consumer', 'Healthcare', 'Fintech', 'Industrials',
  'Real Estate and Construction', 'Education', 'Government'
];

export default function AIIdeaGenerator({ allCompanies, onSaveSuccess, onOpenSettings }) {
  const [industry, setIndustry] = useState('B2B');
  const [problemArea, setProblemArea] = useState('');
  const [techStack, setTechStack] = useState('');
  const [inspirationIds, setInspirationIds] = useState([]);
  const [refSearch, setRefSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [rawText, setRawText] = useState('');
  const [generatedIdea, setGeneratedIdea] = useState(null);
  const [savedToSandbox, setSavedToSandbox] = useState(false);
  const containerRef = useRef(null);

  // Check if API key is configured on backend or local storage
  useEffect(() => {
    Promise.all([
      fetch('/api/health')
        .then(res => res.json())
        .catch(() => null),
      getSetting('yc_llm_provider'),
      getSetting('yc_llm_api_key'),
      getSetting('gemini_api_key')
    ]).then(([backendData, userProvider, userApiKey, legacyKey]) => {
      // If user has local storage settings configured
      if (userProvider && (userApiKey || (userProvider === 'gemini' && legacyKey))) {
        setApiKeySet(true);
      } 
      // Else check if backend is enabled
      else if (backendData && backendData.gemini_enabled) {
        setApiKeySet(true);
      } 
      // Fallback: check legacy gemini key directly
      else if (legacyKey) {
        setApiKeySet(true);
      }
      // No keys set anywhere
      else {
        setApiKeySet(false);
      }
    });
  }, [onOpenSettings]);

  // Search results for references
  const searchResults = useMemo(() => {
    if (!refSearch.trim() || refSearch.trim().length < 2) return [];
    const q = refSearch.toLowerCase();
    return allCompanies
      .filter(c => !inspirationIds.includes(c.id))
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [refSearch, allCompanies, inspirationIds]);

  const addInspiration = (c) => {
    setInspirationIds([...inspirationIds, c.id]);
    setRefSearch('');
  };

  const removeInspiration = (id) => {
    setInspirationIds(inspirationIds.filter(x => x !== id));
  };

  const getCompanyById = (id) => allCompanies.find(c => c.id === id);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setRawText('');
    setGeneratedIdea(null);
    setSavedToSandbox(false);

    try {
      const inputs = { industry, problemArea, techStack };
      const inspirations = inspirationIds.map(id => getCompanyById(id)).filter(Boolean);

      let accumulated = '';
      await streamIdeaGeneration(inputs, inspirations, (chunk) => {
        accumulated += chunk;
        setRawText(accumulated);
      });

      // Parse JSON from markdown code block
      const jsonMatch = accumulated.match(/```json\s*([\s\S]*?)\s*```/) || accumulated.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : accumulated;
      
      try {
        const parsed = JSON.parse(jsonStr.trim());
        setGeneratedIdea(parsed);
      } catch (err) {
        // Fallback: build simple output object if parser fails
        setGeneratedIdea({
          name: "Generated Idea",
          oneLiner: "Parsed failed but text generated. Review raw stream below.",
          detailedDescription: accumulated,
          features: []
        });
      }
    } catch (err) {
      alert(`Error generating idea: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToSandbox = async () => {
    if (!generatedIdea) return;
    try {
      // Map generated idea fields to Sandbox scheme
      const project = {
        name: generatedIdea.name || 'AI Generated Startup',
        oneLiner: generatedIdea.oneLiner || '',
        targetAudience: generatedIdea.targetAudience || '',
        revenueModel: generatedIdea.revenueModel || '',
        features: (generatedIdea.features || []).map(f => ({ text: f, done: false })),
        notes: `${generatedIdea.detailedDescription || ''}\n\n**Market Validation Defense:**\n${generatedIdea.validationDefense || ''}`,
        referenceCompanyIds: inspirationIds,
        status: 'idea'
      };

      await createSandboxProject(project);
      setSavedToSandbox(true);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Failed to save to sandbox.');
    }
  };

  return (
    <div className="brutal-card p-5 bg-white space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center space-x-2.5 border-b-2 border-black pb-4">
        <div className="w-9 h-9 rounded bg-neon-orange border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Lightbulb className="w-4.5 h-4.5" />
        </div>
        <div>
          <h2 className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest leading-none">
            AI_STARTUP_IDEA_GENERATOR
          </h2>
          <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
            Synthesize new venture concepts validated against YC patterns // stream pitch deck
          </span>
        </div>
      </div>

      {!apiKeySet ? (
        <div className="brutal-card border-dashed p-8 text-center bg-white space-y-4 max-w-md mx-auto my-6">
          <Sparkles className="w-10 h-10 text-neon-orange mx-auto animate-pulse" />
          <h4 className="font-mono-tech text-xs font-extrabold text-black uppercase">
            API_KEY_REQUIRED
          </h4>
          <p className="font-mono-code text-[10px] text-slate-700 leading-relaxed font-bold">
            Configure your Gemini developer API key in Settings to activate the AI ideation agent.
          </p>
          <button
            onClick={onOpenSettings}
            className="brutal-btn px-5 py-2 font-mono-tech text-[10px] uppercase bg-neon-cyan flex items-center space-x-1.5 mx-auto"
          >
            <span>Open Settings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Parameters */}
          <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
                Target Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full brutal-input px-3 py-2 text-xs font-mono-tech uppercase font-bold text-black"
              >
                {PRIMARY_INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
                Problem Area / Keyword
              </label>
              <input
                type="text"
                value={problemArea}
                onChange={(e) => setProblemArea(e.target.value)}
                placeholder="e.g. healthcare bill auditing, dev tools for websockets"
                className="w-full brutal-input px-3 py-2 text-xs font-sans-body text-black placeholder-slate-450"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
                Preferred Tech Stack
              </label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. Next.js, FastAPI, PostgreSQL"
                className="w-full brutal-input px-3 py-2 text-xs font-sans-body text-black placeholder-slate-450"
              />
            </div>

            {/* Inspiration references */}
            <div className="space-y-2">
              <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
                YC Inspirations (Optional)
              </label>
              
              {inspirationIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {inspirationIds.map(id => {
                    const c = getCompanyById(id);
                    if (!c) return null;
                    return (
                      <span key={id} className="inline-flex items-center space-x-1 bg-neon-cyan/15 border border-black rounded-sm px-2 py-0.5 font-mono-tech text-[9px] font-bold text-black shadow-[1px_1px_0px_0px_#000000]">
                        <span>{c.name}</span>
                        <button type="button" onClick={() => removeInspiration(id)} className="text-slate-500 hover:text-neon-magenta cursor-pointer">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={refSearch}
                  onChange={(e) => setRefSearch(e.target.value)}
                  placeholder="Type YC startup name..."
                  className="w-full brutal-input px-3 py-1.5 text-xs font-mono-code text-black placeholder-slate-450"
                />
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 brutal-card p-1.5 z-10 max-h-[140px] overflow-y-auto bg-white">
                    {searchResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => addInspiration(c)}
                        className="w-full flex items-center justify-between p-2 rounded cursor-pointer hover:bg-neon-cyan/10 transition-colors text-left"
                      >
                        <span className="font-mono-tech text-[10px] font-bold text-black">{c.name}</span>
                        <span className="font-mono-code text-[8px] text-slate-500">{c.batch}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full brutal-btn py-2 text-xs bg-neon-orange text-white font-bold uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
              <span>{generating ? 'SYNTHESIZING...' : 'GENERATE STARTUP IDEA'}</span>
            </button>
          </form>

          {/* Output Presentation deck */}
          <div className="lg:col-span-3">
            {generatedIdea ? (
              <div className="brutal-card p-5 bg-white space-y-4 border-2 border-black shadow-[4px_4px_0px_0px_#000000] animate-fade-in relative">
                {/* Save to Sandbox badge */}
                <div className="absolute right-4 top-4">
                  {savedToSandbox ? (
                    <span className="font-mono-code text-[9px] bg-neon-emerald border border-black px-2 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#000000] font-bold text-black flex items-center space-x-1">
                      <Check className="w-3 h-3 stroke-[2.5px]" />
                      <span>SAVED TO SANDBOX</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleSaveToSandbox}
                      className="brutal-btn px-3 py-1 font-mono-tech text-[9px] uppercase bg-neon-emerald flex items-center space-x-1"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Save to Sandbox</span>
                    </button>
                  )}
                </div>

                {/* Concept Brief */}
                <div className="space-y-1">
                  <span className="font-mono-code text-[8px] text-slate-500 font-bold uppercase">CONCEPT DECK BRIEF</span>
                  <h3 className="text-xl font-mono-tech font-extrabold text-black uppercase tracking-wider">{generatedIdea.name}</h3>
                  <p className="font-sans-body text-xs font-bold text-neon-orange leading-snug">"{generatedIdea.oneLiner}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200 py-3">
                  <div>
                    <span className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase block flex items-center space-x-1">
                      <Users className="w-3 h-3 text-black" />
                      <span>Target Customer</span>
                    </span>
                    <span className="font-sans-body text-xs text-black font-semibold block mt-0.5">{generatedIdea.targetAudience}</span>
                  </div>
                  <div>
                    <span className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase block flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-black" />
                      <span>Revenue Stream</span>
                    </span>
                    <span className="font-sans-body text-xs text-black font-semibold block mt-0.5">{generatedIdea.revenueModel}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase block">Market Pain & Solution Overview</span>
                  <p className="font-sans-body text-xs text-slate-800 leading-relaxed font-medium">{generatedIdea.detailedDescription}</p>
                </div>

                {generatedIdea.validationDefense && (
                  <div className="bg-neon-cyan/5 border-2 border-black p-3 rounded font-mono-code text-[9px] leading-relaxed text-black font-bold">
                    <span className="block text-slate-700 mb-1">💡 COHORT VALIDATION BASIS:</span>
                    {generatedIdea.validationDefense}
                  </div>
                )}

                {generatedIdea.features && generatedIdea.features.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase block">Suggested MVP Checklist</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {generatedIdea.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2 font-sans-body text-xs text-slate-850 font-medium bg-slate-50 border border-slate-200 p-2 rounded">
                          <span className="font-mono-code text-[8px] bg-white border border-black/10 px-1 rounded shrink-0 font-bold text-slate-700">{idx + 1}</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="brutal-card border-dashed p-12 text-center bg-white flex flex-col items-center justify-center min-h-[350px]">
                {generating ? (
                  <div className="space-y-4 w-full">
                    <Sparkles className="w-10 h-10 text-neon-orange animate-spin mx-auto" />
                    <span className="font-mono-tech text-xs text-black font-bold uppercase block tracking-wider">
                      STREAMING IDEATION DATA
                    </span>
                    <div className="brutal-card p-3 max-h-[200px] overflow-y-auto bg-black text-left text-neon-cyan font-mono-code text-[9px] leading-relaxed">
                      {rawText}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-mono-tech text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      IDEATION_DECK_OFFLINE
                    </h4>
                    <p className="font-mono-code text-[9px] text-slate-400 max-w-[200px] mx-auto font-bold leading-relaxed">
                      Select target industry and keywords on the left panel, and click Generate to run the YC AI Agent.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
