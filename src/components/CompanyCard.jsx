import React from 'react';
import { FileText, Trophy, MapPin, Users } from 'lucide-react';
import { FavoriteButton } from './FavoritesBar';

export default function CompanyCard({ company, hasNote, isSelected, onClick, favoriteIds, setFavoriteIds }) {
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
      className={`p-3 cursor-pointer relative overflow-hidden group select-none flex flex-col h-full brutal-card brutal-card-hover transition-all duration-150
        ${isSelected 
          ? 'brutal-card-selected' 
          : ''
        }`}
    >
      {/* Top Header Row: Logo & Batch info */}
      <div className="flex items-start justify-between space-x-3 mb-2">
        <div className="flex items-center space-x-2.5">
          {/* Logo container */}
          <div className="w-8 h-8 rounded border border-black flex items-center justify-center overflow-hidden shrink-0 bg-white">
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
              className="w-full h-full items-center justify-center font-mono-tech text-sm font-bold bg-neon-cyan text-black"
            >
              {monogram}
            </div>
          </div>

          {/* Name & Batch */}
          <div>
            <h3 className="font-mono-tech text-xs font-extrabold text-black group-hover:text-neon-cyan transition-colors leading-tight">
              {name}
            </h3>
            <span className="font-mono-code text-[9px] text-black bg-white px-1.5 py-0.5 rounded border border-black mt-0.5 inline-block font-bold">
              {batch}
            </span>
          </div>
        </div>

        {/* Badges/Indicators Column */}
        <div className="flex flex-col space-y-1.5 items-end">
          {top_company && (
            <div className="text-neon-magenta" title="Top YC Company">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          )}
          {hasNote && (
            <div className="text-neon-cyan" title="Study Takeaways Logged">
              <FileText className="w-3.5 h-3.5" />
            </div>
          )}
          {isHiring && (
            <div className="flex items-center space-x-1 font-mono-code text-[8px] text-black bg-neon-emerald border border-black px-1.5 py-0.2 rounded-sm shadow-[1.5px_1.5px_0px_0px_#000000] font-bold">
              <span className="w-1 h-1 bg-black rounded-full animate-ping"></span>
              <span>HIRING</span>
            </div>
          )}
          {favoriteIds && setFavoriteIds && (
            <FavoriteButton
              companyId={company.id}
              companyData={company}
              favoriteIds={favoriteIds}
              setFavoriteIds={setFavoriteIds}
            />
          )}
        </div>
      </div>

      {/* Pitch (One Liner) */}
      <div className="text-[11px] text-slate-800 mb-2 line-clamp-2 leading-tight flex-grow font-medium">
        {one_liner}
      </div>

      {/* Footer Info Row */}
      <div className="border-t border-black pt-2 mt-auto flex items-center justify-between text-[10px] text-slate-700 font-mono-code">
        {/* Industry Badge */}
        <span className="text-black bg-neon-cyan/20 border border-black px-2 py-0.5 rounded uppercase text-[9px] font-bold tracking-wide max-w-[130px] truncate">
          {industry}
        </span>

        {/* Region/Location or Team */}
        <div className="flex items-center space-x-2">
          {team_size ? (
            <span className="flex items-center space-x-0.5 font-bold" title={`Team size: ${team_size}`}>
              <Users className="w-2.5 h-2.5 text-black" />
              <span className="text-slate-800">{team_size}</span>
            </span>
          ) : null}
          {all_locations ? (
            <span className="flex items-center space-x-0.5 max-w-[80px] truncate font-bold" title={all_locations}>
              <MapPin className="w-2.5 h-2.5 text-black" />
              <span className="truncate text-slate-800">{all_locations.split(',')[0]}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
