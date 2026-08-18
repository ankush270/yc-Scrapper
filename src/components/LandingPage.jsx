import React, { useState } from 'react';
import LandingHero from './LandingHero';
import { 
  Terminal, Sparkles, Cpu, Layers, BookOpen, 
  ArrowRight, Shield, Award, Check, ChevronDown, HelpCircle, 
  Heart, Zap, Star, GitFork, Trash2, Flame
} from 'lucide-react';

export default function LandingPage({ onStart }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const features = [
    {
      icon: <Terminal className="w-6 h-6 text-neon-cyan" />,
      title: "6,179 Startup Database",
      desc: "Explore details, sectors, regions, status, and history of YC-funded companies since 2005."
    },
    {
      icon: <Cpu className="w-6 h-6 text-neon-orange" />,
      title: "Multi-LLM AI Analyst",
      desc: "Run detailed teardowns, technical specs, competitive landscape analyses, and GTM playbooks using Gemini, OpenAI, or Claude."
    },
    {
      icon: <Layers className="w-6 h-6 text-neon-emerald" />,
      title: "System Design & Architecture",
      desc: "Study how real-world products are built. Access interactive Mermaid diagrams, tech stack DNA cards, and database schemas."
    },
    {
      icon: <Zap className="w-6 h-6 text-neon-magenta" />,
      title: "AI Startup Roast Engine",
      desc: "Get brutally honest feedback on your product ideas. Know what VCs would say before you write a single line of code."
    },
    {
      icon: <Trash2 className="w-6 h-6 text-slate-800" />,
      title: "The Startup Graveyard",
      desc: "Analyze inactive and failed startups. Learn why they shut down and study critical counterfactuals to avoid their mistakes."
    },
    {
      icon: <GitFork className="w-6 h-6 text-neon-cyan" />,
      title: "Builder Sandbox",
      desc: "Plan your own products, track features, link inspiration from YC startups, and fork/remix community proposals."
    },
    {
      icon: <Award className="w-6 h-6 text-neon-orange" />,
      title: "Weekly Arena Challenges",
      desc: "Participate in 'How Would You Build This?' architecture challenges, submit diagrams, and get rated by the community."
    },
    {
      icon: <Flame className="w-6 h-6 text-neon-magenta" />,
      title: "Daily Streaks & Leaderboard",
      desc: "Gamified learning check-ins. Accumulate experience points (XP) for viewing startups, writing notes, and ranking in the Arena."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-neon-emerald" />,
      title: "Learning Paths & Certificates",
      desc: "Structured upskilling tracks (SaaS 101, zero to MVP, Fintech). Earn downloadable credentials to display on LinkedIn."
    },
    {
      icon: <Star className="w-6 h-6 text-neon-cyan" />,
      title: "Revenue Reverse-Engineer",
      desc: "Deconstruct monetization strategies. View user fee ratios, transaction models, subscription logic, and price tiers."
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-neon-orange" />,
      title: "Startup Simulator",
      desc: "Interactive what-if scenario spreadsheet. Tweak conversion, churn, and pricing to simulate product growth."
    },
    {
      icon: <Shield className="w-6 h-6 text-neon-magenta" />,
      title: "Founder GTM Playbook",
      desc: "AI generated day-by-day launching blueprints. Plan customer discovery, first 100 users, and scaling channels."
    }
  ];

  const faqs = [
    {
      q: "What is YC_DECODE?",
      a: "YC_DECODE is an interactive tech lab terminal and learning workspace for engineers, startup founders, and students who want to study real-world business models, tech stacks, and system architectures."
    },
    {
      q: "Do I need to pay to use it?",
      a: "No! The core browser, sandbox, and basic database features are 100% free. Optional Pro subscriptions are available for advanced AI capabilities and certificate paths."
    },
    {
      q: "How does the AI analysis work?",
      a: "It generates dynamic technical specifications, systems diagrams, and business autopsies using LLM APIs. You can either use our cloud tier or plug in your own developer API keys."
    },
    {
      q: "Is this suitable for system design interview prep?",
      a: "Absolutely. We provide tailored mock interview interfaces and real-world system architecture diagrams based on actual high-scale companies (like Uber, Stripe, and Airbnb)."
    }
  ];

  return (
    <div className="min-h-screen bg-obsidian-bg text-black antialiased flex flex-col font-sans-body">
      
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto w-full px-4 py-5 flex items-center justify-between border-b-2 border-black">
        <div className="flex items-center space-x-2 select-none">
          <div className="w-8 h-8 rounded border-2 border-black bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="10" y="10" width="80" height="80" fill="#ff7700" stroke="#000" strokeWidth="4" />
              <rect x="5" y="5" width="80" height="80" fill="#00bce6" stroke="#000" strokeWidth="4" />
              <text x="22" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="2">Y</text>
              <text x="46" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#000">D</text>
            </svg>
          </div>
          <span className="font-mono-tech text-base md:text-lg font-bold tracking-widest text-black">
            YC_DECODE
          </span>
        </div>
        <div>
          <button 
            onClick={onStart}
            className="brutal-btn px-4 py-2 text-xs md:text-sm bg-neon-cyan hover:bg-neon-cyan"
          >
            ENTER CONSOLE
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <LandingHero onStart={onStart} />

      {/* Stats Section */}
      <section className="bg-obsidian-dark border-t-2 border-b-2 border-black py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="brutal-card p-5 bg-white">
            <h3 className="font-mono-tech text-3xl md:text-4xl font-extrabold text-neon-orange">6,179</h3>
            <p className="font-mono-code text-[10px] uppercase font-bold text-slate-700 mt-1">Startups Indexed</p>
          </div>
          <div className="brutal-card p-5 bg-white">
            <h3 className="font-mono-tech text-3xl md:text-4xl font-extrabold text-neon-cyan">15+</h3>
            <p className="font-mono-code text-[10px] uppercase font-bold text-slate-700 mt-1">Years of Batch History</p>
          </div>
          <div className="brutal-card p-5 bg-white">
            <h3 className="font-mono-tech text-3xl md:text-4xl font-extrabold text-neon-emerald">11</h3>
            <p className="font-mono-code text-[10px] uppercase font-bold text-slate-700 mt-1">AI Analysis Modes</p>
          </div>
          <div className="brutal-card p-5 bg-white">
            <h3 className="font-mono-tech text-3xl md:text-4xl font-extrabold text-neon-magenta">100%</h3>
            <p className="font-mono-code text-[10px] uppercase font-bold text-slate-700 mt-1">Builder Oriented</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="font-mono-code text-xs bg-neon-cyan border-2 border-black px-3 py-1 rounded font-bold uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
            Product Capability
          </span>
          <h2 className="font-mono-tech text-3xl md:text-4xl font-extrabold mt-6 uppercase tracking-wider text-black">
            The Ultimate Startup Lab
          </h2>
          <p className="text-sm text-slate-800 mt-2 max-w-xl mx-auto font-mono-code">
            Decode successful business models, study architectural flow, and launch your own products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, idx) => (
            <div key={idx} className="brutal-card brutal-card-hover p-6 bg-white flex flex-col justify-between h-full">
              <div>
                <div className="w-12 h-12 rounded border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-5">
                  {f.icon}
                </div>
                <h3 className="font-mono-tech text-lg font-bold text-black uppercase mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-800 font-sans leading-relaxed">
                  {f.desc}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-mono-code font-bold hover:text-neon-cyan cursor-pointer transition-colors" onClick={onStart}>
                <span>Explore Feature</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-20 border-t-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-mono-code text-xs bg-neon-magenta border-2 border-black text-white px-3 py-1 rounded font-bold uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              Workflow Guide
            </span>
            <h2 className="font-mono-tech text-3xl md:text-4xl font-extrabold mt-6 uppercase tracking-wider text-black">
              How To Use YC_DECODE
            </h2>
            <p className="text-sm text-slate-800 mt-2 max-w-xl mx-auto font-mono-code">
              A step-by-step roadmap to study system design and validate your startup ideas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="brutal-card p-6 bg-white relative pt-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-4 left-4 font-mono-tech text-3xl font-black text-neon-orange">
                01
              </span>
              <h3 className="font-mono-tech text-base font-bold uppercase text-black mb-2 mt-2">
                Inspect & Explore
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Browse our grid of 6,179 startups. Filter by batch, industry, status, or search fuzzy keywords to identify market clusters and business trends.
              </p>
            </div>

            {/* Step 2 */}
            <div className="brutal-card p-6 bg-white relative pt-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-4 left-4 font-mono-tech text-3xl font-black text-neon-cyan">
                02
              </span>
              <h3 className="font-mono-tech text-base font-bold uppercase text-black mb-2 mt-2">
                Deconstruct with AI
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Run AI analysis teardowns to map problem statements, core value props, and target audiences. Use the AI Roast Engine for brutally honest feedback on your own concepts.
              </p>
            </div>

            {/* Step 3 */}
            <div className="brutal-card p-6 bg-white relative pt-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-4 left-4 font-mono-tech text-3xl font-black text-neon-emerald">
                03
              </span>
              <h3 className="font-mono-tech text-base font-bold uppercase text-black mb-2 mt-2">
                Study System Design
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Inspect database schemas, REST endpoints, and system architecture. Render Mermaid diagrams to visual maps, and guess tech stack DNA (React, Python, Go) deterministically.
              </p>
            </div>

            {/* Step 4 */}
            <div className="brutal-card p-6 bg-white relative pt-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-4 left-4 font-mono-tech text-3xl font-black text-neon-magenta">
                04
              </span>
              <h3 className="font-mono-tech text-base font-bold uppercase text-black mb-2 mt-2">
                Complete Challenges
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Solve weekly 'How Would You Build This?' architecture challenges. Maintain your daily check-in streak and rank on the Arena Leaderboard to earn points.
              </p>
            </div>

            {/* Step 5 */}
            <div className="brutal-card p-6 bg-white relative pt-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-4 left-4 font-mono-tech text-3xl font-black text-slate-800">
                05
              </span>
              <h3 className="font-mono-tech text-base font-bold uppercase text-black mb-2 mt-2">
                Simulate & Plan
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Open the Sandbox Kanban workspace to structure your MVP roadmap. Tweak users, pricing, and churn ratios in the Startup Simulator to project runway and margins.
              </p>
            </div>

            {/* Step 6 */}
            <div className="brutal-card p-6 bg-white relative pt-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="absolute top-4 left-4 font-mono-tech text-3xl font-black text-neon-cyan">
                06
              </span>
              <h3 className="font-mono-tech text-base font-bold uppercase text-black mb-2 mt-2">
                Export & Showcase
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Download high-quality vector SVG trading cards of startups you deconstruct. Publish read-only teardowns, claim learning certificates, and share milestones with colleagues on LinkedIn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Section */}
      <section className="bg-obsidian-dark border-t-2 border-b-2 border-black py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-mono-code text-xs bg-neon-emerald border-2 border-black px-3 py-1 rounded font-bold uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              Pricing Options
            </span>
            <h2 className="font-mono-tech text-3xl md:text-4xl font-extrabold mt-6 uppercase tracking-wider text-black">
              Simple, Transparent Plans
            </h2>
            <p className="text-sm text-slate-800 mt-2 max-w-xl mx-auto font-mono-code">
              Start for free, upgrade when you want to build and share at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free plan */}
            <div className="brutal-card p-8 bg-white flex flex-col justify-between">
              <div>
                <span className="font-mono-tech text-xs bg-slate-200 border border-black px-2 py-0.5 rounded font-bold">FREE TIER</span>
                <h3 className="font-mono-tech text-2xl font-black mt-2 text-black">BUILDER</h3>
                <div className="flex items-baseline mt-4 mb-6">
                  <span className="font-mono-tech text-4xl font-black">$0</span>
                  <span className="font-mono-code text-xs text-slate-600 ml-2">/ lifetime free</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-800 font-mono-code">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-emerald mr-2 shrink-0" />
                    <span>Access to all 6,179 YC startups</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-emerald mr-2 shrink-0" />
                    <span>3 AI startup analyses per month</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-emerald mr-2 shrink-0" />
                    <span>1 Sandbox planning project</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-emerald mr-2 shrink-0" />
                    <span>Basic stats & achievements</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onStart}
                className="brutal-btn w-full mt-8 py-3 bg-white text-black font-bold uppercase text-xs tracking-wider"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro plan */}
            <div className="brutal-card p-8 bg-white flex flex-col justify-between border-neon-orange relative shadow-[6px_6px_0px_0px_rgba(255,119,0,1)]">
              <div className="absolute top-4 right-4 bg-neon-orange text-white border border-black font-mono-tech text-[10px] px-2.5 py-1 rounded font-black uppercase tracking-wider">
                POPULAR
              </div>
              <div>
                <span className="font-mono-tech text-xs bg-neon-orange/20 border border-neon-orange px-2 py-0.5 rounded font-bold text-neon-orange">PRO TIER</span>
                <h3 className="font-mono-tech text-2xl font-black mt-2 text-black">HACKER</h3>
                <div className="flex items-baseline mt-4 mb-6">
                  <span className="font-mono-tech text-4xl font-black">$9</span>
                  <span className="font-mono-code text-xs text-slate-600 ml-2">/ month ($7 billed annually)</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-800 font-mono-code">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-orange mr-2 shrink-0" />
                    <span>Everything in Builder plan</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-orange mr-2 shrink-0" />
                    <span>Unlimited AI startup analyses</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-orange mr-2 shrink-0" />
                    <span>Unlimited Sandbox projects</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-orange mr-2 shrink-0" />
                    <span>Access to system design + schemas</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-neon-orange mr-2 shrink-0" />
                    <span>LinkedIn certificates & sharing loops</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onStart}
                className="brutal-btn w-full mt-8 py-3 bg-neon-orange text-white font-bold uppercase text-xs tracking-wider border-black hover:bg-neon-orange"
              >
                Go Pro Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-3xl mx-auto px-4 w-full">
        <div className="text-center mb-16">
          <span className="font-mono-code text-xs bg-neon-magenta border-2 border-black text-white px-3 py-1 rounded font-bold uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
            FAQ
          </span>
          <h2 className="font-mono-tech text-3xl md:text-4xl font-extrabold mt-6 uppercase tracking-wider text-black">
            Got Questions?
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div key={idx} className="brutal-card bg-white overflow-hidden transition-all duration-150">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-4 flex items-center justify-between font-mono-tech text-sm md:text-base font-bold text-left uppercase border-none outline-none focus:outline-none"
              >
                <span>{f.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ml-4 ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-xs text-slate-800 border-t border-slate-100 font-sans leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t-2 border-black py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <svg viewBox="0 0 100 100" className="w-6 h-6">
              <rect x="10" y="10" width="80" height="80" fill="#ff7700" stroke="#000" strokeWidth="4" />
              <rect x="5" y="5" width="80" height="80" fill="#00bce6" stroke="#000" strokeWidth="4" />
              <text x="22" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="2">Y</text>
              <text x="46" y="58" fontFamily="Share Tech Mono, monospace" fontSize="48" fontWeight="900" fill="#000">D</text>
            </svg>
            <span className="font-mono-tech text-sm font-bold tracking-widest text-black">
              YC_DECODE // STUDY AND BUILD THE FUTURE
            </span>
          </div>
          <div className="flex items-center space-x-1.5 font-mono-code text-[10px] text-slate-800 font-bold">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-neon-magenta fill-neon-magenta" />
            <span>for builders & students</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
