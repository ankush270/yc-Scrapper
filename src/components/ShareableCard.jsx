import React, { useState, useRef } from 'react';
import { 
  X, Download, Copy, Check, Share2, Palette, Sparkles, Star 
} from 'lucide-react';

export default function ShareableCard({ company, teardownText, onClose, publishUrl }) {
  const [selectedColor, setSelectedColor] = useState('cyan'); // 'cyan', 'orange', 'emerald', 'magenta'
  const [highlightText, setHighlightText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCardText, setCopiedCardText] = useState(false);
  const cardRef = useRef(null);

  const colors = {
    cyan: { bg: 'bg-neon-cyan', hex: '#00bce6', text: 'text-black' },
    orange: { bg: 'bg-neon-orange', hex: '#ff7700', text: 'text-white' },
    emerald: { bg: 'bg-neon-emerald', hex: '#00d37e', text: 'text-black' },
    magenta: { bg: 'bg-neon-magenta', hex: '#e60073', text: 'text-white' }
  };

  const getExcerpt = () => {
    if (highlightText) return highlightText;
    if (!teardownText) return "No teardown details available.";
    
    // Extract first 150 chars or first paragraph
    const cleaned = teardownText.replace(/[#*`]/g, '').trim();
    const paragraph = cleaned.split('\n')[0];
    return paragraph.length > 180 ? paragraph.substring(0, 180) + '...' : paragraph;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publishUrl || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    const textToCopy = `Decoded ${company?.name || 'startup'} on YC_DECODE! 🧠\n\n"${getExcerpt()}"\n\nRead the full teardown here: ${publishUrl || window.location.href}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCardText(true);
    setTimeout(() => setCopiedCardText(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `Decoded ${company?.name || 'startup'} on YC_DECODE! 🧠\n\nRead the full teardown here: ${publishUrl || window.location.href}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publishUrl || window.location.href)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="brutal-card w-full max-w-xl bg-white p-6 relative flex flex-col md:flex-row gap-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 cursor-pointer"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Column 1: Card Preview */}
        <div className="flex-1 flex flex-col items-center">
          <span className="font-mono-tech text-[10px] uppercase font-bold text-slate-700 mb-3 tracking-wider flex items-center">
            <Sparkles className="w-3 h-3 text-neon-orange mr-1 animate-pulse" />
            Social Teardown Card Preview
          </span>
          
          {/* Branded Card */}
          <div 
            ref={cardRef}
            className={`w-full aspect-[1.91/1] border-2.5 border-black rounded p-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors duration-200 ${colors[selectedColor].bg} ${colors[selectedColor].text}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded border border-black bg-white flex items-center justify-center font-mono-tech text-xs font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none">
                  {company?.name ? company.name.charAt(0).toUpperCase() : 'Y'}
                </div>
                <div>
                  <h3 className="font-mono-tech text-xs font-black uppercase tracking-wider leading-none">
                    {company?.name || 'STARTUP'}
                  </h3>
                  <span className="font-mono-code text-[8px] uppercase opacity-75 font-semibold">
                    {company?.batch || 'YC Batch'} • {company?.industry || 'Industry'}
                  </span>
                </div>
              </div>
              <div className="font-mono-tech text-[8px] bg-white text-black border border-black px-1.5 py-0.5 rounded font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                DECODED 🧠
              </div>
            </div>

            <div className="my-2.5 font-sans italic text-[11px] leading-relaxed line-clamp-3 font-medium bg-white/10 p-2 rounded border border-black/10 select-all">
              "{getExcerpt()}"
            </div>

            <div className="flex justify-between items-center border-t border-black/20 pt-2 text-[8px] font-mono-code uppercase font-bold">
              <span>YC_DECODE TERMINAL</span>
              <span className="flex items-center">
                <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                ycdecode.com
              </span>
            </div>
          </div>

          {/* Color Picker */}
          <div className="flex items-center space-x-2 mt-5">
            <Palette className="w-3.5 h-3.5 text-slate-700" />
            <span className="font-mono-code text-[10px] uppercase font-bold text-slate-600 mr-2">Theme:</span>
            {Object.keys(colors).map((colorKey) => (
              <button
                key={colorKey}
                onClick={() => setSelectedColor(colorKey)}
                className={`w-6 h-6 rounded-full border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform ${colors[colorKey].bg} ${
                  selectedColor === colorKey ? 'scale-110 ring-2 ring-slate-400' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Column 2: Controls & Sharing options */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-mono-tech text-sm font-bold uppercase tracking-wider text-black mb-3">
              Share Your Insight
            </h4>
            <p className="text-[11px] text-slate-600 font-sans leading-relaxed mb-4">
              Publish this teardown card to LinkedIn, Twitter, or copy the link to share directly in study channels and team boards.
            </p>

            {/* Custom Excerpt Input */}
            <div className="mb-4">
              <label className="font-mono-code text-[9px] uppercase font-black text-slate-700 block mb-1">
                Customize Card Insight Highlight (Optional)
              </label>
              <textarea
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value.substring(0, 180))}
                placeholder="Highlight a key lesson or value proposition..."
                className="w-full text-xs p-2.5 border-2 border-black rounded focus:outline-none focus:ring-1 focus:ring-slate-300 font-sans h-20 resize-none bg-zinc-50"
              />
              <span className="text-[9px] text-slate-500 font-mono-code block text-right mt-0.5">
                {highlightText.length}/180 chars
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <button 
              onClick={handleCopyLink}
              className="brutal-btn w-full py-2.5 text-xs bg-white hover:bg-zinc-50 flex items-center justify-center space-x-2"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-neon-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'LINK COPIED!' : 'COPY PUBLIC TEARDOWN LINK'}</span>
            </button>

            <button 
              onClick={handleCopyText}
              className="brutal-btn w-full py-2.5 text-xs bg-white hover:bg-zinc-50 flex items-center justify-center space-x-2"
            >
              {copiedCardText ? <Check className="w-3.5 h-3.5 text-neon-emerald" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedCardText ? 'TEXT COPIED!' : 'COPY PRE-FORMATTED SHARE'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                onClick={handleShareTwitter}
                className="brutal-btn py-2.5 text-xs bg-[#1DA1F2] hover:bg-[#1b95e0] text-white border-black font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>TWITTER</span>
              </button>

              <button 
                onClick={handleShareLinkedIn}
                className="brutal-btn py-2.5 text-xs bg-[#0077B5] hover:bg-[#00669b] text-white border-black font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LINKEDIN</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
