import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { 
  X, ExternalLink, Info, Copy, Check, FileText, 
  MapPin, Users, Activity, Tag, Sparkles 
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function InspectorPanel({ 
  company, 
  noteText, 
  onNoteChange, 
  onClose 
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
      <div className="glass-panel rounded-xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center h-full select-none min-h-[400px]">
        <Info className="w-8 h-8 text-slate-600 mb-3" />
        <h3 className="font-mono-tech text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
          INSPECTOR_OFFLINE
        </h3>
        <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
          Select a startup card from the directory console to trigger detailed analyzer and study panel.
        </p>
      </div>
    );
  }

  const monogram = name ? name.charAt(0).toUpperCase() : 'Y';

  return (
    <div
      ref={panelRef}
      className="glass-panel rounded-xl border border-slate-800 p-5 flex flex-col h-full relative overflow-y-auto max-h-[85vh] lg:max-h-none"
    >
      {/* Decorative corner indicators */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neon-cyan"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neon-cyan"></div>

      {/* Header controls */}
      <div className="flex justify-between items-start mb-4 border-b border-slate-850 pb-3">
        <span className="font-mono-tech text-xs text-neon-cyan tracking-widest uppercase">
          ANALYZER_SYS_v1.0
        </span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Company Title section */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
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
            className="w-full h-full items-center justify-center font-mono-tech text-xl font-bold bg-gradient-to-br from-slate-850 to-slate-950 text-slate-400"
          >
            {monogram}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-mono-tech font-bold text-white leading-tight">
            {name}
          </h2>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="font-mono-code text-[10px] text-neon-emerald bg-neon-emerald/10 border border-neon-emerald/30 px-2 py-0.2 rounded">
              {batch}
            </span>
            {stage && (
              <span className="font-mono-code text-[10px] text-slate-400 bg-slate-950 px-2 py-0.2 rounded border border-slate-900">
                {stage} Stage
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description pitch */}
      <div className="bg-slate-950/60 border-l-2 border-neon-cyan p-3 rounded-r-lg mb-4 text-xs font-sans-body italic text-slate-300 leading-relaxed">
        "{one_liner}"
      </div>

      {/* External Action Links */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-1.5 font-mono-tech text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:text-neon-cyan hover:border-neon-cyan hover:shadow-glow-cyan py-2 rounded-lg transition-all text-center uppercase tracking-wide cursor-pointer"
          >
            <span>Visit Website</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-1.5 font-mono-tech text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:text-neon-orange hover:border-neon-orange hover:shadow-glow-orange py-2 rounded-lg transition-all text-center uppercase tracking-wide cursor-pointer"
          >
            <span>YC Directory</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Startup Parameters details */}
      <div className="space-y-2.5 mb-5 bg-slate-950/20 border border-slate-850 p-3 rounded-lg text-xs font-mono-code text-slate-300">
        {all_locations && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-350">
              <MapPin className="w-3 h-3 text-neon-cyan/80" />
              <span>Location:</span>
            </span>
            <span className="text-white text-right max-w-[150px] truncate" title={all_locations}>
              {all_locations}
            </span>
          </div>
        )}
        {team_size !== undefined && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-350">
              <Users className="w-3 h-3 text-neon-cyan/80" />
              <span>Team Size:</span>
            </span>
            <span className="text-white">{team_size} members</span>
          </div>
        )}
        {status && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-350">
              <Activity className="w-3 h-3 text-neon-cyan/80" />
              <span>Status:</span>
            </span>
            <span className={`font-bold ${status === 'Active' ? 'text-neon-emerald' : 'text-neon-magenta'}`}>
              {status}
            </span>
          </div>
        )}
        {industry && (
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-350">
              <Tag className="w-3 h-3 text-neon-cyan/80" />
              <span>Industry:</span>
            </span>
            <span className="text-white truncate max-w-[150px]" title={industry}>
              {industry}
            </span>
          </div>
        )}
      </div>

      {/* Description text */}
      <div className="space-y-1.5 mb-5 flex-grow">
        <h4 className="font-mono-tech text-xs text-slate-400 uppercase tracking-wider">
          Idea & Product Teardown
        </h4>
        <div className="text-xs font-sans-body text-slate-300 leading-relaxed text-justify max-h-[160px] overflow-y-auto pr-1 border border-slate-900/60 bg-slate-950/20 p-2.5 rounded">
          {long_description || 'No detailed project teardown available in the YC index. Use the AI analyser below to generate a detailed breakdown.'}
        </div>
      </div>

      {/* Interactive Tags Badges */}
      {tags && tags.length > 0 && (
        <div className="mb-5">
          <span className="block font-mono-tech text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Keywords & Verticals
          </span>
          <div className="flex flex-wrap gap-1">
            {tags.map(t => (
              <span 
                key={t} 
                className="text-[9px] font-mono-code px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Study Notes Textarea */}
      <div className="space-y-2 border-t border-slate-900 pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="flex items-center space-x-1.5 font-mono-tech text-xs text-neon-cyan uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>My Study Notes</span>
          </span>
          {noteSavedFeedback && (
            <span className="text-[10px] text-neon-emerald font-mono-code animate-pulse flex items-center space-x-0.5">
              <Check className="w-3 h-3" />
              <span>SYNCED</span>
            </span>
          )}
        </div>
        <textarea
          value={noteText}
          onChange={handleNoteChange}
          placeholder="Log features, problem solved, revenue model, or design takeaways for this startup..."
          className="w-full h-24 bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20 transition-all font-sans-body resize-none"
        />
      </div>

      {/* AI Prompt Clipboard Copier */}
      <button
        onClick={copyAIPrompt}
        className={`w-full font-mono-tech text-xs flex items-center justify-center space-x-2 py-2.5 rounded-lg border transition-all cursor-pointer uppercase tracking-wider
          ${copied 
            ? 'bg-neon-emerald/20 border-neon-emerald text-neon-emerald shadow-glow-emerald' 
            : 'bg-slate-950 border-slate-800 text-neon-cyan hover:border-neon-cyan hover:shadow-glow-cyan'
          }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copied prompt to clipboard!</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Copy AI Analysis Prompt</span>
          </>
        )}
      </button>
    </div>
  );
}
