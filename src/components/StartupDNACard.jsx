import React, { useState, useMemo } from 'react';
import { 
  Download, Copy, Check, Star, Shield, 
  Sparkles, Award, Zap, Heart, Info, InfoIcon 
} from 'lucide-react';

// Deterministic helper to generate DNA stats for any YC startup
export function generateDNAStats(company) {
  if (!company) return null;

  const { name, batch, industry, status, team_size } = company;
  const hashStr = (name || '') + (industry || '') + (batch || '');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashStr.length; i++) {
    hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const getVal = (min, max, offset) => {
    const val = Math.abs((hash + offset) % (max - min + 1));
    return min + val;
  };

  // 1. Tech Stack mapping
  const techMap = {
    'Fintech': ['PostgreSQL', 'Go', 'Python', 'Stripe API', 'React'],
    'SaaS': ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Redis'],
    'Healthcare': ['Python', 'Django', 'PostgreSQL', 'FastAPI', 'HIPAA Cloud'],
    'Consumer': ['Next.js', 'Firebase', 'MongoDB', 'Node.js', 'Vercel'],
    'AI': ['PyTorch', 'FastAPI', 'Vector DB', 'OpenAI API', 'Python'],
    'Hardware': ['C++', 'Embedded RTOS', 'Python', 'MQTT', 'ROS'],
    'Web3': ['Rust', 'Solidity', 'TypeScript', 'Ethers.js', 'IPFS']
  };
  const matchingStack = techMap[industry] || ['React', 'Python', 'Node.js', 'PostgreSQL', 'AWS'];

  // 2. Revenue Model mapping
  const revMap = {
    'Fintech': 'Transaction Fee (1.5% - 3.5%)',
    'SaaS': 'Subscription SaaS (Seat-based)',
    'Healthcare': 'B2B Enterprise License / Annual contract',
    'Consumer': 'Freemium / Ad-supported / Direct Sale',
    'AI': 'Usage API Credits (per token)',
    'Hardware': 'Direct Sales + Subscription service',
    'Web3': 'Tokenomics / Protocol Fee'
  };
  const matchingRevenue = revMap[industry] || 'Subscription SaaS / B2B Pricing';

  // 3. Power stats
  const sizeMultiplier = team_size ? Math.min(10, Math.ceil(team_size / 20)) : 1;
  const scale = Math.min(99, getVal(35, 85, 1) + sizeMultiplier);
  const innovation = getVal(50, 98, 2);
  const moat = getVal(30, 92, 3) + (status === 'Active' ? 10 : 0);

  return {
    techStack: matchingStack,
    revenueModel: matchingRevenue,
    scale,
    innovation,
    moat,
    cardColor: Math.abs(hash) % 4 // 0: Cyan, 1: Orange, 2: Emerald, 3: Magenta
  };
}

