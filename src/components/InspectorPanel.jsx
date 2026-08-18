import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { 
  X, ExternalLink, Info, Check, FileText, 
  MapPin, Users, Activity, Tag, Sparkles, Link2 
} from 'lucide-react';
import { findSimilarCompanies } from '../lib/similarity';
import AIAnalyzer from './AIAnalyzer';

gsap.registerPlugin(useGSAP);

export default function InspectorPanel({ 
  company, 
  noteText, 
  onNoteChange, 
  onClose,
  allCompanies,
  onSelectCompany,
  onOpenSettings 
}) {
  const panelRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const feedbackTimeoutRef = useRef(null);

  const {
    name,
    batch,
    industry,
    subindustry,
    one_liner,
    long_description,
    website,
    url, // YC profile URL
    status,
    team_size,
    all_locations,
    tags,
    regions,
    stage,
    small_logo_thumb_url
  } = company || {};

  // GSAP slide-in/fade-in animation when company changes
  useGSAP(() => {
    if (!company) return;
    gsap.killTweensOf(panelRef.current);
    gsap.fromTo(
      panelRef.current,
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
  }, { 
    dependencies: [company],
    scope: panelRef
  });

  // Handle saving feedback
  const handleNoteChange = (e) => {
    if (!company) return;
    const slug = company.slug || company.id.toString();
    onNoteChange(slug, e.target.value);
    
    // Trigger saved indicator feedback
    setNoteSavedFeedback(true);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setNoteSavedFeedback(false);
    }, 1000);
  };

  // Build and copy the AI study prompt
  const copyAIPrompt = () => {
    if (!company) return;
    
    const promptText = `You are an expert startup strategist and VC analyzer.
Analyze the following Y Combinator startup to extract actionable insights for a builder:

STARTUP OVERVIEW:
- Name: ${name}
- Batch: ${batch}
- Industry: ${industry} ${subindustry ? `(Subindustry: ${subindustry})` : ''}
- Status: ${status}
- One-liner Pitch: ${one_liner}
- Description: ${long_description || 'No description available.'}
- Region: ${regions ? regions.join(', ') : 'Not specified'}

ANALYZE & TEARDOWN:
1. PROBLEM SOLVED: What is the core pain point this company targets? Why was existing technology or behavior insufficient?
2. THE SOLUTION & VALPROP: How does their product solve this? What is their unique value proposition?
3. CORE SYSTEM FEATURES: What are the key features or product components required to make this work?
4. REVENUE & BUSINESS MODEL: How does this type of product monetize? What are the unit economics?
5. MAKER LESSONS: What are 3 core design or business lessons a developer/founder can learn from this startup idea to build something new today?

Provide a concise, sharp, technical analysis.`;

    navigator.clipboard.writeText(promptText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy prompt:', err));
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  if (!company) {
    return (
      <div className="brutal-card p-8 text-center flex flex-col items-center justify-center h-full select-none min-h-[400px]">
        <Info className="w-8 h-8 text-black mb-3" />
        <h3 className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest mb-1">
          INSPECTOR_OFFLINE
        </h3>
        <p className="text-xs text-slate-700 max-w-[200px] leading-relaxed font-bold">
          Select a startup card from the directory console to trigger detailed analyzer and study panel.
        </p>
      </div>
    );
  }

  const monogram = name ? name.charAt(0).toUpperCase() : 'Y';

  return (
    <div
      ref={panelRef}
      className="brutal-card p-5 flex flex-col h-full relative overflow-y-auto max-h-[85vh] lg:max-h-none bg-white"
    >
      {/* Header controls */}
      <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-3">
        <span className="font-mono-tech text-xs text-black font-extrabold tracking-widest uppercase">
          ANALYZER_SYS_v1.0
        </span>
        <button
          onClick={onClose}
          className="text-slate-700 hover:text-black p-1 hover:bg-slate-100 border border-transparent hover:border-black rounded transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Company Title section */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-12 h-12 rounded border-2 border-black bg-white flex items-center justify-center overflow-hidden shrink-0">
          {small_logo_thumb_url ? (
            <img
              src={small_logo_thumb_url}
              alt={`${name} Logo`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              className="w-full h-full object-cover"
            />
          ) : null}
          <div
            style={{ display: small_logo_thumb_url ? 'none' : 'flex' }}
            className="w-full h-full items-center justify-center font-mono-tech text-xl font-bold bg-neon-cyan text-black"
          >
            {monogram}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-mono-tech font-extrabold text-black leading-tight">
            {name}
          </h2>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="font-mono-code text-[10px] text-black bg-neon-emerald border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000] font-bold">
              {batch}
            </span>
            {stage && (
              <span className="font-mono-code text-[10px] text-black bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000000] font-bold">
                {stage} Stage
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description pitch */}
      <div className="bg-neon-cyan/10 border-2 border-black p-3 rounded mb-4 text-xs font-sans-body font-bold text-slate-800 leading-relaxed shadow-[2px_2px_0px_0px_#000000]">
        "{one_liner}"
      </div>

      {/* External Action Links */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn flex items-center justify-center space-x-1.5 font-mono-tech text-[11px] py-2 text-center uppercase tracking-wide cursor-pointer hover:bg-neon-cyan"
          >
            <span>Visit Website</span>
            <ExternalLink className="w-3 h-3 stroke-[2.5px]" />
          </a>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn flex items-center justify-center space-x-1.5 font-mono-tech text-[11px] py-2 text-center uppercase tracking-wide cursor-pointer hover:bg-neon-orange hover:text-white"
          >
            <span>YC Directory</span>
            <ExternalLink className="w-3 h-3 stroke-[2.5px]" />
          </a>
        )}
      </div>

      {/* Startup Parameters details */}
      <div className="space-y-2.5 mb-5 bg-obsidian-dark border-2 border-black p-3 rounded text-xs font-mono-code text-black shadow-[2px_2px_0px_0px_#000000] font-bold">
        {all_locations && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-700">
              <MapPin className="w-3 h-3 text-black" />
              <span>Location:</span>
            </span>
            <span className="text-black text-right max-w-[150px] truncate" title={all_locations}>
              {all_locations}
            </span>
          </div>
        )}
        {team_size !== undefined && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-700">
              <Users className="w-3 h-3 text-black" />
              <span>Team Size:</span>
            </span>
            <span className="text-black">{team_size} members</span>
          </div>
        )}
        {status && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-700">
              <Activity className="w-3 h-3 text-black" />
              <span>Status:</span>
            </span>
            <span className={`font-bold px-1.5 py-0.2 border border-black rounded shadow-[1px_1px_0px_0px_#000000] ${status === 'Active' ? 'bg-neon-emerald' : 'bg-neon-magenta text-white'}`}>
              {status}
            </span>
          </div>
        )}
        {industry && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-700">
              <Tag className="w-3 h-3 text-black" />
              <span>Industry:</span>
            </span>
            <span className="text-black truncate max-w-[150px]" title={industry}>
              {industry}
            </span>
          </div>
        )}
      </div>

      {/* Description text */}
      <div className="space-y-1.5 mb-5 flex-grow">
        <h4 className="font-mono-tech text-xs text-slate-800 font-extrabold uppercase tracking-wider">
          Idea & Product Teardown
        </h4>
        <div className="text-xs font-sans-body text-slate-800 leading-relaxed text-justify max-h-[160px] overflow-y-auto pr-1 border-2 border-black bg-white p-2.5 rounded shadow-[2px_2px_0px_0px_#000000] font-medium">
          {long_description || 'No detailed project teardown available in the YC index. Use the AI analyser below to generate a detailed breakdown.'}
        </div>
      </div>

      {/* Interactive Tags Badges */}
      {tags && tags.length > 0 && (
        <div className="mb-5">
          <span className="block font-mono-tech text-[10px] text-slate-700 uppercase tracking-wider mb-2 font-bold">
            Keywords & Verticals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span 
                key={t} 
                className="text-[9px] font-mono-code px-2 py-0.5 rounded border border-black bg-white text-black font-bold shadow-[1px_1px_0px_0px_#000000]"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Similar Startups Section */}
      {allCompanies && allCompanies.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Link2 className="w-3.5 h-3.5 text-black" />
            <span className="font-mono-tech text-[10px] text-black uppercase tracking-wider font-extrabold">
              Similar Startups
            </span>
          </div>
          <div className="space-y-2">
            {findSimilarCompanies(company, allCompanies, 5).map(({ company: similar, score }) => {
              const simMonogram = similar.name ? similar.name.charAt(0).toUpperCase() : 'Y';
              return (
                <button
                  key={similar.id}
                  onClick={() => onSelectCompany && onSelectCompany(similar)}
                  className="w-full brutal-card p-2.5 flex items-center space-x-2.5 cursor-pointer hover:bg-neon-cyan/10 transition-all group text-left"
                >
                  {/* Mini logo */}
                  <div className="w-7 h-7 rounded border border-black flex items-center justify-center overflow-hidden shrink-0 bg-white">
                    {similar.small_logo_thumb_url ? (
                      <img
                        src={similar.small_logo_thumb_url}
                        alt={`${similar.name} Logo`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div
                      style={{ display: similar.small_logo_thumb_url ? 'none' : 'flex' }}
                      className="w-full h-full items-center justify-center font-mono-tech text-xs font-bold bg-neon-cyan text-black"
                    >
                      {simMonogram}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <span className="font-mono-tech text-[10px] font-extrabold text-black group-hover:text-neon-cyan transition-colors block truncate leading-tight">
                      {similar.name}
                    </span>
                    <span className="font-mono-code text-[8px] text-slate-600 block truncate">
                      {similar.one_liner?.slice(0, 50)}{similar.one_liner?.length > 50 ? '...' : ''}
                    </span>
                  </div>

                  {/* Match score */}
                  <span className="font-mono-code text-[8px] font-bold bg-neon-emerald border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000000] shrink-0">
                    {score}%
                  </span>
                </button>
              );
            })}
            {findSimilarCompanies(company, allCompanies, 5).length === 0 && (
              <span className="font-mono-code text-[9px] text-slate-500 font-bold">
                No similar startups found above threshold.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Study Notes Textarea */}
      <div className="space-y-2 border-t-2 border-black pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="flex items-center space-x-1.5 font-mono-tech text-xs text-black font-extrabold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>My Study Notes</span>
          </span>
          {noteSavedFeedback && (
            <span className="text-[9px] bg-neon-emerald border border-black text-black font-mono-code font-bold px-1.5 py-0.2 rounded shadow-[1px_1px_0px_0px_#000000]">
              SYNCED
            </span>
          )}
        </div>
        <textarea
          value={noteText}
          onChange={handleNoteChange}
          placeholder="Log features, problem solved, revenue model, or design takeaways for this startup..."
          className="w-full h-24 brutal-input p-2.5 text-xs text-black placeholder-slate-500 font-sans-body resize-none"
        />
      </div>

      {/* AI Analyzer Active Console */}
      <div className="border-t-2 border-black pt-4">
        <AIAnalyzer
          company={company}
          similarCompanies={allCompanies ? findSimilarCompanies(company, allCompanies, 5).map(x => x.company) : []}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </div>
  );
}
