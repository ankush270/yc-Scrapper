import React from 'react';
import { Briefcase, FileText, Trophy, MapPin, Users } from 'lucide-react';

export default function CompanyCard({ company, hasNote, isSelected, onClick }) {
  const {
    name,
    batch,
    industry,
    one_liner,
    small_logo_thumb_url,
    isHiring,
    top_company,
    all_locations,
    team_size
  } = company;

  // Get first letter of company name for placeholder monogram
  const monogram = name ? name.charAt(0).toUpperCase() : 'Y';

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-3 rounded-lg border transition-all duration-300 cursor-pointer relative overflow-hidden group select-none flex flex-col h-full 
        ${isSelected 
          ? 'border-neon-emerald shadow-glow-emerald bg-slate-900/60' 
          : 'border-slate-800 bg-slate-950/40 hover:border-neon-cyan hover:shadow-glow-cyan hover:-translate-y-0.5'
        }`}
    >
      {/* Visual Tech Details */}
      <div className="absolute top-0 right-0 w-8 h-8 opacity-20 pointer-events-none group-hover:opacity-100 transition-opacity">
        <div className="absolute top-0 right-0 w-2 h-[1px] bg-neon-cyan"></div>
        <div className="absolute top-0 right-0 w-[1px] h-2 bg-neon-cyan"></div>
      </div>

      {/* Top Header Row: Logo & Batch info */}
      <div className="flex items-start justify-between space-x-3 mb-2">
        <div className="flex items-center space-x-2.5">
          {/* Logo container */}
          <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
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
              className="w-full h-full items-center justify-center font-mono-tech text-sm font-bold bg-gradient-to-br from-slate-800 to-slate-950 text-slate-400 group-hover:text-neon-cyan"
            >
              {monogram}
            </div>
          </div>

          {/* Name & Batch */}
          <div>
            <h3 className="font-mono-tech text-xs font-bold text-white group-hover:text-neon-cyan transition-colors leading-tight">
              {name}
            </h3>
            <span className="font-mono-code text-[9px] text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 mt-0.5 inline-block">
              {batch}
            </span>
          </div>
        </div>

        {/* Badges/Indicators Column */}
        <div className="flex flex-col space-y-1.5 items-end">
          {top_company && (
            <div className="text-neon-magenta" title="Top YC Company">
              <Trophy className="w-3.5 h-3.5 drop-shadow-[0_0_4px_#ff007f]" />
            </div>
          )}
          {hasNote && (
            <div className="text-neon-cyan" title="Study Takeaways Logged">
              <FileText className="w-3.5 h-3.5 animate-pulse drop-shadow-[0_0_4px_#00d2ff]" />
            </div>
          )}
          {isHiring && (
            <div className="flex items-center space-x-1 font-mono-code text-[9px] text-neon-emerald bg-neon-emerald/10 border border-neon-emerald/30 px-1 rounded-sm">
              <span className="w-1 h-1 bg-neon-emerald rounded-full animate-ping"></span>
              <span>HIRING</span>
            </div>
          )}
        </div>
      </div>

      {/* Pitch (One Liner) */}
      <div className="text-[11px] text-slate-300 mb-2 line-clamp-2 leading-tight flex-grow">
        {one_liner}
      </div>

      {/* Footer Info Row */}
      <div className="border-t border-slate-900 pt-2 mt-auto flex items-center justify-between text-[10px] text-slate-400 font-mono-code">
        {/* Industry Badge */}
        <span className="text-neon-cyan/80 bg-slate-900/60 border border-slate-800/80 px-2 py-0.5 rounded-full uppercase text-[9px] tracking-wide max-w-[130px] truncate">
          {industry}
        </span>

        {/* Region/Location or Team */}
        <div className="flex items-center space-x-2">
          {team_size ? (
            <span className="flex items-center space-x-0.5" title={`Team size: ${team_size}`}>
              <Users className="w-2.5 h-2.5 text-neon-cyan/70" />
              <span className="text-slate-300">{team_size}</span>
            </span>
          ) : null}
          {all_locations ? (
            <span className="flex items-center space-x-0.5 max-w-[80px] truncate" title={all_locations}>
              <MapPin className="w-2.5 h-2.5 text-neon-cyan/70" />
              <span className="truncate text-slate-300">{all_locations.split(',')[0]}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
