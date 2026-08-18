import React, { useState } from 'react';
import { 
  Award, Layers, Star, Play, 
  Search, ShieldAlert, Sparkles, BookOpen 
} from 'lucide-react';
import StartupDNACard, { generateDNAStats } from './StartupDNACard';

export default function DNACardDeck({ allCompanies, favoriteIds, userNotes }) {
  const [deckTab, setDeckTab] = useState('favorites'); // 'favorites' | 'notes'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Filter companies down to user's cards
  const deckCompanies = React.useMemo(() => {
    let list = [];
    if (deckTab === 'favorites') {
      list = allCompanies.filter(c => favoriteIds.has(c.id.toString()) || favoriteIds.has(c.id));
    } else {
      list = allCompanies.filter(c => {
        const slug = c.slug || c.id.toString();
        return !!userNotes[slug];
      });
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.industry && c.industry.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allCompanies, favoriteIds, userNotes, deckTab, searchQuery]);

  const colorThemes = [
    { border: 'border-neon-cyan', text: 'text-neon-cyan', bg: 'bg-neon-cyan/5' },
    { border: 'border-neon-orange', text: 'text-neon-orange', bg: 'bg-neon-orange/5' },
    { border: 'border-neon-emerald', text: 'text-neon-emerald', bg: 'bg-neon-emerald/5' },
    { border: 'border-neon-magenta', text: 'text-neon-magenta', bg: 'bg-neon-magenta/5' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-4">
        <div>
          <h2 className="font-mono-tech text-lg md:text-xl font-black uppercase text-black tracking-wider flex items-center">
            <Layers className="w-5 h-5 mr-2 text-neon-cyan fill-neon-cyan/10" />
            Startup DNA trading deck
          </h2>
          <p className="font-mono-code text-[10px] text-slate-500 uppercase mt-0.5">
            Collect and export system design stats for startups you study
          </p>
        </div>

        {/* Tab switcher & Search */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center border-2 border-black rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white select-none">
            <button
              onClick={() => setDeckTab('favorites')}
              className={`font-mono-tech text-[10px] px-3 py-1.5 font-bold uppercase transition-colors cursor-pointer
                ${deckTab === 'favorites' ? 'bg-neon-cyan text-black' : 'bg-white text-black hover:bg-zinc-50'}`}
            >
              ★ FAVORITES
            </button>
            <button
              onClick={() => setDeckTab('notes')}
              className={`font-mono-tech text-[10px] px-3 py-1.5 font-bold uppercase transition-colors cursor-pointer border-l-2 border-black
                ${deckTab === 'notes' ? 'bg-neon-cyan text-black' : 'bg-white text-black hover:bg-zinc-50'}`}
            >
              ✍ Takeaways
            </button>
          </div>

          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deck..."
              className="font-mono-code text-[10px] pl-8 pr-3 py-1.5 border-2 border-black rounded focus:outline-none w-full sm:w-44 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white"
            />
          </div>
        </div>
      </div>

      {deckCompanies.length === 0 ? (
        <div className="brutal-card p-12 text-center bg-white border-dashed space-y-3">
          <ShieldAlert className="w-8 h-8 text-neon-orange mx-auto opacity-75 animate-bounce" />
          <h4 className="font-mono-tech text-xs font-black uppercase text-black">NO TRADING CARDS IN DECK</h4>
          <p className="font-mono-code text-[10px] text-slate-700 leading-relaxed font-bold max-w-sm mx-auto">
            {deckTab === 'favorites' 
              ? "Mark startups as Favorites in the Explorer console to add their system DNA trading cards here."
              : "Write study takeaways or notes on startup profiles to unlock and collect their cards."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {deckCompanies.map(company => {
            const dna = generateDNAStats(company);
            const theme = colorThemes[dna?.cardColor || 0];
            return (
              <div 
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className={`brutal-card brutal-card-hover p-3 bg-white flex flex-col justify-between aspect-[1/1.35] text-left cursor-pointer transition-all border-t-4 ${theme.border}`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start text-[8px] font-mono-code font-bold uppercase text-slate-500">
                    <span>{company.batch}</span>
                    <span className={`px-1 rounded ${theme.bg} ${theme.text}`}>{company.industry}</span>
                  </div>
                  <h4 className="font-mono-tech text-xs font-black uppercase text-black tracking-wider line-clamp-1 mt-1">
                    {company.name}
                  </h4>
                  <p className="font-sans text-[8.5px] text-slate-800 leading-tight line-clamp-3 italic mt-1">
                    "{company.one_liner || 'Build interesting products.'}"
                  </p>
                </div>

                {/* Mini Stat display */}
                <div className="mt-3 space-y-1 select-none">
                  <div className="w-full h-1 bg-zinc-100 rounded overflow-hidden flex">
                    <div style={{ width: `${dna.scale}%` }} className="h-full bg-neon-orange" />
                  </div>
                  <div className="w-full h-1 bg-zinc-100 rounded overflow-hidden flex">
                    <div style={{ width: `${dna.innovation}%` }} className="h-full bg-neon-cyan" />
                  </div>
                  <div className="w-full h-1 bg-zinc-100 rounded overflow-hidden flex">
                    <div style={{ width: `${dna.moat}%` }} className="h-full bg-neon-emerald" />
                  </div>
                  <div className="flex justify-between text-[7px] font-mono-code text-slate-400 mt-1 uppercase font-bold">
                    <span>Card Deck</span>
                    <span className="flex items-center text-neon-orange">
                      <Sparkles className="w-2 h-2 mr-0.5 animate-pulse" />
                      View Card
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Render selected trading card modal overlay */}
      {selectedCompany && (
        <StartupDNACard
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}

    </div>
  );
}
