import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Sparkles, Terminal, Rocket, Layers, Play } from 'lucide-react';

export default function LandingHero({ onStart }) {
  const containerRef = useRef(null);
  const headlineRef = useRef(null);
  const tagRef = useRef(null);
  const actionRef = useRef(null);
  const consoleRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(headlineRef.current, 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, delay: 0.2 }
    )
    .fromTo(tagRef.current, 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6 },
      '-=0.4'
    )
    .fromTo(actionRef.current, 
      { scale: 0.95, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(consoleRef.current, 
      { y: 40, opacity: 0, scale: 0.98 }, 
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.2)' },
      '-=0.2'
    );
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      className="max-w-7xl mx-auto w-full px-4 py-16 md:py-24 flex flex-col items-center justify-center text-center overflow-hidden"
    >
      {/* Visual Badge */}
      <div 
        ref={tagRef}
        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] md:text-xs font-mono-code font-bold uppercase select-none mb-6"
      >
        <Sparkles className="w-3.5 h-3.5 text-neon-orange animate-spin-slow" />
        <span>DECIPHERING STARTUP ENGINEERING & ARCHITECTURE</span>
      </div>

      {/* Main Headline */}
      <h1 
        ref={headlineRef}
        className="font-mono-tech text-4xl md:text-6xl lg:text-7xl font-black text-black leading-[1.05] tracking-tight uppercase max-w-4xl"
      >
        Decode <span className="text-white bg-black px-2 py-0.5 inline-block transform -rotate-1 rounded shadow-[4px_4px_0px_0px_rgba(0,188,230,1)]">Startups</span> <br className="hidden md:inline" />
        Build The Future.
      </h1>

      {/* Tagline */}
      <p 
        className="text-xs md:text-sm text-slate-800 font-mono-code max-w-2xl mt-6 px-4 leading-relaxed"
      >
        For Entrepreneurs, Techies, and College Students. Explore 6,100+ YC companies, run multi-model AI system design autopsies, view real database schemas, and reverse-engineer successful products.
      </p>

      {/* Call to Actions */}
      <div 
        ref={actionRef}
        className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-10 w-full px-4"
      >
        <button 
          onClick={onStart}
          className="brutal-btn w-full sm:w-auto px-8 py-3.5 bg-neon-orange text-white text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neon-orange"
        >
          <Rocket className="w-4 h-4" />
          <span>START LEARNING NOW</span>
        </button>

        <button 
          onClick={onStart}
          className="brutal-btn w-full sm:w-auto px-8 py-3.5 bg-white text-black text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Play className="w-4.5 h-4.5 fill-black" />
          <span>LAUNCH DEMO TERMINAL</span>
        </button>
      </div>

      {/* Terminal Mockup preview panel */}
      <div 
        ref={consoleRef}
        className="w-full max-w-4xl mt-16 brutal-card bg-black p-1 text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white overflow-hidden font-mono-code relative"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900 select-none">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-neon-magenta border border-black" />
            <div className="w-2.5 h-2.5 rounded-full bg-neon-orange border border-black" />
            <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan border border-black" />
            <span className="text-[10px] text-zinc-400 font-bold ml-2">SYSTEM_DESIGN_PREVIEW.SH</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold tracking-wider">ONLINE</span>
        </div>

        {/* Terminal Body */}
        <div className="p-5 text-xs text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre font-mono-code bg-zinc-950 min-h-[220px]">
          <span className="text-neon-cyan font-bold">visitor@yc_decode:~$</span> node analyze-startup.js --slug=stripe<br />
          <span className="text-zinc-500">Querying startup database index [6,179 profiles]...</span><br />
          <span className="text-zinc-500">Retrieving system architecture spec for STRIPE (S09)...</span><br />
          <br />
          <span className="text-neon-orange font-bold"># SYSTEM INTERVIEW SCHEMA (STRIPE IDEMPOTENT PAYMENTS)</span><br />
          <span className="text-neon-emerald">1. Client Request</span> --[ POST /v1/charges with Idempotency-Key ]--&gt; <span className="text-neon-cyan">API Gateway</span><br />
          <span className="text-neon-cyan">2. API Gateway</span> --[ Read Cache ]--&gt; <span className="text-white bg-zinc-800 px-1 border border-zinc-700">Redis Cache</span> (Check for duplicate key)<br />
          <span className="text-zinc-500">   • FOUND: Return identical stored response without re-executing</span><br />
          <span className="text-zinc-500">   • NOT FOUND: Save key in Redis with state 'IN_PROGRESS' and route request</span><br />
          <span className="text-neon-cyan">3. Core Service</span> --[ Start Transaction ]--&gt; <span className="text-neon-emerald">PostgreSQL DB</span> (Write double-entry ledger)<br />
          <span className="text-neon-cyan">4. Stripe Gateway</span> --[ Dispatch Call ]--&gt; <span className="text-neon-magenta">Acquiring Bank API</span><br />
          <span className="text-zinc-500">   • State updated to 'COMPLETED' in DB & Cache</span><br />
          <br />
          <span className="text-zinc-500">// Analysis complete. 100% of functional requirements matched.</span><br />
          <span className="text-neon-cyan font-bold">visitor@yc_decode:~$</span> <span className="animate-pulse">_</span>
        </div>
      </div>

    </section>
  );
}