export default function StartupDNACard({ company, onClose }) {
  const [copied, setCopied] = useState(false);
  const stats = useMemo(() => generateDNAStats(company), [company]);

  if (!company || !stats) return null;

  const colorThemes = [
    { bg: '#00bce6', text: '#000000', label: 'CYAN', class: 'bg-neon-cyan text-black' },
    { bg: '#ff7700', text: '#ffffff', label: 'ORANGE', class: 'bg-neon-orange text-white' },
    { bg: '#00d37e', text: '#000000', label: 'EMERALD', class: 'bg-neon-emerald text-black' },
    { bg: '#e60073', text: '#ffffff', label: 'MAGENTA', class: 'bg-neon-magenta text-white' }
  ];
  const theme = colorThemes[stats.cardColor] || colorThemes[0];

  const handleCopyLink = () => {
    const link = `${window.location.origin}/#teardown/${company.slug || company.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download card as vector SVG image natively
  const handleDownloadSVG = () => {
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 480" width="350" height="480">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap');
          .title-text { font-family: 'Share Tech Mono', monospace; font-size: 20px; font-weight: bold; fill: ${theme.text}; }
          .mono-code { font-family: 'Share Tech Mono', monospace; font-size: 10px; fill: ${theme.text}; }
          .normal-text { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; fill: #1e293b; }
          .bold-label { font-family: 'Share Tech Mono', monospace; font-size: 9px; font-weight: bold; fill: #475569; }
          .rating-bar-bg { fill: #e2e8f0; stroke: #000; stroke-width: 1.5; }
          .rating-bar-fill { fill: ${theme.bg}; stroke: #000; stroke-width: 1.5; }
        </style>
      </defs>
      
      <!-- Outer Card Border (Neo-Brutalist shadow) -->
      <rect x="16" y="16" width="324" height="454" rx="8" fill="#000000" />
      <rect x="10" y="10" width="324" height="454" rx="8" fill="#ffffff" stroke="#000000" stroke-width="3" />
      
      <!-- Branded Header block -->
      <rect x="22" y="22" width="300" height="50" rx="4" fill="${theme.bg}" stroke="#000000" stroke-width="2.5" />
      <text x="34" y="53" class="title-text">${company.name.toUpperCase()}</text>
      <rect x="250" y="32" width="60" height="30" rx="3" fill="#ffffff" stroke="#000000" stroke-width="1.5" />
      <text x="260" y="51" font-family="'Share Tech Mono', monospace" font-size="12" font-weight="bold" fill="#000000">${company.batch}</text>
      
      <!-- One Liner -->
      <rect x="22" y="86" width="300" height="60" rx="4" fill="#faf8f5" stroke="#000000" stroke-width="2" />
      <text x="32" y="106" class="bold-label">MISSION STATEMENT</text>
      <text x="32" y="126" class="normal-text">${company.one_liner ? (company.one_liner.length > 40 ? company.one_liner.substring(0, 40) + '...' : company.one_liner) : 'Build interesting products.'}</text>
      
      <!-- Tech Stack DNA -->
      <rect x="22" y="160" width="300" height="75" rx="4" fill="#ffffff" stroke="#000000" stroke-width="2" />
      <text x="32" y="178" class="bold-label">TECH STACK DNA</text>
      <text x="32" y="200" font-family="sans-serif" font-size="11" font-weight="bold" fill="#000000">${stats.techStack.join(' • ')}</text>
      <text x="32" y="220" font-family="sans-serif" font-size="9" fill="#64748b">MONETIZATION: ${stats.revenueModel}</text>
      
      <!-- Power Stats Sliders -->
      <rect x="22" y="250" width="300" height="155" rx="4" fill="#ffffff" stroke="#000000" stroke-width="2" />
      <text x="32" y="270" class="bold-label">BUILDER POWER STATS</text>
      
      <!-- Scale -->
      <text x="32" y="295" font-family="sans-serif" font-size="9" font-weight="bold" fill="#000">SCALE: ${stats.scale}/100</text>
      <rect x="32" y="303" width="280" height="10" rx="3" class="rating-bar-bg" />
      <rect x="32" y="303" width="${(stats.scale / 100) * 280}" height="10" rx="3" class="rating-bar-fill" />
      
      <!-- Innovation -->
      <text x="32" y="335" font-family="sans-serif" font-size="9" font-weight="bold" fill="#000">INNOVATION: ${stats.innovation}/100</text>
      <rect x="32" y="343" width="280" height="10" rx="3" class="rating-bar-bg" />
      <rect x="32" y="343" width="${(stats.innovation / 100) * 280}" height="10" rx="3" class="rating-bar-fill" />
      
      <!-- Moat -->
      <text x="32" y="375" font-family="sans-serif" font-size="9" font-weight="bold" fill="#000">MOAT DEFENSE: ${stats.moat}/100</text>
      <rect x="32" y="377" width="280" height="10" rx="3" class="rating-bar-bg" />
      <rect x="32" y="377" width="${(stats.moat / 100) * 280}" height="10" rx="3" class="rating-bar-fill" />
      
      <!-- Card Footer -->
      <text x="32" y="435" font-family="'Share Tech Mono', monospace" font-size="9" fill="#94a3b8">DECODED ON YC_DECODE // CODENAME: ${company.name.toUpperCase()}</text>
      <text x="32" y="448" font-family="'Share Tech Mono', monospace" font-size="9" fill="#94a3b8">STUDY REVENUE MODELS AND SYSTEM ARCHITECTURES</text>
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${company.slug || 'startup'}_dna_card.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="brutal-card w-full max-w-sm bg-white p-6 relative">
        
        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 cursor-pointer"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Card Render */}
        <div className="flex flex-col items-center">
          <span className="font-mono-tech text-[10px] uppercase font-bold text-slate-700 mb-3 tracking-wider flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-neon-orange mr-1 animate-pulse" />
            STARTUP DNA TRADING CARD
          </span>

          {/* HTML Card representation matching the downloaded SVG */}
          <div className="w-full aspect-[1/1.37] border-2.5 border-black rounded p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between select-none">
            {/* Header Block */}
            <div className={`p-2.5 border-2 border-black rounded flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${theme.class}`}>
              <h3 className="font-mono-tech text-sm font-black uppercase tracking-wider truncate max-w-[170px]">
                {company.name}
              </h3>
              <span className="font-mono-code text-[10px] bg-white text-black border border-black px-1.5 py-0.5 rounded font-black">
                {company.batch}
              </span>
            </div>

            {/* Mission */}
            <div className="mt-2.5 p-2 border border-black rounded bg-zinc-50 flex flex-col">
              <span className="font-mono-code text-[8px] font-bold text-slate-500 uppercase">MISSION STATEMENT</span>
              <p className="font-sans text-[10px] text-slate-800 italic mt-0.5 line-clamp-2">
                "{company.one_liner || 'Build interesting products.'}"
              </p>
            </div>

            {/* Tech Stack DNA */}
            <div className="mt-2 p-2 border border-black rounded bg-white flex flex-col">
              <span className="font-mono-code text-[8px] font-bold text-slate-500 uppercase">TECH STACK DNA</span>
              <span className="font-sans text-[9px] font-bold text-black mt-1 leading-tight">
                {stats.techStack.join(' • ')}
              </span>
              <span className="font-sans text-[8px] text-slate-500 mt-1 uppercase">
                REV: {stats.revenueModel}
              </span>
            </div>

            {/* Power Stats sliders */}
            <div className="mt-2 p-2 border border-black rounded bg-white flex flex-col space-y-1.5">
              <span className="font-mono-code text-[8px] font-bold text-slate-500 uppercase">BUILDER POWER STATS</span>
              
              {/* Scale */}
              <div>
                <div className="flex justify-between text-[8px] font-bold uppercase mb-0.5 font-sans">
                  <span>SCALE:</span>
                  <span>{stats.scale}/100</span>
                </div>
                <div className="w-full h-2 rounded border border-black bg-zinc-100 overflow-hidden">
                  <div style={{ width: `${stats.scale}%` }} className={`h-full border-r border-black ${theme.class}`} />
                </div>
              </div>

              {/* Innovation */}
              <div>
                <div className="flex justify-between text-[8px] font-bold uppercase mb-0.5 font-sans">
                  <span>INNOVATION:</span>
                  <span>{stats.innovation}/100</span>
                </div>
                <div className="w-full h-2 rounded border border-black bg-zinc-100 overflow-hidden">
                  <div style={{ width: `${stats.innovation}%` }} className={`h-full border-r border-black ${theme.class}`} />
                </div>
              </div>

              {/* Moat */}
              <div>
                <div className="flex justify-between text-[8px] font-bold uppercase mb-0.5 font-sans">
                  <span>MOAT DEFENSE:</span>
                  <span>{stats.moat}/100</span>
                </div>
                <div className="w-full h-2 rounded border border-black bg-zinc-100 overflow-hidden">
                  <div style={{ width: `${stats.moat}%` }} className={`h-full border-r border-black ${theme.class}`} />
                </div>
              </div>
            </div>

            <div className="text-[7.5px] font-mono-code text-slate-400 mt-2 leading-tight uppercase select-none">
              <span>DECODED ON YC_DECODE // TRADING DECK</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6 w-full">
            <button 
              onClick={handleDownloadSVG}
              className="brutal-btn py-2 text-xs bg-neon-orange text-white border-black font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neon-orange"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SVG CARD</span>
            </button>

            <button 
              onClick={handleCopyLink}
              className="brutal-btn py-2 text-xs bg-white text-black border-black font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-neon-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED!' : 'SHARE LINK'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
