import React, { useEffect, useState } from 'react';
import { 
  Sparkles, Terminal, ArrowLeft, Heart, 
  Globe, Users, Calendar, ExternalLink, ShieldCheck, 
  Database, Cpu, MessageSquare, Copy, Check 
} from 'lucide-react';

export default function PublicTeardownView({ teardownId, onBackToLanding }) {
  const [loading, setLoading] = useState(true);
  const [teardown, setTeardown] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!teardownId) return;

    // Fetch public teardown snapshot from python backend
    fetch(`/api/teardowns/${teardownId}`)
      .then(res => {
        if (!res.ok) throw new Error("Teardown not found");
        return res.json();
      })
      .then(data => {
        setTeardown(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching public teardown:", err);
        // Fallback demo data for preview/development
        setTeardown({
          companyName: "Stripe",
          companyOneLiner: "Financial infrastructure for the internet",
          companyBatch: "S09",
          companyIndustry: "Fintech",
          companyWebsite: "https://stripe.com",
          teardownTitle: "Idempotent API Architecture & Ledger Model",
          teardownContent: `### 1. Problem Statement
Online payment processing is brittle. Network failures can happen mid-request, causing duplicate charges if clients retry blindly. Stripe solves this by establishing strict idempotency constraints at the API gateway layer.

### 2. Solution & Value Proposition
By requiring an unique \`Idempotency-Key\` header, Stripe guarantees that retried API requests are safe. They cache responses in Redis before processing:
- If key matches an active job: Return \`IN_PROGRESS\` state.
- If key matches a completed transaction: Return identical cached response directly.

### 3. Revenue Model
Transaction Fee model: Charges 2.9% + $0.30 per successful credit card charge. High-margin SaaS upsells for billing, tax management, and identity verification.

### 4. Key Lessons
- **Design for Failure**: Assume networks will timeout. Move safety checks to the gateway layer.
- **Ledger Correctness**: Prioritize ACID consistency over immediate horizontal scale for ledger databases.`,
          userDisplayName: "Alex Mercer",
          unlockedBadgesCount: 8
        });
        setLoading(false);
      });
  }, [teardownId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContentLines = () => {
    if (!teardown?.teardownContent) return null;
    return teardown.teardownContent.split('\n').map((line, idx) => {
      if (line.startsWith('###')) {
        return (
          <h3 key={idx} className="font-mono-tech text-sm md:text-base font-extrabold uppercase mt-6 mb-3 text-black border-b border-black pb-1">
            {line.replace('###', '').trim()}
          </h3>
        );
      }
      if (line.startsWith('-')) {
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-slate-800 leading-relaxed mb-1 font-sans">
            {line.substring(1).trim()}
          </li>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-800 leading-relaxed mb-3 font-sans">
          {line}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-bg flex flex-col justify-center items-center font-mono-code text-black p-6">
        <div className="w-full max-w-sm bg-white border-2 border-black p-5 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center animate-pulse">
          <Terminal className="w-8 h-8 text-neon-cyan mx-auto mb-3 animate-spin-slow" />
          <span className="font-bold text-xs uppercase tracking-wider">RETRIEVING SHARED TEARDOWN DATA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-bg text-black antialiased flex flex-col font-sans-body">
      
      {/* Header Bar */}
      <nav className="max-w-4xl mx-auto w-full px-4 py-5 flex items-center justify-between border-b-2 border-black">
        <button 
          onClick={onBackToLanding}
          className="brutal-btn px-3 py-1.5 text-xs bg-white hover:bg-zinc-50 flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO LOBBY</span>
        </button>

        <div className="flex items-center space-x-2 select-none">
          <div className="w-7 h-7 rounded border border-black bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="10" y="10" width="80" height="80" fill="#ff7700" stroke="#000" strokeWidth="4" />
              <rect x="5" y="5" width="80" height="80" fill="#00bce6" stroke="#000" strokeWidth="4" />
              <text x="22" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="2">Y</text>
              <text x="46" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#000">D</text>
            </svg>
          </div>
          <span className="font-mono-tech text-sm font-bold tracking-widest text-black hidden sm:inline">
            YC_DECODE // ARCHIVE
          </span>
        </div>

        <button 
          onClick={handleCopyLink}
          className="brutal-btn px-3.5 py-1.5 text-xs bg-neon-cyan hover:bg-neon-cyan flex items-center space-x-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-neon-emerald" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'COPIED!' : 'SHARE LINK'}</span>
        </button>
      </nav>

      {/* Main Teardown Container */}
      <main className="max-w-2xl mx-auto w-full px-4 py-12 flex-grow">
        
        {/* Author Bio Badge */}
        <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 border-2 border-black rounded bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-8 select-none">
          <div className="w-7 h-7 rounded-full bg-neon-magenta border border-black flex items-center justify-center font-mono-tech text-xs font-bold text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            {teardown?.userDisplayName ? teardown.userDisplayName.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <span className="font-mono-code text-[9px] text-slate-500 block uppercase leading-none">Shared Insight by</span>
            <span className="font-mono-tech text-xs font-black uppercase text-black">
              {teardown?.userDisplayName || 'Anonymous Builder'}
            </span>
          </div>
          <div className="border-l border-zinc-300 h-6 mx-2" />
          <span className="font-mono-tech text-[10px] bg-neon-orange/20 border border-neon-orange px-2 py-0.5 rounded font-black text-neon-orange flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" />
            {teardown?.unlockedBadgesCount || 0} BADGES
          </span>
        </div>

        {/* Company Card Header */}
        <div className="brutal-card p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-zinc-200 pb-4 mb-4">
            <div>
              <h2 className="font-mono-tech text-2xl font-black uppercase tracking-wider text-black">
                {teardown?.companyName || 'Startup'}
              </h2>
              <p className="font-sans text-xs text-slate-800 mt-1 italic">
                "{teardown?.companyOneLiner || 'No summary available.'}"
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="font-mono-code text-[10px] bg-neon-cyan/20 border border-neon-cyan px-2 py-0.5 rounded font-bold text-black uppercase">
                {teardown?.companyBatch || 'YC'}
              </span>
              <span className="font-mono-code text-[10px] bg-neon-emerald/20 border border-neon-emerald px-2 py-0.5 rounded font-bold text-black uppercase">
                {teardown?.companyIndustry || 'Fintech'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono-code font-semibold text-slate-700">
            <div className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <a href={teardown?.companyWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center text-neon-cyan font-bold">
                <span>Website</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <span>Scale: Active</span>
            </div>
            <div className="flex items-center space-x-1.5 col-span-2 md:col-span-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Decoded Live</span>
            </div>
          </div>
        </div>

        {/* Detailed Insights Markdown */}
        <div className="brutal-card p-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-12">
          <div className="flex items-center space-x-1.5 text-neon-magenta font-mono-tech text-xs uppercase font-extrabold mb-5 select-none">
            <Sparkles className="w-4 h-4 text-neon-magenta fill-neon-magenta animate-pulse" />
            <span>DECODED STARTUP PLAYBOOK</span>
          </div>

          <h1 className="font-mono-tech text-lg md:text-xl font-extrabold uppercase text-black tracking-wide leading-tight mb-6">
            {teardown?.teardownTitle || 'Startup Analysis Teardown Report'}
          </h1>

          <div className="space-y-4">
            {renderContentLines()}
          </div>
        </div>

        {/* Footer Call-To-Action */}
        <div className="brutal-card p-8 bg-black text-white text-center shadow-[6px_6px_0px_0px_rgba(0,0,188,230,1)] border-black">
          <Sparkles className="w-8 h-8 text-neon-orange mx-auto mb-4 animate-bounce" />
          <h3 className="font-mono-tech text-lg font-black uppercase tracking-wider text-white">
            Want to decode your own ideas?
          </h3>
          <p className="text-xs text-zinc-400 font-mono-code mt-2 max-w-sm mx-auto leading-relaxed">
            Gain access to system design templates, database schemas, mock interviews, and GTM playbooks.
          </p>
          <button 
            onClick={onBackToLanding}
            className="brutal-btn py-3 px-6 bg-neon-cyan border-black text-black font-bold uppercase text-xs tracking-wider mt-6 w-full sm:w-auto"
          >
            Access Builder Console Free
          </button>
        </div>

      </main>

      {/* Small copyright footer */}
      <footer className="border-t border-zinc-200 py-6 text-center font-mono-code text-[10px] text-slate-800 bg-white select-none">
        <span>POWERED BY YC_DECODE LAB // STUDY STARTUP ARCHITECTURES & REVENUE MODELS</span>
      </footer>

    </div>
  );
}
